import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

export const BASE_DIR = process.cwd();
export const OUTPUT_DIR = path.join(BASE_DIR, "public", "generated");
export const FONTS_DIR = path.join(BASE_DIR, "assets", "fonts");

if (!fs.existsSync(OUTPUT_DIR)) {
	fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

export function getFreshEnv(): Record<string, string> {
	const envPath = path.join(BASE_DIR, ".env");
	if (!fs.existsSync(envPath)) {
		return {};
	}
	return dotenv.parse(fs.readFileSync(envPath, "utf-8"));
}

export function getCurrentGeminiApiKey(): string {
	const env = getFreshEnv();
	return env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || "";
}

export const RESOLUTIONS: Record<string, Record<string, [number, number]>> = {
	"9:16": {
		"720p": [720, 1280],
		"1080p": [1080, 1920],
		"1440p": [1440, 2560],
		"4k": [2160, 3840],
	},
	"16:9": {
		"720p": [1280, 720],
		"1080p": [1920, 1080],
		"1440p": [2560, 1440],
		"4k": [3840, 2160],
	},
};

export const SUPPORTED_GEMINI_MODELS = [
	"gemini-3.5-flash-lite",
	"gemini-3-flash-preview",
	"gemini-4-argon",
	"gemini-3.8-flash",
	"gemini-3.7-flash",
	"gemini-3.1-pro-preview",
	"gemini-2.5-pro",
	"gemini-3.6-flash",
	"gemini-2.5-flash",
	"veo-3.1-generate-preview",
	"veo-3.1-fast-generate-preview",
	"veo-2.0-generate-001",
];

export const DEFAULT_PLANNING_MODEL = "gemini-3.8-flash";
export const DEFAULT_RESOLUTION = "1080p";
export const DEFAULT_ASPECT_RATIO = "9:16";
export const DEFAULT_FPS = 30;
