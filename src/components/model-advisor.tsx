"use client";

import { Cpu } from "lucide-react";
import type { ModelAdvisorProfile } from "@/engine/types";

interface ModelAdvisorProps {
	selectedModel: string;
	advisorList: ModelAdvisorProfile[];
	onSelectModel?: (modelId: string) => void;
}

export function ModelAdvisor({
	selectedModel,
	advisorList,
	onSelectModel,
}: ModelAdvisorProps) {
	const profile = advisorList.find((m) => m.id === selectedModel) ||
		advisorList[0] || {
			id: selectedModel,
			name: selectedModel,
			speed: "~1.5s",
			token_economy: "4.5/5",
			accuracy_rating: "4.5/5",
			tier: "Standard",
			badge: "Active",
			description: "Standard model configuration for multi-segment generation.",
		};

	const isPro =
		profile.tier.toLowerCase().includes("pro") ||
		profile.tier.toLowerCase().includes("standard");

	return (
		<div className="bg-[#141b2a] rounded-xl p-3.5 border border-slate-800 text-xs space-y-3">
			<div className="flex items-center justify-between">
				<span
					className="font-bold text-slate-100 flex items-center gap-1.5 cursor-help"
					title={`${profile.name} (${profile.tier}) — ${profile.tag}`}
				>
					<Cpu className="w-4 h-4 text-sky-400" />
					<span className="truncate">{profile.name}</span>
				</span>
				<div className="flex items-center gap-1.5 shrink-0">
					<span
						title={`${profile.badge}: ${profile.tier}`}
						className={`px-2 py-0.5 rounded text-[10px] font-bold border cursor-help ${
							isPro
								? "bg-amber-500/10 text-amber-300 border-amber-500/20"
								: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
						}`}
					>
						{profile.badge}
					</span>
					<span
						title={profile.tier}
						className="text-[10px] text-slate-400 hidden sm:inline"
					>
						{profile.tier}
					</span>
				</div>
			</div>

			<div className="grid grid-cols-3 gap-2 text-[11px]">
				<div
					title={`Average Generation Latency: ${profile.speed}`}
					className="bg-[#090c13]/80 p-2 rounded-lg border border-slate-800/80 cursor-help"
				>
					<span className="text-slate-500 block text-[9px] uppercase tracking-wider font-semibold">
						Speed
					</span>
					<span className="text-sky-300 font-semibold truncate block">
						{profile.speed}
					</span>
				</div>
				<div
					title={`Token Consumption Economy: ${profile.token_economy}`}
					className="bg-[#090c13]/80 p-2 rounded-lg border border-slate-800/80 cursor-help"
				>
					<span className="text-slate-500 block text-[9px] uppercase tracking-wider font-semibold">
						Token Economy
					</span>
					<span className="text-emerald-300 font-semibold truncate block">
						{profile.token_economy}
					</span>
				</div>
				<div
					title={`Scientific Reasoning & Diagram Accuracy: ${profile.accuracy_rating}`}
					className="bg-[#090c13]/80 p-2 rounded-lg border border-slate-800/80 cursor-help"
				>
					<span className="text-slate-500 block text-[9px] uppercase tracking-wider font-semibold">
						Accuracy
					</span>
					<span className="text-amber-300 font-semibold truncate block">
						{profile.accuracy_rating}
					</span>
				</div>
			</div>

			<p
				title={profile.description}
				className="text-[11px] text-slate-300 leading-relaxed cursor-help"
			>
				{profile.description}
			</p>

			{/* Quick Model Selector Pills */}
			{onSelectModel && advisorList.length > 0 && (
				<div className="pt-2 border-t border-slate-800/80 space-y-1.5">
					<span className="text-[10px] text-slate-400 font-medium block">
						Quick Switch (Free & Pro Tiers):
					</span>
					<div className="flex flex-wrap gap-1.5">
						{advisorList.map((m) => {
							const isSelected = m.id === selectedModel;
							const isFree = m.tier.toLowerCase().includes("free");
							const pillTooltip = `${m.name} (${m.tier})\nSpeed: ${m.speed} | Accuracy: ${m.accuracy_rating}\n\n${m.description}`;
							return (
								<button
									key={m.id}
									type="button"
									onClick={() => onSelectModel(m.id)}
									title={pillTooltip}
									className={`text-[10px] px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1 transition cursor-pointer ${
										isSelected
											? "border-sky-500 bg-sky-500/20 text-sky-200"
											: "border-slate-800 bg-[#0c1220] text-slate-400 hover:text-slate-200 hover:border-slate-700"
									}`}
								>
									<span className="truncate max-w-[120px] sm:max-w-none">
										{m.name.replace("Gemini ", "")}
									</span>
									<span
										className={`text-[8px] px-1 rounded shrink-0 ${
											isFree
												? "bg-emerald-500/20 text-emerald-300"
												: "bg-amber-500/20 text-amber-300"
										}`}
									>
										{isFree ? "Free" : "Pro"}
									</span>
								</button>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
}
