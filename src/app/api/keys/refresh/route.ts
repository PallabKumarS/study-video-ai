import { NextResponse } from "next/server";
import { getAllKeysStatus } from "@/engine/key-manager";

export async function POST() {
	try {
		const keys = await getAllKeysStatus();
		return NextResponse.json({ keys });
	} catch (err: unknown) {
		const msg = err instanceof Error ? err.message : String(err);
		return NextResponse.json({ error: msg }, { status: 500 });
	}
}
