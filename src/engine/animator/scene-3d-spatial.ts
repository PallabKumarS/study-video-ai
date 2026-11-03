import type { VideoSegment } from "../types";
import { project3D, rotateX, rotateY } from "./projection-3d";
import type { FrameContext } from "./types";

export function renderAnimated3dScene(
	ctx: FrameContext,
	_segment: VideoSegment,
): string {
	const { width, height, time } = ctx;
	const cx = width / 2;
	const cy = height * 0.48;
	const u = width / 720;

	// Rotation angles over time
	const rotY = time * 0.9;
	const rotX = Math.sin(time * 0.6) * 0.35 + 0.2;

	// Orbiting 3D Nodes
	const nodeCount = 4;
	const orbitRadius = 190 * u;
	const nodesMarkup: string[] = [];

	for (let i = 0; i < nodeCount; i++) {
		const angle = rotY + (i * Math.PI * 2) / nodeCount;
		const rawPt = {
			x: Math.cos(angle) * orbitRadius,
			y: Math.sin(i * 1.5 + time * 0.8) * (50 * u),
			z: Math.sin(angle) * orbitRadius,
		};

		const rotPt = rotateX(rotateY(rawPt, rotY * 0.5), rotX);
		const proj = project3D(rotPt, cx, cy, 650);

		// Depth shading: nodes in front are brighter and larger
		const depthFactor = (rotPt.z + orbitRadius) / (orbitRadius * 2);
		const r = Math.max(8 * u, (14 + depthFactor * 16) * u * proj.scale);
		const opacity = Math.max(0.3, Math.min(1.0, 0.4 + depthFactor * 0.6));
		const color = i % 2 === 0 ? "#38bdf8" : "#ec4899";

		nodesMarkup.push(`
      <!-- Orbit Trail Line -->
      <line x1="${cx}" y1="${cy}" x2="${proj.x}" y2="${proj.y}" stroke="${color}" stroke-opacity="${opacity * 0.4}" stroke-width="1.5" stroke-dasharray="3 3" />
      
      <!-- 3D Node Glow and Sphere -->
      <circle cx="${proj.x}" cy="${proj.y}" r="${r * 1.6}" fill="${color}" fill-opacity="${opacity * 0.2}" />
      <circle cx="${proj.x}" cy="${proj.y}" r="${r}" fill="${color}" fill-opacity="${opacity}" stroke="#ffffff" stroke-width="2" />
    `);
	}

	// 3D Perspective Ground Grid
	const gridLines: string[] = [];
	const gridExtent = 240 * u;
	const gridY = 120 * u;

	for (let gx = -gridExtent; gx <= gridExtent; gx += 60 * u) {
		const p1 = project3D(
			rotateX({ x: gx, y: gridY, z: -gridExtent }, rotX * 0.5),
			cx,
			cy,
			650,
		);
		const p2 = project3D(
			rotateX({ x: gx, y: gridY, z: gridExtent }, rotX * 0.5),
			cx,
			cy,
			650,
		);
		gridLines.push(
			`<line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" stroke="#1e293b" stroke-width="1.5" stroke-opacity="0.6" />`,
		);
	}

	for (let gz = -gridExtent; gz <= gridExtent; gz += 60 * u) {
		const p1 = project3D(
			rotateX({ x: -gridExtent, y: gridY, z: gz }, rotX * 0.5),
			cx,
			cy,
			650,
		);
		const p2 = project3D(
			rotateX({ x: gridExtent, y: gridY, z: gz }, rotX * 0.5),
			cx,
			cy,
			650,
		);
		gridLines.push(
			`<line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" stroke="#1e293b" stroke-width="1.5" stroke-opacity="0.6" />`,
		);
	}

	// 3D Central Core Pulse
	const corePulse = 1 + Math.sin(time * 4) * 0.08;
	const coreR = 52 * u * corePulse;

	return `
  <!-- 3D Spatial Grid -->
  <g>
    ${gridLines.join("\n")}
  </g>

  <!-- 3D Spatial Orbital Ellipses -->
  <g transform="rotate(${Math.sin(time * 0.5) * 15}, ${cx}, ${cy})">
    <ellipse cx="${cx}" cy="${cy}" rx="${orbitRadius * 1.05}" ry="${orbitRadius * 0.38}" fill="none" stroke="#0ea5e9" stroke-opacity="0.4" stroke-width="2" stroke-dasharray="6 4" />
    <ellipse cx="${cx}" cy="${cy}" rx="${orbitRadius * 0.45}" ry="${orbitRadius * 1.05}" fill="none" stroke="#818cf8" stroke-opacity="0.35" stroke-width="2" />
  </g>

  <!-- Central 3D Core with Depth Shading -->
  <radialGradient id="coreGlow3d" cx="40%" cy="35%" r="65%">
    <stop offset="0%" stop-color="#38bdf8" />
    <stop offset="50%" stop-color="#0284c7" />
    <stop offset="100%" stop-color="#0f172a" />
  </radialGradient>
  <circle cx="${cx}" cy="${cy}" r="${coreR * 1.5}" fill="#38bdf8" fill-opacity="0.15" />
  <circle cx="${cx}" cy="${cy}" r="${coreR}" fill="url(#coreGlow3d)" stroke="#7dd3fc" stroke-width="3" />
  <circle cx="${cx - 14 * u}" cy="${cy - 14 * u}" r="${10 * u}" fill="#ffffff" fill-opacity="0.6" />

  <!-- 3D Orbiting Nodes -->
  <g>
    ${nodesMarkup.join("\n")}
  </g>
`;
}
