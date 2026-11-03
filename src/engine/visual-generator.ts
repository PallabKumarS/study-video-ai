import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import {
	DEFAULT_ASPECT_RATIO,
	DEFAULT_RESOLUTION,
	getCurrentGeminiApiKey,
	RESOLUTIONS,
	SUPPORTED_GEMINI_MODELS,
} from "./config";
import { recordKeyUsage } from "./key-manager";
import { getGenAIClient } from "./planner";
import { createFallbackSvg, sanitizeSvgMarkup } from "./svg-sanitizer";
import type { VideoSegment } from "./types";
import { buildVisualPrompt } from "./visual-prompt-builder";

export interface VisualAssetResult {
	type: "image" | "video";
	path: string;
	svgPath?: string;
}

export interface GenerateVisualParams {
	segment: VideoSegment;
	topic: string;
	outputBaseDir: string;
	aspectRatio?: string;
	resolution?: string;
	theme?: string;
	language?: string;
	model?: string;
	apiKey?: string;
}

async function renderSvgToPng(
	svgContent: string,
	pngPath: string,
): Promise<string> {
	fs.mkdirSync(path.dirname(pngPath), { recursive: true });
	await sharp(Buffer.from(svgContent)).png().toFile(pngPath);
	return pngPath;
}

async function tryVeoVideoGeneration(
	segment: VideoSegment,
	outputVideoPath: string,
	apiKey?: string,
): Promise<string | null> {
	try {
		const ai = getGenAIClient(apiKey);
		const prompt =
			segment.visual_prompt ||
			`Cinematic 3D educational animation showing ${segment.title}`;

		const response = await ai.models.generateVideos({
			model: "veo-2.0-generate-001",
			prompt,
			config: {
				numberOfVideos: 1,
				durationSeconds: 5,
				aspectRatio: "9:16",
			},
		});

		// If video generated with URI or bytes, download and save
		const videoUri = (response as { uri?: string })?.uri;
		if (videoUri) {
			const res = await fetch(videoUri);
			const buf = Buffer.from(await res.arrayBuffer());
			fs.writeFileSync(outputVideoPath, buf);
			return outputVideoPath;
		}
		return null;
	} catch {
		// Veo unavailable or quota 0; graceful fallback to generative SVG
		return null;
	}
}

export async function generateSegmentVisualAsset(
	params: GenerateVisualParams,
): Promise<VisualAssetResult> {
	const {
		segment,
		topic,
		outputBaseDir,
		aspectRatio = DEFAULT_ASPECT_RATIO,
		resolution = DEFAULT_RESOLUTION,
		theme = "dark_glow",
		language = "bn",
		model = "gemini-3.5-flash-lite",
		apiKey,
	} = params;

	const dims = RESOLUTIONS[aspectRatio]?.[resolution] || [1080, 1920];
	const [w, h] = dims;
	const segIdx = segment.segment_index;

	fs.mkdirSync(outputBaseDir, { recursive: true });
	const outputMp4Path = path.join(outputBaseDir, `visual_seg_${segIdx}.mp4`);
	const outputPngPath = path.join(outputBaseDir, `visual_seg_${segIdx}.png`);
	const outputSvgPath = path.join(outputBaseDir, `visual_seg_${segIdx}.svg`);

	// Check if Veo video is requested and attempt generation
	const isVeoRequested =
		model.includes("veo") ||
		(segment.dimension === "3d" && model.includes("veo"));
	if (isVeoRequested) {
		const veoVideo = await tryVeoVideoGeneration(
			segment,
			outputMp4Path,
			apiKey,
		);
		if (veoVideo && fs.existsSync(veoVideo)) {
			return { type: "video", path: veoVideo };
		}
	}

	// Generate customized educational SVG via Gemini
	const ai = getGenAIClient(apiKey);
	const promptPayload = buildVisualPrompt({
		topic,
		segment,
		width: w,
		height: h,
		theme,
		language,
	});

	const candidateModels = [
		model.includes("veo") ? "gemini-3.8-flash" : model,
		...SUPPORTED_GEMINI_MODELS.filter((m) => !m.includes("veo") && m !== model),
	];

	let rawSvg = "";
	const activeKey = apiKey || getCurrentGeminiApiKey();

	for (const modelName of candidateModels) {
		try {
			const response = await ai.models.generateContent({
				model: modelName,
				contents: promptPayload,
				config: {
					temperature: 0.25,
					maxOutputTokens: 4000,
				},
			});

			const text = response.text || "";
			if (text.includes("<svg") && text.includes("</svg>")) {
				rawSvg = text;
				recordKeyUsage(activeKey, "generate_visual", 1500);
				break;
			}
		} catch {}
	}

	// Sanitize SVG or use fallback if LLM response is malformed
	const sanitizedSvg = sanitizeSvgMarkup(rawSvg, {
		width: w,
		height: h,
		fallbackTitle: segment.title || topic,
	});

	fs.writeFileSync(outputSvgPath, sanitizedSvg, "utf-8");

	try {
		await renderSvgToPng(sanitizedSvg, outputPngPath);
		return { type: "image", path: outputPngPath, svgPath: outputSvgPath };
	} catch {
		// Emergency fallback SVG if complex SVG rasterization fails
		const fallbackSvg = createFallbackSvg(w, h, segment.title || topic);
		fs.writeFileSync(outputSvgPath, fallbackSvg, "utf-8");
		await renderSvgToPng(fallbackSvg, outputPngPath);
		return { type: "image", path: outputPngPath, svgPath: outputSvgPath };
	}
}
