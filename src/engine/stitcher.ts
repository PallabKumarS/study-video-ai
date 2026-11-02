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

function escapeFfmpegText(str: string): string {
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

export async function renderSegmentVideo(
	segment: VideoSegment,
	audioPath: string,
	outputMp4Path: string,
	aspectRatio = DEFAULT_ASPECT_RATIO,
	resolution = DEFAULT_RESOLUTION,
	theme = "dark_glow",
	_overallProgStart = 0,
	overallProgEnd = 1,
	_fps = DEFAULT_FPS,
): Promise<string> {
	fs.mkdirSync(path.dirname(outputMp4Path), { recursive: true });
	const dims = RESOLUTIONS[aspectRatio]?.[resolution] || [1080, 1920];
	const [w, h] = dims;

	const duration = await getAudioDuration(audioPath);
	const themeCfg = getTheme(theme);
	const fontPath = "assets/fonts/HindSiliguri-Bold.ttf";

	const scale = w / 720;
	const barW = Math.round(w * Math.max(0.05, Math.min(1.0, overallProgEnd)));
	const badgeText = escapeFfmpegText(
		segment.badge_text || segment.tag || "Study Video",
	);
	const titleText = escapeFfmpegText(segment.title || "");
	const captionText = escapeFfmpegText(segment.bottom_caption || "");

	const filters: string[] = [];

	// Top progress bar
	filters.push(
		`drawbox=x=0:y=0:w=${barW}:h=${Math.round(8 * scale)}:color=${themeCfg.barColor}:t=fill`,
	);

	// Top badge pill
	const badgeW = Math.min(w - 60, Math.round(220 * scale));
	const badgeH = Math.round(44 * scale);
	const badgeY = Math.round(50 * scale);
	filters.push(
		`drawbox=x=40:y=${badgeY}:w=${badgeW}:h=${badgeH}:color=${themeCfg.cardBg}:t=fill`,
	);
	filters.push(
		`drawbox=x=40:y=${badgeY}:w=${badgeW}:h=${badgeH}:color=${themeCfg.barColor}:t=2`,
	);
	filters.push(
		`drawtext=fontfile='${fontPath}':text='${badgeText}':fontcolor=white:fontsize=${Math.round(20 * scale)}:x=56:y=${badgeY + Math.round(10 * scale)}`,
	);

	// Title
	if (titleText) {
		const titleSize =
			titleText.length > 35 ? Math.round(28 * scale) : Math.round(34 * scale);
		filters.push(
			`drawtext=fontfile='${fontPath}':text='${titleText}':fontcolor=white:fontsize=${titleSize}:x=(w-text_w)/2:y=${Math.round(140 * scale)}`,
		);
	}

	// Dynamic concept cards
	const cards = segment.card_items || [];
	const cardStartY = Math.round(240 * scale);
	const cardH = Math.round(96 * scale);
	const cardGap = Math.round(20 * scale);
	const cardW = w - Math.round(80 * scale);
	const cardX = Math.round(40 * scale);

	cards.slice(0, 4).forEach((card, i) => {
		const cY = cardStartY + i * (cardH + cardGap);
		const cTitle = escapeFfmpegText(card.title || "");
		const cSub = escapeFfmpegText(card.subtitle || "");
		const accent = card.accent || themeCfg.barColor;

		filters.push(
			`drawbox=x=${cardX}:y=${cY}:w=${cardW}:h=${cardH}:color=${themeCfg.cardBg}:t=fill`,
		);
		filters.push(
			`drawbox=x=${cardX}:y=${cY}:w=${cardW}:h=${cardH}:color=${themeCfg.cardBorder}:t=2`,
		);
		filters.push(
			`drawbox=x=${cardX + 4}:y=${cY + 4}:w=${Math.round(6 * scale)}:h=${cardH - 8}:color=${accent}:t=fill`,
		);
		if (cTitle) {
			filters.push(
				`drawtext=fontfile='${fontPath}':text='${cTitle}':fontcolor=white:fontsize=${Math.round(22 * scale)}:x=${cardX + Math.round(24 * scale)}:y=${cY + Math.round(16 * scale)}`,
			);
		}
		if (cSub) {
			filters.push(
				`drawtext=fontfile='${fontPath}':text='${cSub}':fontcolor=#94a3b8:fontsize=${Math.round(17 * scale)}:x=${cardX + Math.round(24 * scale)}:y=${cY + Math.round(52 * scale)}`,
			);
		}
	});

	// Bottom summary caption pill
	if (captionText) {
		const capH = Math.round(54 * scale);
		const capW = w - Math.round(80 * scale);
		const capX = Math.round(40 * scale);
		const capY = h - Math.round(120 * scale);
		filters.push(
			`drawbox=x=${capX}:y=${capY}:w=${capW}:h=${capH}:color=${themeCfg.captionBg}:t=fill`,
		);
		filters.push(
			`drawbox=x=${capX}:y=${capY}:w=${capW}:h=${capH}:color=${themeCfg.captionBorder}:t=2`,
		);
		filters.push(
			`drawtext=fontfile='${fontPath}':text='${captionText}':fontcolor=white:fontsize=${Math.round(20 * scale)}:x=(w-text_w)/2:y=${capY + Math.round(15 * scale)}`,
		);
	}

	const filterString = filters.join(",");

	await execFileAsync("ffmpeg", [
		"-y",
		"-f",
		"lavfi",
		"-i",
		`color=c=${themeCfg.bgColor}:s=${w}x${h}:d=${duration}`,
		"-i",
		audioPath,
		"-vf",
		filterString,
		"-c:v",
		"libx264",
		"-preset",
		"veryfast",
		"-pix_fmt",
		"yuv420p",
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
		// Fallback with re-encode
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
