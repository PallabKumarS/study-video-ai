import { NextResponse } from "next/server";
import { generateStudyVideo, updateJobProgress } from "@/engine/pipeline";
import { getUniqueJobTarget } from "@/engine/sanitize";

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const prompt = body.prompt?.trim();
		if (!prompt) {
			return NextResponse.json(
				{ error: "Prompt is required." },
				{ status: 400 },
			);
		}

		const rawTitle = body.title?.trim() || prompt.slice(0, 60);
		const { jobId, jobDir } = getUniqueJobTarget(rawTitle);

		updateJobProgress(
			jobDir,
			jobId,
			"queued",
			5,
			"Initializing video engine...",
		);

		// Fire generation in background
		(async () => {
			try {
				await generateStudyVideo({
					prompt,
					title: body.title,
					language: body.language || "bn",
					targetDuration: body.target_duration || 60,
					resolution: body.resolution || "1080p",
					aspectRatio: body.aspect_ratio || "9:16",
					model: body.model || "gemini-3.5-flash-lite",
					theme: body.theme || "dark_glow",
					voiceEngine: body.voice_engine || "gemini",
					jobId,
					apiKey: body.api_key,
				});
			} catch (err: unknown) {
				const msg = err instanceof Error ? err.message : String(err);
				updateJobProgress(jobDir, jobId, "failed", 0, msg);
			}
		})();

		return NextResponse.json({ job_id: jobId, status: "queued" });
	} catch (err: unknown) {
		const msg = err instanceof Error ? err.message : String(err);
		return NextResponse.json({ error: msg }, { status: 500 });
	}
}
