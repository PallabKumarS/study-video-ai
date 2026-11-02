import { NextResponse } from "next/server";
import {
	getAllKeysStatus,
	getKeyHash,
	loadAllKeys,
	setApiKeyActive,
} from "@/engine/key-manager";

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const keyHash = body.key_hash;
		if (!keyHash) {
			return NextResponse.json(
				{ error: "key_hash is required." },
				{ status: 400 },
			);
		}

		const allKeys = loadAllKeys();
		const target = allKeys.find((k) => getKeyHash(k) === keyHash);
		if (!target) {
			return NextResponse.json({ error: "Key not found." }, { status: 404 });
		}

		setApiKeyActive(target);
		const keys = await getAllKeysStatus();
		return NextResponse.json({ success: true, keys });
	} catch (err: unknown) {
		const msg = err instanceof Error ? err.message : String(err);
		return NextResponse.json({ error: msg }, { status: 500 });
	}
}
