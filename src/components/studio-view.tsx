"use client";

import { ArrowRight, Film, Key } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
	fetchKeysAction,
	fetchVideoHistoryAction,
} from "@/actions/studio-actions";
import { Container } from "@/components/container";
import { GeneratorForm } from "@/components/generator-form";
import { SegmentStudio } from "@/components/segment-studio";
import { VideoPlayer } from "@/components/video-player";
import { useGeneration } from "@/context/generation-context";
import type {
	KeyStatus,
	ModelAdvisorProfile,
	VideoMetadata,
} from "@/engine/types";

interface StudioViewProps {
	initialVideos: VideoMetadata[];
	initialKeys: KeyStatus[];
	initialAdvisorList: ModelAdvisorProfile[];
	initialThemes: { id: string; name: string }[];
}

export function StudioView({
	initialVideos,
	initialKeys,
	initialAdvisorList,
	initialThemes,
}: StudioViewProps) {
	const [currentVideo, setCurrentVideo] = useState<VideoMetadata | null>(
		initialVideos[0] || null,
	);
	const [historyCount, setHistoryCount] = useState(initialVideos.length);
	const [keys, setKeys] = useState<KeyStatus[]>(initialKeys);
	const [advisorList] = useState<ModelAdvisorProfile[]>(initialAdvisorList);
	const [themes] = useState<{ id: string; name: string }[]>(initialThemes);
	const { activeVideo, setActiveVideo } = useGeneration();

	useEffect(() => {
		if (activeVideo) {
			setCurrentVideo(activeVideo);
		}
	}, [activeVideo]);

	const refreshHistory = useCallback(async () => {
		try {
			const list = await fetchVideoHistoryAction();
			setHistoryCount(list?.length || 0);
			if (!currentVideo && list && list.length > 0) {
				setCurrentVideo(list[0]);
			}
		} catch {}
	}, [currentVideo]);

	const refreshKeys = useCallback(async () => {
		try {
			const data = await fetchKeysAction();
			setKeys(data || []);
		} catch {}
	}, []);

	useEffect(() => {
		const timer = setInterval(() => {
			refreshKeys();
		}, 120000);

		return () => clearInterval(timer);
	}, [refreshKeys]);

	const activeKey = keys.find((k) => k.is_active);

	const handleVideoCreatedOrUpdated = (video: VideoMetadata) => {
		setCurrentVideo(video);
		setActiveVideo(video);
		refreshHistory();
		refreshKeys();
	};

	const handleVideoDeleted = (
		_deletedJobId: string,
		remainingVideos: VideoMetadata[],
	) => {
		setHistoryCount(remainingVideos.length);
		const nextVideo = remainingVideos[0] || null;
		setCurrentVideo(nextVideo);
		setActiveVideo(nextVideo);
	};

	const lastUsedTitle = initialVideos[0]?.topic;
	const lastUsedPrompt = initialVideos[0]?.original_prompt;

	return (
		<main className="flex-1 w-full">
			<Container className="py-6 space-y-6">
				{/* Top Quick Status & Navigation Bar */}
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<Link
						href="/archive"
						title="Open full video archive gallery, search past videos, and download MP4s"
						className="glass-panel rounded-xl p-3.5 flex items-center justify-between border-slate-800 hover:border-slate-700 transition group cursor-pointer"
					>
						<div className="flex items-center gap-3">
							<div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
								<Film className="w-4 h-4" />
							</div>
							<div>
								<div className="text-xs font-bold text-white group-hover:text-sky-300 transition">
									Video Archive ({historyCount} Generated)
								</div>
								<div className="text-[11px] text-slate-400">
									Browse, search, and download all past releases
								</div>
							</div>
						</div>
						<ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400 group-hover:translate-x-0.5 transition" />
					</Link>

					<Link
						href="/keys"
						title={`Gemini API Keys: ${activeKey ? `${activeKey.masked_key} (${activeKey.service_tier}) with ${activeKey.remaining_estimated_rpd?.toLocaleString() || 1500} RPD remaining` : "Configure keys"}`}
						className="glass-panel rounded-xl p-3.5 flex items-center justify-between border-slate-800 hover:border-slate-700 transition group cursor-pointer"
					>
						<div className="flex items-center gap-3">
							<div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
								<Key className="w-4 h-4" />
							</div>
							<div>
								<div className="text-xs font-bold text-white group-hover:text-emerald-300 transition">
									API Keys & Quota Manager
								</div>
								<div className="text-[11px] text-slate-400">
									{activeKey
										? `${activeKey.remaining_estimated_rpd?.toLocaleString() || 1500} RPD remaining today`
										: "Configure or switch active keys"}
								</div>
							</div>
						</div>
						<ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition" />
					</Link>
				</div>

				{/* Two-Column Studio Workspace */}
				<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
					{/* Left Column: Generator Form & Model Advisor */}
					<section className="lg:col-span-5 space-y-6">
						<GeneratorForm
							advisorList={advisorList}
							themes={themes}
							initialTitle={lastUsedTitle}
							initialPrompt={lastUsedPrompt}
							onVideoCreated={handleVideoCreatedOrUpdated}
						/>
					</section>

					{/* Right Column: Player & Segment Studio */}
					<section id="player-section" className="lg:col-span-7 space-y-6">
						<VideoPlayer
							currentVideo={currentVideo}
							onVideoDeleted={handleVideoDeleted}
						/>

						<SegmentStudio
							currentVideo={currentVideo}
							onVideoUpdated={handleVideoCreatedOrUpdated}
						/>
					</section>
				</div>
			</Container>
		</main>
	);
}
