import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { renderAnimatedSegmentVideo } from "./animator";
import { DEFAULT_ASPECT_RATIO, DEFAULT_RESOLUTION, OUTPUT_DIR } from "./config";
import { planStudyVideo, refineSegmentWithFeedback } from "./planner";
import { sanitizeTitle } from "./sanitize";
import { generateVideoThumbnail, stitchSegments } from "./stitcher";
import type { SegmentRecord, VideoMetadata, VideoPlan } from "./types";
import { generateVoiceover } from "./voiceover";

export interface JobProgress {
	status: string;
	progress: number;
	message: string;
	updated_at: number;
	result?: VideoMetadata | null;
	estimated_total_sec?: number;
	estimated_remaining_sec?: number;
}

export const ACTIVE_JOBS: Record<string, JobProgress> = {};
export const CANCELED_JOBS = new Set<string>();

export function isJobCanceled(jobId: string): boolean {
	return CANCELED_JOBS.has(jobId);
}

export function cancelGenerationJob(jobId: string): void {
	CANCELED_JOBS.add(jobId);
	const jobDir = path.join(OUTPUT_DIR, jobId);
	updateJobProgress(jobDir, jobId, "failed", 0, "Generation canceled by user");
}

export function updateJobProgress(
	jobDir: string,
	jobId: string,
	status: string,
	progress: number,
	message: string,
	result?: VideoMetadata | null,
	estimatedTotalSec?: number,
): void {
	const prevJob = ACTIVE_JOBS[jobId];
	const totalSec = estimatedTotalSec ?? prevJob?.estimated_total_sec;
	let remSec: number | undefined;

	if (status === "completed") {
		remSec = 0;
	} else if (totalSec && progress > 0) {
		remSec = Math.max(1, Math.round(totalSec * (1 - progress / 100)));
	}

	const data: JobProgress = {
		status,
		progress,
		message,
		updated_at: Date.now(),
		result: result || null,
		estimated_total_sec: totalSec,
		estimated_remaining_sec: remSec,
	};
	ACTIVE_JOBS[jobId] = data;

	const progFile = path.join(jobDir, "progress.json");
	try {
		fs.writeFileSync(progFile, JSON.stringify(data, null, 2), "utf-8");
	} catch {}
}

export async function generateStudyVideo(params: {
	prompt: string;
	targetDuration?: number;
	resolution?: string;
	aspectRatio?: string;
	model?: string;
	theme?: string;
	voiceEngine?: string;
	jobId?: string;
	title?: string;
	language?: string;
	apiKey?: string;
}): Promise<VideoMetadata> {
	const {
		prompt,
		targetDuration = 60,
		resolution = DEFAULT_RESOLUTION,
		aspectRatio = DEFAULT_ASPECT_RATIO,
		model = "gemini-3.5-flash-lite",
		theme = "dark_glow",
		voiceEngine = "gemini-kore",
		title,
		language = "bn",
		apiKey,
	} = params;

	const jobId =
		params.jobId ||
		`vid_${Math.floor(Date.now() / 1000)}_${crypto.randomBytes(3).toString("hex")}`;
	const jobDir = path.join(OUTPUT_DIR, jobId);
	const segmentsDir = path.join(jobDir, "segments");
	const audioDir = path.join(jobDir, "audio");

	fs.mkdirSync(segmentsDir, { recursive: true });
	fs.mkdirSync(audioDir, { recursive: true });

	// Step 1: Planning
	updateJobProgress(
		jobDir,
		jobId,
		"planning",
		10,
		`Planning study segments with ${model}...`,
	);
	const planData = await planStudyVideo(
		prompt,
		targetDuration,
		aspectRatio,
		model,
		title,
		language,
		apiKey,
	);

	const segments = planData.segments || [];
	if (segments.length === 0) {
		throw new Error("Failed to plan video segments.");
	}

	fs.writeFileSync(
		path.join(jobDir, "plan.json"),
		JSON.stringify(planData, null, 2),
		"utf-8",
	);

	const numSegments = segments.length;
	// Real-world segment latency calibrated to ~30s-60s per segment
	let perSegSec = 42;
	if (model.includes("pro")) perSegSec = 60;
	else if (model.includes("lite")) perSegSec = 30;
	else if (model.includes("veo")) perSegSec = 90;

	let resMult = 1.0;
	if (resolution === "1080p") resMult = 1.15;
	else if (resolution === "1440p" || resolution === "4k") resMult = 1.4;

	const planningBaseSec = 10;
	const stitchingBaseSec = 6;
	const estimatedTotalSec = Math.round(
		planningBaseSec + perSegSec * resMult * numSegments + stitchingBaseSec,
	);

	// Update planning completion with estimated total time
	updateJobProgress(
		jobDir,
		jobId,
		"planning_complete",
		15,
		`Planned ${numSegments} educational segments. Estimated time: ~${estimatedTotalSec}s`,
		null,
		estimatedTotalSec,
	);

	const segmentVideoPaths: string[] = [];
	const segmentRecords: SegmentRecord[] = [];

	// Step 2: Voiceover & Rendering for each segment
	for (let i = 0; i < numSegments; i++) {
		if (isJobCanceled(jobId)) {
			throw new Error("Generation canceled by user");
		}
		const seg = segments[i];
		const idx = i + 1;
		const segTag = seg.tag || `Segment ${idx}`;

		// Voiceover
		const progAudio = 15 + Math.floor((i / numSegments) * 30);
		updateJobProgress(
			jobDir,
			jobId,
			"voiceover",
			progAudio,
			`Generating studio voiceover for segment ${idx}/${numSegments}: ${segTag}`,
			null,
			estimatedTotalSec,
		);

		const audioPath = path.join(audioDir, `audio_seg_${idx}.mp3`);
		const duration = await generateVoiceover(
			seg.narration,
			audioPath,
			voiceEngine,
			apiKey,
		);

		// Multi-frame Motion Video Rendering
		const progRender = 45 + Math.floor((i / numSegments) * 45);
		updateJobProgress(
			jobDir,
			jobId,
			"rendering",
			progRender,
			`Rendering dynamic animation for segment ${idx}/${numSegments}: ${segTag}`,
			null,
			estimatedTotalSec,
		);

		const segMp4Path = path.join(segmentsDir, `segment_${idx}.mp4`);
		await renderAnimatedSegmentVideo({
			segment: seg,
			audioPath,
			outputMp4Path: segMp4Path,
			topic: planData.topic || title || prompt,
			aspectRatio,
			resolution,
			theme,
			overallProgStart: i / numSegments,
			overallProgEnd: (i + 1) / numSegments,
		});

		const segThumbPath = path.join(segmentsDir, `thumb_seg_${idx}.jpg`);
		await generateVideoThumbnail(segMp4Path, segThumbPath, "00:00:02");

		segmentVideoPaths.push(segMp4Path);
		segmentRecords.push({
			segment_index: idx,
			tag: segTag,
			title: seg.title || "",
			duration: Math.round(duration * 100) / 100,
			video_url: `/api/videos/${encodeURIComponent(jobId)}/segments/segment_${idx}.mp4`,
			thumbnail_url: `/api/videos/${encodeURIComponent(jobId)}/segments/thumb_seg_${idx}.jpg`,
			narration: seg.narration,
			bottom_caption: seg.bottom_caption || "",
			dimension: seg.dimension || "2d",
			visual_prompt: seg.visual_prompt,
		});
	}

	// Step 3: Stitching
	updateJobProgress(
		jobDir,
		jobId,
		"stitching",
		90,
		"Stitching multi-segment video into master release...",
		null,
		estimatedTotalSec,
	);

	const finalTitle = planData.topic || title || prompt;
	const safeName = sanitizeTitle(finalTitle);
	const videoFileName = `${safeName}.mp4`;
	const thumbFileName = `${safeName}.jpg`;

	const masterMp4Path = path.join(jobDir, videoFileName);
	await stitchSegments(segmentVideoPaths, masterMp4Path);

	const masterThumbPath = path.join(jobDir, thumbFileName);
	await generateVideoThumbnail(masterMp4Path, masterThumbPath, "00:00:02");

	// Provide fallback copies for legacy compatibility
	try {
		fs.copyFileSync(masterMp4Path, path.join(jobDir, "master_video.mp4"));
		fs.copyFileSync(masterThumbPath, path.join(jobDir, "master_thumb.jpg"));
	} catch {}

	const totalDuration = segmentRecords.reduce((acc, s) => acc + s.duration, 0);
	const metadata: VideoMetadata = {
		job_id: jobId,
		topic: finalTitle,
		category: planData.category || "Education",
		language,
		resolution,
		aspect_ratio: aspectRatio,
		model_used: planData.used_model || model,
		fallback_reason: planData.fallback_reason,
		total_duration: Math.round(totalDuration * 100) / 100,
		total_segments: numSegments,
		video_file_name: videoFileName,
		original_prompt: prompt,
		voice_used: voiceEngine,
		theme_used: theme,
		master_video_url: `/api/videos/${encodeURIComponent(jobId)}/${encodeURIComponent(videoFileName)}`,
		master_thumbnail_url: `/api/videos/${encodeURIComponent(jobId)}/${encodeURIComponent(thumbFileName)}`,
		segments: segmentRecords,
		created_at: Date.now(),
	};

	fs.writeFileSync(
		path.join(jobDir, "metadata.json"),
		JSON.stringify(metadata, null, 2),
		"utf-8",
	);
	updateJobProgress(
		jobDir,
		jobId,
		"completed",
		100,
		"Video created successfully!",
		metadata,
	);

	return metadata;
}

export async function regenerateSingleSegment(params: {
	jobId: string;
	segmentIndex: number;
	userComment?: string;
	customTitle?: string;
	customNarration?: string;
	model?: string;
	voiceEngine?: string;
	apiKey?: string;
}): Promise<VideoMetadata> {
	const {
		jobId,
		segmentIndex,
		userComment,
		customTitle,
		customNarration,
		model = "gemini-3.5-flash-lite",
		voiceEngine = "gemini-kore",
		apiKey,
	} = params;
	const jobDir = path.join(OUTPUT_DIR, jobId);
	if (!fs.existsSync(jobDir)) {
		throw new Error(`Job ${jobId} not found.`);
	}

	const planFile = path.join(jobDir, "plan.json");
	const metaFile = path.join(jobDir, "metadata.json");
	if (!fs.existsSync(planFile) || !fs.existsSync(metaFile)) {
		throw new Error("Job metadata or plan file is missing.");
	}

	const planData: VideoPlan = JSON.parse(fs.readFileSync(planFile, "utf-8"));
	const metaData: VideoMetadata = JSON.parse(
		fs.readFileSync(metaFile, "utf-8"),
	);

	const segments = planData.segments || [];
	if (segmentIndex < 1 || segmentIndex > segments.length) {
		throw new Error(
			`Invalid segment index ${segmentIndex}. Total segments: ${segments.length}`,
		);
	}

	const targetIdx = segmentIndex - 1;
	let currentSeg = segments[targetIdx];
	const topic = planData.topic || metaData.topic || "";
	const language = metaData.language || "bn";
	const resolution = metaData.resolution || DEFAULT_RESOLUTION;
	const aspectRatio = metaData.aspect_ratio || DEFAULT_ASPECT_RATIO;
	const theme = "dark_glow";

	if (userComment?.trim()) {
		currentSeg = await refineSegmentWithFeedback(
			currentSeg,
			topic,
			userComment,
			language,
			model,
			apiKey,
		);
	}
	if (customTitle?.trim()) {
		currentSeg.title = customTitle.trim();
	}
	if (customNarration?.trim()) {
		currentSeg.narration = customNarration.trim();
	}

	segments[targetIdx] = currentSeg;
	planData.segments = segments;
	fs.writeFileSync(planFile, JSON.stringify(planData, null, 2), "utf-8");

	// Re-generate audio for this segment
	const audioDir = path.join(jobDir, "audio");
	const audioPath = path.join(audioDir, `audio_seg_${segmentIndex}.mp3`);
	const newDuration = await generateVoiceover(
		currentSeg.narration,
		audioPath,
		voiceEngine,
		apiKey,
	);

	// Re-render animated segment video
	const segmentsDir = path.join(jobDir, "segments");
	const segMp4Path = path.join(segmentsDir, `segment_${segmentIndex}.mp4`);
	const numSegments = segments.length;
	await renderAnimatedSegmentVideo({
		segment: currentSeg,
		audioPath,
		outputMp4Path: segMp4Path,
		topic,
		aspectRatio,
		resolution,
		theme,
		overallProgStart: targetIdx / numSegments,
		overallProgEnd: (targetIdx + 1) / numSegments,
	});

	const segThumbPath = path.join(segmentsDir, `thumb_seg_${segmentIndex}.jpg`);
	await generateVideoThumbnail(segMp4Path, segThumbPath, "00:00:02");

	// Re-stitch all segments
	const allSegmentPaths: string[] = [];
	for (let i = 1; i <= numSegments; i++) {
		const sPath = path.join(segmentsDir, `segment_${i}.mp4`);
		if (!fs.existsSync(sPath)) {
			throw new Error(`Missing segment file ${sPath}`);
		}
		allSegmentPaths.push(sPath);
	}

	const safeName = sanitizeTitle(metaData.topic || "master_video");
	const videoFileName = metaData.video_file_name || `${safeName}.mp4`;
	const thumbFileName = `${safeName}.jpg`;

	const masterMp4Path = path.join(jobDir, videoFileName);
	await stitchSegments(allSegmentPaths, masterMp4Path);

	const masterThumbPath = path.join(jobDir, thumbFileName);
	await generateVideoThumbnail(masterMp4Path, masterThumbPath, "00:00:02");

	try {
		fs.copyFileSync(masterMp4Path, path.join(jobDir, "master_video.mp4"));
		fs.copyFileSync(masterThumbPath, path.join(jobDir, "master_thumb.jpg"));
	} catch {}

	// Update metadata
	const metaSegs = metaData.segments || [];
	if (metaSegs.length >= segmentIndex) {
		metaSegs[targetIdx].title = currentSeg.title || "";
		metaSegs[targetIdx].duration = Math.round(newDuration * 100) / 100;
		metaSegs[targetIdx].narration = currentSeg.narration;
		metaSegs[targetIdx].bottom_caption = currentSeg.bottom_caption || "";
		metaSegs[targetIdx].tag = currentSeg.tag || `Segment ${segmentIndex}`;
	}

	metaData.total_duration =
		Math.round(metaSegs.reduce((a, s) => a + s.duration, 0) * 100) / 100;
	metaData.segments = metaSegs;
	metaData.video_file_name = videoFileName;
	metaData.master_video_url = `/api/videos/${encodeURIComponent(jobId)}/${encodeURIComponent(videoFileName)}`;
	metaData.master_thumbnail_url = `/api/videos/${encodeURIComponent(jobId)}/${encodeURIComponent(thumbFileName)}`;
	metaData.updated_at = Date.now();

	fs.writeFileSync(metaFile, JSON.stringify(metaData, null, 2), "utf-8");
	return metaData;
}

export async function regenerateEntireVideo(params: {
	jobId: string;
	userComment: string;
	model?: string;
	voiceEngine?: string;
	theme?: string;
	apiKey?: string;
}): Promise<VideoMetadata> {
	const {
		jobId,
		userComment,
		model: reqModel,
		voiceEngine: reqVoice,
		theme: reqTheme,
		apiKey,
	} = params;

	const jobDir = path.join(OUTPUT_DIR, jobId);
	if (!fs.existsSync(jobDir)) {
		throw new Error(`Job ${jobId} not found.`);
	}

	const planFile = path.join(jobDir, "plan.json");
	const metaFile = path.join(jobDir, "metadata.json");
	if (!fs.existsSync(planFile) || !fs.existsSync(metaFile)) {
		throw new Error("Job metadata or plan file is missing.");
	}

	const oldPlan: VideoPlan = JSON.parse(fs.readFileSync(planFile, "utf-8"));
	const oldMeta: VideoMetadata = JSON.parse(fs.readFileSync(metaFile, "utf-8"));

	const language = oldMeta.language || oldPlan.language || "bn";
	const resolution = oldMeta.resolution || "1080p";
	const aspectRatio = oldMeta.aspect_ratio || oldPlan.aspect_ratio || "9:16";
	const theme = reqTheme || oldMeta.theme_used || "dark_glow";
	const model = reqModel || oldMeta.model_used || "gemini-3.8-flash";
	const voiceEngine =
		reqVoice ||
		oldMeta.voice_used ||
		(language === "bn" ? "bn-pradeep" : "en-christopher");
	const targetDuration = Math.round(
		oldMeta.total_duration || oldPlan.estimated_total_seconds || 60,
	);

	const basePrompt =
		oldPlan.original_prompt ||
		oldMeta.original_prompt ||
		oldPlan.topic ||
		oldMeta.topic;
	const revisedPrompt = `${basePrompt}\n\n[DIRECTOR REVISION FOR ALL SEGMENTS]: ${userComment.trim()}`;

	updateJobProgress(
		jobDir,
		jobId,
		"planning",
		15,
		`Replanning all segments with ${model} and director revision...`,
	);

	const newPlan = await planStudyVideo(
		revisedPrompt,
		targetDuration,
		aspectRatio,
		model,
		oldMeta.topic,
		language,
		apiKey,
	);
	newPlan.original_prompt = basePrompt;

	const segments = newPlan.segments || [];
	if (segments.length === 0) {
		throw new Error("Failed to plan revised video segments.");
	}

	fs.writeFileSync(planFile, JSON.stringify(newPlan, null, 2), "utf-8");

	const segmentsDir = path.join(jobDir, "segments");
	const audioDir = path.join(jobDir, "audio");
	fs.mkdirSync(segmentsDir, { recursive: true });
	fs.mkdirSync(audioDir, { recursive: true });

	const numSegments = segments.length;
	const segmentVideoPaths: string[] = [];
	const segmentRecords: SegmentRecord[] = [];

	for (let i = 0; i < numSegments; i++) {
		if (isJobCanceled(jobId)) {
			throw new Error("Generation canceled by user");
		}
		const seg = segments[i];
		const idx = i + 1;
		const segTag = seg.tag || `Segment ${idx}`;

		const progAudio = 20 + Math.floor((i / numSegments) * 35);
		updateJobProgress(
			jobDir,
			jobId,
			"voiceover",
			progAudio,
			`Generating revision voiceover (${voiceEngine}) for segment ${idx}/${numSegments}: ${segTag}`,
		);

		const audioPath = path.join(audioDir, `audio_seg_${idx}.mp3`);
		const duration = await generateVoiceover(
			seg.narration,
			audioPath,
			voiceEngine,
			apiKey,
		);

		const progRender = 55 + Math.floor((i / numSegments) * 35);
		updateJobProgress(
			jobDir,
			jobId,
			"rendering",
			progRender,
			`Rendering revision visuals for segment ${idx}/${numSegments}: ${segTag}`,
		);

		const segMp4Path = path.join(segmentsDir, `segment_${idx}.mp4`);
		await renderAnimatedSegmentVideo({
			segment: seg,
			audioPath,
			outputMp4Path: segMp4Path,
			topic: newPlan.topic || oldMeta.topic,
			aspectRatio,
			resolution,
			theme,
			overallProgStart: i / numSegments,
			overallProgEnd: (i + 1) / numSegments,
		});

		const segThumbPath = path.join(segmentsDir, `thumb_seg_${idx}.jpg`);
		await generateVideoThumbnail(segMp4Path, segThumbPath, "00:00:02");

		segmentVideoPaths.push(segMp4Path);
		segmentRecords.push({
			segment_index: idx,
			tag: segTag,
			title: seg.title || "",
			duration: Math.round(duration * 100) / 100,
			video_url: `/api/videos/${encodeURIComponent(jobId)}/segments/segment_${idx}.mp4`,
			thumbnail_url: `/api/videos/${encodeURIComponent(jobId)}/segments/thumb_seg_${idx}.jpg`,
			narration: seg.narration,
			bottom_caption: seg.bottom_caption || "",
			dimension: seg.dimension || "2d",
			visual_prompt: seg.visual_prompt,
		});
	}

	updateJobProgress(
		jobDir,
		jobId,
		"stitching",
		92,
		"Stitching updated segments into release video...",
	);

	const safeName = sanitizeTitle(newPlan.topic || oldMeta.topic);
	const videoFileName = oldMeta.video_file_name || `${safeName}.mp4`;
	const thumbFileName = `${safeName}.jpg`;

	const masterMp4Path = path.join(jobDir, videoFileName);
	await stitchSegments(segmentVideoPaths, masterMp4Path);

	const masterThumbPath = path.join(jobDir, thumbFileName);
	await generateVideoThumbnail(masterMp4Path, masterThumbPath, "00:00:02");

	try {
		fs.copyFileSync(masterMp4Path, path.join(jobDir, "master_video.mp4"));
		fs.copyFileSync(masterThumbPath, path.join(jobDir, "master_thumb.jpg"));
	} catch {}

	const totalDuration = segmentRecords.reduce((acc, s) => acc + s.duration, 0);
	const updatedMeta: VideoMetadata = {
		...oldMeta,
		topic: newPlan.topic || oldMeta.topic,
		model_used: newPlan.used_model || model,
		fallback_reason: newPlan.fallback_reason,
		voice_used: voiceEngine,
		theme_used: theme,
		total_duration: Math.round(totalDuration * 100) / 100,
		total_segments: numSegments,
		video_file_name: videoFileName,
		master_video_url: `/api/videos/${encodeURIComponent(jobId)}/${encodeURIComponent(videoFileName)}`,
		master_thumbnail_url: `/api/videos/${encodeURIComponent(jobId)}/${encodeURIComponent(thumbFileName)}`,
		segments: segmentRecords,
		updated_at: Date.now(),
	};

	fs.writeFileSync(metaFile, JSON.stringify(updatedMeta, null, 2), "utf-8");
	updateJobProgress(
		jobDir,
		jobId,
		"completed",
		100,
		"Entire video regenerated and re-stitched successfully!",
		updatedMeta,
	);

	return updatedMeta;
}
