import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import {
	DEFAULT_ASPECT_RATIO,
	DEFAULT_FPS,
	DEFAULT_RESOLUTION,
	RESOLUTIONS,
} from "../config";
import { getAudioDuration } from "../voiceover";
import { composeFrameSvg } from "./frame-composer";
import type { FrameContext, RenderAnimatedVideoParams } from "./types";

export async function renderAnimatedSegmentVideo(
	params: RenderAnimatedVideoParams,
): Promise<string> {
	const {
		segment,
		audioPath,
		outputMp4Path,
		topic,
		aspectRatio = DEFAULT_ASPECT_RATIO,
		resolution = DEFAULT_RESOLUTION,
		theme = "dark_glow",
		overallProgStart = 0,
		overallProgEnd = 1,
		fps = DEFAULT_FPS,
	} = params;

	fs.mkdirSync(path.dirname(outputMp4Path), { recursive: true });
	const dims = RESOLUTIONS[aspectRatio]?.[resolution] || [720, 1280];
	const [w, h] = dims;

	const duration = await getAudioDuration(audioPath);
	const totalFrames = Math.max(24, Math.round(duration * fps));

	const ffmpeg = spawn(
		"ffmpeg",
		[
			"-y",
			"-f",
			"image2pipe",
			"-vcodec",
			"png",
			"-r",
			String(fps),
			"-i",
			"-",
			"-i",
			audioPath,
			"-t",
			String(duration),
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
		],
		{ stdio: ["pipe", "ignore", "pipe"] },
	);

	let stderrOutput = "";
	ffmpeg.stderr.on("data", (chunk) => {
		stderrOutput += chunk.toString();
	});

	// Render in concurrent chunks of 16 frames for maximum throughput
	const chunkSize = 16;
	for (let i = 0; i < totalFrames; i += chunkSize) {
		const end = Math.min(i + chunkSize, totalFrames);
		const framePromises: Promise<Buffer>[] = [];

		for (let f = i; f < end; f++) {
			const time = f / fps;
			const progress = f / (totalFrames - 1);
			const ctx: FrameContext = {
				time,
				duration,
				progress,
				frameIndex: f,
				totalFrames,
				width: w,
				height: h,
				theme,
				overallProgStart,
				overallProgEnd,
			};

			const svg = composeFrameSvg(ctx, segment, topic);
			framePromises.push(sharp(Buffer.from(svg)).png().toBuffer());
		}

		const renderedBuffers = await Promise.all(framePromises);
		for (const buf of renderedBuffers) {
			ffmpeg.stdin.write(buf);
		}
	}

	ffmpeg.stdin.end();

	await new Promise<void>((resolve, reject) => {
		ffmpeg.on("close", (code) => {
			if (code === 0) resolve();
			else {
				reject(
					new Error(
						`FFmpeg animated render failed with code ${code}: ${stderrOutput}`,
					),
				);
			}
		});
	});

	return outputMp4Path;
}
