import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { GoogleGenAI } from "@google/genai";
import { BASE_DIR, getCurrentGeminiApiKey, OUTPUT_DIR } from "./config";
import type { KeyStatus, ModelQuotaInfo } from "./types";

const ENV_PATH = path.join(BASE_DIR, ".env");
const USAGE_FILE = path.join(OUTPUT_DIR, "key_usage.json");

export function getKeyHash(key: string): string {
	return crypto
		.createHash("sha256")
		.update(key.trim())
		.digest("hex")
		.slice(0, 12);
}

export function maskKey(key: string): string {
	const k = key.trim();
	if (k.length <= 12) {
		return k.length > 6 ? `${k.slice(0, 3)}...${k.slice(-3)}` : "***";
	}
	return `${k.slice(0, 8)}...${k.slice(-6)}`;
}

export function readEnvFile(): Record<string, string> {
	if (!fs.existsSync(ENV_PATH)) return {};
	const content = fs.readFileSync(ENV_PATH, "utf-8");
	const result: Record<string, string> = {};
	for (const line of content.split("\n")) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#")) continue;
		const idx = trimmed.indexOf("=");
		if (idx !== -1) {
			result[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
		}
	}
	return result;
}

export function writeEnvFile(envDict: Record<string, string>): void {
	const lines = Object.entries(envDict).map(([k, v]) => `${k}=${v}`);
	fs.writeFileSync(ENV_PATH, `${lines.join("\n")}\n`, "utf-8");
}

export function loadAllKeys(): string[] {
	const env = readEnvFile();
	const keys: string[] = [];

	const main = env.GEMINI_API_KEY?.trim();
	if (main && !keys.includes(main)) keys.push(main);

	const multi = env.GEMINI_API_KEYS;
	if (multi) {
		for (const k of multi.split(",")) {
			const clean = k.trim();
			if (clean && !keys.includes(clean)) keys.push(clean);
		}
	}

	for (const [k, v] of Object.entries(env)) {
		if (
			k.startsWith("GEMINI_API_KEY_") &&
			v?.trim() &&
			!keys.includes(v.trim())
		) {
			keys.push(v.trim());
		}
	}

	return keys;
}

export function setApiKeyActive(key: string): boolean {
	const clean = key.trim();
	if (!clean) return false;
	const env = readEnvFile();
	const allKeys = loadAllKeys();
	if (!allKeys.includes(clean)) allKeys.push(clean);

	env.GEMINI_API_KEY = clean;
	env.GEMINI_API_KEYS = allKeys.join(",");
	writeEnvFile(env);
	process.env.GEMINI_API_KEY = clean;
	return true;
}

export function addNewApiKey(newKey: string, makeActive = false): boolean {
	const clean = newKey.trim();
	if (!clean) return false;
	const allKeys = loadAllKeys();
	if (!allKeys.includes(clean)) allKeys.push(clean);

	const env = readEnvFile();
	if (makeActive || !env.GEMINI_API_KEY) {
		env.GEMINI_API_KEY = clean;
		process.env.GEMINI_API_KEY = clean;
	}
	env.GEMINI_API_KEYS = allKeys.join(",");
	writeEnvFile(env);
	return true;
}

export interface KeyUsageStore {
	[hash: string]: {
		date: string;
		today_requests: number;
		today_videos: number;
		total_tokens_est: number;
		tier_override?: "pro" | "free" | "payg";
		models_usage?: Record<string, number>;
		exhausted_models?: string[];
	};
}

export function recordModelExhaustion(key: string, modelName: string): void {
	const h = getKeyHash(key);
	const today = new Date().toISOString().slice(0, 10);
	const store = loadUsageStore();
	if (!store[h] || store[h].date !== today) {
		const existingTier = store[h]?.tier_override;
		store[h] = {
			date: today,
			today_requests: 0,
			today_videos: 0,
			total_tokens_est: 0,
			tier_override: existingTier,
			models_usage: {},
			exhausted_models: [],
		};
	}
	if (!store[h].exhausted_models) {
		store[h].exhausted_models = [];
	}
	const cleanName = modelName.replace(/^models\//, "");
	if (!store[h].exhausted_models.includes(cleanName)) {
		store[h].exhausted_models.push(cleanName);
	}
	saveUsageStore(store);
}

export function loadUsageStore(): KeyUsageStore {
	if (!fs.existsSync(USAGE_FILE)) return {};
	try {
		return JSON.parse(fs.readFileSync(USAGE_FILE, "utf-8"));
	} catch {
		return {};
	}
}

export function saveUsageStore(store: KeyUsageStore): void {
	fs.writeFileSync(USAGE_FILE, JSON.stringify(store, null, 2), "utf-8");
}

export function setKeyTier(
	keyHash: string,
	tier: "pro" | "free" | "payg",
): boolean {
	const store = loadUsageStore();
	const today = new Date().toISOString().slice(0, 10);
	if (!store[keyHash]) {
		store[keyHash] = {
			date: today,
			today_requests: 0,
			today_videos: 0,
			total_tokens_est: 0,
			tier_override: tier,
		};
	} else {
		store[keyHash].tier_override = tier;
	}
	saveUsageStore(store);
	return true;
}

export function recordKeyUsage(
	key: string,
	action = "api_call",
	tokensEst = 500,
	modelName?: string,
): void {
	const h = getKeyHash(key);
	const today = new Date().toISOString().slice(0, 10);
	const store = loadUsageStore();

	if (!store[h] || store[h].date !== today) {
		const existingTier = store[h]?.tier_override;
		store[h] = {
			date: today,
			today_requests: 0,
			today_videos: 0,
			total_tokens_est: 0,
			tier_override: existingTier,
			models_usage: {},
		};
	}

	if (!store[h].models_usage) {
		store[h].models_usage = {};
	}

	store[h].today_requests += 1;
	store[h].total_tokens_est += tokensEst;
	if (action === "video_generation") {
		store[h].today_videos += 1;
	}
	if (modelName) {
		const cleanName = modelName.replace(/^models\//, "");
		store[h].models_usage[cleanName] =
			(store[h].models_usage[cleanName] || 0) + 1;
	}
	saveUsageStore(store);
}

function buildModelQuotas(
	availableModelNames: Set<string>,
	modelsUsage: Record<string, number>,
	effectiveTier: "pro" | "free" | "payg",
	exhaustedModels: string[] = [],
): ModelQuotaInfo[] {
	const isFree = effectiveTier === "free";

	// 1. Gemini 3.8 Flash
	const used38 = modelsUsage["gemini-3.8-flash"] || 0;
	const is38Exhausted =
		exhaustedModels.includes("gemini-3.8-flash") || (isFree && used38 >= 20);
	const limit38 = isFree ? "20 RPD" : "10,000 RPD";
	const effectiveUsed38 =
		is38Exhausted && isFree ? Math.max(20, used38) : used38;
	const rem38 = is38Exhausted
		? "0 left"
		: isFree
			? `${Math.max(0, 20 - used38).toLocaleString()} left`
			: `${Math.max(0, 10000 - used38).toLocaleString()} left`;
	const has38 = availableModelNames.has("gemini-3.8-flash");

	// 2. Gemini 4.0 Argon
	const usedArgon = modelsUsage["gemini-4-argon"] || 0;
	const hasArgon = availableModelNames.has("gemini-4-argon") || !isFree;
	const limitArgon = isFree ? "Pro Plan" : "10,000 RPD";
	const remArgon = isFree
		? "Locked (Pro)"
		: `${Math.max(0, 10000 - usedArgon).toLocaleString()} left`;

	// 3. Gemini 3.5 Flash Lite
	const used35 = modelsUsage["gemini-3.5-flash-lite"] || 0;
	const limit35 = isFree ? "1,500 RPD" : "10,000 RPD";
	const rem35 = isFree
		? `${Math.max(0, 1500 - used35).toLocaleString()} left`
		: `${Math.max(0, 10000 - used35).toLocaleString()} left`;
	const has35 = availableModelNames.has("gemini-3.5-flash-lite");

	// 4. Google Veo Video
	const hasVeo = Array.from(availableModelNames).some((m) => m.includes("veo"));
	const usedVeo =
		(modelsUsage.veo || 0) +
		(modelsUsage["veo-2.0-generate-001"] || 0) +
		(modelsUsage["veo-3.1-generate-preview"] || 0);
	const limitVeo = hasVeo
		? isFree
			? "10 RPD"
			: "500 RPD"
		: "Requires Vertex AI";
	const remVeo = hasVeo
		? `${Math.max(0, (isFree ? 10 : 500) - usedVeo).toLocaleString()} left`
		: "Requires Vertex AI";

	return [
		{
			model_id: "gemini-3.8-flash",
			display_name: "Gemini 3.8 Flash",
			daily_limit: limit38,
			used_today: effectiveUsed38,
			remaining: rem38,
			supported: has38,
			status: is38Exhausted ? "Quota Exhausted" : "Operational",
			status_note: is38Exhausted
				? "Free Tier 20 RPD limit reached. Resets daily."
				: isFree
					? "Free Tier 20 RPD limit. Resets daily."
					: "Priority Pro tier high-speed STEM reasoning",
		},
		{
			model_id: "gemini-4-argon",
			display_name: "Gemini 4.0 Argon",
			daily_limit: limitArgon,
			used_today: usedArgon,
			remaining: remArgon,
			supported: hasArgon,
			status: isFree ? "Pro Plan Required" : "Operational",
			status_note: isFree
				? "Requires Gemini Pro Subscription or PayG"
				: "Flagship STEM mathematical ray reasoning active",
		},
		{
			model_id: "gemini-3.5-flash-lite",
			display_name: "Gemini 3.5 Flash Lite",
			daily_limit: limit35,
			used_today: used35,
			remaining: rem35,
			supported: has35,
			status: "Operational",
			status_note: isFree
				? "Generous free tier quota (1,500 RPD)"
				: "Ultra-fast low-latency high-volume tier",
		},
		{
			model_id: "veo",
			display_name: "Google Veo",
			daily_limit: limitVeo,
			used_today: usedVeo,
			remaining: remVeo,
			supported: hasVeo,
			status: hasVeo ? "Operational" : "Not Supported",
			status_note: hasVeo
				? "AI Video generation enabled on this key"
				: "Requires Vertex AI allowlist or Gemini Enterprise access",
		},
	];
}

export async function testKeyStatus(
	key: string,
	isActive = false,
): Promise<KeyStatus> {
	const kHash = getKeyHash(key);
	const masked = maskKey(key);
	const tStart = Date.now();

	const store = loadUsageStore();
	const usage = store[kHash] || { today_requests: 0, today_videos: 0 };

	try {
		const ai = new GoogleGenAI({ apiKey: key });
		const modelsResponse = await ai.models.list();
		const availableModelNames = new Set<string>();
		let modelCount = 0;
		for await (const m of modelsResponse) {
			modelCount++;
			if (m.name) {
				availableModelNames.add(m.name.replace(/^models\//, ""));
			}
			if (modelCount > 80) break;
		}
		const latency = Date.now() - tStart;

		// Default keys to Google AI Studio Free Tier unless explicitly set to pro or payg
		const effectiveTier: "pro" | "free" | "payg" =
			store[kHash]?.tier_override || "free";

		let serviceTier = "Gemini Pro Plan";
		let tierExplanation =
			"Gemini Pro Subscription: Priority 10,000 RPD • 1,000 RPM • Flat Subscription (No Pay-As-You-Go Metering)";
		let dailyLimit = 10000;
		let rpm = 1000;
		let tpm = "4,000,000 TPM";

		if (effectiveTier === "free") {
			serviceTier = "Free Tier (Google AI Studio)";
			tierExplanation =
				"Google AI Studio Free Tier: 1,500 Requests/Day • 15 Requests/Min";
			dailyLimit = 1500;
			rpm = 15;
			tpm = "1,000,000 TPM";
		} else if (effectiveTier === "payg") {
			serviceTier = "Cloud Pay-As-You-Go";
			tierExplanation =
				"Google Cloud Metered Billing: 10,000+ Requests/Day • 1,000 Requests/Min";
			dailyLimit = 10000;
			rpm = 1000;
			tpm = "4,000,000 TPM";
		}

		const remaining = Math.max(0, dailyLimit - usage.today_requests);
		const modelQuotas = buildModelQuotas(
			availableModelNames,
			usage.models_usage || {},
			effectiveTier,
			usage.exhausted_models || [],
		);

		return {
			key_hash: kHash,
			masked_key: masked,
			is_active: isActive,
			valid: true,
			status: "Operational",
			service_tier: serviceTier,
			tier_type: effectiveTier,
			models_count: modelCount,
			daily_limit_rpd: dailyLimit,
			remaining_estimated_rpd: remaining,
			daily_limit_requests: dailyLimit,
			remaining_daily_requests: remaining,
			rate_limit_rpm: rpm,
			token_limit_tpm: tpm,
			tier_explanation: tierExplanation,
			today_requests: usage.today_requests,
			today_videos: usage.today_videos,
			latency_ms: latency,
			last_checked: new Date().toLocaleTimeString(),
			model_quotas: modelQuotas,
		};
	} catch (err: unknown) {
		const errMsg = err instanceof Error ? err.message : String(err);
		const latency = Date.now() - tStart;
		const fallbackQuotas = buildModelQuotas(
			new Set<string>(),
			usage.models_usage || {},
			"free",
			usage.exhausted_models || [],
		);
		return {
			key_hash: kHash,
			masked_key: masked,
			is_active: isActive,
			valid: false,
			status: errMsg.includes("API_KEY_INVALID")
				? "Invalid API Key"
				: "Quota Exhausted",
			service_tier: "Unknown",
			models_count: 0,
			daily_limit_rpd: 1500,
			remaining_estimated_rpd: 0,
			daily_limit_requests: 1500,
			remaining_daily_requests: 0,
			rate_limit_rpm: 15,
			token_limit_tpm: "1,000,000 TPM",
			tier_explanation: "Inactive or Exhausted Key",
			today_requests: usage.today_requests,
			today_videos: usage.today_videos,
			latency_ms: latency,
			last_checked: new Date().toLocaleTimeString(),
			model_quotas: fallbackQuotas,
		};
	}
}

export async function getAllKeysStatus(): Promise<KeyStatus[]> {
	const keys = loadAllKeys();
	const activeKey = getCurrentGeminiApiKey();
	const results: KeyStatus[] = [];

	for (const k of keys) {
		const status = await testKeyStatus(k, k === activeKey);
		results.push(status);
	}

	return results;
}
