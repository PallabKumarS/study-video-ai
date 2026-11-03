import { execFile } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import {
	DEFAULT_ASPECT_RATIO,
	DEFAULT_FPS,
	DEFAULT_RESOLUTION,
	RESOLUTIONS,
} from "./config";
import { getTheme } from "./themes";
import type { VideoSegment } from "./types";
import { getAudioDuration } from "./voiceover";

const execFileAsync = promisify(execFile);

export interface RenderSegmentVideoParams {
	segment: VideoSegment;
	audioPath: string;
	outputMp4Path: string;
	visualAssetPath?: string;
	visualAssetType?: "image" | "video";
	aspectRatio?: string;
	resolution?: string;
	theme?: string;
	overallProgStart?: number;
	overallProgEnd?: number;
	fps?: number;
}

export function escapeFfmpegText(str: string): string {
	return str
		.replace(/\\/g, "\\\\")
		.replace(/'/g, "\\'")
		.replace(/:/g, "\\:")
		.replace(/%/g, "\\%")
		.replace(/\[/g, "\\[")
		.replace(/\]/g, "\\]");
}

export async function generateVideoThumbnail(
	videoPath: string,
	outputPath: string,
	timestamp = "00:00:01",
): Promise<string> {
	fs.mkdirSync(path.dirname(outputPath), { recursive: true });
	await execFileAsync("ffmpeg", [
		"-y",
		"-ss",
		timestamp,
		"-i",
		videoPath,
		"-vframes",
		"1",
		"-q:v",
		"2",
		outputPath,
	]);
	return outputPath;
}

function resolveRenderParams(
	segmentOrParams: VideoSegment | RenderSegmentVideoParams,
	posAudio?: string,
	posOutput?: string,
	posAspect = DEFAULT_ASPECT_RATIO,
	posRes = DEFAULT_RESOLUTION,
	posTheme = "dark_glow",
	posProgStart = 0,
	posProgEnd = 1,
	posFps = DEFAULT_FPS,
	posAssetPath?: string,
	posAssetType: "image" | "video" = "image",
): RenderSegmentVideoParams {
	if ("audioPath" in segmentOrParams) {
		return segmentOrParams;
	}
	return {
		segment: segmentOrParams,
		audioPath: posAudio || "",
		outputMp4Path: posOutput || "",
		aspectRatio: posAspect,
		resolution: posRes,
		theme: posTheme,
		overallProgStart: posProgStart,
		overallProgEnd: posProgEnd,
		fps: posFps,
		visualAssetPath: posAssetPath,
		visualAssetType: posAssetType,
	};
}

export async function renderSegmentVideo(
	segmentOrParams: VideoSegment | RenderSegmentVideoParams,
	posAudio?: string,
	posOutput?: string,
	posAspect = DEFAULT_ASPECT_RATIO,
	posRes = DEFAULT_RESOLUTION,
	posTheme = "dark_glow",
	posProgStart = 0,
	posProgEnd = 1,
	posFps = DEFAULT_FPS,
	posAssetPath?: string,
	posAssetType: "image" | "video" = "image",
): Promise<string> {
	const params = resolveRenderParams(
		segmentOrParams,
		posAudio,
		posOutput,
		posAspect,
		posRes,
		posTheme,
		posProgStart,
		posProgEnd,
		posFps,
		posAssetPath,
		posAssetType,
	);

	const {
		segment,
		audioPath,
		outputMp4Path,
		visualAssetPath,
		visualAssetType = "image",
		aspectRatio = DEFAULT_ASPECT_RATIO,
		resolution = DEFAULT_RESOLUTION,
		theme = "dark_glow",
		overallProgEnd = 1,
		fps = DEFAULT_FPS,
	} = params;

	fs.mkdirSync(path.dirname(outputMp4Path), { recursive: true });
	const dims = RESOLUTIONS[aspectRatio]?.[resolution] || [1080, 1920];
	const [w, h] = dims;

	const duration = await getAudioDuration(audioPath);
	const themeCfg = getTheme(theme);
	const scale = w / 720;
	const barW = Math.round(w * Math.max(0.05, Math.min(1.0, overallProgEnd)));
	const barH = Math.max(4, Math.round(8 * scale));

	const hasVisualFile =
		visualAssetPath &&
		fs.existsSync(visualAssetPath) &&
		fs.statSync(visualAssetPath).size > 0;

	if (hasVisualFile && visualAssetType === "video") {
		// Video clip from Veo
		const filter = `scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2,drawbox=x=0:y=0:w=${barW}:h=${barH}:color=${themeCfg.barColor}:t=fill`;
		await execFileAsync("ffmpeg", [
			"-y",
			"-stream_loop",
			"-1",
			"-i",
			visualAssetPath,
			"-i",
			audioPath,
			"-t",
			String(duration),
			"-vf",
			filter,
			"-c:v",
			"libx264",
			"-preset",
			"veryfast",
			"-pix_fmt",
			"yuv420p",
			"-r",
			String(fps),
			"-c:a",
			"aac",
			"-b:a",
			"192k",
			"-shortest",
			outputMp4Path,
		]);
		return outputMp4Path;
	}

	if (hasVisualFile) {
		// AI-Generated SVG rasterized to high-res PNG image
		const filter = `scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2,drawbox=x=0:y=0:w=${barW}:h=${barH}:color=${themeCfg.barColor}:t=fill`;
		await execFileAsync("ffmpeg", [
			"-y",
			"-loop",
			"1",
			"-i",
			visualAssetPath,
			"-i",
			audioPath,
			"-t",
			String(duration),
			"-vf",
			filter,
			"-c:v",
			"libx264",
			"-preset",
			"veryfast",
			"-pix_fmt",
			"yuv420p",
			"-r",
			String(fps),
			"-c:a",
			"aac",
			"-b:a",
			"192k",
			"-shortest",
			outputMp4Path,
		]);
		return outputMp4Path;
	}

	// Emergency fallback if no visual file was generated
	const fontPath = "assets/fonts/HindSiliguri-Bold.ttf";
	const badge = escapeFfmpegText(
		segment.badge_text || segment.tag || "Study Video",
	);
	const title = escapeFfmpegText(segment.title || "");
	const fallbackFilters: string[] = [
		`drawbox=x=0:y=0:w=${barW}:h=${barH}:color=${themeCfg.barColor}:t=fill`,
		`drawtext=fontfile='${fontPath}':text='${badge}':fontcolor=white:fontsize=${Math.round(22 * scale)}:x=40:y=50`,
		`drawtext=fontfile='${fontPath}':text='${title}':fontcolor=white:fontsize=${Math.round(32 * scale)}:x=(w-text_w)/2:y=(h-text_h)/2`,
	];

	await execFileAsync("ffmpeg", [
		"-y",
		"-f",
		"lavfi",
		"-i",
		`color=c=${themeCfg.bgColor}:s=${w}x${h}:d=${duration}`,
		"-i",
		audioPath,
		"-vf",
		fallbackFilters.join(","),
		"-c:v",
		"libx264",
		"-preset",
		"veryfast",
		"-pix_fmt",
		"yuv420p",
		"-r",
		String(fps),
		"-c:a",
		"aac",
		"-b:a",
		"192k",
		"-shortest",
		outputMp4Path,
	]);

	return outputMp4Path;
}

export async function stitchSegments(
	segmentMp4Paths: string[],
	outputMasterPath: string,
): Promise<string> {
	if (segmentMp4Paths.length === 0) {
		throw new Error("No segment files provided to stitch.");
	}
	fs.mkdirSync(path.dirname(outputMasterPath), { recursive: true });

	if (segmentMp4Paths.length === 1) {
		await execFileAsync("ffmpeg", [
			"-y",
			"-i",
			segmentMp4Paths[0],
			"-c",
			"copy",
			outputMasterPath,
		]);
		return outputMasterPath;
	}

	const concatListFile = path.join(
		path.dirname(outputMasterPath),
		`concat_${Date.now()}.txt`,
	);
	const lines = segmentMp4Paths.map(
		(p) => `file '${path.resolve(p).replace(/\\/g, "/")}'`,
	);
	fs.writeFileSync(concatListFile, `${lines.join("\n")}\n`, "utf-8");

	try {
		await execFileAsync("ffmpeg", [
			"-y",
			"-f",
			"concat",
			"-safe",
			"0",
			"-i",
			concatListFile,
			"-c",
			"copy",
			outputMasterPath,
		]);
	} catch {
		await execFileAsync("ffmpeg", [
			"-y",
			"-f",
			"concat",
			"-safe",
			"0",
			"-i",
			concatListFile,
			"-c:v",
			"libx264",
			"-preset",
			"veryfast",
			"-c:a",
			"aac",
			outputMasterPath,
		]);
	} finally {
		if (fs.existsSync(concatListFile)) {
			try {
				fs.unlinkSync(concatListFile);
			} catch {}
		}
	}

	return outputMasterPath;
}
