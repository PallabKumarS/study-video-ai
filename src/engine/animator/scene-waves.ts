import type { VideoSegment } from "../types";
import type { FrameContext } from "./types";

export function renderAnimatedWavesScene(
	ctx: FrameContext,
	_segment: VideoSegment,
): string {
	const { width, height, time } = ctx;
	const cx = width / 2;
	const cy = height * 0.48;
	const u = width / 720;

	// Expanding Wavefront Rings
	const ringCount = 5;
	const maxR = 240 * u;
	const waveSpeed = 90 * u;
	const waveRings: string[] = [];

	for (let i = 0; i < ringCount; i++) {
		const r = ((time * waveSpeed + i * (maxR / ringCount)) % maxR) + 20 * u;
		const fade = 1 - r / maxR;
		waveRings.push(
			`<circle cx="${cx - 100 * u}" cy="${cy}" r="${r}" fill="none" stroke="#38bdf8" stroke-width="${3 * fade}" stroke-opacity="${fade * 0.8}" />`,
		);
	}

	// Reflected Waves from Barrier
	const barrierX = cx + 140 * u;
	const reflectedRings: string[] = [];
	for (let i = 0; i < ringCount; i++) {
		const r =
			(((time * waveSpeed + i * (maxR / ringCount) + maxR * 0.5) % maxR) +
				20 * u) *
			0.7;
		const fade = 1 - r / (maxR * 0.7);
		reflectedRings.push(
			`<circle cx="${barrierX}" cy="${cy}" r="${r}" fill="none" stroke="#f43f5e" stroke-dasharray="5 5" stroke-width="${2.5 * fade}" stroke-opacity="${fade * 0.7}" />`,
		);
	}

	// Harmonic Sine Waveform along axis
	const wavePts: string[] = [];
	const waveStartX = 50 * u;
	const waveEndX = width - 50 * u;
	const waveY = cy + 120 * u;
	const amp = 35 * u * (0.8 + Math.sin(time * 3) * 0.2);
	const freq = 0.025 / u;

	for (let x = waveStartX; x <= waveEndX; x += 6 * u) {
		const y = waveY + Math.sin((x - waveStartX) * freq - time * 6) * amp;
		wavePts.push(`${x},${y}`);
	}

	return `
  <!-- Wave Barrier -->
  <line x1="${barrierX}" y1="${cy - 160 * u}" x2="${barrierX}" y2="${cy + 160 * u}" stroke="#94a3b8" stroke-width="6" stroke-linecap="round" />
  <text x="${barrierX + 16 * u}" y="${cy - 120 * u}" fill="#94a3b8" font-size="${14 * u}" font-weight="bold">Reflector / Barrier</text>

  <!-- Wave Source Pulse -->
  <circle cx="${cx - 100 * u}" cy="${cy}" r="${18 * u + Math.sin(time * 10) * 4}" fill="#0284c7" stroke="#38bdf8" stroke-width="3" />
  <circle cx="${cx - 100 * u}" cy="${cy}" r="6" fill="#ffffff" />
  <text x="${cx - 100 * u}" y="${cy + 36 * u}" fill="#38bdf8" font-size="${14 * u}" text-anchor="middle" font-weight="bold">Source</text>

  <!-- Concentric Incident Wavefronts -->
  <g>
    ${waveRings.join("\n")}
  </g>

  <!-- Reflected Echo Wavefronts -->
  <g>
    ${reflectedRings.join("\n")}
  </g>

  <!-- Harmonic Sine Wave Oscillation -->
  <line x1="${waveStartX}" y1="${waveY}" x2="${waveEndX}" y2="${waveY}" stroke="#334155" stroke-width="1.5" stroke-dasharray="4 4" />
  <polyline points="${wavePts.join(" ")}" fill="none" stroke="#34d399" stroke-width="3.5" stroke-linecap="round" />
  <text x="${cx}" y="${waveY + 45 * u}" fill="#34d399" font-size="${14 * u}" text-anchor="middle" font-weight="bold">Oscillation: y = A sin(kx - ωt)</text>
`;
}
