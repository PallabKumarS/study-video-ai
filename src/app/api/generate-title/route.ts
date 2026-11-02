import { NextResponse } from "next/server";
import { generateVideoTitle } from "@/engine/planner";

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

		// Always use the ultra-fast free tier model for title generation to conserve quota
		const title = await generateVideoTitle(
			prompt,
			body.language || "bn",
			"gemini-3.5-flash-lite",
			body.api_key,
		);

		return NextResponse.json({ title });
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : String(err);
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
