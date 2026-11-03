import type { VideoSegment } from "../types";
import { clamp, easeOutCubic } from "./easings";
import type { FrameContext } from "./types";

export function renderAnimatedOpticsScene(
	ctx: FrameContext,
	segment: VideoSegment,
): string {
	const { width, height, time, duration } = ctx;
	const isConvex = segment.diagram_data?.lens_type !== "concave";
	const cx = width / 2;
	const cy = height * 0.48;
	const axisY = cy;

	// Scale according to viewport width
	const u = width / 720;
	const focalDist = 140 * u;
	const objX = cx - 240 * u;
	const objH = 90 * u;
	const lensH = 340 * u;
	const lensW = isConvex ? 38 * u : 28 * u;

	// Time phases: 0 to 0.4: incident rays; 0.4 to 0.8: refracted rays; 0.8 to 1.0: image reveal
	const tNorm = clamp(time / duration);
	const incProg = easeOutCubic(clamp(tNorm / 0.35));
	const refrProg = easeOutCubic(clamp((tNorm - 0.35) / 0.4));
	const imgProg = easeOutCubic(clamp((tNorm - 0.75) / 0.25));

	// Ray 1: Parallel to axis, then through focus
	const p1StartX = objX;
	const p1StartY = axisY - objH;
	const p1HitX = cx;
	const p1HitY = p1StartY;
	const p1CurX = p1StartX + (p1HitX - p1StartX) * incProg;

	// Refracted ray 1
	const f2X = cx + focalDist;
	const f2Y = axisY;
	const p1EndX = isConvex ? cx + 240 * u : cx + 240 * u;
	const p1Slope = isConvex ? (f2Y - p1HitY) / focalDist : -0.7;
	const p1FinalY = p1HitY + p1Slope * (p1EndX - cx);
	const p1RefCurX = cx + (p1EndX - cx) * refrProg;
	const p1RefCurY = p1HitY + (p1FinalY - p1HitY) * refrProg;

	// Ray 2: Center ray (through optical center without deviation)
	const p2CurX = objX + (cx + 240 * u - objX) * Math.min(1, incProg + refrProg);
	const p2Slope = objH / (cx - objX);
	const p2CurY = p1StartY + p2Slope * (p2CurX - objX);

	// Image coordinates
	const imgX = isConvex ? cx + 240 * u : cx - 110 * u;
	const imgH = isConvex ? -objH : objH * 0.55;
	const imgY = axisY - imgH * imgProg;

	const pulseR = 8 + Math.sin(time * 8) * 4;

	return `
  <!-- Optical Principal Axis -->
  <line x1="${40 * u}" y1="${axisY}" x2="${width - 40 * u}" y2="${axisY}" stroke="#475569" stroke-width="2" stroke-dasharray="6 6" />
  
  <!-- Focal Point Markings -->
  <circle cx="${cx - focalDist}" cy="${axisY}" r="4" fill="#38bdf8" />
  <circle cx="${cx + focalDist}" cy="${axisY}" r="4" fill="#38bdf8" />
  <circle cx="${cx - focalDist * 2}" cy="${axisY}" r="4" fill="#818cf8" />
  <circle cx="${cx + focalDist * 2}" cy="${axisY}" r="4" fill="#818cf8" />
  <text x="${cx - focalDist}" y="${axisY + 24}" fill="#94a3b8" font-size="${14 * u}" text-anchor="middle">F1</text>
  <text x="${cx + focalDist}" y="${axisY + 24}" fill="#94a3b8" font-size="${14 * u}" text-anchor="middle">F2</text>
  <text x="${cx - focalDist * 2}" y="${axisY + 24}" fill="#64748b" font-size="${12 * u}" text-anchor="middle">2F1</text>
  <text x="${cx + focalDist * 2}" y="${axisY + 24}" fill="#64748b" font-size="${12 * u}" text-anchor="middle">2F2</text>
  <text x="${cx}" y="${axisY + 24}" fill="#38bdf8" font-size="${14 * u}" text-anchor="middle">O</text>

  <!-- Lens Body -->
  ${
		isConvex
			? `<path d="M ${cx} ${cy - lensH / 2} Q ${cx + lensW} ${cy} ${cx} ${cy + lensH / 2} Q ${cx - lensW} ${cy} ${cx} ${cy - lensH / 2} Z" fill="#0284c7" fill-opacity="0.22" stroke="#38bdf8" stroke-width="2.5" />`
			: `<path d="M ${cx - lensW} ${cy - lensH / 2} Q ${cx} ${cy} ${cx - lensW} ${cy + lensH / 2} L ${cx + lensW} ${cy + lensH / 2} Q ${cx} ${cy} ${cx + lensW} ${cy - lensH / 2} Z" fill="#0284c7" fill-opacity="0.22" stroke="#38bdf8" stroke-width="2.5" />`
	}

  <!-- Object Arrow -->
  <line x1="${objX}" y1="${axisY}" x2="${objX}" y2="${axisY - objH}" stroke="#f59e0b" stroke-width="4" />
  <polygon points="${objX},${axisY - objH - 8} ${objX - 6},${axisY - objH + 4} ${objX + 6},${axisY - objH + 4}" fill="#f59e0b" />
  <text x="${objX}" y="${axisY - objH - 14}" fill="#f59e0b" font-size="${14 * u}" text-anchor="middle" font-weight="bold">Object</text>

  <!-- Incident Ray 1 (Parallel) -->
  <line x1="${p1StartX}" y1="${p1StartY}" x2="${p1CurX}" y2="${p1StartY}" stroke="#38bdf8" stroke-width="3" />
  <circle cx="${p1CurX}" cy="${p1StartY}" r="4" fill="#ffffff" />

  <!-- Refracted Ray 1 -->
  ${
		incProg >= 0.95
			? `<line x1="${cx}" y1="${p1HitY}" x2="${p1RefCurX}" y2="${p1RefCurY}" stroke="#38bdf8" stroke-width="3" />
       <circle cx="${p1RefCurX}" cy="${p1RefCurY}" r="4" fill="#ffffff" />`
			: ""
	}

  <!-- Ray 2 (Central through optical center) -->
  <line x1="${objX}" y1="${p1StartY}" x2="${p2CurX}" y2="${p2CurY}" stroke="#34d399" stroke-width="3" />
  <circle cx="${p2CurX}" cy="${p2CurY}" r="4" fill="#ffffff" />

  <!-- Virtual Back-trace for Concave Lens -->
  ${
		!isConvex && incProg >= 0.95
			? `<line x1="${cx}" y1="${p1HitY}" x2="${cx - focalDist}" y2="${axisY}" stroke="#f43f5e" stroke-width="2" stroke-dasharray="4 4" />`
			: ""
	}

  <!-- Focal Point Indicator Pulse -->
  ${
		refrProg >= 0.8
			? `<circle cx="${isConvex ? f2X : cx - focalDist}" cy="${axisY}" r="${pulseR}" fill="none" stroke="#38bdf8" stroke-width="2" />`
			: ""
	}

  <!-- Formed Image Arrow -->
  ${
		imgProg > 0
			? `
  <g opacity="${imgProg}">
    <line x1="${imgX}" y1="${axisY}" x2="${imgX}" y2="${imgY}" stroke="${isConvex ? "#ec4899" : "#34d399"}" stroke-width="4" stroke-dasharray="${isConvex ? "none" : "4 4"}" />
    <polygon points="${imgX},${imgY + (isConvex ? 8 : -8)} ${imgX - 6},${imgY + (isConvex ? -4 : 4)} ${imgX + 6},${imgY + (isConvex ? -4 : 4)}" fill="${isConvex ? "#ec4899" : "#34d399"}" />
    <text x="${imgX}" y="${imgY + (isConvex ? 24 : -14)}" fill="${isConvex ? "#ec4899" : "#34d399"}" font-size="${14 * u}" text-anchor="middle" font-weight="bold">
      ${isConvex ? "Real, Inverted Image" : "Virtual, Upright Image"}
    </text>
  </g>`
			: ""
	}
`;
}
