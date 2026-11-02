import { NextResponse } from "next/server";
import { getVideoHistory } from "@/lib/server-api";

export async function GET() {
	const history = await getVideoHistory();
	return NextResponse.json(history);
}
