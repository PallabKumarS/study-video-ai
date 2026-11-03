"use client";

import {
	Heading,
	Languages,
	PlusCircle,
	Sparkles,
	Volume2,
	Wand2,
	XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/confirm-modal";
import { useGeneration } from "@/context/generation-context";
import type { ModelAdvisorProfile, VideoMetadata } from "@/engine/types";
import { CustomSelect, type SelectOption } from "./custom-select";
import { ModelAdvisor } from "./model-advisor";

interface GeneratorFormProps {
	advisorList: ModelAdvisorProfile[];
	themes: { id: string; name: string }[];
	initialTitle?: string;
	initialPrompt?: string;
	initialModel?: string;
	onVideoCreated: (video: VideoMetadata) => void;
}

function formatRemainingTime(sec?: number): string {
	if (sec === undefined || sec === null) return "";
	if (sec <= 0) return "finishing up";
	if (sec < 60) return `~${sec}s left`;
	const mins = Math.floor(sec / 60);
	const rem = sec % 60;
	return `~${mins}m ${rem}s left`;
}

const MODEL_OPTIONS: SelectOption[] = [
	{
		value: "gemini-3.8-flash",
		label: "Gemini 3.8 Flash (Recommended)",
		badge: "Pro / Free (20 RPD)",
		badgeColor: "sky",
		subtitle:
			"Latest high-reasoning engine with fast speed & accuracy (auto-fallback to 3.5-lite if 20 RPD free limit is reached)",
	},
	{
		value: "gemini-4-argon",
		label: "Gemini 4.0 Argon",
		badge: "Pro Plan Flagship",
		badgeColor: "amber",
		subtitle:
			"Flagship Gemini 4 engine with absolute STEM accuracy & mathematical ray precision",
	},
	{
		value: "gemini-3.5-flash-lite",
		label: "Gemini 3.5 Flash Lite",
		badge: "Free Tier (1500 RPD)",
		badgeColor: "emerald",
		subtitle:
			"Ultra-fast (~1.2s), generous daily free quota, lowest token cost",
	},
	{
		value: "gemini-3-flash-preview",
		label: "Gemini 3 Flash Preview",
		badge: "Free Tier (High Phrasing)",
		badgeColor: "sky",
		subtitle:
			"Superior natural Bengali phrasing & structured diagram planning on free tier",
	},
	{
		value: "gemini-3.7-flash",
		label: "Gemini 3.7 Flash",
		badge: "Pro Standard",
		badgeColor: "purple",
		subtitle:
			"Adaptive reasoning verifying formula coordinates and optics geometry",
	},
	{
		value: "gemini-3.1-pro-preview",
		label: "Gemini 3.1 Pro Preview",
		badge: "Pro STEM Expert",
		badgeColor: "amber",
		subtitle:
			"Highest scientific & mathematical accuracy for STEM, optics, physics",
	},
	{
		value: "gemini-2.5-pro",
		label: "Gemini 2.5 Pro",
		badge: "Pro Academic Workhorse",
		badgeColor: "purple",
		subtitle:
			"Deep multi-step reasoning & complete academic curriculum coverage",
	},
	{
		value: "gemini-3.6-flash",
		label: "Gemini 3.6 Flash",
		badge: "Pro Science Edition",
		badgeColor: "purple",
		subtitle: "DeepMind advanced science reasoning for physics and engineering",
	},
	{
		value: "gemini-2.5-flash",
		label: "Gemini 2.5 Flash",
		badge: "Standard Production",
		badgeColor: "slate",
		subtitle: "Fast, rock-solid production workhorse with high consistency",
	},
	{
		value: "veo-3.1-generate-preview",
		label: "Veo 3.1 Pro Cinema",
		badge: "Veo Cinema Video",
		badgeColor: "sky",
		subtitle:
			"High-definition cinematic generative video for realistic study backdrops",
	},
	{
		value: "veo-3.1-fast-generate-preview",
		label: "Veo 3.1 Fast Video",
		badge: "Veo Fast Engine",
		badgeColor: "sky",
		subtitle:
			"Rapid generative video synthesis for motion scenes and dynamic b-roll",
	},
	{
		value: "veo-2.0-generate-001",
		label: "Veo 2.0 Standard",
		badge: "Veo 2.0 Video",
		badgeColor: "slate",
		subtitle:
			"Stable production video generation creating continuous scene motion",
	},
];

const RESOLUTION_OPTIONS: SelectOption[] = [
	{
		value: "1080p",
		label: "1080p (Full HD)",
		badge: "Standard",
		badgeColor: "sky",
	},
	{
		value: "720p",
		label: "720p (HD Fast)",
		badge: "Fast Render",
		badgeColor: "emerald",
	},
	{
		value: "1440p",
		label: "1440p (2K QHD)",
		badge: "High Res",
		badgeColor: "purple",
	},
	{
		value: "4k",
		label: "4K (UHD Cinema)",
		badge: "Max Clarity",
		badgeColor: "amber",
	},
];

const VOICE_OPTIONS: SelectOption[] = [
	{
		value: "gemini-kore",
		label: "Gemini Kore (AI Academic)",
		badge: "Default Voice",
		badgeColor: "purple",
		subtitle: "Formal, academic Google Gemini AI narration voice",
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
		subtitle: "Deep, authoritative Google Gemini AI studio voice",
	},
	{
		value: "bn-pradeep",
		label: "Pradeep (Bengali Male)",
		badge: "Bengali Male",
		badgeColor: "emerald",
		subtitle:
			"Natural, fluent Bengali male lecturer tone with clear pronunciation",
	},
	{
		value: "bn-nabanita",
		label: "Nabanita (Bengali Female)",
		badge: "Bengali Female",
		badgeColor: "emerald",
		subtitle: "Warm, crystal-clear Bengali female explainer tone",
	},
	{
		value: "en-christopher",
		label: "Christopher (English Male)",
		badge: "English Lecturer",
		badgeColor: "sky",
		subtitle: "Professional British/US educational male presenter",
	},
	{
		value: "en-jenny",
		label: "Jenny (English Female)",
		badge: "English Explainer",
		badgeColor: "emerald",
		subtitle: "Crisp, welcoming female teacher explainer",
	},
];

export function GeneratorForm({
	advisorList,
	themes,
	initialTitle,
	initialPrompt,
	initialModel,
	onVideoCreated,
}: GeneratorFormProps) {
	const [language, setLanguage] = useState<"bn" | "en">("bn");
	const [title, setTitle] = useState(initialTitle || "");
	const [prompt, setPrompt] = useState(initialPrompt || "");
	const [model, setModel] = useState(initialModel || "gemini-3.8-flash");
	const [resolution, setResolution] = useState("1080p");
	const [aspectRatio, setAspectRatio] = useState("9:16");
	const duration = "60";
	const [voice, setVoice] = useState("gemini-kore");
	const [theme, setTheme] = useState("deep_slate_academic");

	const [generatingTitle, setGeneratingTitle] = useState(false);
	const [showCancelModal, setShowCancelModal] = useState(false);
	const [isCanceling, setIsCanceling] = useState(false);
	const [currentJobId, setCurrentJobId] = useState<string | null>(null);
	const { jobs, startGeneration, cancelJob } = useGeneration();

	const currentJob = jobs.find((j) => j.jobId === currentJobId);
	const isCurrentJobActive = Boolean(
		currentJob &&
			currentJob.status !== "completed" &&
			currentJob.status !== "failed",
	);

	useEffect(() => {
		try {
			const savedTitle = localStorage.getItem("studio_last_title");
			const savedPrompt = localStorage.getItem("studio_last_prompt");
			const savedModel = localStorage.getItem("studio_last_model");
			if (savedTitle) {
				setTitle(savedTitle);
			} else if (initialTitle) {
				setTitle(initialTitle);
			}

			if (savedPrompt) {
				setPrompt(savedPrompt);
			} else if (initialPrompt) {
				setPrompt(initialPrompt);
			}

			if (savedModel) {
				setModel(savedModel);
			}
		} catch {}
	}, [initialTitle, initialPrompt]);

	useEffect(() => {
		if (currentJob?.status === "completed" && currentJob.result) {
			onVideoCreated(currentJob.result);
		}
	}, [currentJob?.status, currentJob?.result, onVideoCreated]);

	const handleTitleChange = (val: string) => {
		setTitle(val);
		try {
			localStorage.setItem("studio_last_title", val);
		} catch {}
	};

	const handlePromptChange = (val: string) => {
		setPrompt(val);
		try {
			localStorage.setItem("studio_last_prompt", val);
		} catch {}
	};

	const handleModelChange = (val: string) => {
		setModel(val);
		try {
			localStorage.setItem("studio_last_model", val);
		} catch {}
	};

	const handleGenerateTitle = async () => {
		if (!prompt.trim()) {
			toast.error("Please enter a detailed prompt first.");
			return;
		}
		setGeneratingTitle(true);
		try {
			// Hardcode the ultra-fast free tier model for title generation
			const resp = await fetch("/api/generate-title", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					prompt,
					language,
					model: "gemini-3.5-flash-lite",
				}),
			});
			const data = await resp.json();
			if (data.title) {
				handleTitleChange(data.title);
				toast.success("AI Title Generated!");
			}
		} catch {
			toast.error("Failed to generate title.");
		} finally {
			setGeneratingTitle(false);
		}
	};

	const handleGenerate = async () => {
		if (!prompt.trim()) {
			toast.error("Prompt cannot be empty.");
			return;
		}

		try {
			const videoTitle = title.trim() || prompt.slice(0, 60);
			try {
				localStorage.setItem("studio_last_title", videoTitle);
				localStorage.setItem("studio_last_prompt", prompt);
				localStorage.setItem("studio_last_model", model);
			} catch {}

			const resp = await fetch("/api/generate", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					prompt,
					title: title.trim() || undefined,
					language,
					target_duration: parseInt(duration, 10),
					resolution,
					aspect_ratio: aspectRatio,
					model,
					voice_engine: voice,
					theme,
				}),
			});

			const data = await resp.json();
			if (!resp.ok) throw new Error(data.error || "Generation error");

			startGeneration(data.job_id, videoTitle);
			setCurrentJobId(data.job_id);
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : String(err);
			toast.error(msg);
		}
	};

	const handleCreateAnother = () => {
		setPrompt("");
		setTitle("");
		setCurrentJobId(null);
		toast.success(
			"Ready for your next video! Previous creation is running in the background stack.",
		);
	};

	return (
		<div className="glass-panel rounded-2xl p-6 shadow-xl space-y-5">
			<div className="flex items-center justify-between border-b border-slate-800 pb-3">
				<h2 className="text-base font-semibold text-white flex items-center gap-2">
					<Sparkles className="w-4 h-4 text-sky-400" />
					<span>Create Study Video</span>
				</h2>
			</div>
			{/* Language Toggle */}
			<div className="space-y-2">
				<label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
					<Languages className="w-3.5 h-3.5 text-sky-400" />
					<span>Video Language</span>
				</label>
				<div className="grid grid-cols-2 gap-2.5">
					<button
						type="button"
						onClick={() => setLanguage("bn")}
						className={`h-10 px-4 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
							language === "bn"
								? "border-emerald-500 bg-emerald-500/15 text-emerald-300 shadow-sm shadow-emerald-950/40"
								: "border-slate-800 bg-[#141b2a] text-slate-400 hover:text-slate-200 hover:border-slate-700"
						}`}
					>
						<span className="w-4 h-3 rounded-[2px] overflow-hidden flex items-center justify-center bg-[#006a4e] relative shrink-0">
							<span className="w-1.5 h-1.5 rounded-full bg-[#f42a41]" />
						</span>
						<span>Bengali</span>
					</button>
					<button
						type="button"
						onClick={() => setLanguage("en")}
						className={`h-10 px-4 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
							language === "en"
								? "border-sky-500 bg-sky-500/15 text-sky-300 shadow-sm shadow-sky-950/40"
								: "border-slate-800 bg-[#141b2a] text-slate-400 hover:text-slate-200 hover:border-slate-700"
						}`}
					>
						<span>English</span>
					</button>
				</div>
			</div>
			{/* Video Title */}
			<div className="space-y-1.5">
				<div className="flex items-center justify-between">
					<label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
						<Heading className="w-3.5 h-3.5 text-sky-400" />
						<span>Video Title</span>
					</label>
					<button
						type="button"
						onClick={handleGenerateTitle}
						disabled={generatingTitle}
						className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 font-semibold transition px-2 py-0.5 rounded bg-sky-500/10 hover:bg-sky-500/20 disabled:opacity-50 cursor-pointer"
					>
						<Sparkles className="w-3 h-3" />
						<span>
							{generatingTitle ? "Generating..." : "Generate with AI"}
						</span>
					</button>
				</div>
				<input
					type="text"
					value={title}
					onChange={(e) => handleTitleChange(e.target.value)}
					placeholder="Enter video title or generate with AI..."
					className="w-full rounded-xl bg-[#161d2d] border border-slate-800 px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
				/>
			</div>
			{/* Prompt */}
			<div className="space-y-1.5">
				<label className="text-xs font-medium text-slate-300">
					Prompt / Concept
				</label>
				<textarea
					rows={3}
					value={prompt}
					onChange={(e) => handlePromptChange(e.target.value)}
					placeholder="Enter educational topic prompt..."
					className="w-full rounded-xl bg-[#161d2d] border border-slate-800 px-3.5 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition resize-none"
				/>
			</div>
			{/* Model Engine */}
			<div className="space-y-1.5 pt-1">
				<span className="text-xs font-semibold text-slate-200">
					Model Engine
				</span>
				<CustomSelect
					value={model}
					onChange={handleModelChange}
					options={MODEL_OPTIONS}
				/>
			</div>
			{/* Model Advisor Box */}
			<ModelAdvisor
				selectedModel={model}
				advisorList={advisorList}
				onSelectModel={handleModelChange}
			/>
			{/* Resolution & Aspect Ratio */}
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
				<div className="space-y-1.5">
					<span className="text-xs font-medium text-slate-300">Resolution</span>
					<CustomSelect
						value={resolution}
						onChange={setResolution}
						options={RESOLUTION_OPTIONS}
					/>
				</div>

				<div className="space-y-1.5">
					<span className="text-xs font-medium text-slate-300">
						Aspect Ratio
					</span>
					<div className="grid grid-cols-2 gap-1.5 h-11">
						<button
							type="button"
							onClick={() => setAspectRatio("9:16")}
							className={`h-full rounded-xl border text-xs font-semibold transition cursor-pointer flex items-center justify-center ${
								aspectRatio === "9:16"
									? "bg-sky-500/20 border-sky-500 text-sky-300 shadow-sm shadow-sky-950/40"
									: "bg-[#141b2a] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
							}`}
						>
							9:16 Shorts
						</button>
						<button
							type="button"
							onClick={() => setAspectRatio("16:9")}
							className={`h-full rounded-xl border text-xs font-semibold transition cursor-pointer flex items-center justify-center ${
								aspectRatio === "16:9"
									? "bg-sky-500/20 border-sky-500 text-sky-300 shadow-sm shadow-sky-950/40"
									: "bg-[#141b2a] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
							}`}
						>
							16:9 Cinema
						</button>
					</div>
				</div>
			</div>
			{/* Voice Narration & Visual Theme */}
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
				<div className="space-y-1.5">
					<span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
						<Volume2 className="w-3.5 h-3.5 text-emerald-400" />
						<span>Voice Narration</span>
					</span>
					<CustomSelect
						value={voice}
						onChange={setVoice}
						options={VOICE_OPTIONS}
					/>
				</div>

				<div className="space-y-1.5">
					<span className="text-xs font-medium text-slate-300">
						Visual Theme
					</span>
					<CustomSelect
						value={theme}
						onChange={setTheme}
						options={themes.map((t) => ({
							value: t.id,
							label: t.name,
						}))}
					/>
				</div>
			</div>
			{/* Submit & Cancel Actions */}
			<div className="space-y-3">
				<div className="flex items-center gap-3">
					<button
						type="button"
						disabled={isCurrentJobActive}
						onClick={handleGenerate}
						className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-sky-500/25 flex items-center justify-center space-x-2 transition cursor-pointer disabled:opacity-75"
					>
						<Wand2 className="w-4 h-4" />
						<span>
							{isCurrentJobActive
								? `Generating... ${currentJob?.progress || 10}% ${currentJob?.estimatedRemainingSec ? `(${formatRemainingTime(currentJob.estimatedRemainingSec)})` : ""}`
								: "Generate Study Video"}
						</span>
					</button>

					{isCurrentJobActive && (
						<button
							type="button"
							onClick={() => setShowCancelModal(true)}
							title="Cancel this video generation"
							className="py-3.5 px-4 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
						>
							<XCircle className="w-4 h-4" />
							<span>Cancel</span>
						</button>
					)}
				</div>

				{/* Create Another Video Button */}
				{isCurrentJobActive && (
					<button
						type="button"
						onClick={handleCreateAnother}
						className="w-full py-2.5 px-4 rounded-xl bg-[#141b2a] hover:bg-slate-800 text-sky-300 hover:text-white border border-sky-500/30 hover:border-sky-400/50 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer shadow-md shadow-sky-950/40"
					>
						<PlusCircle className="w-4 h-4 text-sky-400" />
						<span>+ Create Another Video (Queue in Background)</span>
					</button>
				)}
			</div>
			{/* Progress Card */}
			{isCurrentJobActive && currentJob && (
				<div className="glass-panel rounded-2xl p-5 shadow-xl space-y-3 border-sky-500/30">
					<div className="flex items-center justify-between text-xs">
						<span className="font-bold text-sky-400 tracking-wider uppercase">
							{currentJob.status}
						</span>
						<div className="flex items-center gap-2 font-mono">
							{currentJob.estimatedRemainingSec !== undefined && (
								<span className="text-sky-300 text-[11px] bg-sky-950/80 px-2 py-0.5 rounded border border-sky-800/40">
									{formatRemainingTime(currentJob.estimatedRemainingSec)}
								</span>
							)}
							<span className="text-slate-300 font-semibold">
								{currentJob.progress}%
							</span>
						</div>
					</div>
					<div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800">
						<div
							className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full transition-all duration-300"
							style={{ width: `${currentJob.progress}%` }}
						/>
					</div>
					<div className="flex items-center justify-between gap-2 text-xs text-slate-400">
						<p
							className="truncate leading-relaxed cursor-help flex-1"
							title={currentJob.message}
						>
							{currentJob.message}
						</p>
						<button
							type="button"
							onClick={() => setShowCancelModal(true)}
							className="text-rose-400 hover:text-rose-300 underline font-medium shrink-0 cursor-pointer text-[11px]"
						>
							Cancel Generation
						</button>
					</div>
				</div>
			)}
			<ConfirmModal
				isOpen={showCancelModal}
				onClose={() => setShowCancelModal(false)}
				onConfirm={async () => {
					if (!currentJobId) return;
					setIsCanceling(true);
					try {
						await cancelJob(currentJobId);
						setCurrentJobId(null);
						toast.info("Video generation canceled");
						setShowCancelModal(false);
					} catch {
						toast.error("Failed to cancel generation");
					} finally {
						setIsCanceling(false);
					}
				}}
				title="Cancel Video Generation?"
				description="Are you sure you want to stop generating this study video? Any progress made on current segments will be canceled."
				confirmText="Yes, Cancel Generation"
				cancelText="Keep Generating"
				variant="danger"
				isLoading={isCanceling}
			/>
		</div>
	);
}
