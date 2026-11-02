"use client";

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";
import type { VideoMetadata } from "@/engine/types";

export interface ActiveGenerationJob {
	jobId: string;
	title: string;
	status: string;
	progress: number;
	message: string;
	result: VideoMetadata | null;
	error?: string;
	startedAt: number;
	estimatedTotalSec?: number;
	estimatedRemainingSec?: number;
}

interface GenerationContextValue {
	jobs: ActiveGenerationJob[];
	activeJob: ActiveGenerationJob | null;
	isGenerating: boolean;
	isMinimized: boolean;
	setIsMinimized: (minimized: boolean) => void;
	startGeneration: (jobId: string, title?: string) => void;
	dismissJob: (jobId: string) => void;
	cancelJob: (jobId: string) => Promise<void>;
	cancelGeneration: () => Promise<void>;
	activeVideo: VideoMetadata | null;
	setActiveVideo: (video: VideoMetadata | null) => void;
}

const STORAGE_KEY = "study_video_active_jobs_list";

const GenerationContext = createContext<GenerationContextValue | undefined>(
	undefined,
);

export function GenerationProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const [jobs, setJobs] = useState<ActiveGenerationJob[]>([]);
	const [isMinimized, setIsMinimized] = useState(false);
	const [activeVideo, setActiveVideo] = useState<VideoMetadata | null>(null);
	const pollRef = useRef<NodeJS.Timeout | null>(null);

	// Restore jobs list from localStorage on mount
	useEffect(() => {
		try {
			const saved = localStorage.getItem(STORAGE_KEY);
			if (saved) {
				const parsed = JSON.parse(saved);
				if (Array.isArray(parsed)) {
					setJobs(parsed);
				}
			}
		} catch {}
	}, []);

	// Persist jobs to localStorage
	const persistJobs = useCallback((list: ActiveGenerationJob[]) => {
		try {
			if (list.length > 0) {
				localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
			} else {
				localStorage.removeItem(STORAGE_KEY);
			}
		} catch {}
	}, []);

	const stopPolling = useCallback(() => {
		if (pollRef.current) {
			clearInterval(pollRef.current);
			pollRef.current = null;
		}
	}, []);

	// Active running jobs
	const runningJobIds = jobs
		.filter((j) => j.status !== "completed" && j.status !== "failed")
		.map((j) => j.jobId)
		.join(",");

	// Polling loop for all active jobs in parallel
	useEffect(() => {
		if (!runningJobIds) {
			stopPolling();
			return;
		}

		stopPolling();

		const pollAll = async () => {
			const idsToPoll = runningJobIds.split(",").filter(Boolean);
			if (idsToPoll.length === 0) return;

			try {
				const updates = await Promise.allSettled(
					idsToPoll.map(async (id) => {
						const resp = await fetch(`/api/status/${encodeURIComponent(id)}`);
						if (!resp.ok) return null;
						const data = await resp.json();
						return { id, data };
					}),
				);

				setJobs((prevJobs) => {
					let hasChanges = false;
					const next = prevJobs.map((job) => {
						const updateItem = updates.find(
							(u) => u.status === "fulfilled" && u.value?.id === job.jobId,
						);
						if (updateItem?.status !== "fulfilled" || !updateItem.value) {
							return job;
						}

						const data = updateItem.value.data;
						const status = data.status || "processing";
						const progress = Number(data.progress ?? job.progress);
						const message = data.message || job.message;
						const result = data.result || null;
						const estimatedTotalSec =
							data.estimated_total_sec ?? job.estimatedTotalSec;
						const estimatedRemainingSec =
							data.estimated_remaining_sec ?? job.estimatedRemainingSec;

						if (
							job.status !== status ||
							job.progress !== progress ||
							job.message !== message ||
							(result && !job.result)
						) {
							hasChanges = true;
							const updated: ActiveGenerationJob = {
								...job,
								status,
								progress: Math.max(job.progress, progress),
								message,
								result: result || job.result,
								estimatedTotalSec,
								estimatedRemainingSec,
							};

							if (status === "completed" && result && !activeVideo) {
								setActiveVideo(result);
							}
							return updated;
						}

						return job;
					});

					if (hasChanges) {
						persistJobs(next);
					}
					return next;
				});
			} catch {}
		};

		pollAll();
		pollRef.current = setInterval(pollAll, 1500);

		return () => stopPolling();
	}, [runningJobIds, persistJobs, stopPolling, activeVideo]);

	const startGeneration = useCallback(
		(jobId: string, title?: string) => {
			const newJob: ActiveGenerationJob = {
				jobId,
				title: title?.trim() || "New Study Video",
				status: "queued",
				progress: 5,
				message: "Initializing video pipeline...",
				result: null,
				startedAt: Date.now(),
			};

			setJobs((prev) => {
				const filtered = prev.filter((j) => j.jobId !== jobId);
				const next = [newJob, ...filtered];
				persistJobs(next);
				return next;
			});
			setIsMinimized(false);
		},
		[persistJobs],
	);

	const dismissJob = useCallback(
		(jobId: string) => {
			setJobs((prev) => {
				const next = prev.filter((j) => j.jobId !== jobId);
				persistJobs(next);
				return next;
			});
		},
		[persistJobs],
	);

	const cancelJob = useCallback(
		async (jobId: string) => {
			try {
				await fetch("/api/video/cancel", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ job_id: jobId }),
				});
			} catch {}

			setJobs((prev) => {
				const next = prev.filter((j) => j.jobId !== jobId);
				persistJobs(next);
				return next;
			});
		},
		[persistJobs],
	);

	const cancelGeneration = useCallback(async () => {
		const currentActive = jobs.find(
			(j) => j.status !== "completed" && j.status !== "failed",
		);
		if (currentActive) {
			await cancelJob(currentActive.jobId);
		}
	}, [jobs, cancelJob]);

	const activeJob = jobs[0] || null;
	const isGenerating = jobs.some(
		(j) => j.status !== "completed" && j.status !== "failed",
	);

	return (
		<GenerationContext.Provider
			value={{
				jobs,
				activeJob,
				isGenerating,
				isMinimized,
				setIsMinimized,
				startGeneration,
				dismissJob,
				cancelJob,
				cancelGeneration,
				activeVideo,
				setActiveVideo,
			}}
		>
			{children}
		</GenerationContext.Provider>
	);
}

export function useGeneration(): GenerationContextValue {
	const context = useContext(GenerationContext);
	if (!context) {
		throw new Error("useGeneration must be used within a GenerationProvider");
	}
	return context;
}
