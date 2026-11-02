import fs from "node:fs";
import path from "node:path";
import { type NextRequest, NextResponse } from "next/server";
import { OUTPUT_DIR } from "@/engine/config";

export async function GET(
	req: NextRequest,
	{ params }: { params: Promise<{ path: string[] }> },
) {
	try {
		const resolvedParams = await params;
		const parts = resolvedParams.path || [];
		if (parts.length === 0) {
			return new NextResponse("Not Found", { status: 404 });
		}

		// Decode each segment of the path
		const decodedParts = parts.map((p) => decodeURIComponent(p));
		let filePath = path.join(OUTPUT_DIR, ...decodedParts);

		// Directory traversal protection
		if (!filePath.startsWith(OUTPUT_DIR)) {
			return new NextResponse("Forbidden", { status: 403 });
		}

		// Fallback check: if the requested file doesn't exist, check alternatives
		if (!fs.existsSync(filePath)) {
			const dir = path.dirname(filePath);
			const requestedName = path.basename(filePath);
			if (fs.existsSync(dir)) {
				const files = fs.readdirSync(dir);
				// If looking for an mp4 file in this directory and exact name not found, find any mp4 in the dir
				if (requestedName.endsWith(".mp4")) {
					const altMp4 = files.find(
						(f) => f.endsWith(".mp4") && !f.startsWith("segment_"),
					);
					if (altMp4) {
						filePath = path.join(dir, altMp4);
					}
				} else if (requestedName.endsWith(".jpg")) {
					const altJpg = files.find(
						(f) => f.endsWith(".jpg") && !f.startsWith("thumb_seg_"),
					);
					if (altJpg) {
						filePath = path.join(dir, altJpg);
					}
				}
			}
		}

		if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
			return new NextResponse("File Not Found", { status: 404 });
		}

		const stat = fs.statSync(filePath);
		const fileSize = stat.size;
		const ext = path.extname(filePath).toLowerCase();

		const mimeTypes: Record<string, string> = {
			".mp4": "video/mp4",
			".mp3": "audio/mpeg",
			".jpg": "image/jpeg",
			".jpeg": "image/jpeg",
			".png": "image/png",
			".json": "application/json",
			".txt": "text/plain",
		};
		const contentType = mimeTypes[ext] || "application/octet-stream";

		// HTTP Range support for seamless HTML5 video seeking
		const range = req.headers.get("range");
		if (range && contentType.startsWith("video/")) {
			const rangeParts = range.replace(/bytes=/, "").split("-");
			const start = parseInt(rangeParts[0], 10);
			const end = rangeParts[1] ? parseInt(rangeParts[1], 10) : fileSize - 1;
			const chunksize = end - start + 1;

			const nodeStream = fs.createReadStream(filePath, { start, end });
			const webStream = new ReadableStream({
				start(controller) {
					nodeStream.on("data", (chunk) => controller.enqueue(chunk));
					nodeStream.on("end", () => controller.close());
					nodeStream.on("error", (err) => controller.error(err));
				},
			});

			return new NextResponse(webStream, {
				status: 206,
				headers: {
					"Content-Range": `bytes ${start}-${end}/${fileSize}`,
					"Accept-Ranges": "bytes",
					"Content-Length": chunksize.toString(),
					"Content-Type": contentType,
				},
			});
		}

		const nodeStream = fs.createReadStream(filePath);
		const webStream = new ReadableStream({
			start(controller) {
				nodeStream.on("data", (chunk) => controller.enqueue(chunk));
				nodeStream.on("end", () => controller.close());
				nodeStream.on("error", (err) => controller.error(err));
			},
		});

		return new NextResponse(webStream, {
			status: 200,
			headers: {
				"Content-Length": fileSize.toString(),
				"Content-Type": contentType,
				"Accept-Ranges": "bytes",
			},
		});
	} catch {
		return new NextResponse("Server Error", { status: 500 });
	}
}
