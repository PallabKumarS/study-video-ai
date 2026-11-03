import type { VideoSegment } from "../types";
import { clamp, easeOutCubic } from "./easings";
import type { FrameContext } from "./types";

export function renderAnimatedOpticsScene(
	ctx: FrameContext,
	segment: VideoSegment,
): string {
	const { width, height, time, duration } = ctx;
	const isConvex = segment.diagram_data?.lens_type !== "concave";
	const isBn =
		segment.tag?.includes("লেন্স") || segment.bottom_caption?.includes("লেন্স");

	const cx = width / 2;
	const cy = height * 0.46;
	const axisY = cy;
	const u = width / 720;

	// Optical geometry constants
	const f = isConvex ? 110 * u : 140 * u;
	const do_ = isConvex ? 2 * f : 1.5 * f;
	const objX = cx - do_;
	const objH = isConvex ? 80 * u : 90 * u;
	const objTipY = axisY - objH;

	// Thin lens equation calculations
	// 1/di = 1/f - 1/do  =>  di = (f * do) / (do - f) for convex
	// di = (f * do) / (do + f) for concave (virtual image)
	const di = isConvex ? (f * do_) / (do_ - f) : (f * do_) / (do_ + f);
	const mag = isConvex ? di / do_ : di / do_;
	const imgH = isConvex ? mag * objH : mag * objH;
	const imgX = isConvex ? cx + di : cx - di;
	const imgTipY = isConvex ? axisY + imgH : axisY - imgH;

	const lensH = 360 * u;
	const lensW = isConvex ? 38 * u : 28 * u;

	// Time phases:
	// 0.00 to 0.32: incident rays travel from object tip to lens
	// 0.32 to 0.65: refracted rays travel through focal points to collide at P_img
	// 0.65 to 1.00: intersection beacon pulses, image arrow reveals, rays extend beyond
	const tNorm = clamp(time / duration);
	const incProg = easeOutCubic(clamp(tNorm / 0.32));
	const refrProg = easeOutCubic(clamp((tNorm - 0.32) / 0.33));
	const imgProg = easeOutCubic(clamp((tNorm - 0.6) / 0.4));

	// Ray 1: Parallel to principal axis -> Refracts through focal point
	const r1IncCurX = objX + (cx - objX) * incProg;
	const r1HitY = objTipY;

	// Ray 2: Through optical center (undeviated straight line)
	const r2TotalEndX = isConvex ? imgX + 50 * u : cx + 180 * u;
	const r2TotalEndY = isConvex
		? axisY + (imgH / di) * (r2TotalEndX - cx)
		: axisY + (objH / do_) * (r2TotalEndX - cx);
	const r2CurX =
		objX + (r2TotalEndX - objX) * Math.min(1, incProg * 0.45 + refrProg * 0.55);
	const r2CurY =
		objTipY +
		((r2TotalEndY - objTipY) / (r2TotalEndX - objX)) * (r2CurX - objX);

	// Ray 3: Through front focus (convex) or directed to rear focus (concave)
	const r3HitY = isConvex ? axisY + imgH : imgTipY;
	const r3IncCurX = objX + (cx - objX) * incProg;
	const r3IncCurY = objTipY + (r3HitY - objTipY) * incProg;

	// Refracted endpoints (extending past P_img)
	const r1RefrEndX = isConvex ? imgX + 50 * u : cx + 180 * u;
	const r1RefrEndY = isConvex
		? axisY - objH + (objH / f) * (r1RefrEndX - cx)
		: axisY - objH - (objH / f) * (r1RefrEndX - cx);

	const r3RefrEndX = isConvex ? imgX + 50 * u : cx + 180 * u;

	const r1CurX = cx + (r1RefrEndX - cx) * refrProg;
	const r1CurY = r1HitY + (r1RefrEndY - r1HitY) * refrProg;

	const r3CurX = cx + (r3RefrEndX - cx) * refrProg;
	const r3CurY = r3HitY;

	const pulseR = 6 * u + Math.sin(time * 9) * 3 * u;
	const hasCollided = refrProg >= 0.85;

	return `
  <!-- Optical Principal Axis -->
  <line x1="${30 * u}" y1="${axisY}" x2="${width - 30 * u}" y2="${axisY}" stroke="#475569" stroke-width="2" stroke-dasharray="6 6" />
  
  <!-- Focal Point Markings -->
  <circle cx="${cx - f}" cy="${axisY}" r="4" fill="#38bdf8" />
  <circle cx="${cx + f}" cy="${axisY}" r="4" fill="#38bdf8" />
  <circle cx="${cx - 2 * f}" cy="${axisY}" r="4" fill="#818cf8" />
  <circle cx="${cx + 2 * f}" cy="${axisY}" r="4" fill="#818cf8" />
  <circle cx="${cx}" cy="${axisY}" r="4" fill="#ffffff" />

  <text x="${cx - f}" y="${axisY + 22 * u}" fill="#94a3b8" font-size="${12 * u}" text-anchor="middle" font-mono font-bold">F1</text>
  <text x="${cx + f}" y="${axisY + 22 * u}" fill="#94a3b8" font-size="${12 * u}" text-anchor="middle" font-mono font-bold">F2</text>
  <text x="${cx - 2 * f}" y="${axisY + 22 * u}" fill="#64748b" font-size="${11 * u}" text-anchor="middle" font-mono>2F1</text>
  <text x="${cx + 2 * f}" y="${axisY + 22 * u}" fill="#64748b" font-size="${11 * u}" text-anchor="middle" font-mono>2F2</text>
  <text x="${cx}" y="${axisY + 22 * u}" fill="#38bdf8" font-size="${12 * u}" text-anchor="middle" font-mono font-bold">O</text>

  <!-- Lens Body -->
  ${
		isConvex
			? `<path d="M ${cx} ${cy - lensH / 2} Q ${cx + lensW} ${cy} ${cx} ${cy + lensH / 2} Q ${cx - lensW} ${cy} ${cx} ${cy - lensH / 2} Z" fill="#0284c7" fill-opacity="0.22" stroke="#38bdf8" stroke-width="2.5" />`
			: `<path d="M ${cx - lensW} ${cy - lensH / 2} Q ${cx} ${cy} ${cx - lensW} ${cy + lensH / 2} L ${cx + lensW} ${cy + lensH / 2} Q ${cx} ${cy} ${cx + lensW} ${cy - lensH / 2} Z" fill="#0284c7" fill-opacity="0.22" stroke="#38bdf8" stroke-width="2.5" />`
	}
  <!-- Lens Center Axis Guide -->
  <line x1="${cx}" y1="${cy - lensH / 2}" x2="${cx}" y2="${cy + lensH / 2}" stroke="#38bdf8" stroke-width="1" stroke-dasharray="3 3" opacity="0.4" />

  <!-- Object Arrow -->
  <line x1="${objX}" y1="${axisY}" x2="${objX}" y2="${objTipY}" stroke="#f59e0b" stroke-width="4" />
  <polygon points="${objX},${objTipY - 8 * u} ${objX - 6 * u},${objTipY + 4 * u} ${objX + 6 * u},${objTipY + 4 * u}" fill="#f59e0b" />
  <text x="${objX}" y="${objTipY - 14 * u}" fill="#f59e0b" font-size="${13 * u}" text-anchor="middle" font-weight="bold">
    ${isBn ? "বস্তু (Object)" : "Object"}
  </text>

  <!-- Incident Ray 1: Cyan (Parallel to axis) -->
  <line x1="${objX}" y1="${objTipY}" x2="${r1IncCurX}" y2="${objTipY}" stroke="#38bdf8" stroke-width="3" />
  <circle cx="${r1IncCurX}" cy="${objTipY}" r="3.5" fill="#ffffff" />

  <!-- Refracted Ray 1: Cyan (Passes through F2 for convex, diverges for concave) -->
  ${
		incProg >= 0.95
			? `<line x1="${cx}" y1="${r1HitY}" x2="${r1CurX}" y2="${r1CurY}" stroke="#38bdf8" stroke-width="3" />
         <circle cx="${r1CurX}" cy="${r1CurY}" r="3.5" fill="#ffffff" />`
			: ""
	}

  <!-- Ray 2: Emerald (Passes through Optical Center O undeviated) -->
  <line x1="${objX}" y1="${objTipY}" x2="${r2CurX}" y2="${r2CurY}" stroke="#34d399" stroke-width="3" />
  <circle cx="${r2CurX}" cy="${r2CurY}" r="3.5" fill="#ffffff" />

  <!-- Incident Ray 3: Amber (Through F1 for convex, towards F2 for concave) -->
  <line x1="${objX}" y1="${objTipY}" x2="${r3IncCurX}" y2="${r3IncCurY}" stroke="#fbbf24" stroke-width="3" />
  <circle cx="${r3IncCurX}" cy="${r3IncCurY}" r="3.5" fill="#ffffff" />

  <!-- Refracted Ray 3: Amber (Emerges parallel to axis) -->
  ${
		incProg >= 0.95
			? `<line x1="${cx}" y1="${r3HitY}" x2="${r3CurX}" y2="${r3CurY}" stroke="#fbbf24" stroke-width="3" />
         <circle cx="${r3CurX}" cy="${r3CurY}" r="3.5" fill="#ffffff" />`
			: ""
	}

  <!-- Virtual Back-traces for Concave Lens (Diverging rays trace back to common intersection point) -->
  ${
		!isConvex && incProg >= 0.95
			? `
    <!-- Ray 1 virtual back-trace to F1 -->
    <line x1="${cx}" y1="${r1HitY}" x2="${cx - f}" y2="${axisY}" stroke="#38bdf8" stroke-width="2" stroke-dasharray="4 4" opacity="0.85" />
    <!-- Ray 3 virtual horizontal back-trace -->
    <line x1="${cx}" y1="${r3HitY}" x2="${imgX - 30 * u}" y2="${r3HitY}" stroke="#fbbf24" stroke-width="2" stroke-dasharray="4 4" opacity="0.85" />
    `
			: ""
	}

  <!-- EXACT COMMON INTERSECTION COLLISION BEACON -->
  ${
		hasCollided
			? `
    <g>
      <!-- Pulsing collision aura -->
      <circle cx="${imgX}" cy="${imgTipY}" r="${pulseR * 1.8}" fill="none" stroke="${isConvex ? "#ec4899" : "#38bdf8"}" stroke-width="2" opacity="0.8" />
      <circle cx="${imgX}" cy="${imgTipY}" r="${pulseR}" fill="${isConvex ? "#ec4899" : "#38bdf8"}" fill-opacity="0.3" stroke="${isConvex ? "#ec4899" : "#38bdf8"}" stroke-width="2.5" />
      <circle cx="${imgX}" cy="${imgTipY}" r="4" fill="#ffffff" />
      
      <!-- Crosshair indicator on collision point -->
      <line x1="${imgX - 8 * u}" y1="${imgTipY}" x2="${imgX + 8 * u}" y2="${imgTipY}" stroke="#ffffff" stroke-width="1.5" />
      <line x1="${imgX}" y1="${imgTipY - 8 * u}" x2="${imgX}" y2="${imgTipY + 8 * u}" stroke="#ffffff" stroke-width="1.5" />
      
      <!-- Common collision label -->
      <rect x="${imgX - 70 * u}" y="${isConvex ? imgTipY + 14 * u : imgTipY - 32 * u}" width="${140 * u}" height="${20 * u}" rx="6" fill="#0f172a" fill-opacity="0.9" stroke="${isConvex ? "#ec4899" : "#38bdf8"}" stroke-width="1" />
      <text x="${imgX}" y="${isConvex ? imgTipY + 28 * u : imgTipY - 18 * u}" fill="${isConvex ? "#f472b6" : "#38bdf8"}" font-size="${10 * u}" text-anchor="middle" font-weight="bold">
        ${isBn ? "মিলন বিন্দু (Intersection Point)" : "Intersection Point"}
      </text>
    </g>`
			: ""
	}

  <!-- Formed Image Arrow -->
  ${
		imgProg > 0
			? `
  <g opacity="${imgProg}">
    <!-- Image Arrow Body -->
    <line x1="${imgX}" y1="${axisY}" x2="${imgX}" y2="${imgTipY}" stroke="${isConvex ? "#ec4899" : "#34d399"}" stroke-width="4" stroke-dasharray="${isConvex ? "none" : "5 5"}" />
    <!-- Image Arrowhead exactly at imgTipY -->
    <polygon points="${imgX},${imgTipY + (isConvex ? 8 * u : -8 * u)} ${imgX - 6 * u},${imgTipY + (isConvex ? -4 * u : 4 * u)} ${imgX + 6 * u},${imgTipY + (isConvex ? -4 * u : 4 * u)}" fill="${isConvex ? "#ec4899" : "#34d399"}" />
    
    <!-- Image Type Badge -->
    <rect x="${imgX - 85 * u}" y="${isConvex ? imgTipY + 38 * u : imgTipY - 54 * u}" width="${170 * u}" height="${24 * u}" rx="6" fill="#090d16" fill-opacity="0.95" stroke="${isConvex ? "#ec4899" : "#34d399"}" stroke-width="1.5" />
    <text x="${imgX}" y="${isConvex ? imgTipY + 54 * u : imgTipY - 38 * u}" fill="${isConvex ? "#ec4899" : "#34d399"}" font-size="${12 * u}" text-anchor="middle" font-weight="bold">
      ${isConvex ? (isBn ? "বাস্তব ও উল্টো প্রতিবিম্ব" : "Real, Inverted Image") : isBn ? "অবাস্তব ও সোজা প্রতিবিম্ব" : "Virtual, Upright Image"}
    </text>
  </g>`
			: ""
	}

  <!-- Legend Box (3 Classical Ray Rules) -->
  <g opacity="0.9">
    <rect x="${20 * u}" y="${20 * u}" width="${width - 40 * u}" height="${34 * u}" rx="8" fill="#090d16" fill-opacity="0.85" stroke="#334155" stroke-width="1" />
    <circle cx="${35 * u}" cy="${37 * u}" r="4" fill="#38bdf8" />
    <text x="${45 * u}" y="${41 * u}" fill="#94a3b8" font-size="${11 * u}">${isBn ? "রশ্মি ১: সমান্তরাল" : "Ray 1: Parallel"}</text>
    
    <circle cx="${width / 3 + 10 * u}" cy="${37 * u}" r="4" fill="#34d399" />
    <text x="${width / 3 + 20 * u}" y="${41 * u}" fill="#94a3b8" font-size="${11 * u}">${isBn ? "রশ্মি ২: আলোক কেন্দ্র" : "Ray 2: Center"}</text>
    
    <circle cx="${(2 * width) / 3}" cy="${37 * u}" r="4" fill="#fbbf24" />
    <text x="${(2 * width) / 3 + 10 * u}" y="${41 * u}" fill="#94a3b8" font-size="${11 * u}">${isBn ? "রশ্মি ৩: ফোকাস রশ্মি" : "Ray 3: Focal"}</text>
  </g>
`;
}
