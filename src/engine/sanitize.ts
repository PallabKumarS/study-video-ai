import fs from "node:fs";
import path from "node:path";
import { OUTPUT_DIR } from "./config";

/**
 * Sanitizes a title string so it is valid as both a directory and a filename
 * on Windows, macOS, and Linux without illegal characters or excessive length.
 */
export function sanitizeTitle(rawTitle: string, maxLength = 100): string {
	if (!rawTitle?.trim()) {
		return `Study_Video_${Date.now()}`;
	}

	// Remove characters forbidden by Windows NTFS: \ / : * ? " < > |
	let sanitized = rawTitle
		.replace(/[\\/:*?"<>|\r\n\t]/g, " ")
		.replace(/\s+/g, " ")
		.trim();

	// Remove leading or trailing periods and spaces
	sanitized = sanitized.replace(/^\.+|\.+$/g, "").trim();

	if (!sanitized) {
		return `Study_Video_${Date.now()}`;
	}

	if (sanitized.length > maxLength) {
		sanitized = sanitized.slice(0, maxLength).trim();
	}

	return sanitized;
}

/**
 * Creates a unique folder name in the generated output directory.
 * If a folder with the title already exists, appends (2), (3), etc.
 */
export function getUniqueJobTarget(title: string): {
	jobId: string;
	jobDir: string;
	safeTitle: string;
} {
	const safeTitle = sanitizeTitle(title);
	let candidate = safeTitle;
	let counter = 1;
	let jobDir = path.join(OUTPUT_DIR, candidate);

	while (fs.existsSync(jobDir)) {
		counter++;
		candidate = `${safeTitle} (${counter})`;
		jobDir = path.join(OUTPUT_DIR, candidate);
	}

	return {
		jobId: candidate,
		jobDir,
		safeTitle,
	};
}
