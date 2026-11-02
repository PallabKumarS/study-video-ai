import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { OUTPUT_DIR } from "@/engine/config";
import { ACTIVE_JOBS } from "@/engine/pipeline";

export async function GET(
	_req: Request,
	{ params }: { params: Promise<{ jobId: string }> },
) {
	const { jobId } = await params;

	const progFile = path.join(OUTPUT_DIR, jobId, "progress.json");
	if (fs.existsSync(progFile)) {
		try {
			const data = JSON.parse(fs.readFileSync(progFile, "utf-8"));
			return NextResponse.json(data);
		} catch {}
	}

	if (ACTIVE_JOBS[jobId]) {
		return NextResponse.json(ACTIVE_JOBS[jobId]);
	}

	return NextResponse.json({ error: "Job not found." }, { status: 404 });
}
