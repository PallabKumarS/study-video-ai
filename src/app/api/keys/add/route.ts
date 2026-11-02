import { NextResponse } from "next/server";
import { addNewApiKey, getAllKeysStatus } from "@/engine/key-manager";

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const key = body.key?.trim();
		if (!key) {
			return NextResponse.json({ error: "Key is required." }, { status: 400 });
		}

		const success = addNewApiKey(key, Boolean(body.make_active));
		if (!success) {
			return NextResponse.json(
				{ error: "Failed to add key." },
				{ status: 500 },
			);
		}

		const keys = await getAllKeysStatus();
		return NextResponse.json({ success: true, keys });
	} catch (err: unknown) {
		const msg = err instanceof Error ? err.message : String(err);
		return NextResponse.json({ error: msg }, { status: 500 });
	}
}
