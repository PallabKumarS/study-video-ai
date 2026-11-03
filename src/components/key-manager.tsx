"use client";

import {
	Activity,
	Gauge,
	HelpCircle,
	Info,
	Key,
	Layers,
	PlusCircle,
	RefreshCw,
	Save,
	Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
	activateKeyAction,
	addKeyAction,
	fetchKeysAction,
	updateKeyTierAction,
} from "@/actions/studio-actions";
import type { KeyStatus } from "@/engine/types";

interface KeyManagerProps {
	keys: KeyStatus[];
	onKeysChanged: (newKeys: KeyStatus[]) => void;
}

export function KeyManager({ keys, onKeysChanged }: KeyManagerProps) {
	const [newKey, setNewKey] = useState("");
	const [makeActive, setMakeActive] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [updatingTierHash, setUpdatingTierHash] = useState<string | null>(null);
	const [showExplainer, setShowExplainer] = useState(false);

	const handleUpdateTier = async (
		keyHash: string,
		tier: "pro" | "free" | "payg",
	) => {
		setUpdatingTierHash(keyHash);
		try {
			const res = await updateKeyTierAction(keyHash, tier);
			if (res.success && res.keys) {
				toast.success("Account tier updated successfully");
				onKeysChanged(res.keys);
			} else {
				toast.error(res.error || "Failed to update tier");
			}
		} catch {
			toast.error("Failed to update account tier");
		} finally {
			setUpdatingTierHash(null);
		}
	};

	const handleAdd = async () => {
		if (!newKey.trim()) {
			toast.error("Please enter a valid Gemini API key.");
			return;
		}

		try {
			const res = await addKeyAction(newKey.trim(), makeActive);
			if (!res.success) throw new Error(res.error || "Failed to add key");

			toast.success("API Key saved to .env successfully!");
			setNewKey("");
			if (res.keys) onKeysChanged(res.keys);
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : String(err);
			toast.error(msg);
		}
	};

	const handleActivate = async (keyHash: string) => {
		try {
			const res = await activateKeyAction(keyHash);
			if (res.success && res.keys) {
				toast.success("Active key updated!");
				onKeysChanged(res.keys);
			} else {
				toast.error(res.error || "Failed to activate key.");
			}
		} catch {
			toast.error("Failed to activate key.");
		}
	};

	const handleRefresh = async () => {
		setRefreshing(true);
		try {
			const updatedKeys = await fetchKeysAction();
			toast.success("Quota limits refreshed!");
			onKeysChanged(updatedKeys);
		} catch {
			toast.error("Failed to refresh quota limits.");
		} finally {
			setRefreshing(false);
		}
	};

	return (
		<section
			id="keyManagerSection"
			className="glass-panel rounded-2xl p-6 shadow-xl space-y-6 border-slate-700/60"
		>
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
				<div>
					<h3 className="text-base font-bold text-white flex items-center gap-2">
						<Key className="w-5 h-5 text-sky-400" />
						<span>Gemini API Keys & Quota Manager</span>
					</h3>
					<p className="text-xs text-slate-400 mt-0.5">
						Keys are securely stored in{" "}
						<code className="text-sky-300">.env</code>. Monitor live quotas and
						switch active keys.
					</p>
				</div>
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={() => setShowExplainer(!showExplainer)}
						className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
					>
						<HelpCircle className="w-3.5 h-3.5 text-sky-400" />
						<span>{showExplainer ? "Hide Guide" : "What is RPD?"}</span>
					</button>
					<button
						type="button"
						disabled={refreshing}
						onClick={handleRefresh}
						className="px-3.5 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 text-xs font-semibold flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
					>
						<RefreshCw
							className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
						/>
						<span>Refresh Quotas</span>
					</button>
				</div>
			</div>

			{/* RPD / RPM / TPM Explainer Banner */}
			{showExplainer && (
				<div className="rounded-xl p-4 bg-sky-950/30 border border-sky-500/30 text-xs text-slate-300 space-y-2">
					<div className="font-semibold text-white flex items-center gap-1.5">
						<Info className="w-4 h-4 text-sky-400" />
						<span>Gemini Account Tiers & Limits Explained</span>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-[11px]">
						<div className="rounded-lg bg-[#0d1424] p-3 border border-purple-500/30">
							<div className="font-bold text-purple-300 text-xs mb-1">
								Gemini Pro Plan (Subscription)
							</div>
							<p className="text-slate-300 leading-relaxed">
								Flat monthly Google subscription. Full priority access to Gemini
								3.8, 4.0 Argon, Veo, with <strong>10,000 RPD</strong> and{" "}
								<strong>1,000 RPM</strong>. Zero per-token metered charges.
							</p>
						</div>
						<div className="rounded-lg bg-[#0d1424] p-3 border border-sky-500/20">
							<div className="font-bold text-sky-300 text-xs mb-1">
								Google AI Studio Free Tier
							</div>
							<p className="text-slate-300 leading-relaxed">
								Standard free developer quota. Allows <strong>1,500 RPD</strong>{" "}
								and <strong>15 RPM</strong> on Flash models for experimental
								workloads.
							</p>
						</div>
						<div className="rounded-lg bg-[#0d1424] p-3 border border-amber-500/20">
							<div className="font-bold text-amber-300 text-xs mb-1">
								Cloud Pay-As-You-Go
							</div>
							<p className="text-slate-300 leading-relaxed">
								Google Cloud metered billing with enterprise throughput (10,000+
								RPD, 4M TPM) billed per million tokens consumed.
							</p>
						</div>
					</div>
				</div>
			)}

			{/* Add New Key Input */}
			<div className="bg-[#161d2d]/70 rounded-xl p-4 border border-slate-800 space-y-3">
				<label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
					<PlusCircle className="w-4 h-4 text-emerald-400" />
					<span>Add Another Gemini API Key</span>
				</label>
				<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
					<input
						type="text"
						value={newKey}
						onChange={(e) => setNewKey(e.target.value)}
						placeholder="Paste your Google AI Studio API key (AIzaSy...)"
						className="flex-1 rounded-xl bg-[#090c13] border border-slate-800 px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono transition"
					/>
					<label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none px-1">
						<input
							type="checkbox"
							checked={makeActive}
							onChange={(e) => setMakeActive(e.target.checked)}
							className="rounded border-slate-800 text-sky-500 focus:ring-sky-500"
						/>
						<span>Make active key</span>
					</label>
					<button
						type="button"
						onClick={handleAdd}
						className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-lg shadow-emerald-600/20"
					>
						<Save className="w-3.5 h-3.5" />
						<span>Save to .env</span>
					</button>
				</div>
			</div>

			{/* Fluid Auto-Fill Grid for Key Cards */}
			<div className="space-y-2">
				<div className="flex items-center justify-between text-xs text-slate-400">
					<span>Configured Keys & Quota Breakdown</span>
					<span className="text-[11px] text-slate-500">
						{keys.length} Keys Configured
					</span>
				</div>
				<div className="grid grid-cols-[repeat(auto-fill,minmax(min(340px,100%),1fr))] gap-3">
					{keys.map((k) => {
						const dailyLimit =
							k.daily_limit_requests || k.daily_limit_rpd || 1500;
						const remaining =
							k.remaining_daily_requests ??
							k.remaining_estimated_rpd ??
							dailyLimit;
						const usedToday = k.today_requests || 0;
						const pctRemaining = Math.max(
							0,
							Math.min(100, Math.round((remaining / dailyLimit) * 100)),
						);

						return (
							<div
								key={k.key_hash}
								className={`rounded-xl p-4 border transition-all space-y-3.5 ${
									k.is_active
										? "bg-sky-500/10 border-sky-500 shadow-md shadow-sky-500/10"
										: "bg-[#161d2d] border-slate-800 hover:border-slate-700"
								}`}
							>
								{/* Card Header */}
								<div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
									<div className="flex items-center gap-2">
										<input
											type="radio"
											name="activeKeyRadio"
											checked={k.is_active}
											onChange={() => handleActivate(k.key_hash)}
											title={`Select ${k.masked_key} as active system key`}
											className="w-3.5 h-3.5 text-sky-500 border-slate-800 focus:ring-sky-500 cursor-pointer"
										/>
										<span
											title={`Masked API Key: ${k.masked_key}`}
											className="font-mono text-xs font-bold text-slate-100 cursor-help"
										>
											{k.masked_key}
										</span>
									</div>
									<div className="flex items-center gap-1.5">
										{k.is_active && (
											<span
												title="Currently active API key powering generation requests"
												className="px-2 py-0.5 rounded-full bg-sky-500/20 border border-sky-500/30 text-sky-300 text-[10px] font-bold cursor-help"
											>
												ACTIVE
											</span>
										)}
										<span
											title={`API Key Status: ${k.status}`}
											className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border cursor-help ${
												k.valid
													? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
													: "bg-rose-500/10 border-rose-500/20 text-rose-300"
											}`}
										>
											<span
												className={`w-1.5 h-1.5 rounded-full ${
													k.valid ? "bg-emerald-400" : "bg-rose-400"
												}`}
											/>
											<span>{k.status}</span>
										</span>
									</div>
								</div>

								{/* Interactive Account Tier Selector */}
								<div className="space-y-1.5 pt-0.5">
									<div className="flex items-center justify-between text-xs">
										<span className="text-slate-400 text-[11px]">
											Account Plan:
										</span>
										<span
											title={k.tier_explanation || k.service_tier}
											className={`text-[11px] font-semibold cursor-help ${
												k.tier_type === "pro" ||
												(!k.tier_type && k.service_tier.includes("Pro"))
													? "text-purple-300"
													: k.tier_type === "payg"
														? "text-amber-300"
														: "text-sky-300"
											}`}
										>
											{k.service_tier}
										</span>
									</div>
									<div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-[#0e1422] border border-slate-800 text-[10px]">
										<button
											type="button"
											onClick={() => handleUpdateTier(k.key_hash, "pro")}
											disabled={updatingTierHash === k.key_hash}
											title="Gemini Pro Plan: Priority 10,000 RPD, 1,000 RPM, flat subscription (no pay-as-you-go metered charges)"
											className={`py-1 px-1 rounded-md font-medium text-center transition cursor-pointer ${
												k.tier_type === "pro" ||
												(!k.tier_type && k.service_tier.includes("Pro"))
													? "bg-purple-600/30 text-purple-200 border border-purple-500/40 shadow-sm font-bold"
													: "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
											}`}
										>
											Pro Plan
										</button>
										<button
											type="button"
											onClick={() => handleUpdateTier(k.key_hash, "free")}
											disabled={updatingTierHash === k.key_hash}
											title="Google AI Studio Free Tier: 1,500 RPD, 15 RPM"
											className={`py-1 px-1 rounded-md font-medium text-center transition cursor-pointer ${
												k.tier_type === "free"
													? "bg-sky-600/30 text-sky-200 border border-sky-500/40 shadow-sm font-bold"
													: "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
											}`}
										>
											Free Tier
										</button>
										<button
											type="button"
											onClick={() => handleUpdateTier(k.key_hash, "payg")}
											disabled={updatingTierHash === k.key_hash}
											title="Google Cloud Pay-As-You-Go: Metered per-token billing"
											className={`py-1 px-1 rounded-md font-medium text-center transition cursor-pointer ${
												k.tier_type === "payg"
													? "bg-amber-600/30 text-amber-200 border border-amber-500/40 shadow-sm font-bold"
													: "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
											}`}
										>
											Pay-As-You-Go
										</button>
									</div>
								</div>

								{/* Quota Progress Bar */}
								<div
									title={`${remaining.toLocaleString()} requests remaining out of ${dailyLimit.toLocaleString()} daily limit (${pctRemaining}% available)`}
									className="space-y-1.5 bg-[#0e1422] p-3 rounded-lg border border-slate-800/80 cursor-help"
								>
									<div className="flex items-center justify-between text-xs">
										<span className="text-slate-300 font-medium text-[11px] flex items-center gap-1">
											<Gauge className="w-3.5 h-3.5 text-emerald-400" />
											<span>Daily Requests Remaining (RPD):</span>
										</span>
										<span className="font-mono text-[11px] font-bold text-emerald-300">
											{remaining.toLocaleString()} /{" "}
											{dailyLimit.toLocaleString()}
										</span>
									</div>

									{/* Visual progress bar */}
									<div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
										<div
											className={`h-full rounded-full transition-all duration-500 ${
												pctRemaining > 50
													? "bg-emerald-500"
													: pctRemaining > 20
														? "bg-amber-500"
														: "bg-rose-500"
											}`}
											style={{ width: `${pctRemaining}%` }}
										/>
									</div>

									<div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
										<span>Used today: {usedToday} API calls</span>
										<span>{pctRemaining}% quota available</span>
									</div>
								</div>

								{/* Per-Model Quotas & Usage Breakdown */}
								{k.model_quotas && k.model_quotas.length > 0 && (
									<div className="space-y-1.5 pt-0.5">
										<div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
											<span className="flex items-center gap-1">
												<Layers className="w-3.5 h-3.5 text-sky-400" />
												<span>Model Quota & Support:</span>
											</span>
											<span className="text-[10px] text-slate-500 font-mono">
												3.8 • Argon • 3.5 • Veo
											</span>
										</div>
										<div className="grid grid-cols-2 gap-1.5">
											{k.model_quotas.map((mq) => {
												const isExhausted = mq.status === "Quota Exhausted";
												const isProReq = mq.status === "Pro Plan Required";
												const isOperational = mq.status === "Operational";

												const statusColor = isOperational
													? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
													: isExhausted
														? "text-rose-400 bg-rose-500/10 border-rose-500/20"
														: isProReq
															? "text-purple-400 bg-purple-500/10 border-purple-500/20"
															: "text-slate-400 bg-slate-800/40 border-slate-700/40";

												const badgeLabel =
													mq.status === "Operational"
														? "Ready"
														: mq.status === "Quota Exhausted"
															? "Exhausted"
															: mq.status === "Pro Plan Required"
																? "Pro Only"
																: "Not Supported";

												return (
													<div
														key={mq.model_id}
														title={`${mq.display_name}\nStatus: ${mq.status}\nDaily Limit: ${mq.daily_limit}\nUsed Today: ${mq.used_today} calls\nRemaining: ${mq.remaining}\n${mq.status_note || ""}`}
														className={`p-2 rounded-lg bg-[#0e1422] border transition cursor-help flex flex-col justify-between text-[10px] space-y-1 ${
															isOperational
																? "border-emerald-500/20 hover:border-emerald-500/40"
																: isExhausted
																	? "border-rose-500/30 hover:border-rose-500/50"
																	: isProReq
																		? "border-purple-500/20 hover:border-purple-500/40"
																		: "border-slate-800/80 hover:border-slate-700/80"
														}`}
													>
														<div className="flex items-center justify-between gap-1">
															<span className="font-semibold text-slate-200 truncate text-[10.5px]">
																{mq.display_name}
															</span>
															<span
																className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${statusColor}`}
															>
																{badgeLabel}
															</span>
														</div>
														<div className="flex items-center justify-between text-slate-400 text-[10px]">
															<span>
																Used:{" "}
																<strong className="text-slate-100 font-mono">
																	{mq.used_today}
																</strong>
															</span>
															<span
																className={`font-mono text-[10px] font-semibold ${
																	isExhausted
																		? "text-rose-400"
																		: isOperational
																			? "text-emerald-400"
																			: isProReq
																				? "text-purple-400"
																				: "text-slate-400"
																}`}
															>
																{mq.remaining}
															</span>
														</div>
														<div className="flex items-center justify-between text-[9px] text-slate-500 pt-0.5">
															<span className="truncate">
																Limit: {mq.daily_limit}
															</span>
															{mq.supported && (
																<span className="text-[9px] text-emerald-400/80 font-medium font-mono">
																	Supported
																</span>
															)}
														</div>
													</div>
												);
											})}
										</div>
									</div>
								)}

								{/* Detailed Spec Grid */}
								<div className="grid grid-cols-2 gap-2 text-[11px]">
									<div
										title={`Requests per minute speed limit: ${k.rate_limit_rpm || 15} RPM`}
										className="rounded-lg bg-[#0e1422] p-2 border border-slate-800/80 cursor-help"
									>
										<div className="text-slate-400 text-[10px] flex items-center gap-1">
											<Zap className="w-3 h-3 text-sky-400" />
											<span>Speed Limit (RPM)</span>
										</div>
										<div className="font-semibold text-slate-200 mt-0.5">
											{k.rate_limit_rpm || 15} req / min
										</div>
									</div>

									<div
										title={`Tokens per minute rate limit: ${k.token_limit_tpm || "1,000,000 TPM"}`}
										className="rounded-lg bg-[#0e1422] p-2 border border-slate-800/80 cursor-help"
									>
										<div className="text-slate-400 text-[10px] flex items-center gap-1">
											<Activity className="w-3 h-3 text-sky-400" />
											<span>Token Rate (TPM)</span>
										</div>
										<div className="font-semibold text-slate-200 mt-0.5 truncate">
											{k.token_limit_tpm || "1,000,000 TPM"}
										</div>
									</div>
								</div>

								{/* Footer Latency & Verification */}
								<div
									title={`Health latency: ${k.latency_ms}ms, last verified: ${k.last_checked}`}
									className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px] text-slate-400 cursor-help"
								>
									<span>API Latency: {k.latency_ms} ms</span>
									<span>Verified: {k.last_checked}</span>
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
}
