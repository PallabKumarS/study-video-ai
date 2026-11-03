export interface SvgSanitizeOptions {
	width: number;
	height: number;
	fallbackTitle?: string;
}

export function sanitizeSvgMarkup(
	rawText: string,
	options: SvgSanitizeOptions,
): string {
	const { width, height, fallbackTitle = "Educational Diagram" } = options;
	let cleaned = rawText.trim();

	// Remove markdown fences
	if (cleaned.startsWith("```xml")) cleaned = cleaned.slice(6);
	else if (cleaned.startsWith("```svg")) cleaned = cleaned.slice(6);
	else if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
	if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
	cleaned = cleaned.trim();

	const startIdx = cleaned.indexOf("<svg");
	const endIdx = cleaned.lastIndexOf("</svg>");

	if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
		return createFallbackSvg(width, height, fallbackTitle);
	}

	let svg = cleaned.slice(startIdx, endIdx + 6).trim();

	// Ensure required xmlns is present
	if (!svg.includes('xmlns="http://www.w3.org/2000/svg"')) {
		svg = svg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
	}

	// Ensure viewBox is present
	if (!svg.includes("viewBox=")) {
		svg = svg.replace("<svg", `<svg viewBox="0 0 ${width} ${height}"`);
	}

	// Remove script tags and external references
	svg = svg.replace(/<script[\s\S]*?<\/script>/gi, "");
	svg = svg.replace(/href=["']http[^"']+["']/gi, "");

	return svg;
}

export function createFallbackSvg(
	width: number,
	height: number,
	title: string,
): string {
	const cx = Math.round(width / 2);
	const cy = Math.round(height / 2);

	return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0b1120" />
      <stop offset="100%" stop-color="#020617" />
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.25" />
      <stop offset="100%" stop-color="#38bdf8" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)" />
  <circle cx="${cx}" cy="${cy}" r="${Math.round(width * 0.35)}" fill="url(#glow)" />
  <circle cx="${cx}" cy="${cy}" r="${Math.round(width * 0.22)}" fill="none" stroke="#38bdf8" stroke-width="3" stroke-dasharray="8 8" />
  <circle cx="${cx}" cy="${cy}" r="${Math.round(width * 0.12)}" fill="#1e293b" stroke="#818cf8" stroke-width="2" />
  <text x="${cx}" y="${cy + 8}" fill="#f8fafc" font-family="'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="bold" text-anchor="middle">${title}</text>
</svg>`;
}
