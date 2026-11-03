import type { VideoSegment } from "../types";
import { clamp, easeOutCubic } from "./easings";
import { renderAnimated3dScene } from "./scene-3d-spatial";
import { renderAnimatedCardsScene } from "./scene-cards";
import { renderAnimatedOpticsScene } from "./scene-optics";
import { renderAnimatedBioScene } from "./scene-particles-bio";
import { renderAnimatedWavesScene } from "./scene-waves";
import type { FrameContext } from "./types";

function selectSceneMarkup(
	ctx: FrameContext,
	segment: VideoSegment,
	topic: string,
): string {
	const promptText =
		`${topic} ${segment.visual_prompt || ""} ${segment.title || ""}`.toLowerCase();

	const isOptics =
		segment.diagram_type === "lens_ray" ||
		promptText.includes("lens") ||
		promptText.includes("optics") ||
		promptText.includes("লেন্স") ||
		promptText.includes("আলো");

	if (isOptics) {
		return renderAnimatedOpticsScene(ctx, segment);
	}

	const isWave =
		segment.diagram_type === "wave_propagation" ||
		promptText.includes("wave") ||
		promptText.includes("sound") ||
		promptText.includes("শব্দ") ||
		promptText.includes("তরঙ্গ");

	if (isWave) {
		return renderAnimatedWavesScene(ctx, segment);
	}

	const isBio =
		promptText.includes("cell") ||
		promptText.includes("bio") ||
		promptText.includes("photo") ||
		promptText.includes("কোষ") ||
		promptText.includes("সালোকসংশ্লেষণ");

	if (isBio) {
		return renderAnimatedBioScene(ctx, segment);
	}

	const is3d =
		segment.dimension === "3d" ||
		segment.layout_type === "3d_scene" ||
		segment.diagram_type === "3d_spatial";

	if (is3d) {
		return renderAnimated3dScene(ctx, segment);
	}

	return renderAnimatedCardsScene(ctx, segment);
}

function renderAmbientParticles(
	width: number,
	height: number,
	time: number,
): string {
	const particles: string[] = [];
	const count = 15;
	const u = width / 720;

	for (let i = 0; i < count; i++) {
		const seedX = ((i * 137.5) % width) + 20 * u;
		const seedY = ((i * 229.3) % height) + 20 * u;
		const speed = 25 * u + (i % 5) * 8 * u;
		const curX = (seedX + Math.sin(time * 1.2 + i) * 35 * u) % width;
		const curY = (seedY - time * speed + height * 2) % height;
		const r = (2 + (i % 3) * 1.5) * u;
		const opacity = 0.15 + (i % 4) * 0.12;

		particles.push(
			`<circle cx="${curX}" cy="${curY}" r="${r}" fill="#38bdf8" fill-opacity="${opacity}" />`,
		);
	}

	return particles.join("\n");
}

export function composeFrameSvg(
	ctx: FrameContext,
	segment: VideoSegment,
	topic: string,
): string {
	const { width, height, time, duration, overallProgStart, overallProgEnd } =
		ctx;
	const u = width / 720;

	// Progress bar calculation
	const curSegProgress = clamp(time / duration);
	const overallProg =
		overallProgStart + (overallProgEnd - overallProgStart) * curSegProgress;
	const barW = Math.round(width * Math.max(0.04, Math.min(1.0, overallProg)));

	// Header animation (glides down smoothly on entry)
	const headerProg = easeOutCubic(clamp(time / 0.6));
	const headerYOffset = (1 - headerProg) * (-40 * u);
	const badge = segment.badge_text || segment.tag || "Educational";
	const title = segment.title || topic;

	// Bottom caption animation (glides up smoothly)
	const caption = segment.bottom_caption || "";
	const captionProg = easeOutCubic(clamp(time / 0.8));
	const captionYOffset = (1 - captionProg) * (40 * u);

	const sceneMarkup = selectSceneMarkup(ctx, segment, topic);
	const ambientParticles = renderAmbientParticles(width, height, time);

	return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bgVignette" cx="50%" cy="45%" r="65%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="70%" stop-color="#070d17" />
      <stop offset="100%" stop-color="#020617" />
    </radialGradient>
  </defs>

  <!-- Background Base -->
  <rect width="${width}" height="${height}" fill="url(#bgVignette)" />

  <!-- Animated Ambient Floating Particles -->
  <g>
    ${ambientParticles}
  </g>

  <!-- Top Real-time Progress Bar -->
  <rect x="0" y="0" width="${barW}" height="${Math.round(8 * u)}" fill="#38bdf8" />

  <!-- Header Section (Animated Entrance) -->
  <g transform="translate(0, ${headerYOffset})" opacity="${headerProg}">
    <rect x="${40 * u}" y="${45 * u}" width="${Math.min(width - 80 * u, 240 * u)}" height="${40 * u}" rx="${12 * u}" fill="#1e293b" stroke="#38bdf8" stroke-width="2" />
    <text x="${56 * u}" y="${71 * u}" fill="#ffffff" font-family="'Hind Siliguri', 'Segoe UI', sans-serif" font-size="${18 * u}" font-weight="bold">${badge}</text>
    <text x="${width / 2}" y="${140 * u}" fill="#ffffff" font-family="'Hind Siliguri', 'Segoe UI', sans-serif" font-size="${30 * u}" font-weight="bold" text-anchor="middle">${title}</text>
  </g>

  <!-- Core Animated Scene -->
  <g>
    ${sceneMarkup}
  </g>

  <!-- Bottom Caption Section (Animated Entrance) -->
  ${
		caption
			? `
  <g transform="translate(0, ${captionYOffset})" opacity="${captionProg}">
    <rect x="${40 * u}" y="${height - 110 * u}" width="${width - 80 * u}" height="${52 * u}" rx="${16 * u}" fill="#0f172a" stroke="#38bdf8" stroke-width="2" />
    <text x="${width / 2}" y="${height - 77 * u}" fill="#ffffff" font-family="'Hind Siliguri', 'Segoe UI', sans-serif" font-size="${18 * u}" text-anchor="middle" font-weight="bold">${caption}</text>
  </g>`
			: ""
	}
</svg>`;
}
