import type { VideoSegment } from "./types";

export interface BuildVisualPromptParams {
	topic: string;
	segment: VideoSegment;
	width: number;
	height: number;
	theme: string;
	language: string;
}

export function buildVisualPrompt(params: BuildVisualPromptParams): string {
	const { topic, segment, width, height, theme, language } = params;
	const is3d = segment.dimension === "3d" || segment.layout_type === "3d_scene";
	const isBengali = language === "bn";
	const visualPromptHint = segment.visual_prompt || "";
	const title = segment.title || topic;
	const tag = segment.badge_text || segment.tag || "Educational";
	const narration = segment.narration || "";

	const visualStyle = is3d
		? "3D spatial scene illustration: isometric or perspective projection with gradient volumetric shading, depth lighting, floating spatial elements, depth coordinates, and rich highlights."
		: "2D high-contrast technical motion graphics: precision vector schematic, scientific rays or flows, labeled anatomical/mechanical components, callout pointers, and structured formula or concept breakdown.";

	return `You are a world-class educational motion graphics designer and technical vector illustrator.
Generate a complete, production-grade SVG illustration for an educational video reel.

VIDEO SPECIFICATIONS:
- Main Topic: ${topic}
- Segment Tag: ${tag}
- Segment Title: ${title}
- Segment Narration Context: "${narration}"
- Visual Scene Concept: "${visualPromptHint}"
- Dimension Mode: ${is3d ? "3D Spatial Illustration" : "2D Motion Graphic Diagram"}
- Canvas Dimensions: width="${width}" height="${height}" (viewBox="0 0 ${width} ${height}")
- Theme Aesthetic: ${theme} (dark background #090d16 / #0b1120, glowing accents #38bdf8, #818cf8, #34d399, #f43f5e, #fbbf24)
- Language: ${isBengali ? "Bengali (বাংলা) for labels and captions where appropriate" : "English"}

ILLUSTRATION MANDATES:
1. PURE TOPIC-SPECIFIC VISUALIZATION:
   Do NOT output generic blank boxes. Actually illustrate the scientific/academic subject matter in detail:
   ${visualStyle}
2. COMPOSITION & HIERARCHY:
   - Modern dark gradient background with subtle grid or radial glow backdrop.
   - Top Header: Elegant pill badge with text "${tag}" and clear title "${title}".
   - Center Canvas: The primary scientific diagram or 3D vector illustration with labeled components, arrows, gradients, and glowing accents.
   - Bottom Overlay: Clean summary card or caption bar with key takeaway.
3. SVG TECHNICAL REQUIREMENTS:
   - Must be fully valid, self-contained SVG starting with <svg> and ending with </svg>.
   - Must include xmlns="http://www.w3.org/2000/svg" and viewBox="0 0 ${width} ${height}".
   - Use <defs> for gradients, glow filters (<filter id="glow">), and markers (<marker> for arrowheads).
   - Use standard cross-platform font families: font-family="'Segoe UI', Roboto, 'Hind Siliguri', sans-serif".
   - Zero external images (<image xlink:href="http..."> is strictly forbidden). Everything must be pure vector geometry (<path>, <circle>, <rect>, <polygon>, <text>, <line>).
4. OUTPUT FORMAT:
   - Return ONLY the raw SVG code.
   - Do NOT wrap in markdown or backticks. No conversational filler.`;
}
