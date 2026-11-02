import { NextResponse } from "next/server";
import { regenerateSingleSegment } from "@/engine/pipeline";

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const jobId = body.job_id || body.jobId;
		const segmentIndex = body.segment_index || body.segmentIndex;

		if (!jobId) {
			return NextResponse.json(
				{ error: "job_id is required." },
				{ status: 400 },
			);
		}
		if (!segmentIndex) {
			return NextResponse.json(
				{ error: "segment_index is required." },
				{ status: 400 },
			);
		}

		const metadata = await regenerateSingleSegment({
			jobId,
			segmentIndex: parseInt(String(segmentIndex), 10),
			userComment: body.user_comment || body.userComment,
			customTitle: body.custom_title || body.customTitle,
			customNarration: body.custom_narration || body.customNarration,
			model: body.model || "gemini-3.5-flash-lite",
			voiceEngine: body.voice_engine || body.voiceEngine || "gemini",
			apiKey: body.api_key || body.apiKey,
		});

		return NextResponse.json({ success: true, metadata });
	} catch (err: unknown) {
		const msg = err instanceof Error ? err.message : String(err);
		return NextResponse.json({ error: msg }, { status: 500 });
	}
}
