export function clamp(val: number, min = 0, max = 1): number {
	return Math.max(min, Math.min(max, val));
}

export function easeOutCubic(t: number): number {
	const clamped = clamp(t);
	return 1 - (1 - clamped) ** 3;
}

export function easeInOutQuad(t: number): number {
	const clamped = clamp(t);
	return clamped < 0.5
		? 2 * clamped * clamped
		: 1 - (-2 * clamped + 2) ** 2 / 2;
}

export function easeOutBack(t: number): number {
	const clamped = clamp(t);
	const c1 = 1.70158;
	const c3 = c1 + 1;
	return 1 + c3 * (clamped - 1) ** 3 + c1 * (clamped - 1) ** 2;
}

export function spring(t: number, freq = 8, decay = 5): number {
	if (t <= 0) return 0;
	if (t >= 1) return 1;
	return 1 - Math.exp(-t * decay) * Math.cos(t * freq);
}

export function interpolate(start: number, end: number, t: number): number {
	return start + (end - start) * t;
}
