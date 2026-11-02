import type { VideoSegment } from "./types";

export interface SvgSceneConfig {
	width: number;
	height: number;
	theme: string;
}

export function generateSegmentSvg(
	segment: VideoSegment,
	config: SvgSceneConfig,
): string {
	const { width, height } = config;
	const title = segment.title || "";
	const badge = segment.badge_text || segment.tag || "Study Video";
	const caption = segment.bottom_caption || "";

	return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="#0d101a" />
  <rect x="0" y="0" width="${width}" height="8" fill="#38bdf8" />
  <rect x="40" y="50" width="220" height="44" rx="12" fill="#1e293b" stroke="#38bdf8" stroke-width="2" />
  <text x="60" y="78" fill="#ffffff" font-family="'Hind Siliguri', 'Nirmala UI', sans-serif" font-size="20">${badge}</text>
  <text x="${width / 2}" y="150" text-anchor="middle" fill="#ffffff" font-family="'Hind Siliguri', 'Nirmala UI', sans-serif" font-size="34" font-weight="bold">${title}</text>
  ${
		caption
			? `<rect x="40" y="${height - 120}" width="${width - 80}" height="54" rx="20" fill="#0f172a" stroke="#38bdf8" stroke-width="2" />
  <text x="${width / 2}" y="${height - 85}" text-anchor="middle" fill="#ffffff" font-family="'Hind Siliguri', 'Nirmala UI', sans-serif" font-size="20">${caption}</text>`
			: ""
	}
</svg>`;
}
