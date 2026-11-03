import type { VideoSegment } from "../types";
import { clamp, easeOutCubic } from "./easings";
import type { FrameContext } from "./types";

export function renderAnimatedCardsScene(
	ctx: FrameContext,
	segment: VideoSegment,
): string {
	const { width, height, time, duration } = ctx;
	const cards = segment.card_items || [];
	const u = width / 720;
	const cardCount = Math.min(3, cards.length);

	if (cardCount === 0) {
		return "";
	}

	const startY = height * 0.32;
	const cardH = 96 * u;
	const gap = 20 * u;
	const cardW = width - 80 * u;
	const cardX = 40 * u;
	const cardsMarkup: string[] = [];

	const tNorm = clamp(time / duration);

	for (let i = 0; i < cardCount; i++) {
		const card = cards[i];
		const enterStart = 0.15 + i * 0.22;
		const enterProgress = easeOutCubic(clamp((tNorm - enterStart) / 0.18));

		if (enterProgress <= 0) continue;

		const slideX = (1 - enterProgress) * (50 * u);
		const opacity = enterProgress;
		const cY = startY + i * (cardH + gap);

		// Current active stage pulse
		const isActive = tNorm >= enterStart && tNorm < enterStart + 0.3;
		const borderPulse = isActive ? 1 + Math.sin(time * 8) * 0.04 : 1;
		const accent = card.accent || "#38bdf8";

		cardsMarkup.push(`
      <g opacity="${opacity}" transform="translate(${-slideX}, 0) scale(${borderPulse})" transform-origin="${cardX + cardW / 2} ${cY + cardH / 2}">
        <rect x="${cardX}" y="${cY}" width="${cardW}" height="${cardH}" rx="${14 * u}" fill="#111827" stroke="${isActive ? accent : "#1e293b"}" stroke-width="${isActive ? "2.5" : "1.5"}" />
        <rect x="${cardX + 4}" y="${cY + 4}" width="${6 * u}" height="${cardH - 8}" rx="${3 * u}" fill="${accent}" />
        
        <!-- Active Pulse Beacon -->
        ${
					isActive
						? `<circle cx="${cardX + cardW - 24 * u}" cy="${cY + 24 * u}" r="${6 * u}" fill="${accent}" />
               <circle cx="${cardX + cardW - 24 * u}" cy="${cY + 24 * u}" r="${(10 + Math.sin(time * 10) * 4) * u}" fill="none" stroke="${accent}" stroke-width="1.5" />`
						: ""
				}

        <!-- Card Title & Subtitle -->
        <text x="${cardX + 24 * u}" y="${cY + 34 * u}" fill="#ffffff" font-size="${20 * u}" font-weight="bold">${card.title || ""}</text>
        <text x="${cardX + 24 * u}" y="${cY + 68 * u}" fill="#94a3b8" font-size="${15 * u}">${card.subtitle || ""}</text>
      </g>
    `);
	}

	return `
    <g>
      ${cardsMarkup.join("\n")}
    </g>
  `;
}
