import type { VideoSegment } from "../types";
import type { FrameContext } from "./types";

export function renderAnimatedBioScene(
	ctx: FrameContext,
	_segment: VideoSegment,
): string {
	const { width, height, time } = ctx;
	const cx = width / 2;
	const cy = height * 0.48;
	const u = width / 720;

	// Biological Membrane Layer (Lipid bilayer)
	const lipidCount = 14;
	const lipidSpacing = (width - 120 * u) / lipidCount;
	const memY = cy + 20 * u;
	const lipidsMarkup: string[] = [];

	for (let i = 0; i < lipidCount; i++) {
		const lx = 60 * u + i * lipidSpacing;
		const waveJitter = Math.sin(time * 3 + i * 0.5) * 4 * u;
		lipidsMarkup.push(`
      <circle cx="${lx}" cy="${memY - 25 * u + waveJitter}" r="${7 * u}" fill="#34d399" />
      <line x1="${lx}" y1="${memY - 20 * u + waveJitter}" x2="${lx}" y2="${memY - 5 * u + waveJitter}" stroke="#10b981" stroke-width="2" />
      <line x1="${lx}" y1="${memY + 5 * u + waveJitter}" x2="${lx}" y2="${memY + 20 * u + waveJitter}" stroke="#10b981" stroke-width="2" />
      <circle cx="${lx}" cy="${memY + 25 * u + waveJitter}" r="${7 * u}" fill="#34d399" />
    `);
	}

	// Incoming Photons (Light Beam)
	const photonSpeed = 160 * u;
	const photonProgress = (time * photonSpeed) % (280 * u);
	const photonX = cx - 180 * u + photonProgress * 0.7;
	const photonY = cy - 200 * u + photonProgress;

	// Ion / Electron Particles Hopping
	const electronProg = (time * 120 * u) % (width - 160 * u);
	const eX = 80 * u + electronProg;
	const eY = memY - 45 * u + Math.abs(Math.sin(time * 6)) * -25 * u;

	// Rotating Molecular Rotor (ATP Synthase)
	const rotorAngle = time * 2.8;
	const rotorX = cx + 120 * u;
	const rotorY = memY;

	return `
  <!-- Sunlight Photon Beam -->
  <line x1="${cx - 180 * u}" y1="${cy - 200 * u}" x2="${cx - 40 * u}" y2="${cy}" stroke="#fbbf24" stroke-width="2" stroke-dasharray="6 6" stroke-opacity="0.6" />
  <circle cx="${photonX}" cy="${photonY}" r="${9 * u}" fill="#fde047" />
  <circle cx="${photonX}" cy="${photonY}" r="${16 * u}" fill="#fde047" fill-opacity="0.3" />
  <text x="${cx - 180 * u}" y="${cy - 215 * u}" fill="#fbbf24" font-size="${14 * u}" font-weight="bold">Photons (hν)</text>

  <!-- Cell Membrane Bilayer -->
  <g>
    ${lipidsMarkup.join("\n")}
  </g>

  <!-- Membrane Protein Complex -->
  <rect x="${cx - 50 * u}" y="${memY - 50 * u}" width="${65 * u}" height="${100 * u}" rx="14" fill="#0284c7" stroke="#38bdf8" stroke-width="2.5" />
  <text x="${cx - 18 * u}" y="${memY + 5 * u}" fill="#ffffff" font-size="${12 * u}" text-anchor="middle" font-weight="bold">Complex</text>

  <!-- Hopping Electron with Trail -->
  <circle cx="${eX}" cy="${eY}" r="${6 * u}" fill="#38bdf8" />
  <circle cx="${eX}" cy="${eY}" r="${12 * u}" fill="#38bdf8" fill-opacity="0.35" />
  <text x="${eX}" y="${eY - 14 * u}" fill="#38bdf8" font-size="${13 * u}" text-anchor="middle" font-weight="bold">e⁻</text>

  <!-- Spinning ATP Synthase Rotor Head -->
  <g transform="rotate(${(rotorAngle * 180) / Math.PI}, ${rotorX}, ${rotorY})">
    <circle cx="${rotorX}" cy="${rotorY}" r="${26 * u}" fill="#8b5cf6" stroke="#c084fc" stroke-width="2.5" />
    <circle cx="${rotorX + 16 * u}" cy="${rotorY}" r="${7 * u}" fill="#ffffff" />
    <circle cx="${rotorX - 16 * u}" cy="${rotorY}" r="${7 * u}" fill="#ffffff" />
    <circle cx="${rotorX}" cy="${rotorY + 16 * u}" r="${7 * u}" fill="#ffffff" />
    <circle cx="${rotorX}" cy="${rotorY - 16 * u}" r="${7 * u}" fill="#ffffff" />
  </g>
  <text x="${rotorX}" y="${rotorY + 45 * u}" fill="#c084fc" font-size="${13 * u}" text-anchor="middle" font-weight="bold">ATP Synthase</text>
`;
}
