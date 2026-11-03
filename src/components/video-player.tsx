"use client";

import { Download, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { deleteVideoAction } from "@/actions/studio-actions";
import { ConfirmModal } from "@/components/confirm-modal";
import type { VideoMetadata } from "@/engine/types";

interface VideoPlayerProps {
	currentVideo: VideoMetadata | null;
	onVideoDeleted?: (
		deletedJobId: string,
		remainingVideos: VideoMetadata[],
	) => void;
}

export function VideoPlayer({
	currentVideo,
	onVideoDeleted,
}: VideoPlayerProps) {
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const isLandscape = currentVideo?.aspect_ratio === "16:9";

	const handleDelete = async () => {
		if (!currentVideo?.job_id) return;
		setIsDeleting(true);
		try {
			const res = await deleteVideoAction(currentVideo.job_id);
			if (res.success) {
				toast.success("Study video deleted successfully");
				setShowDeleteModal(false);
				onVideoDeleted?.(currentVideo.job_id, res.remainingHistory || []);
			} else {
				toast.error(res.error || "Failed to delete video");
			}
		} catch {
			toast.error("An unexpected error occurred while deleting video");
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<div className="glass-panel rounded-2xl p-6 shadow-xl space-y-4">
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
				<div className="truncate pr-2">
					<h2
						title={currentVideo?.topic || "Video Studio Player"}
						className="text-base font-bold text-white truncate cursor-help"
					>
						{currentVideo?.topic || "Video Studio Player"}
					</h2>
					<p
						title={
							currentVideo
								? `${currentVideo.category} • ${currentVideo.total_segments} Segments Stitched`
								: "Main stitched release preview"
						}
						className="text-xs text-slate-400 truncate cursor-help"
					>
						{currentVideo
							? `${currentVideo.category} • ${currentVideo.total_segments} Segments Stitched`
							: "Main stitched release preview"}
					</p>
				</div>
				{currentVideo?.master_video_url && (
					<div className="flex items-center gap-2 shrink-0">
						<a
							href={currentVideo.master_video_url}
							download={`${currentVideo.topic}.mp4`}
							title={`Download complete video file: ${currentVideo.video_file_name || `${currentVideo.topic}.mp4`}`}
							className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 border border-sky-500/30 text-xs font-medium transition cursor-pointer"
						>
							<Download className="w-3.5 h-3.5" />
							<span>Download MP4</span>
						</a>

						<button
							type="button"
							onClick={() => setShowDeleteModal(true)}
							title="Delete this study video from storage"
							className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 border border-rose-500/30 text-xs font-medium transition cursor-pointer"
						>
							<Trash2 className="w-3.5 h-3.5" />
							<span>Delete</span>
						</button>
					</div>
				)}
			</div>

			<div
				className={`relative w-full rounded-xl overflow-hidden bg-black mx-auto flex items-center justify-center border border-slate-800 shadow-2xl transition-all ${
					isLandscape
						? "aspect-[16/9] max-h-[420px]"
						: "aspect-[9/16] max-h-[520px]"
				}`}
			>
				{currentVideo ? (
					<video
						key={`${currentVideo.master_video_url}-${currentVideo.updated_at || currentVideo.created_at}`}
						controls
						className="w-full h-full object-contain"
						poster={currentVideo.master_thumbnail_url}
					>
						<source
							src={`${currentVideo.master_video_url}?t=${currentVideo.updated_at || currentVideo.created_at}`}
							type="video/mp4"
						/>
						Your browser does not support the video tag.
					</video>
				) : (
					<div className="text-xs text-slate-500">No video generated yet.</div>
				)}
			</div>

			{currentVideo && (
				<div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
					<span
						title={`Canvas Resolution & Aspect Ratio: ${currentVideo.resolution} (${currentVideo.aspect_ratio})`}
						className="px-2.5 py-1 rounded-md bg-[#161d2d] border border-slate-800 text-slate-300 cursor-help"
					>
						{currentVideo.resolution} ({currentVideo.aspect_ratio})
					</span>
					<span
						title={`Total video runtime: ${currentVideo.total_duration} seconds`}
						className="px-2.5 py-1 rounded-md bg-[#161d2d] border border-slate-800 text-slate-300 cursor-help"
					>
						Duration: {currentVideo.total_duration}s
					</span>
					<span
						title={`Total stitched segments: ${currentVideo.total_segments}`}
						className="px-2.5 py-1 rounded-md bg-[#161d2d] border border-slate-800 text-slate-300 cursor-help"
					>
						{currentVideo.total_segments} Segments Stitched
					</span>
					<span
						title={`Video content language: ${currentVideo.language === "bn" ? "Bengali (বাংলা)" : "English"}`}
						className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 cursor-help"
					>
						{currentVideo.language === "bn" ? "বাংলা (Bengali)" : "English"}
					</span>
					<span
						title={
							currentVideo.fallback_reason
								? `Fallback Note: ${currentVideo.fallback_reason}`
								: `Gemini AI Reasoning Engine: ${currentVideo.model_used}`
						}
						className={`px-2.5 py-1 rounded-md border cursor-help inline-flex items-center gap-1.5 ${
							currentVideo.fallback_reason
								? "bg-amber-500/10 border-amber-500/30 text-amber-300"
								: "bg-sky-500/10 border-sky-500/20 text-sky-300"
						}`}
					>
						{currentVideo.model_used}
						{currentVideo.fallback_reason && (
							<span className="text-[10px] uppercase font-semibold px-1 py-0.5 rounded bg-amber-500/20 text-amber-200">
								Auto Fallback
							</span>
						)}
					</span>
					{currentVideo.voice_used && (
						<span
							title={`Narration Studio Voice: ${currentVideo.voice_used}`}
							className="px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 cursor-help"
						>
							Voice: {currentVideo.voice_used}
						</span>
					)}
				</div>
			)}

			<ConfirmModal
				isOpen={showDeleteModal}
				onClose={() => setShowDeleteModal(false)}
				onConfirm={handleDelete}
				title="Delete Study Video?"
				description={`Are you sure you want to permanently delete "${currentVideo?.topic}"? All segments, narration audio, and exported MP4 files will be removed.`}
				confirmText="Yes, Delete Video"
				cancelText="Cancel"
				variant="danger"
				isLoading={isDeleting}
			/>
		</div>
	);
}
