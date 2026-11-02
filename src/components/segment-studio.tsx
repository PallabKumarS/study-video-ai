"use client";

import {
	Clock,
	Edit3,
	Film,
	Layers,
	MessageSquare,
	RefreshCw,
	Sparkles,
	Volume2,
	Wand2,
	XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/confirm-modal";
import { useGeneration } from "@/context/generation-context";
import type { SegmentRecord, VideoMetadata } from "@/engine/types";
import { CustomSelect, type SelectOption } from "./custom-select";

const STUDIO_MODEL_OPTIONS: SelectOption[] = [
	{
		value: "gemini-4-argon",
		label: "Gemini 4.0 Argon",
		badge: "Pro Flagship",
		badgeColor: "amber",
		subtitle: "Top-tier zero-misinformation reasoning & physics accuracy",
	},
	{
		value: "gemini-3.8-flash",
		label: "Gemini 3.8 Flash",
		badge: "Pro High Speed",
		badgeColor: "sky",
		subtitle: "Next-gen multimodal speed with high science fidelity",
	},
	{
		value: "gemini-3.7-flash",
		label: "Gemini 3.7 Flash",
		badge: "Pro Thinking",
		badgeColor: "purple",
		subtitle: "Adaptive thinking for coordinate and diagram verification",
	},
	{
		value: "gemini-3.1-pro-preview",
		label: "Gemini 3.1 Pro",
		badge: "Pro Accuracy",
		badgeColor: "amber",
		subtitle: "Deep optical ray angles and mathematical proofs",
	},
	{
		value: "gemini-2.5-pro",
		label: "Gemini 2.5 Pro",
		badge: "Pro Academic",
		badgeColor: "purple",
		subtitle: "Complete academic curriculum & multi-step derivations",
	},
	{
		value: "gemini-3.6-flash",
		label: "Gemini 3.6 Flash",
		badge: "Pro Science",
		badgeColor: "purple",
		subtitle: "Scientific reasoning for physics and engineering",
	},
	{
		value: "gemini-3.5-flash-lite",
		label: "Gemini 3.5 Flash Lite",
		badge: "Free Tier",
		badgeColor: "emerald",
		subtitle: "Fast free tier engine for rapid generation",
	},
	{
		value: "gemini-3-flash-preview",
		label: "Gemini 3 Flash Preview",
		badge: "Free Phrasing",
		badgeColor: "sky",
		subtitle: "Natural phrasing and structured diagram planning",
	},
	{
		value: "gemini-2.5-flash",
		label: "Gemini 2.5 Flash",
		badge: "Standard",
		badgeColor: "slate",
		subtitle: "Production workhorse with solid consistency",
	},
	{
		value: "veo-3.1-generate-preview",
		label: "Veo 3.1 Pro Cinema",
		badge: "Veo Cinema Video",
		badgeColor: "sky",
		subtitle: "Google Veo 4K/1080p generative video rendering",
	},
	{
		value: "veo-3.1-fast-generate-preview",
		label: "Veo 3.1 Fast Video",
		badge: "Veo Fast Video",
		badgeColor: "sky",
		subtitle: "Rapid generative video background motion synthesis",
	},
	{
		value: "veo-2.0-generate-001",
		label: "Veo 2.0 Standard",
		badge: "Veo 2.0 Video",
		badgeColor: "slate",
		subtitle: "Stable production video generation",
	},
];

const STUDIO_VOICE_OPTIONS: SelectOption[] = [
	{
		value: "gemini-kore",
		label: "Gemini Kore (AI Academic)",
		badge: "Default Voice",
		badgeColor: "purple",
		subtitle: "Formal academic Google Gemini AI narration voice",
	},
	{
		value: "gemini-puck",
		label: "Gemini Puck (AI Dynamic)",
		badge: "AI Speech",
		badgeColor: "sky",
		subtitle: "Energetic Google Gemini AI studio narration voice",
	},
	{
		value: "gemini-charon",
		label: "Gemini Charon (AI Deep)",
		badge: "AI Authoritative",
		badgeColor: "amber",
		subtitle: "Deep authoritative Google Gemini AI studio voice",
	},
	{
		value: "bn-pradeep",
		label: "Pradeep (Bengali Male)",
		badge: "Bengali Natural",
		badgeColor: "emerald",
		subtitle: "Natural fluent lecturer tone with clear pronunciation",
	},
	{
		value: "bn-nabanita",
		label: "Nabanita (Bengali Female)",
		badge: "Bengali Clear",
		badgeColor: "emerald",
		subtitle: "Warm, crystal-clear explainer tone",
	},
	{
		value: "en-christopher",
		label: "Christopher (English Male)",
		badge: "English Lecturer",
		badgeColor: "sky",
		subtitle: "Professional educational male presenter",
	},
	{
		value: "en-jenny",
		label: "Jenny (English Female)",
		badge: "English Explainer",
		badgeColor: "emerald",
		subtitle: "Crisp, welcoming female teacher explainer",
	},
];

const STUDIO_DURATION_OPTIONS: SelectOption[] = [
	{
		value: "auto",
		label: "Keep Current Duration",
		badge: "Auto",
		badgeColor: "sky",
		subtitle: "Preserves existing duration and segment pacing",
	},
	{
		value: "30",
		label: "30 Seconds",
		badge: "2 Segments",
		badgeColor: "slate",
		subtitle: "Concise summary for rapid review",
	},
	{
		value: "60",
		label: "60 Seconds",
		badge: "3-4 Segments",
		badgeColor: "sky",
		subtitle: "Standard educational explanation",
	},
	{
		value: "90",
		label: "90 Seconds",
		badge: "4-5 Segments",
		badgeColor: "purple",
		subtitle: "Expanded depth for complex topics & formulas",
	},
	{
		value: "120",
		label: "120 Seconds",
		badge: "5-6 Segments",
		badgeColor: "amber",
		subtitle: "Full comprehensive masterclass lesson",
	},
];

interface SegmentStudioProps {
	currentVideo: VideoMetadata | null;
	onVideoUpdated: (updated: VideoMetadata) => void;
}

export function SegmentStudio({
	currentVideo,
	onVideoUpdated,
}: SegmentStudioProps) {
	// Master whole-video state
	const [masterComment, setMasterComment] = useState("");
	const [masterModel, setMasterModel] = useState("gemini-3.8-flash");
	const [masterVoice, setMasterVoice] = useState(
		currentVideo?.voice_used || "gemini-kore",
	);
	const [masterDuration, setMasterDuration] = useState("auto");
	const [showCancelModal, setShowCancelModal] = useState(false);
	const [isCanceling, setIsCanceling] = useState(false);
	const { activeJob, isGenerating, startGeneration, cancelGeneration } =
		useGeneration();

	useEffect(() => {
		if (activeJob?.status === "completed" && activeJob.result) {
			onVideoUpdated(activeJob.result);
			setMasterComment("");
		}
	}, [activeJob?.status, activeJob?.result, onVideoUpdated]);

	// Individual segment states
	const [openEditors, setOpenEditors] = useState<Record<number, boolean>>({});
	const [comments, setComments] = useState<Record<number, string>>({});
	const [titles, setTitles] = useState<Record<number, string>>({});
	const [narrations, setNarrations] = useState<Record<number, string>>({});
	const [models, setModels] = useState<Record<number, string>>({});
	const [loadingMap, setLoadingMap] = useState<Record<number, boolean>>({});

	if (!currentVideo?.segments?.length) {
		return (
			<div className="glass-panel rounded-2xl p-6 shadow-xl space-y-3">
				<h3 className="text-sm font-semibold text-white flex items-center gap-2">
					<Layers className="w-4 h-4 text-sky-400" />
					<span>Segment Studio & Video Refinement</span>
				</h3>
				<p className="text-xs text-slate-500 py-2">
					Generate or select a video to inspect, add whole-video director
					revisions, or regenerate individual segments.
				</p>
			</div>
		);
	}

	const toggleEditor = (idx: number, seg: SegmentRecord) => {
		setOpenEditors((prev) => {
			const nextState = !prev[idx];
			if (nextState) {
				if (!titles[idx]) setTitles((t) => ({ ...t, [idx]: seg.title }));
				if (!narrations[idx])
					setNarrations((n) => ({ ...n, [idx]: seg.narration }));
				if (!models[idx])
					setModels((m) => ({ ...m, [idx]: "gemini-3.8-flash" }));
			}
			return { ...prev, [idx]: nextState };
		});
	};

	const handleRegenerateWholeVideo = async () => {
		if (!masterComment.trim()) {
			toast.error(
				"Please enter a revision instruction or feedback for the video.",
			);
			return;
		}

		try {
			const targetDurationValue =
				masterDuration === "auto"
					? Math.round(currentVideo.total_duration || 60)
					: parseInt(masterDuration, 10);

			const resp = await fetch("/api/video/regenerate", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					job_id: currentVideo.job_id,
					user_comment: masterComment.trim(),
					model: masterModel,
					voice_engine: masterVoice,
					target_duration: targetDurationValue,
				}),
			});

			const data = await resp.json();
			if (!resp.ok) {
				throw new Error(
					data.error || "Failed to start master video regeneration",
				);
			}

			startGeneration(data.job_id, `Revision: ${currentVideo.topic}`);
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : String(err);
			toast.error(`Master regeneration failed: ${msg}`);
		}
	};

	const handleRegenerateSegment = async (segIndex: number) => {
		setLoadingMap((prev) => ({ ...prev, [segIndex]: true }));
		const comment = comments[segIndex]?.trim();
		const customTitle = titles[segIndex]?.trim();
		const customNarr = narrations[segIndex]?.trim();
		const model = models[segIndex] || "gemini-3.8-flash";

		try {
			const resp = await fetch("/api/segments/regenerate", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					job_id: currentVideo.job_id,
					segment_index: segIndex,
					user_comment: comment || undefined,
					custom_title: customTitle || undefined,
					custom_narration: customNarr || undefined,
					model,
					voice_engine: masterVoice,
				}),
			});

			const data = await resp.json();
			if (!resp.ok) {
				throw new Error(data.error || "Failed to regenerate segment");
			}

			toast.success(
				`Segment ${segIndex} regenerated & re-stitched successfully!`,
			);
			onVideoUpdated(data.metadata);
			setOpenEditors((prev) => ({ ...prev, [segIndex]: false }));
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : String(err);
			toast.error(`Segment regeneration failed: ${msg}`);
		} finally {
			setLoadingMap((prev) => ({ ...prev, [segIndex]: false }));
		}
	};

	return (
		<div className="glass-panel rounded-2xl p-6 shadow-xl space-y-6">
			{/* Top Header */}
			<div className="flex items-center justify-between border-b border-slate-800 pb-3">
				<div>
					<h3 className="text-sm font-semibold text-white flex items-center gap-2">
						<Layers className="w-4 h-4 text-sky-400" />
						<span>Director Studio & Video Refinement</span>
					</h3>
					<p className="text-xs text-slate-400 mt-0.5">
						Regenerate the entire video with iterative director revisions or
						fine-tune individual segments
					</p>
				</div>
				<span
					title={`Current active video job identifier: ${currentVideo.job_id}`}
					className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#161d2d] border border-slate-800 text-slate-400 cursor-help"
				>
					Job: {currentVideo.job_id}
				</span>
			</div>

			{/* Section 1: Whole-Video Master Edit & Regeneration */}
			<div className="bg-[#121927]/90 rounded-xl p-4 border border-sky-500/30 space-y-3.5 shadow-md">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<span className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/40 flex items-center justify-center">
							<Sparkles className="w-3.5 h-3.5" />
						</span>
						<h4 className="text-xs font-semibold text-sky-200">
							Master Video Edit & Full Regeneration
						</h4>
					</div>
					<span className="text-[10px] font-semibold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-full">
						All Segments
					</span>
				</div>

				<div className="space-y-1">
					<label className="text-[11px] font-medium text-slate-300 flex items-center gap-1.5">
						<MessageSquare className="w-3 h-3 text-sky-400" />
						<span>Whole Video Feedback / Revision Prompt</span>
					</label>
					<textarea
						rows={2}
						value={masterComment}
						onChange={(e) => setMasterComment(e.target.value)}
						placeholder="e.g. Ensure all segments have clear Bengali narration voice, verify optical rays diverge in concave lens, and deepen explanation..."
						className="w-full rounded-lg bg-[#090c13] border border-slate-800 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition resize-none"
					/>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
					<div className="space-y-1">
						<label className="text-[11px] text-slate-400 flex items-center gap-1">
							<Film className="w-3 h-3 text-sky-400" />
							<span>Model Engine</span>
						</label>
						<CustomSelect
							value={masterModel}
							onChange={setMasterModel}
							options={STUDIO_MODEL_OPTIONS}
						/>
					</div>

					<div className="space-y-1">
						<label className="text-[11px] text-slate-400 flex items-center gap-1">
							<Volume2 className="w-3 h-3 text-emerald-400" />
							<span>Voice Engine</span>
						</label>
						<CustomSelect
							value={masterVoice}
							onChange={setMasterVoice}
							options={STUDIO_VOICE_OPTIONS}
						/>
					</div>

					<div className="space-y-1">
						<label className="text-[11px] text-slate-400 flex items-center gap-1">
							<Clock className="w-3 h-3 text-purple-400" />
							<span>Target Duration</span>
						</label>
						<CustomSelect
							value={masterDuration}
							onChange={setMasterDuration}
							options={STUDIO_DURATION_OPTIONS}
						/>
					</div>
				</div>

				{isGenerating && activeJob && (
					<div className="rounded-xl p-3 bg-[#090c13] border border-sky-500/30 space-y-2">
						<div className="flex items-center justify-between text-xs">
							<span className="font-semibold text-sky-400 capitalize flex items-center gap-1.5">
								<span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
								<span>{activeJob.status}</span>
							</span>
							<span className="text-slate-300 font-mono text-[11px]">
								{activeJob.progress}%
							</span>
						</div>
						<div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
							<div
								className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full transition-all duration-300"
								style={{ width: `${activeJob.progress}%` }}
							/>
						</div>
						<p
							className="text-[11px] text-slate-400 truncate cursor-help"
							title={activeJob.message}
						>
							{activeJob.message}
						</p>
					</div>
				)}

				<div className="flex items-center gap-2">
					<button
						type="button"
						disabled={isGenerating}
						onClick={handleRegenerateWholeVideo}
						title="Synthesizes a brand new video using your revision instructions and previous prompt, planning new segments as needed"
						className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-xs shadow-md shadow-sky-500/20 flex items-center justify-center space-x-2 transition cursor-pointer disabled:opacity-50"
					>
						{isGenerating ? (
							<>
								<RefreshCw className="w-3.5 h-3.5 animate-spin" />
								<span>Synthesizing New Video & Segments...</span>
							</>
						) : (
							<>
								<Wand2 className="w-3.5 h-3.5" />
								<span>Generate New Video with Revision Prompt</span>
							</>
						)}
					</button>

					{isGenerating && (
						<button
							type="button"
							onClick={() => setShowCancelModal(true)}
							title="Cancel current generation"
							className="py-2.5 px-3 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
						>
							<XCircle className="w-3.5 h-3.5" />
							<span>Cancel</span>
						</button>
					)}
				</div>
			</div>

			{/* Section 2: Individual Segment Fine-Tuning */}
			<div className="space-y-3">
				<div className="flex items-center justify-between">
					<h4 className="text-xs font-semibold text-slate-300">
						Individual Segment Fine-Tuning
					</h4>
					<span className="text-[10px] text-slate-500">
						{currentVideo.segments.length} Segments
					</span>
				</div>

				{currentVideo.segments.map((seg) => {
					const idx = seg.segment_index;
					const isOpen = openEditors[idx];
					const isLoading = loadingMap[idx];

					return (
						<div
							key={idx}
							className="bg-[#161d2d]/90 rounded-xl p-3.5 border border-slate-800 space-y-3 transition"
						>
							<div className="flex items-center justify-between pb-2 border-b border-slate-800">
								<div className="flex items-center gap-2">
									<span className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/30 font-bold text-xs flex items-center justify-center">
										{idx}
									</span>
									<div>
										<h4
											title={seg.tag || `Segment ${idx}`}
											className="text-xs font-semibold text-slate-100 truncate cursor-help"
										>
											{seg.tag || `Segment ${idx}`}
										</h4>
										<div className="flex items-center gap-1.5 mt-0.5">
											<span
												title={`Segment audio duration: ${seg.duration}s`}
												className="text-[10px] text-slate-400 cursor-help"
											>
												{seg.duration}s
											</span>
											<span className="text-slate-600 text-[10px]">•</span>
											<span
												title={
													seg.visual_prompt ||
													(seg.dimension === "3d"
														? "3D Spatial AI Scene"
														: "2D Vector Diagram")
												}
												className={`text-[9px] px-1.5 py-0.2 rounded font-semibold border cursor-help ${
													seg.dimension === "3d"
														? "bg-purple-500/15 text-purple-300 border-purple-500/30"
														: "bg-sky-500/15 text-sky-300 border-sky-500/30"
												}`}
											>
												{seg.dimension === "3d" ? "3D Scene" : "2D Vector"}
											</span>
										</div>
									</div>
								</div>
								<button
									type="button"
									onClick={() => toggleEditor(idx, seg)}
									className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 font-medium transition px-2 py-1 rounded bg-sky-500/10 hover:bg-sky-500/20 cursor-pointer"
								>
									<Edit3 className="w-3.5 h-3.5" />
									<span>{isOpen ? "Close Editor" : "Edit / Comment"}</span>
								</button>
							</div>

							<div className="text-xs space-y-1">
								<div
									title={seg.title}
									className="text-slate-300 font-medium truncate cursor-help"
								>
									{seg.title}
								</div>
								<p
									title={`Full Narration Script:\n${seg.narration}`}
									className="text-slate-400 text-[11px] line-clamp-2 italic cursor-help"
								>
									"{seg.narration}"
								</p>
								{seg.bottom_caption && (
									<span
										title={`Bottom Screen Banner:\n${seg.bottom_caption}`}
										className="text-[10px] text-sky-400 block truncate cursor-help"
									>
										Caption: {seg.bottom_caption}
									</span>
								)}
							</div>

							{isOpen && (
								<div className="pt-2 border-t border-slate-800/80 space-y-2.5">
									<div className="space-y-1">
										<label className="text-[11px] font-semibold text-sky-300 flex items-center gap-1">
											<MessageSquare className="w-3 h-3" />
											<span>Director Feedback / Comment</span>
										</label>
										<textarea
											rows={2}
											value={comments[idx] || ""}
											onChange={(e) =>
												setComments((prev) => ({
													...prev,
													[idx]: e.target.value,
												}))
											}
											placeholder="e.g. Change to Concave lens with diverging rays and clear Bengali narration..."
											className="w-full rounded-lg bg-[#090c13] border border-slate-800 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition resize-none"
										/>
									</div>

									<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
										<div className="space-y-1">
											<label className="text-[11px] text-slate-400">
												Segment Title
											</label>
											<input
												type="text"
												value={titles[idx] || ""}
												onChange={(e) =>
													setTitles((prev) => ({
														...prev,
														[idx]: e.target.value,
													}))
												}
												className="w-full rounded-lg bg-[#090c13] border border-slate-800 px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 transition"
											/>
										</div>
										<div className="space-y-1">
											<label className="text-[11px] text-slate-400">
												Model Engine
											</label>
											<CustomSelect
												value={models[idx] || "gemini-3.8-flash"}
												onChange={(val) =>
													setModels((prev) => ({
														...prev,
														[idx]: val,
													}))
												}
												options={STUDIO_MODEL_OPTIONS}
											/>
										</div>
									</div>

									<div className="space-y-1">
										<label className="text-[11px] text-slate-400">
											Voice Narration Script
										</label>
										<textarea
											rows={2}
											value={narrations[idx] || ""}
											onChange={(e) =>
												setNarrations((prev) => ({
													...prev,
													[idx]: e.target.value,
												}))
											}
											className="w-full rounded-lg bg-[#090c13] border border-slate-800 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 transition resize-none"
										/>
									</div>

									<div className="flex justify-end pt-1">
										<button
											type="button"
											disabled={isLoading}
											onClick={() => handleRegenerateSegment(idx)}
											className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
										>
											{isLoading ? (
												<>
													<RefreshCw className="w-3.5 h-3.5 animate-spin" />
													<span>Regenerating Segment...</span>
												</>
											) : (
												<>
													<RefreshCw className="w-3.5 h-3.5" />
													<span>Regenerate Segment {idx}</span>
												</>
											)}
										</button>
									</div>
								</div>
							)}
						</div>
					);
				})}
			</div>

			<ConfirmModal
				isOpen={showCancelModal}
				onClose={() => setShowCancelModal(false)}
				onConfirm={async () => {
					setIsCanceling(true);
					try {
						await cancelGeneration();
						setLoadingMap({});
						toast.info("Regeneration canceled");
						setShowCancelModal(false);
					} catch {
						toast.error("Failed to cancel regeneration");
					} finally {
						setIsCanceling(false);
					}
				}}
				title="Cancel Video Generation?"
				description="Are you sure you want to stop this revision? Any ongoing rendering or audio generation will be halted."
				confirmText="Yes, Cancel Generation"
				cancelText="Keep Generating"
				variant="danger"
				isLoading={isCanceling}
			/>
		</div>
	);
}
