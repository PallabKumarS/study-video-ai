"use client";

import { Key, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Container } from "@/components/container";
import { Header } from "@/components/header";
import { KeyManager } from "@/components/key-manager";
import type { KeyStatus } from "@/engine/types";

interface KeysViewProps {
	initialKeys: KeyStatus[];
}

export function KeysView({ initialKeys }: KeysViewProps) {
	const [keys, setKeys] = useState<KeyStatus[]>(initialKeys);

	const activeKey = keys.find((k) => k.is_active);

	return (
		<div className="min-h-screen bg-[#090c13] text-slate-100 flex flex-col font-sans">
			<Header
				activeKeyLabel={
					activeKey ? `Active: ${activeKey.masked_key}` : "No Active Key"
				}
			/>

			<main className="flex-1 w-full">
				<Container className="py-6 space-y-6 max-w-6xl">
					{/* Page Intro */}
					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-5">
						<div>
							<div className="flex items-center gap-2.5">
								<div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
									<Key className="w-4 h-4" />
								</div>
								<h1 className="text-xl font-bold text-white tracking-tight">
									Gemini API Key & Rate Limit Manager
								</h1>
							</div>
							<p className="text-xs text-slate-400 mt-1">
								Manage your Google AI Studio keys, inspect rolling 24-hour RPD
								quotas, and switch active models.
							</p>
						</div>

						<div className="flex items-center gap-2">
							<span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium">
								<ShieldCheck className="w-3.5 h-3.5" />
								<span>Protected in .env</span>
							</span>
						</div>
					</div>

					{/* Key Manager Dashboard */}
					<KeyManager keys={keys} onKeysChanged={setKeys} />
				</Container>
			</main>
		</div>
	);
}
