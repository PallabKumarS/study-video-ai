import { GoogleGenAI } from "@google/genai";
import { getCurrentGeminiApiKey, SUPPORTED_GEMINI_MODELS } from "./config";
import { recordKeyUsage, recordModelExhaustion } from "./key-manager";
import type { VideoPlan, VideoSegment } from "./types";

export function getGenAIClient(apiKey?: string): GoogleGenAI {
	const key = apiKey || getCurrentGeminiApiKey();
	if (!key) {
		throw new Error("GEMINI_API_KEY is not configured in .env");
	}
	return new GoogleGenAI({ apiKey: key });
}

export async function generateVideoTitle(
	userPrompt: string,
	language = "bn",
	preferredModel = "gemini-3.5-flash-lite",
	apiKey?: string,
): Promise<string> {
	const ai = getGenAIClient(apiKey);
	const langName = language === "bn" ? "natural Bengali (বাংলা)" : "English";
	const sysInstruction = `You are an educational video director. Generate a concise, catchy video title (max 6-8 words) strictly in ${langName}. Output ONLY the title without quotes or markdown.`;

	const promptText =
		language === "bn"
			? `Give me a short catchy title in natural Bengali (বাংলা) for this video topic: ${userPrompt}. Output ONLY the Bengali text without quotes.`
			: `Give me a short catchy title in English for this video topic: ${userPrompt}. Output ONLY the English text without quotes.`;

	const candidateModels = [
		preferredModel,
		"gemini-3-flash-preview",
		"gemini-flash-lite-latest",
	];

	for (const modelName of candidateModels) {
		try {
			const resp = await ai.models.generateContent({
				model: modelName,
				contents: promptText,
				config: {
					systemInstruction: sysInstruction,
					temperature: 0.7,
					maxOutputTokens: 60,
				},
			});

			const title = resp.text?.trim().replace(/^["'`]|["'`]$/g, "");
			if (title && title.length > 2) {
				const activeK = apiKey || getCurrentGeminiApiKey();
				recordKeyUsage(activeK, "generate_title", 200, modelName);
				return title;
			}
		} catch (err) {
			const errStr = String(err);
			if (
				errStr.includes("429") ||
				errStr.includes("quota") ||
				errStr.includes("RESOURCE_EXHAUSTED")
			) {
				const activeK = apiKey || getCurrentGeminiApiKey();
				recordModelExhaustion(activeK, modelName);
			}
		}
	}

	return language === "bn"
		? "আলোর প্রতিসরণ: উত্তল ও অবতল লেন্সের মূল নিয়ম"
		: "Optics: Convex and Concave Lens Rules";
}

export const PLANNER_SYSTEM_INSTRUCTION = `
You are an expert educational motion graphics video director and science animator.
You produce high-retention, cinematic educational study reels and videos combining 3D AI spatial animations and 2D vector motion graphics.

MANDATORY ACCURACY & ANIMATION RULES:
0. ABSOLUTE SCIENTIFIC & FACTUAL ACCURACY (STRICT MANDATE):
   All content MUST be 100% scientifically, physically, mathematically, and historically accurate. Zero misinformation, zero hallucinations, zero inverted formulas.
   - Optics: Convex lenses are CONVERGING; parallel rays refract through the real principal focus to form real, inverted images (when object distance > focal length). Concave lenses are DIVERGING; parallel rays diverge outwards as if originating from the virtual focal point, forming virtual, upright, diminished images.
   - Acoustics / Wave Physics: Sound requires a medium; reflection creates echoes when distance >= 17m; speed in air ~343 m/s.
   - Exact terminology: Always use precise scientific terms in Bengali (যেমন: ফোকাস দূরত্ব, অভিসারী, অপসারী, বাস্তব প্রতিবিম্ব, অবাস্তব প্রতিবিম্ব, প্রতিধ্বনি, তরঙ্গমুখ) or English.
1. 3D VS 2D ANIMATION SELECTION (INTELLIGENT HYBRID ARCHITECTURE):
   For every segment, decide whether 3D animation or 2D motion graphics is required:
   - USE 3D ANIMATION (dimension="3d", layout_type="3d_scene"):
     * Real-world spatial physics (e.g., sound waves echoing off 3D buildings/mountains, wave propagation, Doppler shifts).
     * Spatial mechanics, molecular geometries, orbital mechanics, 3D electric/magnetic field lines.
     * Cinematic hooks or glassmorphic achievement milestones (e.g., 3D extruded trophy, depth lighting, floating particle fields).
     * Provide a cinematic "visual_prompt" detailing 3D camera trajectory (isometric, slow tracking, low angle), volumetric lighting, atmospheric depth, and spatial objects.
   - USE 2D VECTOR MOTION (dimension="2d", layout_type="diagram" or "cards"):
     * Exact geometric ray tracing (e.g., lens 3-ray rules with principal axis, optical center, focal points).
     * Mathematical proofs, formula breakdowns, side-by-side comparison tables.
     * Structured recap cards and exam takeaways where crisp readability and zero visual distortion are vital.
2. ZERO CONTENT REPETITION: Every segment MUST cover a distinct, unique phase or concept. Never repeat the same diagram or concept across multiple segments.
3. DUAL/MULTI-CONCEPT COVERAGE:
   When the prompt includes two concepts or comparisons:
   - Segment 1: Hook / Core spatial problem / 3D or 2D Introduction.
   - Segment 2: Exclusively First Concept (e.g., Convex Lens with converging rays, real inverted image).
   - Segment 3: Exclusively Second Concept (e.g., Concave Lens with diverging rays, virtual upright image).
   - Segment 4: Comparative Exam Summary / Key Takeaways.
4. SEGMENT COUNT & PACING:
   - ~30s video: exactly 2 segments (~15s each).
   - ~60s video: 3 to 4 segments (~15-20s each).
   - ~90s video: 4 to 5 segments (~18-22s each).
   - ~120s+ video: 5 to 6 segments (~20-25s each).
5. SCRIPT & NARRATION:
   - If language is Bengali ('bn'), write ALL text strictly in natural, grammatically correct educational Bengali (বাংলা).
   - If language is English ('en'), write all text strictly in clear, professional English.

Output ONLY valid JSON matching this schema:
{
  "topic": "Concave & Convex Lenses Explained",
  "category": "Physics / Optics",
  "language": "en",
  "aspect_ratio": "9:16",
  "estimated_total_seconds": 60,
  "segments": [
    {
      "segment_index": 1,
      "tag": "Optics Hook",
      "dimension": "3d",
      "visual_prompt": "Cinematic 3D dark studio scene, a glass optical lens floating in mid-air with volumetric blue laser light beam slicing through the glass and refracting into sharp focal points, particles floating, isometric camera tracking",
      "animation_details": {
        "dimension": "3d",
        "camera_movement": "Slow orbital push-in",
        "lighting": "Volumetric cyan rim light with dark moody background",
        "environment": "Minimalist dark 3D grid with floating optical elements"
      },
      "title": "Where Does Light Form an Image?",
      "narration": "Have you ever wondered how lenses bend light into crisp images? It all comes down to 3 fundamental ray rules.",
      "bottom_caption": "How lenses form sharp images",
      "layout_type": "cards",
      "badge_text": "Study Rule",
      "card_items": [
        {"title": "Convex Lens", "subtitle": "Converging: focuses light rays inward", "accent": "#38bdf8"},
        {"title": "Concave Lens", "subtitle": "Diverging: spreads light rays outward", "accent": "#f43f5e"}
      ],
      "diagram_type": "none"
    },
    {
      "segment_index": 2,
      "tag": "Convex Lens",
      "dimension": "2d",
      "visual_prompt": "Clean 2D vector ray optics diagram of a biconvex lens on a dark grid, 3 distinct colored rays refracting to form an inverted real image at 2F",
      "animation_details": {
        "dimension": "2d",
        "camera_movement": "Static centered",
        "lighting": "High-contrast glowing vector lines",
        "environment": "Dark academic grid canvas"
      },
      "title": "Convex Lens & Real Image",
      "narration": "In a convex lens, parallel rays refract through the focal point, while rays through the optical center continue straight, forming a real inverted image.",
      "bottom_caption": "Convex lens: Converging rays form real image",
      "layout_type": "diagram",
      "badge_text": "Ray Rules: Convex",
      "card_items": [],
      "diagram_type": "lens_ray",
      "diagram_data": {
        "lens_type": "convex",
        "show_parallel_ray": true,
        "show_center_ray": true,
        "show_focal_ray": true
      }
    },
    {
      "segment_index": 3,
      "tag": "Concave Lens",
      "dimension": "2d",
      "visual_prompt": "Clean 2D vector ray optics diagram of a biconcave lens on a dark grid, 3 distinct colored rays diverging with virtual backward dashed lines converging at F1",
      "animation_details": {
        "dimension": "2d",
        "camera_movement": "Static centered",
        "lighting": "High-contrast glowing vector lines",
        "environment": "Dark academic grid canvas"
      },
      "title": "Concave Lens & Virtual Image",
      "narration": "In a concave lens, parallel rays diverge away from the near focal point, forming a virtual, upright, and diminished image.",
      "bottom_caption": "Concave lens: Diverging rays form virtual image",
      "layout_type": "diagram",
      "badge_text": "Ray Rules: Concave",
      "card_items": [],
      "diagram_type": "lens_ray",
      "diagram_data": {
        "lens_type": "concave",
        "show_parallel_ray": true,
        "show_center_ray": true,
        "show_focal_ray": true
      }
    },
    {
      "segment_index": 4,
      "tag": "Exam Summary",
      "dimension": "3d",
      "visual_prompt": "3D glassmorphic cards floating in space with neon glowing borders, comparing convex convergence and concave divergence, subtle camera tilt",
      "animation_details": {
        "dimension": "3d",
        "camera_movement": "Gentle floating tilt",
        "lighting": "Dual tone blue and emerald accent glow",
        "environment": "3D perspective grid with subtle bokeh"
      },
      "title": "Key Optical Comparison",
      "narration": "Remember this rule: convex lenses converge light to form real inverted images, while concave lenses diverge light to form virtual upright images.",
      "bottom_caption": "Master the 3 ray rules for exam success",
      "layout_type": "cards",
      "badge_text": "Exam Takeaway",
      "card_items": [
        {"title": "Convex (Converging)", "subtitle": "Real & Inverted image (d_o > f)", "accent": "#38bdf8"},
        {"title": "Concave (Diverging)", "subtitle": "Always Virtual & Upright", "accent": "#34d399"}
      ],
      "diagram_type": "none"
    }
  ]
}
`;

function cleanJsonResponse(rawText: string): string {
	let cleaned = rawText.trim();
	if (cleaned.startsWith("```json")) {
		cleaned = cleaned.slice(7);
	} else if (cleaned.startsWith("```")) {
		cleaned = cleaned.slice(3);
	}
	if (cleaned.endsWith("```")) {
		cleaned = cleaned.slice(0, -3);
	}
	return cleaned.trim();
}

function validateAndEnhancePlan(
	plan: VideoPlan,
	userPrompt: string,
	language: string,
): VideoPlan {
	const segments = plan.segments || [];
	if (segments.length === 0) return plan;

	const promptLower = userPrompt.toLowerCase();
	const isLensTopic =
		promptLower.includes("lens") || userPrompt.includes("লেন্স");
	const wantsBoth =
		(promptLower.includes("concave") && promptLower.includes("convex")) ||
		(userPrompt.includes("উত্তল") && userPrompt.includes("অবতল"));

	if (isLensTopic && wantsBoth) {
		const hasConcave = segments.some(
			(s) => s.diagram_data?.lens_type === "concave",
		);
		if (!hasConcave && segments.length >= 3) {
			const seg3 = segments[2];
			seg3.tag = language === "bn" ? "অবতল লেন্স" : "Concave Lens";
			seg3.title =
				language === "bn"
					? "অবতল লেন্স ও অবাস্তব প্রতিবিম্ব"
					: "Concave Lens & Virtual Image";
			seg3.layout_type = "diagram";
			seg3.diagram_type = "lens_ray";
			seg3.diagram_data = {
				lens_type: "concave",
				show_parallel_ray: true,
				show_center_ray: true,
				show_focal_ray: true,
			};
			seg3.badge_text =
				language === "bn" ? "রশ্মি নিয়ম: অবতল" : "Ray Rules: Concave";
			seg3.bottom_caption =
				language === "bn"
					? "অবতল লেন্সে অপসারী রশ্মি মিলিত হয়ে সোজা অবাস্তব প্রতিবিম্ব গঠন করে"
					: "Concave lens: Diverging rays form virtual upright image";
			seg3.narration =
				language === "bn"
					? "অবতল লেন্সে প্রধান অক্ষের সমান্তরাল রশ্মিগুলো লেন্স ভেদ করার পর এমনভাবে ছড়িয়ে পড়ে যেন তারা প্রথম ফোকাস থেকে অপসারিত হচ্ছে। আলোক কেন্দ্র দিয়ে যাওয়া রশ্মি কোনো বিচ্যুতি ছাড়াই সোজা নির্গত হয়। ফলে লেন্সের একই পাশে বস্তুর চেয়ে ছোট একটি অবাস্তব ও সোজা প্রতিবিম্ব গঠিত হয়।"
					: "In a concave lens, parallel incident rays diverge outward as if originating from the near focal point. A ray passing through the optical center travels straight without deviation. These diverging rays appear to intersect, forming an upright, diminished virtual image.";
		}
	}

	return plan;
}

export async function planStudyVideo(
	userPrompt: string,
	targetDuration = 60,
	aspectRatio = "9:16",
	preferredModel = "gemini-3.8-flash",
	customTitle?: string,
	language = "bn",
	apiKey?: string,
): Promise<VideoPlan> {
	const ai = getGenAIClient(apiKey);
	const isVeoRequested = preferredModel.includes("veo");
	const planningModel = isVeoRequested
		? "gemini-3.1-pro-preview"
		: preferredModel;

	const candidateModels = [
		planningModel,
		...SUPPORTED_GEMINI_MODELS.filter(
			(m) => m !== planningModel && !m.includes("veo"),
		),
	];

	const langDirective =
		language === "bn"
			? "LANGUAGE MANDATE: The video language is Bengali (বাংলা). All narration scripts, scene titles, tags, card titles/subtitles, and bottom captions MUST be written strictly in natural, engaging educational Bengali script."
			: "LANGUAGE MANDATE: The video language is English. All narration scripts, titles, tags, card text, and captions must be written in English.";

	const titleDirective = customTitle
		? `USE THIS EXACT TITLE AS THE MAIN TOPIC: "${customTitle}".`
		: "";

	const promptPayload = `
Plan an educational study video based on this prompt:
"${userPrompt}"

${langDirective}
${titleDirective}

Target Duration: ${targetDuration} seconds.
Aspect Ratio: ${aspectRatio}.
Language Code: ${language}.
Generate the structured segments with voiceover narration, cards, diagram elements, and bottom caption.
`;

	let lastError: unknown = null;
	for (const modelName of candidateModels) {
		try {
			const response = await ai.models.generateContent({
				model: modelName,
				contents: promptPayload,
				config: {
					systemInstruction: PLANNER_SYSTEM_INSTRUCTION,
					temperature: 0.3,
					responseMimeType: "application/json",
				},
			});

			const raw = response.text || "";
			const cleaned = cleanJsonResponse(raw);
			const data = JSON.parse(cleaned) as VideoPlan;
			data.used_model = isVeoRequested ? preferredModel : modelName;
			if (modelName !== planningModel) {
				const errStr = String(lastError);
				const is429 =
					errStr.includes("429") ||
					errStr.includes("quota") ||
					errStr.includes("RESOURCE_EXHAUSTED");
				data.fallback_reason = is429
					? `${planningModel} daily quota limit was reached; automatically switched to ${modelName}`
					: `${planningModel} was temporarily unavailable; automatically switched to ${modelName}`;
			}
			data.language = language;
			if (customTitle) data.topic = customTitle;

			const enhanced = validateAndEnhancePlan(data, userPrompt, language);
			const activeK = apiKey || getCurrentGeminiApiKey();
			recordKeyUsage(activeK, "video_generation", 1800, modelName);
			return enhanced;
		} catch (err) {
			lastError = err;
			const errStr = String(err);
			if (
				errStr.includes("429") ||
				errStr.includes("quota") ||
				errStr.includes("RESOURCE_EXHAUSTED")
			) {
				const activeK = apiKey || getCurrentGeminiApiKey();
				recordModelExhaustion(activeK, modelName);
			}
		}
	}

	throw new Error(`All Gemini models failed to generate plan: ${lastError}`);
}

export async function refineSegmentWithFeedback(
	segment: VideoSegment,
	topic: string,
	userComment: string,
	language = "bn",
	preferredModel = "gemini-3.8-flash",
	apiKey?: string,
): Promise<VideoSegment> {
	const ai = getGenAIClient(apiKey);
	const candidateModels = [
		preferredModel,
		"gemini-3-flash-preview",
		"gemini-flash-lite-latest",
		"gemini-3.6-flash",
	];
	const langName =
		language === "bn" ? "natural educational Bengali (বাংলা)" : "English";

	const promptPayload = `
We have an educational video segment for the topic: "${topic}".
Current Segment JSON:
${JSON.stringify(segment, null, 2)}

User Feedback / Change Request:
"${userComment}"

Language Requirement: Strictly output all spoken narration, title, badge_text, card items, and bottom_caption in ${langName}.
Update this segment JSON according to the user's instructions while keeping the format identical.
If the user mentions concave lens (অবতল লেন্স), ensure layout_type="diagram", diagram_type="lens_ray", diagram_data={"lens_type": "concave"}.
If the user mentions convex lens (উত্তল লেন্স), ensure layout_type="diagram", diagram_type="lens_ray", diagram_data={"lens_type": "convex"}.

Return ONLY the updated JSON segment object.
`;

	for (const modelName of candidateModels) {
		try {
			const resp = await ai.models.generateContent({
				model: modelName,
				contents: promptPayload,
				config: {
					systemInstruction:
						"You are an expert video director. Return ONLY valid JSON for the updated segment object.",
					temperature: 0.3,
					responseMimeType: "application/json",
				},
			});

			const cleaned = cleanJsonResponse(resp.text || "");
			const updated = JSON.parse(cleaned) as VideoSegment;
			updated.segment_index = segment.segment_index;
			const activeK = apiKey || getCurrentGeminiApiKey();
			recordKeyUsage(activeK, "segment_refinement", 800, modelName);
			return updated;
		} catch (err) {
			const errStr = String(err);
			if (
				errStr.includes("429") ||
				errStr.includes("quota") ||
				errStr.includes("RESOURCE_EXHAUSTED")
			) {
				const activeK = apiKey || getCurrentGeminiApiKey();
				recordModelExhaustion(activeK, modelName);
			}
		}
	}

	const fallback = { ...segment };
	const lower = userComment.toLowerCase();
	if (lower.includes("concave") || userComment.includes("অবতল")) {
		fallback.tag = language === "bn" ? "অবতল লেন্স" : "Concave Lens";
		fallback.title =
			language === "bn"
				? "অবতল লেন্স ও ভার্চুয়াল ফোকাস"
				: "Concave Lens & Virtual Focus";
		fallback.layout_type = "diagram";
		fallback.diagram_type = "lens_ray";
		fallback.diagram_data = {
			lens_type: "concave",
			show_parallel_ray: true,
			show_center_ray: true,
			show_focal_ray: true,
		};
		fallback.bottom_caption =
			language === "bn"
				? "ভার্চুয়াল ফোকাস: অপসারী রশ্মি পেছনের দিকে ফোকাসে মিলিত হয়"
				: "Virtual focus: Diverging rays trace back to near focal point";
	}
	return fallback;
}
