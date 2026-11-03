export interface Point3D {
	x: number;
	y: number;
	z: number;
}

export interface ProjectedPoint {
	x: number;
	y: number;
	scale: number;
	z: number;
}

export function rotateX(pt: Point3D, angle: number): Point3D {
	const cos = Math.cos(angle);
	const sin = Math.sin(angle);
	return {
		x: pt.x,
		y: pt.y * cos - pt.z * sin,
		z: pt.y * sin + pt.z * cos,
	};
}

export function rotateY(pt: Point3D, angle: number): Point3D {
	const cos = Math.cos(angle);
	const sin = Math.sin(angle);
	return {
		x: pt.x * cos + pt.z * sin,
		y: pt.y,
		z: -pt.x * sin + pt.z * cos,
	};
}

export function rotateZ(pt: Point3D, angle: number): Point3D {
	const cos = Math.cos(angle);
	const sin = Math.sin(angle);
	return {
		x: pt.x * cos - pt.y * sin,
		y: pt.x * sin + pt.y * cos,
		z: pt.z,
	};
}

export function project3D(
	pt: Point3D,
	originX: number,
	originY: number,
	fov = 700,
): ProjectedPoint {
	const safeZ = Math.max(-fov + 20, pt.z);
	const scale = fov / (fov + safeZ);
	return {
		x: originX + pt.x * scale,
		y: originY + pt.y * scale,
		scale,
		z: pt.z,
	};
}
