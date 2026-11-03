import fs from "node:fs";
import path from "node:path";
import { generateStudyVideo } from "../src/engine/pipeline";

interface ParsedArgs {
	prompt?: string;
	title?: string;
	language?: string;
	model?: string;
	resolution?: string;
	aspectRatio?: string;
	duration?: number;
	voice?: string;
	theme?: string;
}

function parseCommandLineArgs(argv: string[]): ParsedArgs {
	const args: ParsedArgs = {};
	for (let i = 2; i < argv.length; i++) {
		const arg = argv[i];
		const next = argv[i + 1];

		if ((arg === "--prompt" || arg === "-p") && next) {
			args.prompt = next;
			i++;
		} else if ((arg === "--title" || arg === "-t") && next) {
			args.title = next;
			i++;
		} else if ((arg === "--lang" || arg === "-l") && next) {
			args.language = next.toLowerCase();
			i++;
		} else if ((arg === "--model" || arg === "-m") && next) {
			args.model = next;
			i++;
		} else if ((arg === "--resolution" || arg === "-r") && next) {
			args.resolution = next;
			i++;
		} else if ((arg === "--aspect-ratio" || arg === "--ar") && next) {
			args.aspectRatio = next;
			i++;
		} else if ((arg === "--duration" || arg === "-d") && next) {
			args.duration = parseInt(next, 10);
			i++;
		} else if ((arg === "--voice" || arg === "-v") && next) {
			args.voice = next;
			i++;
		} else if (arg === "--theme" && next) {
			args.theme = next;
			i++;
		}
	}
	return args;
}

async function runCli(): Promise<void> {
	const args = parseCommandLineArgs(process.argv);
	const prompt =
		args.prompt ||
		"পদার্থবিজ্ঞান: উত্তল ও অবতল লেন্সের ৩টি রশ্মি নিয়ম ও বাস্তব-অবাস্তব প্রতিবিম্ব গঠন চিত্রসহ সহজ ব্যাখ্যা";
	const title = args.title;
	const language = args.language || (prompt.includes("লেন্স") ? "bn" : "en");
	const model = args.model || "gemini-3.5-flash-lite";
	const targetDuration = args.duration || 60;
	const resolution = args.resolution || "1080p";
	const aspectRatio = args.aspectRatio || "9:16";
	const voiceEngine = args.voice || "gemini-kore";
	const theme = args.theme || "deep_slate_academic";

	console.log("=== Study Video AI Generator CLI ===");
	console.log(`Topic/Prompt   : ${prompt}`);
	if (title) console.log(`Custom Title   : ${title}`);
	console.log(`Language       : ${language === "bn" ? "Bengali (বাংলা)" : "English"}`);
	console.log(`Model Engine   : ${model}`);
	console.log(`Voice Narration: ${voiceEngine}`);
	console.log(`Resolution     : ${resolution} (${aspectRatio})`);
	console.log(`Target Duration: ${targetDuration}s`);
	console.log("Starting video creation pipeline...\n");

	const startTime = Date.now();
	try {
		const video = await generateStudyVideo({
			prompt,
			title,
			language,
			model,
			targetDuration,
			resolution,
			aspectRatio,
			voiceEngine,
			theme,
		});

		const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);
		console.log("\n========================================");
		console.log("Video Generation Completed Successfully!");
		console.log("========================================");
		console.log(`Title          : ${video.topic}`);
		console.log(`Job ID         : ${video.job_id}`);
		console.log(`Total Duration : ${video.total_duration.toFixed(2)}s`);
		console.log(`Total Segments : ${video.total_segments}`);
		console.log(`Model Used     : ${video.model_used}`);
		if (video.fallback_reason) {
			console.log(`Fallback Note  : ${video.fallback_reason}`);
		}
		console.log(`Elapsed Time   : ${elapsedSec}s`);
		console.log(`Master Video   : ${video.master_video_url}`);
		console.log(`Local MP4 Path : ${path.join(process.cwd(), "public", video.master_video_url)}`);
		console.log(`Web Dashboard  : http://localhost:3850/archive`);
		console.log("========================================\n");
	} catch (err: unknown) {
		const msg = err instanceof Error ? err.message : String(err);
		console.error(`\n[ERROR] Video generation failed: ${msg}`);
		process.exit(1);
	}
}

runCli();
