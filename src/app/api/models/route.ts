import { NextResponse } from "next/server";
import { SUPPORTED_GEMINI_MODELS } from "@/engine/config";
import { THEME_CONFIGS } from "@/engine/themes";
import type { ModelAdvisorProfile } from "@/engine/types";
import { AVAILABLE_VOICES } from "@/engine/voiceover";

export async function GET() {
	const advisor: ModelAdvisorProfile[] = [
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
			id: "gemini-3.7-flash",
			name: "Gemini 3.7 Flash",
			tag: "Hybrid Extended Thinking",
			speed: "Fast (~2.1s)",
			token_economy: "4.5/5",
			accuracy_rating: "4.8/5",
			tier: "Pro / Standard Plan",
			recommended: false,
			badge: "Pro Thinking",
			description:
				"Features adaptive thinking capability to verify formulas and diagram coordinate geometry before rendering.",
		},
		{
			id: "gemini-3.1-pro-preview",
			name: "Gemini 3.1 Pro Preview",
			tag: "Pro Tier Deep STEM Reasoning",
			speed: "Deep (~4.2s)",
			token_economy: "3.5/5",
			accuracy_rating: "5.0/5",
			tier: "Pro / Standard Plan",
			recommended: false,
			badge: "Pro STEM Expert",
			description:
				"Evaluates complex mathematical formulas, exact optical ray angles, and eliminates misinformation in scientific scripts.",
		},
		{
			id: "gemini-2.5-pro",
			name: "Gemini 2.5 Pro",
			tag: "Pro Tier Academic Depth",
			speed: "Thorough (~3.8s)",
			token_economy: "3.8/5",
			accuracy_rating: "4.9/5",
			tier: "Pro / Standard Plan",
			recommended: false,
			badge: "Pro Academic",
			description:
				"Proven production Pro reasoning engine for comprehensive academic curricula, deep explanations, and multi-step derivations.",
		},
		{
			id: "gemini-3.6-flash",
			name: "Gemini 3.6 Flash",
			tag: "Pro Tier Advanced Science Logic",
			speed: "Fast (~2.2s)",
			token_economy: "4.2/5",
			accuracy_rating: "4.8/5",
			tier: "Pro / Standard Plan",
			recommended: false,
			badge: "Pro Science",
			description:
				"DeepMind scientific reasoning model. Excellent for physics, chemistry, and engineering diagrams.",
		},
		{
			id: "gemini-2.5-flash",
			name: "Gemini 2.5 Flash",
			tag: "Standard High Throughput",
			speed: "Very Fast (~1.5s)",
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

	const themes = Object.entries(THEME_CONFIGS).map(([id, cfg]) => ({
		id,
		name: cfg.name,
	}));

	return NextResponse.json({
		gemini_models: SUPPORTED_GEMINI_MODELS,
		model_advisor: advisor,
		themes,
		voices: AVAILABLE_VOICES,
		resolutions: ["1080p", "720p", "1440p", "4k"],
		default_resolution: "1080p",
		aspect_ratios: ["9:16", "16:9"],
		default_aspect_ratio: "9:16",
	});
}
