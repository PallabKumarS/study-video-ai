import { NextResponse } from "next/server";
import { deleteVideoJob, getVideoHistory } from "@/lib/server-api";

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
		const ok = await deleteVideoJob(jobId);
		if (!ok) {
			return NextResponse.json(
				{ error: "Video not found or already deleted" },
				{ status: 404 },
			);
		}
		const history = await getVideoHistory();
		return NextResponse.json({ success: true, history });
	} catch (err: unknown) {
		const msg = err instanceof Error ? err.message : String(err);
		return NextResponse.json({ error: msg }, { status: 500 });
	}
}
