"use client";

import {
	Calendar,
	Clock,
	Download,
	Film,
	Layers,
	Play,
	RefreshCw,
	Search,
	Trash2,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
	deleteVideoAction,
	fetchVideoHistoryAction,
} from "@/actions/studio-actions";
import { ConfirmModal } from "@/components/confirm-modal";
import { Container } from "@/components/container";
import { useGeneration } from "@/context/generation-context";
import type { VideoMetadata } from "@/engine/types";

interface ArchiveViewProps {
	initialVideos: VideoMetadata[];
}

export function ArchiveView({ initialVideos }: ArchiveViewProps) {
	const [videos, setVideos] = useState<VideoMetadata[]>(initialVideos);
	const [selectedVideo, setSelectedVideo] = useState<VideoMetadata | null>(
		initialVideos[0] || null,
	);
	const [searchQuery, setSearchQuery] = useState("");
	const [loading, setLoading] = useState(false);
	const [videoToDelete, setVideoToDelete] = useState<VideoMetadata | null>(
		null,
	);
	const [isDeleting, setIsDeleting] = useState(false);
	const { setActiveVideo } = useGeneration();

	const handleConfirmDelete = async () => {
		if (!videoToDelete) return;
		setIsDeleting(true);
		try {
			const res = await deleteVideoAction(videoToDelete.job_id);
			if (res.success) {
				toast.success("Study video deleted successfully");
				const remaining = res.remainingHistory || [];
				setVideos(remaining);
				if (selectedVideo?.job_id === videoToDelete.job_id) {
					setSelectedVideo(remaining[0] || null);
				}
				setVideoToDelete(null);
			} else {
				toast.error(res.error || "Failed to delete video");
			}
		} catch {
			toast.error("Failed to delete video");
		} finally {
			setIsDeleting(false);
		}
	};

	const handleRefresh = useCallback(async () => {
		setLoading(true);
		try {
			const list = await fetchVideoHistoryAction();
			setVideos(list || []);
			if (list && list.length > 0 && !selectedVideo) {
				setSelectedVideo(list[0]);
			}
		} catch {
		} finally {
			setLoading(false);
		}
	}, [selectedVideo]);

	const filteredVideos = videos.filter((v) => {
		const q = searchQuery.toLowerCase();
		return (
			v.topic.toLowerCase().includes(q) ||
			v.category.toLowerCase().includes(q) ||
			v.model_used.toLowerCase().includes(q)
		);
	});

	return (
		<main className="flex-1 w-full">
			<Container className="py-6 space-y-6">
				{/* Page Header */}
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
					<div>
						<div className="flex items-center gap-2.5">
							<div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
								<Film className="w-4 h-4" />
							</div>
							<h1 className="text-xl font-bold text-white tracking-tight">
								Generated Video Archive
							</h1>
						</div>
						<p className="text-xs text-slate-400 mt-1">
							Browse, stream, and download all multi-segment study videos
							generated with Gemini and Skia.
						</p>
					</div>

					<div className="flex items-center gap-2.5">
						<div className="relative">
							<Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
							<input
								type="text"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder="Search by topic or category..."
								className="h-10 pl-9 pr-3 rounded-xl bg-[#141b2a] border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition w-56 sm:w-64"
							/>
						</div>
						<button
							type="button"
							onClick={handleRefresh}
							disabled={loading}
							className="h-10 px-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
						>
							<RefreshCw
								className={`w-3.5 h-3.5 text-sky-400 ${loading ? "animate-spin" : ""}`}
							/>
							<span>Refresh</span>
						</button>
					</div>
				</div>

				{/* Active Preview Player if selected */}
				{selectedVideo && (
					<div className="glass-panel rounded-2xl p-6 shadow-xl border-slate-800 space-y-4">
						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
							<div className="truncate pr-2">
								<div className="flex items-center gap-2">
									<span
										title={`Category: ${selectedVideo.category}`}
										className="px-2.5 py-0.5 rounded-md bg-sky-500/15 border border-sky-500/20 text-sky-300 text-[11px] font-semibold cursor-help"
									>
										{selectedVideo.category}
									</span>
									<span
										title={`Job Identifier: ${selectedVideo.job_id}`}
										className="text-xs text-slate-400 cursor-help"
									>
										Job ID: {selectedVideo.job_id}
									</span>
								</div>
								<h2
									title={selectedVideo.topic}
									className="text-base font-bold text-white mt-1 truncate cursor-help"
								>
									{selectedVideo.topic}
								</h2>
							</div>

							<div className="flex items-center gap-2 shrink-0">
								<a
									href={selectedVideo.master_video_url}
									download={`${selectedVideo.topic}.mp4`}
									title={`Download full release: ${selectedVideo.video_file_name || `${selectedVideo.topic}.mp4`}`}
									className="h-9 px-3.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 text-xs font-semibold flex items-center gap-1.5 transition"
								>
									<Download className="w-3.5 h-3.5" />
									<span>Download MP4</span>
								</a>

								<Link
									href="/"
									onClick={() => selectedVideo && setActiveVideo(selectedVideo)}
									title="Open and edit this video in the studio"
									className="h-9 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm shadow-emerald-600/30"
								>
									<Play className="w-3.5 h-3.5" />
									<span>Open in Studio</span>
								</Link>

								<button
									type="button"
									onClick={() => setVideoToDelete(selectedVideo)}
									title="Delete this study video from storage"
									className="h-9 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
								>
									<Trash2 className="w-3.5 h-3.5" />
									<span>Delete</span>
								</button>
							</div>
						</div>

						<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
							{/* Video Container */}
							<div className="lg:col-span-5 bg-black rounded-xl overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center max-h-[460px] aspect-[9/16] mx-auto">
								<video
									key={selectedVideo.job_id}
									controls
									className="w-full h-full object-contain"
									poster={selectedVideo.master_thumbnail_url}
								>
									<source
										src={selectedVideo.master_video_url}
										type="video/mp4"
									/>
									Your browser does not support the video tag.
								</video>
							</div>

							{/* Metadata & Segment Summary */}
							<div className="lg:col-span-7 space-y-4">
								<div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
									<div className="p-3 rounded-xl bg-[#141b2a] border border-slate-800">
										<div className="text-slate-400 text-[10px] flex items-center gap-1">
											<Clock className="w-3 h-3 text-sky-400" />
											<span>Duration</span>
										</div>
										<div className="font-bold text-slate-100 text-sm mt-0.5">
											{selectedVideo.total_duration}s
										</div>
									</div>

									<div className="p-3 rounded-xl bg-[#141b2a] border border-slate-800">
										<div className="text-slate-400 text-[10px] flex items-center gap-1">
											<Layers className="w-3 h-3 text-sky-400" />
											<span>Segments</span>
										</div>
										<div className="font-bold text-slate-100 text-sm mt-0.5">
											{selectedVideo.total_segments} Stitched
										</div>
									</div>

									<div className="p-3 rounded-xl bg-[#141b2a] border border-slate-800">
										<div className="text-slate-400 text-[10px]">Resolution</div>
										<div className="font-bold text-slate-100 text-sm mt-0.5">
											{selectedVideo.resolution}
										</div>
									</div>

									<div className="p-3 rounded-xl bg-[#141b2a] border border-slate-800">
										<div className="text-slate-400 text-[10px]">Language</div>
										<div className="font-bold text-emerald-300 text-sm mt-0.5">
											{selectedVideo.language === "bn" ? "বাংলা" : "English"}
										</div>
									</div>
								</div>

								{/* Segment Breakdown */}
								<div className="space-y-2">
									<h3 className="text-xs font-semibold text-slate-300">
										Stitched Segments Timeline
									</h3>
									<div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
										{selectedVideo.segments?.map((seg) => (
											<div
												key={seg.segment_index}
												title={`Segment ${seg.segment_index}: ${seg.title || seg.tag}\n\nNarration:\n${seg.narration}`}
												className="p-2.5 rounded-lg bg-[#141b2a] border border-slate-800 flex items-center justify-between text-xs cursor-help"
											>
												<div className="flex items-center gap-2 truncate pr-2">
													<span className="w-5 h-5 rounded-md bg-sky-500/10 text-sky-300 flex items-center justify-center font-bold text-[10px] shrink-0">
														{seg.segment_index}
													</span>
													<span className="text-slate-200 font-medium truncate">
														{seg.title || seg.tag}
													</span>
												</div>
												<span className="text-slate-400 text-[11px] font-mono shrink-0">
													{seg.duration}s
												</span>
											</div>
										))}
									</div>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* Video Grid */}
				<div className="space-y-3">
					<div className="flex items-center justify-between text-xs text-slate-400">
						<span>All Rendered Releases ({filteredVideos.length})</span>
						<span className="text-[11px]">Click any card to inspect</span>
					</div>

					{filteredVideos.length === 0 ? (
						<div className="glass-panel rounded-2xl p-12 text-center text-slate-500 text-xs">
							No matching videos found in archive.
						</div>
					) : (
						<div className="grid grid-cols-[repeat(auto-fill,minmax(min(240px,100%),1fr))] gap-3.5">
							{filteredVideos.map((item) => {
								const isSelected = selectedVideo?.job_id === item.job_id;
								const itemTooltip = `${item.topic}\n\nCategory: ${item.category}\nLanguage: ${item.language === "bn" ? "Bengali (বাংলা)" : "English"}\nModel: ${item.model_used}${item.fallback_reason ? `\nFallback Note: ${item.fallback_reason}` : ""}\nDuration: ${item.total_duration}s | Segments: ${item.total_segments}\nFile: ${item.video_file_name || "master_video.mp4"}`;
								return (
									<article
										key={item.job_id}
										title={itemTooltip}
										className={`glass-card rounded-xl p-3 text-left transition flex flex-col justify-between group border ${
											isSelected
												? "border-sky-500 bg-sky-500/10 shadow-lg shadow-sky-500/10"
												: "border-slate-800 hover:border-slate-700 bg-[#141b2a]"
										}`}
									>
										<button
											type="button"
											onClick={() => setSelectedVideo(item)}
											className="space-y-2.5 w-full text-left cursor-pointer"
										>
											{/* Thumbnail Container */}
											<div className="relative rounded-lg overflow-hidden aspect-[9/16] bg-slate-900 border border-slate-800/80">
												<img
													src={item.master_thumbnail_url}
													alt={item.topic}
													className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
												/>
												<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

												{/* Badges on Thumbnail */}
												<div className="absolute top-2 left-2 flex items-center gap-1">
													<span
														title={`Target resolution: ${item.resolution}`}
														className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur text-[10px] font-bold text-sky-300 border border-slate-700 cursor-help"
													>
														{item.resolution}
													</span>
													<span
														title={`Language: ${item.language === "bn" ? "Bengali (বাংলা)" : "English"}`}
														className="px-2 py-0.5 rounded-md bg-emerald-500/80 text-[10px] font-bold text-black cursor-help"
													>
														{item.language === "bn" ? "বাংলা" : "EN"}
													</span>
												</div>

												<div
													title={`Runtime: ${item.total_duration}s`}
													className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur text-[10px] font-mono font-semibold text-slate-200 cursor-help"
												>
													{item.total_duration}s
												</div>
											</div>

											{/* Info */}
											<div>
												<span
													title={`Category: ${item.category}`}
													className="text-[10px] font-semibold text-sky-400 block truncate cursor-help"
												>
													{item.category}
												</span>
												<h4
													title={item.topic}
													className="text-xs font-bold text-slate-100 line-clamp-2 mt-0.5 group-hover:text-sky-300 transition"
												>
													{item.topic}
												</h4>
											</div>
										</button>

										<div className="pt-2 mt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
											<span className="flex items-center gap-1">
												<Calendar className="w-3 h-3 text-slate-500" />
												<span>
													{new Date(item.created_at).toLocaleDateString()}
												</span>
											</span>
											<div className="flex items-center gap-2">
												<span
													title={`${item.total_segments} total stitched video segments`}
													className="font-semibold text-slate-300 cursor-help"
												>
													{item.total_segments} Segments
												</span>
												<button
													type="button"
													onClick={(e) => {
														e.stopPropagation();
														setVideoToDelete(item);
													}}
													title={`Delete ${item.topic}`}
													className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
												>
													<Trash2 className="w-3 h-3" />
												</button>
											</div>
										</div>
									</article>
								);
							})}
						</div>
					)}
				</div>
			</Container>

			<ConfirmModal
				isOpen={Boolean(videoToDelete)}
				onClose={() => setVideoToDelete(null)}
				onConfirm={handleConfirmDelete}
				title="Delete Study Video?"
				description={`Are you sure you want to permanently delete "${videoToDelete?.topic}"? All segments, narration audio, and exported MP4 files will be removed.`}
				confirmText="Yes, Delete Video"
				cancelText="Cancel"
				variant="danger"
				isLoading={isDeleting}
			/>
		</main>
	);
}
