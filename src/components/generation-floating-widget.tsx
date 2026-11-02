"use client";

import {
	AlertCircle,
	ArrowRight,
	CheckCircle2,
	ChevronDown,
	Maximize2,
	Play,
	RefreshCw,
	Sparkles,
	Timer,
	X,
	XCircle,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ConfirmModal } from "@/components/confirm-modal";
import {
	type ActiveGenerationJob,
	useGeneration,
} from "@/context/generation-context";

function formatElapsed(startedAt: number, currentNow: number): string {
	const totalSec = Math.max(0, Math.floor((currentNow - startedAt) / 1000));
	const mins = Math.floor(totalSec / 60);
	const secs = totalSec % 60;
	return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

function formatRemaining(sec?: number): string {
	if (sec === undefined || sec === null) return "Estimating...";
	if (sec <= 0) return "Finishing up";
	if (sec < 60) return `~${sec}s left`;
	const mins = Math.floor(sec / 60);
	const rem = sec % 60;
	return `~${mins}m ${rem}s left`;
}

export function GenerationFloatingWidget() {
	const pathname = usePathname();
	const router = useRouter();
	const [jobToCancel, setJobToCancel] = useState<ActiveGenerationJob | null>(
		null,
	);
	const [isCanceling, setIsCanceling] = useState(false);
	const [now, setNow] = useState(Date.now());

	const {
		jobs,
		isMinimized,
		setIsMinimized,
		dismissJob,
		cancelJob,
		setActiveVideo,
	} = useGeneration();

	// 1-second ticker for elapsed time counter
	useEffect(() => {
		const timer = setInterval(() => setNow(Date.now()), 1000);
		return () => clearInterval(timer);
	}, []);

	if (jobs.length === 0) return null;

	const isHome = pathname === "/";

	const handleWatchVideo = (job: ActiveGenerationJob) => {
		if (job.result) {
			setActiveVideo(job.result);
		}
		if (!isHome) {
			router.push("/");
		} else {
			const playerEl = document.getElementById("player-section");
			if (playerEl) {
				playerEl.scrollIntoView({ behavior: "smooth" });
			} else {
				window.scrollTo({ top: 0, behavior: "smooth" });
			}
		}
	};

	const handleConfirmCancel = async () => {
		if (!jobToCancel) return;
		setIsCanceling(true);
		try {
			await cancelJob(jobToCancel.jobId);
		} finally {
			setIsCanceling(false);
			setJobToCancel(null);
		}
	};

	if (isMinimized) {
		const runningCount = jobs.filter(
			(j) => j.status !== "completed" && j.status !== "failed",
		).length;

		return (
			<button
				type="button"
				className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[#0c1220]/95 backdrop-blur-md border border-sky-500/40 shadow-2xl shadow-sky-950/60 cursor-pointer hover:border-sky-400 hover:scale-105 transition-all text-xs"
				onClick={() => setIsMinimized(false)}
				title="Click to expand video generation queue"
			>
				{runningCount > 0 ? (
					<RefreshCw className="w-3.5 h-3.5 text-sky-400 animate-spin" />
				) : (
					<CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
				)}

				<span className="font-semibold text-slate-200">
					{runningCount > 0
						? `${runningCount} Video${runningCount > 1 ? "s" : ""} Generating`
						: `${jobs.length} Ready`}
				</span>

				<div className="flex items-center gap-1 text-slate-400 text-[11px]">
					{jobs.slice(0, 3).map((j) => (
						<span
							key={j.jobId}
							className="px-1.5 py-0.5 rounded bg-slate-800 text-sky-300 font-mono"
						>
							{j.status === "completed" ? "Done" : `${j.progress}%`}
						</span>
					))}
				</div>

				<Maximize2 className="w-3 h-3 text-slate-400 ml-1" />
			</button>
		);
	}

	return (
		<>
			<section
				aria-label="Video Generation Queue"
				className="fixed bottom-5 right-5 z-50 flex flex-col-reverse gap-3 max-h-[85vh] overflow-y-auto w-84 sm:w-96 pointer-events-none"
			>
				{jobs.map((job) => {
					const isCompleted = job.status === "completed";
					const isFailed = job.status === "failed";
					const isJobGenerating = !isCompleted && !isFailed;
					const elapsedStr = formatElapsed(job.startedAt, now);
					const remainingStr = formatRemaining(job.estimatedRemainingSec);

					return (
						<aside
							key={job.jobId}
							className="pointer-events-auto rounded-2xl bg-[#0c1220]/95 backdrop-blur-md border border-sky-500/40 p-4 shadow-2xl shadow-sky-950/70 space-y-3 transition-all"
						>
							{/* Top Bar */}
							<div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-2.5">
								<div className="flex items-center gap-2 min-w-0">
									<div
										className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
											isCompleted
												? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
												: isFailed
													? "bg-rose-500/15 border-rose-500/30 text-rose-300"
													: "bg-sky-500/15 border-sky-500/30 text-sky-300"
										}`}
									>
										{isJobGenerating && (
											<RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" />
										)}
										{isCompleted && (
											<Sparkles className="w-3.5 h-3.5 text-emerald-400" />
										)}
										{isFailed && (
											<AlertCircle className="w-3.5 h-3.5 text-rose-400" />
										)}
									</div>

									<div className="min-w-0">
										<div className="flex items-center gap-1.5 flex-wrap">
											<span
												className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
													isCompleted
														? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
														: isFailed
															? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
															: "bg-sky-500/20 text-sky-300 border border-sky-500/30"
												}`}
											>
												{isCompleted
													? "Ready"
													: isFailed
														? "Failed"
														: `${job.status} (${job.progress}%)`}
											</span>

											{isJobGenerating && (
												<span className="text-[10px] font-mono text-sky-300 bg-sky-950/80 px-1.5 py-0.5 rounded border border-sky-800/50">
													{remainingStr}
												</span>
											)}
										</div>

										<h4
											className="text-xs font-semibold text-white truncate mt-0.5"
											title={job.title}
										>
											{job.title}
										</h4>
									</div>
								</div>

								<div className="flex items-center gap-1 shrink-0">
									{isJobGenerating && (
										<button
											type="button"
											onClick={() => setJobToCancel(job)}
											title={`Cancel generation for ${job.title}`}
											className="p-1 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition cursor-pointer"
										>
											<XCircle className="w-4 h-4" />
										</button>
									)}

									<button
										type="button"
										onClick={() => setIsMinimized(true)}
										title="Minimize widget stack"
										className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
									>
										<ChevronDown className="w-4 h-4" />
									</button>

									{(isCompleted || isFailed) && (
										<button
											type="button"
											onClick={() => dismissJob(job.jobId)}
											title="Dismiss"
											className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
										>
											<X className="w-4 h-4" />
										</button>
									)}
								</div>
							</div>

							{/* Progress Bar & Timers */}
							<div className="space-y-1.5">
								<div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
									<span className="flex items-center gap-1 text-slate-300">
										<Timer className="w-3 h-3 text-sky-400" />
										<span>Elapsed: {elapsedStr}</span>
									</span>
									{isJobGenerating && (
										<span className="text-sky-300 font-semibold">
											{job.progress}%
										</span>
									)}
								</div>

								<div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
									<div
										className={`h-full rounded-full transition-all duration-300 ${
											isCompleted
												? "bg-emerald-500"
												: isFailed
													? "bg-rose-500"
													: "bg-gradient-to-r from-sky-500 to-indigo-500"
										}`}
										style={{ width: `${job.progress}%` }}
									/>
								</div>

								<p
									className="text-[11px] text-slate-300 truncate cursor-help"
									title={job.message}
								>
									{job.message}
								</p>
							</div>

							{/* Completed Action Footer */}
							{isCompleted && (
								<button
									type="button"
									onClick={() => handleWatchVideo(job)}
									className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 transition cursor-pointer"
								>
									<Play className="w-3.5 h-3.5 fill-current" />
									<span>Watch Study Video</span>
									<ArrowRight className="w-3 h-3" />
								</button>
							)}
						</aside>
					);
				})}
			</section>

			<ConfirmModal
				isOpen={Boolean(jobToCancel)}
				onClose={() => setJobToCancel(null)}
				onConfirm={handleConfirmCancel}
				title="Cancel Video Generation?"
				description={`Are you sure you want to cancel generation for "${jobToCancel?.title}"? Any rendered segments will be discarded.`}
				confirmText="Yes, Cancel Job"
				cancelText="Keep Generating"
				variant="danger"
				isLoading={isCanceling}
			/>
		</>
	);
}
