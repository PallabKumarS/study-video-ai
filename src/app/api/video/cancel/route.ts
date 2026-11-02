import { NextResponse } from "next/server";
import { cancelGenerationJob } from "@/engine/pipeline";

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const jobId = body.job_id || body.jobId;
		if (!jobId) {
			return NextResponse.json(
				{ error: "job_id is required" },
				{ status: 400 },
			);
		}
		cancelGenerationJob(jobId);
		return NextResponse.json({ success: true, message: "Job canceled" });
	} catch (err: unknown) {
		const msg = err instanceof Error ? err.message : String(err);
		return NextResponse.json({ error: msg }, { status: 500 });
	}
}
