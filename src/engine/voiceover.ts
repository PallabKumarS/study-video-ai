import { execFile } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { GoogleGenAI } from "@google/genai";
import { getCurrentGeminiApiKey } from "./config";

const execFileAsync = promisify(execFile);

export interface VoiceOption {
	id: string;
	name: string;
	engine: "edge" | "gemini";
	language: "bn" | "en" | "all";
	gender: "male" | "female";
	description: string;
	edgeVoice?: string;
	geminiVoice?: string;
}

export const AVAILABLE_VOICES: VoiceOption[] = [
	{
		id: "bn-pradeep",
		name: "Pradeep (Bengali Male)",
		engine: "edge",
		language: "bn",
		gender: "male",
		description:
			"Natural, fluent Bengali male lecturer tone with great pronunciation",
		edgeVoice: "bn-BD-PradeepNeural",
	},
	{
		id: "bn-nabanita",
		name: "Nabanita (Bengali Female)",
		engine: "edge",
		language: "bn",
		gender: "female",
		description: "Warm, crystal-clear Bengali female explainer tone",
		edgeVoice: "bn-BD-NabanitaNeural",
	},
	{
		id: "gemini-puck",
		name: "Gemini Puck (AI Dynamic)",
		engine: "gemini",
		language: "all",
		gender: "male",
		description: "Energetic Google Gemini AI studio narration voice",
		geminiVoice: "Puck",
	},
	{
		id: "gemini-kore",
		name: "Gemini Kore (AI Academic)",
		engine: "gemini",
		language: "all",
		gender: "female",
		description: "Formal, academic Google Gemini AI narration voice",
		geminiVoice: "Kore",
	},
	{
		id: "gemini-charon",
		name: "Gemini Charon (AI Deep)",
		engine: "gemini",
		language: "all",
		gender: "male",
		description: "Deep, authoritative Google Gemini AI studio voice",
		geminiVoice: "Charon",
	},
	{
		id: "en-christopher",
		name: "Christopher (English Male)",
		engine: "edge",
		language: "en",
		gender: "male",
		description: "Professional British/US educational male presenter",
		edgeVoice: "en-US-ChristopherNeural",
	},
	{
		id: "en-jenny",
		name: "Jenny (English Female)",
		engine: "edge",
		language: "en",
		gender: "female",
		description: "Crisp, welcoming female teacher explainer",
		edgeVoice: "en-US-JennyNeural",
	},
];

export async function getAudioDuration(audioPath: string): Promise<number> {
	try {
		const { stdout } = await execFileAsync("ffprobe", [
			"-v",
			"error",
			"-show_entries",
			"format=duration",
			"-of",
			"default=noprint_wrappers=1:nokey=1",
			audioPath,
		]);
		const val = parseFloat(stdout.trim());
		return Number.isFinite(val) && val > 0.1 ? val : 5.0;
	} catch {
		return 5.0;
	}
}

async function generateSilentAudio(
	durationSec: number,
	outputPath: string,
): Promise<number> {
	const dur = Math.max(2.0, durationSec);
	await execFileAsync("ffmpeg", [
		"-y",
		"-f",
		"lavfi",
		"-i",
		"anullsrc=r=24000:cl=mono",
		"-t",
		dur.toFixed(2),
		"-q:a",
		"9",
		"-acodec",
		"libmp3lame",
		outputPath,
	]);
	return dur;
}

function detectIsBengali(text: string): boolean {
	return /[\u0980-\u09FF]/.test(text);
}

async function synthesizeEdgeTts(
	text: string,
	outputPath: string,
	voiceName: string,
): Promise<number> {
	await execFileAsync("python", [
		"-m",
		"edge_tts",
		"--voice",
		voiceName,
		"--text",
		text,
		"--write-media",
		outputPath,
	]);
	return await getAudioDuration(outputPath);
}

async function synthesizeGeminiTts(
	text: string,
	outputPath: string,
	voiceName: string,
	apiKey?: string,
): Promise<number> {
	const key = apiKey || getCurrentGeminiApiKey();
	if (!key) {
		throw new Error("No Gemini API key available for Gemini TTS.");
	}

	const ai = new GoogleGenAI({ apiKey: key });
	const ttsCandidateModels = [
		"gemini-3.8-flash-lite-tts",
		"gemini-3.1-flash-tts-preview",
		"gemini-3.8-flash-tts",
	];

	let rawBase64Audio = "";
	let lastTtsError: unknown = null;

	for (const ttsModel of ttsCandidateModels) {
		try {
			const response = await ai.models.generateContent({
				model: ttsModel,
				contents: text,
				config: {
					responseModalities: ["AUDIO"],
					speechConfig: {
						voiceConfig: {
							prebuiltVoiceConfig: {
								voiceName,
							},
						},
					},
				},
			});

			const part = response.candidates?.[0]?.content?.parts?.[0];
			if (part?.inlineData?.data) {
				rawBase64Audio = part.inlineData.data;
				break;
			}
		} catch (err) {
			lastTtsError = err;
		}
	}

	if (!rawBase64Audio) {
		throw new Error(`All Gemini TTS models failed: ${lastTtsError}`);
	}

	const tempWav = `${outputPath}.tmp.wav`;
	try {
		const wavBuffer = Buffer.from(rawBase64Audio, "base64");
		fs.writeFileSync(tempWav, wavBuffer);
		await execFileAsync("ffmpeg", [
			"-y",
			"-i",
			tempWav,
			"-c:a",
			"libmp3lame",
			"-b:a",
			"192k",
			outputPath,
		]);
		return await getAudioDuration(outputPath);
	} finally {
		if (fs.existsSync(tempWav)) {
			try {
				fs.unlinkSync(tempWav);
			} catch {}
		}
	}
}

export async function generateVoiceover(
	narrationText: string,
	outputPath: string,
	preferredEngine = "gemini-kore",
	apiKey?: string,
): Promise<number> {
	fs.mkdirSync(path.dirname(outputPath), { recursive: true });
	const clean = narrationText.trim();
	if (!clean) {
		return generateSilentAudio(4.0, outputPath);
	}

	const isBn = detectIsBengali(clean);
	const matchedVoice = AVAILABLE_VOICES.find(
		(v) => v.id === preferredEngine || v.edgeVoice === preferredEngine,
	);

	// Try 1: Selected voice preference
	if (matchedVoice?.engine === "gemini") {
		const geminiVoice = matchedVoice.geminiVoice || "Kore";
		try {
			const dur = await synthesizeGeminiTts(
				clean,
				outputPath,
				geminiVoice,
				apiKey,
			);
			if (dur > 0.5) return dur;
		} catch {
			// Fallback to Edge TTS immediately
			const edgeFallback = isBn
				? "bn-BD-PradeepNeural"
				: "en-US-ChristopherNeural";
			try {
				const dur = await synthesizeEdgeTts(clean, outputPath, edgeFallback);
				if (dur > 0.5) return dur;
			} catch {}
		}
	} else if (matchedVoice?.engine === "edge") {
		const edgeVoice =
			matchedVoice.edgeVoice ||
			(isBn ? "bn-BD-PradeepNeural" : "en-US-ChristopherNeural");
		try {
			const dur = await synthesizeEdgeTts(clean, outputPath, edgeVoice);
			if (dur > 0.5) return dur;
		} catch {
			// Fallback to Gemini TTS if Edge fails
			try {
				const dur = await synthesizeGeminiTts(
					clean,
					outputPath,
					"Puck",
					apiKey,
				);
				if (dur > 0.5) return dur;
			} catch {}
		}
	} else {
		// Generic fallback based on language
		const defaultEdge = isBn
			? "bn-BD-PradeepNeural"
			: "en-US-ChristopherNeural";
		try {
			const dur = await synthesizeEdgeTts(clean, outputPath, defaultEdge);
			if (dur > 0.5) return dur;
		} catch {
			try {
				const dur = await synthesizeGeminiTts(
					clean,
					outputPath,
					"Puck",
					apiKey,
				);
				if (dur > 0.5) return dur;
			} catch {}
		}
	}

	// Last-resort fallback to prevent crash, estimating realistic speech timing
	const words = clean.split(/\s+/).length;
	const estSeconds = Math.max(3.5, words / 2.8);
	return generateSilentAudio(estSeconds, outputPath);
}
