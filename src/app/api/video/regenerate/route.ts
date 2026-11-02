import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { OUTPUT_DIR } from "@/engine/config";
import { generateStudyVideo, updateJobProgress } from "@/engine/pipeline";
import { getUniqueJobTarget } from "@/engine/sanitize";
import type { VideoMetadata, VideoPlan } from "@/engine/types";

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const jobId = body.job_id || body.jobId;
		const userComment = body.user_comment || body.userComment;

		if (!jobId) {
			return NextResponse.json(
				{ error: "job_id is required." },
				{ status: 400 },
			);
		}
		if (!userComment?.trim()) {
			return NextResponse.json(
				{ error: "Revision comment/feedback is required." },
				{ status: 400 },
			);
		}

		const oldJobDir = path.join(OUTPUT_DIR, jobId);
		if (!fs.existsSync(oldJobDir)) {
			return NextResponse.json(
				{ error: `Job ${jobId} not found.` },
				{ status: 404 },
			);
		}

		const metaFile = path.join(oldJobDir, "metadata.json");
		const planFile = path.join(oldJobDir, "plan.json");

		if (!fs.existsSync(metaFile)) {
			return NextResponse.json(
				{ error: "Job metadata is missing." },
				{ status: 400 },
			);
		}

		const oldMeta: VideoMetadata = JSON.parse(
			fs.readFileSync(metaFile, "utf-8"),
		);
		let oldPlan: Partial<VideoPlan> = {};
		if (fs.existsSync(planFile)) {
			try {
				oldPlan = JSON.parse(fs.readFileSync(planFile, "utf-8"));
			} catch {}
		}

		const language = oldMeta.language || oldPlan.language || "bn";
		const resolution = oldMeta.resolution || "1080p";
		const aspectRatio = oldMeta.aspect_ratio || oldPlan.aspect_ratio || "9:16";
		const theme = body.theme || oldMeta.theme_used || "dark_glow";
		const model = body.model || oldMeta.model_used || "gemini-3.8-flash";
		const voiceEngine =
			body.voice_engine ||
			body.voiceEngine ||
			oldMeta.voice_used ||
			"gemini-kore";

		const targetDuration = body.target_duration
			? Number(body.target_duration)
			: Math.round(
					oldMeta.total_duration || oldPlan.estimated_total_seconds || 60,
				);

		const basePrompt =
			oldPlan.original_prompt ||
			oldMeta.original_prompt ||
			oldPlan.topic ||
			oldMeta.topic;

		const combinedPrompt = `Original Concept / Previous Topic:
${basePrompt}

Director Revision & Expansion Instruction:
${userComment.trim()}

Important Directives:
- Create a comprehensive new multi-segment study video fully addressing all revisions and expansions requested.
- Determine the appropriate segment count (e.g. 3 to 6 segments) and pacing to clearly cover every topic mentioned without rushing.`;

		const title = oldMeta.topic || oldPlan.topic || basePrompt.slice(0, 60);
		const { jobId: newJobId, jobDir: newJobDir } = getUniqueJobTarget(title);

		updateJobProgress(
			newJobDir,
			newJobId,
			"queued",
			5,
			`Initializing revised video pipeline with ${model}...`,
		);

		// Fire background generation of a brand new video preserving the original
		(async () => {
			try {
				await generateStudyVideo({
					prompt: combinedPrompt,
					title,
					language,
					targetDuration,
					resolution,
					aspectRatio,
					model,
					theme,
					voiceEngine,
					jobId: newJobId,
					apiKey: body.api_key || body.apiKey,
				});
			} catch (err: unknown) {
				const msg = err instanceof Error ? err.message : String(err);
				updateJobProgress(newJobDir, newJobId, "failed", 0, msg);
			}
		})();

		return NextResponse.json({
			success: true,
			job_id: newJobId,
			status: "queued",
			message: "New revised study video generation started.",
		});
	} catch (err: unknown) {
		const msg = err instanceof Error ? err.message : String(err);
		return NextResponse.json({ error: msg }, { status: 500 });
	}
}
