import fs from "node:fs";
import path from "node:path";
import { OUTPUT_DIR, SUPPORTED_GEMINI_MODELS } from "@/engine/config";
import { getAllKeysStatus } from "@/engine/key-manager";
import { THEME_CONFIGS } from "@/engine/themes";
import type {
	KeyStatus,
	ModelAdvisorProfile,
	VideoMetadata,
} from "@/engine/types";
import { AVAILABLE_VOICES } from "@/engine/voiceover";

export async function getVideoHistory(): Promise<VideoMetadata[]> {
	const history: VideoMetadata[] = [];
	if (!fs.existsSync(OUTPUT_DIR)) {
		return history;
	}

	const entries = fs.readdirSync(OUTPUT_DIR, { withFileTypes: true });
	const jobDirs = entries
		.filter((e) => e.isDirectory())
		.map((e) => path.join(OUTPUT_DIR, e.name))
		.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);

	for (const dir of jobDirs) {
		const metaPath = path.join(dir, "metadata.json");
		if (fs.existsSync(metaPath)) {
			try {
				const data = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
				if (data.master_video_url?.startsWith("/generated/")) {
					data.master_video_url = data.master_video_url.replace(
						/^\/generated\//,
						"/api/videos/",
					);
				}
				if (data.master_thumbnail_url?.startsWith("/generated/")) {
					data.master_thumbnail_url = data.master_thumbnail_url.replace(
						/^\/generated\//,
						"/api/videos/",
					);
				}
				if (Array.isArray(data.segments)) {
					for (const seg of data.segments) {
						if (seg.video_url?.startsWith("/generated/")) {
							seg.video_url = seg.video_url.replace(
								/^\/generated\//,
								"/api/videos/",
							);
						}
						if (seg.thumbnail_url?.startsWith("/generated/")) {
							seg.thumbnail_url = seg.thumbnail_url.replace(
								/^\/generated\//,
								"/api/videos/",
							);
						}
					}
				}
				history.push(data);
			} catch {}
		}
	}

	return history;
}

export function getModelAdvisorList(): ModelAdvisorProfile[] {
	return [
		{
			id: "gemini-3.5-flash-lite",
			name: "Gemini 3.5 Flash Lite",
			tag: "Free Tier Fast & Lightweight",
			speed: "Ultra Fast (~1.2s)",
			token_economy: "5/5 (Lowest Token Cost)",
			accuracy_rating: "4.5/5",
			tier: "Free Tier (1,500 RPD)",
			recommended: true,
			badge: "Free Account Default",
			description:
				"High-speed free tier engine for rapid study script generation and title synthesis. 1,500 calls/day without billing.",
		},
		{
			id: "gemini-3-flash-preview",
			name: "Gemini 3 Flash Preview",
			tag: "Free Tier High Fidelity",
			speed: "Fast (~2.0s)",
			token_economy: "4.6/5",
			accuracy_rating: "4.7/5",
			tier: "Free Tier (1,500 RPD)",
			recommended: false,
			badge: "Free Account High Phrasing",
			description:
				"Superior natural Bengali educational phrasing and reliable structured JSON diagram planning under free quotas.",
		},
		{
			id: "gemini-4-argon",
			name: "Gemini 4.0 Argon",
			tag: "Pro Flagship Reasoning & Zero Misinformation",
			speed: "Deep (~3.5s)",
			token_economy: "4.0/5",
			accuracy_rating: "5.0/5 (Absolute Precision)",
			tier: "Pro Plan Flagship",
			recommended: true,
			badge: "Pro Plan Flagship",
			description:
				"Top-tier Gemini 4 generation model with strict physics logic, optical ray accuracy, and mathematical proofs.",
		},
		{
			id: "gemini-3.8-flash",
			name: "Gemini 3.8 Flash",
			tag: "Next-Gen High Fidelity Science",
			speed: "Very Fast (~1.8s)",
			token_economy: "4.7/5",
			accuracy_rating: "4.9/5",
			tier: "Pro / Standard Plan",
			recommended: true,
			badge: "Pro High Speed",
			description:
				"Latest multimodal generation engine combining near-instant speed with high reasoning fidelity for STEM animations.",
		},
		{
			id: "gemini-2.5-flash",
			name: "Gemini 2.5 Flash",
			tag: "Standard Production Workhorse",
			speed: "Fast (~1.6s)",
			token_economy: "4.8/5",
			accuracy_rating: "4.6/5",
			tier: "Standard / Enterprise",
			recommended: false,
			badge: "Production Flash",
			description:
				"Production model balancing rapid turnarounds with high factual consistency across topics.",
		},
		{
			id: "veo-3.1-generate-preview",
			name: "Veo 3.1 Pro / Cinema",
			tag: "High-Fidelity Cinema Video",
			speed: "Generative (~45s)",
			token_economy: "High Quality Video",
			accuracy_rating: "4.9/5",
			tier: "Veo Pro / Standard Video",
			recommended: true,
			badge: "Veo Pro Cinema",
			description:
				"Highest quality Google Veo video generation for realistic educational animations, dynamic b-roll, and cinematography.",
		},
		{
			id: "veo-3.1-fast-generate-preview",
			name: "Veo 3.1 Fast Video",
			tag: "Google Video Generation",
			speed: "Generative (~25s)",
			token_economy: "Fast Video Tokens",
			accuracy_rating: "4.7/5",
			tier: "Veo Fast Video",
			recommended: false,
			badge: "Veo Fast Engine",
			description:
				"High-speed generative video synthesis for rapid background motion, b-roll clips, and animated study atmospheres.",
		},
		{
			id: "veo-2.0-generate-001",
			name: "Veo 2.0 Standard",
			tag: "Production Generative Video",
			speed: "Generative (~35s)",
			token_economy: "Standard Video Tokens",
			accuracy_rating: "4.6/5",
			tier: "Veo Standard Video",
			recommended: false,
			badge: "Veo 2.0 Standard",
			description:
				"Proven generative video engine creating consistent, high-definition motion clips and visual educational backdrops.",
		},
	];
}

export async function getModelsCatalog() {
	const advisorList = getModelAdvisorList();
	const themes = Object.entries(THEME_CONFIGS).map(([id, cfg]) => ({
		id,
		name: cfg.name,
	}));

	return {
		gemini_models: SUPPORTED_GEMINI_MODELS,
		advisorList,
		themes,
		voices: AVAILABLE_VOICES,
	};
}

export async function getKeysData(): Promise<KeyStatus[]> {
	try {
		return await getAllKeysStatus();
	} catch {
		return [];
	}
}

export async function deleteVideoJob(jobId: string): Promise<boolean> {
	if (!jobId) return false;
	const jobDir = path.join(OUTPUT_DIR, jobId);
	if (!fs.existsSync(jobDir)) {
		return false;
	}
	fs.rmSync(jobDir, { recursive: true, force: true });
	return true;
}
