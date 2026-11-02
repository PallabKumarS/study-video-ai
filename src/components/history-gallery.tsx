"use client";

import { Film, RefreshCw } from "lucide-react";
import type { VideoMetadata } from "@/engine/types";

interface HistoryGalleryProps {
	history: VideoMetadata[];
	onSelectVideo: (video: VideoMetadata) => void;
	onRefresh: () => void;
}

export function HistoryGallery({
	history,
	onSelectVideo,
	onRefresh,
}: HistoryGalleryProps) {
	return (
		<div className="glass-panel rounded-2xl p-6 shadow-xl space-y-4">
			<div className="flex items-center justify-between border-b border-slate-800 pb-3">
				<div className="flex items-center gap-2">
					<Film className="w-4 h-4 text-sky-400" />
					<h3 className="text-sm font-semibold text-white">
						Generated Video Archive
					</h3>
				</div>
				<button
					type="button"
					onClick={onRefresh}
					className="text-xs text-slate-400 hover:text-sky-300 flex items-center gap-1 transition cursor-pointer"
				>
					<RefreshCw className="w-3 h-3" />
					<span>Refresh Archive</span>
				</button>
			</div>

			{history.length === 0 ? (
				<p className="text-xs text-slate-500 py-4 text-center">
					No videos generated yet.
				</p>
			) : (
				<div className="grid grid-cols-[repeat(auto-fill,minmax(min(175px,100%),1fr))] gap-2">
					{history.map((item) => {
						const cardTooltip = `${item.topic}\n\nCategory: ${item.category}\nLanguage: ${item.language === "bn" ? "Bengali (বাংলা)" : "English"}\nModel: ${item.model_used}\nDuration: ${item.total_duration}s | Segments: ${item.total_segments}\nFile: ${item.video_file_name || "master_video.mp4"}`;
						return (
							<button
								type="button"
								key={item.job_id}
								onClick={() => onSelectVideo(item)}
								title={cardTooltip}
								className="glass-card rounded-xl p-2.5 cursor-pointer flex flex-col justify-between group text-left w-full transition hover:border-sky-500/50"
							>
								<div className="relative rounded-lg overflow-hidden aspect-[9/16] bg-slate-900 mb-2 border border-slate-800">
									<img
										src={item.master_thumbnail_url}
										alt={item.topic}
										className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
									/>
									<span
										title={`Total video runtime: ${item.total_duration} seconds`}
										className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/80 text-[10px] text-slate-300 cursor-help"
									>
										{item.total_duration}s
									</span>
									<span
										title={`Language: ${item.language === "bn" ? "Bengali (বাংলা)" : "English"}`}
										className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-emerald-500/80 text-[9px] font-bold text-white cursor-help"
									>
										{item.language === "bn" ? "বাংলা" : "EN"}
									</span>
								</div>
								<div>
									<h4
										title={item.topic}
										className="text-xs font-semibold text-slate-200 line-clamp-1 group-hover:text-sky-300 transition"
									>
										{item.topic}
									</h4>
									<span
										title={`Resolution: ${item.resolution} | Segments: ${item.total_segments}`}
										className="text-[10px] text-sky-400 block mt-0.5 truncate"
									>
										{item.resolution} • {item.total_segments} Segments
									</span>
								</div>
							</button>
						);
					})}
				</div>
			)}
		</div>
	);
}
