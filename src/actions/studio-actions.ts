"use server";

import {
	addNewApiKey,
	getAllKeysStatus,
	getKeyHash,
	loadAllKeys,
	setApiKeyActive,
	setKeyTier,
} from "@/engine/key-manager";
import { cancelGenerationJob } from "@/engine/pipeline";
import type { KeyStatus, VideoMetadata } from "@/engine/types";
import {
	deleteVideoJob,
	getKeysData,
	getModelsCatalog,
	getVideoHistory,
} from "@/lib/server-api";

export async function fetchVideoHistoryAction(): Promise<VideoMetadata[]> {
	return await getVideoHistory();
}

export async function fetchKeysAction(): Promise<KeyStatus[]> {
	return await getKeysData();
}

export async function fetchModelsCatalogAction() {
	return await getModelsCatalog();
}

export async function activateKeyAction(
	keyHash: string,
): Promise<{ success: boolean; error?: string; keys?: KeyStatus[] }> {
	try {
		if (!keyHash) {
			return { success: false, error: "key_hash is required." };
		}
		const allKeys = loadAllKeys();
		const target = allKeys.find((k) => getKeyHash(k) === keyHash);
		if (!target) {
			return { success: false, error: "Key not found." };
		}

		setApiKeyActive(target);
		const keys = await getAllKeysStatus();
		return { success: true, keys };
	} catch (err: unknown) {
		const msg = err instanceof Error ? err.message : String(err);
		return { success: false, error: msg };
	}
}

export async function addKeyAction(
	newKey: string,
	makeActive = false,
): Promise<{ success: boolean; error?: string; keys?: KeyStatus[] }> {
	try {
		const clean = newKey.trim();
		if (!clean) {
			return { success: false, error: "API key cannot be empty." };
		}

		addNewApiKey(clean, makeActive);
		const keys = await getAllKeysStatus();
		return { success: true, keys };
	} catch (err: unknown) {
		const msg = err instanceof Error ? err.message : String(err);
		return { success: false, error: msg };
	}
}

export async function updateKeyTierAction(
	keyHash: string,
	tier: "pro" | "free" | "payg",
): Promise<{ success: boolean; error?: string; keys?: KeyStatus[] }> {
	try {
		setKeyTier(keyHash, tier);
		const keys = await getAllKeysStatus();
		return { success: true, keys };
	} catch (err: unknown) {
		const msg = err instanceof Error ? err.message : String(err);
		return { success: false, error: msg };
	}
}

export async function deleteVideoAction(jobId: string): Promise<{
	success: boolean;
	error?: string;
	remainingHistory?: VideoMetadata[];
}> {
	try {
		if (!jobId) {
			return { success: false, error: "jobId is required" };
		}
		const ok = await deleteVideoJob(jobId);
		if (!ok) {
			return { success: false, error: "Video directory not found" };
		}
		const remainingHistory = await getVideoHistory();
		return { success: true, remainingHistory };
	} catch (err: unknown) {
		const msg = err instanceof Error ? err.message : String(err);
		return { success: false, error: msg };
	}
}

export async function cancelJobAction(
	jobId: string,
): Promise<{ success: boolean; error?: string }> {
	try {
		if (!jobId) {
			return { success: false, error: "jobId is required" };
		}
		cancelGenerationJob(jobId);
		return { success: true };
	} catch (err: unknown) {
		const msg = err instanceof Error ? err.message : String(err);
		return { success: false, error: msg };
	}
}
