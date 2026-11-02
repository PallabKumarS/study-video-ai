"use client";

import { AlertCircle, AlertTriangle, HelpCircle, Loader2 } from "lucide-react";
import { useEffect } from "react";

export interface ConfirmModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void | Promise<void>;
	title: string;
	description: string;
	confirmText?: string;
	cancelText?: string;
	variant?: "danger" | "warning" | "default";
	isLoading?: boolean;
}

export function ConfirmModal({
	isOpen,
	onClose,
	onConfirm,
	title,
	description,
	confirmText = "Confirm",
	cancelText = "Cancel",
	variant = "default",
	isLoading = false,
}: ConfirmModalProps) {
	useEffect(() => {
		if (!isOpen) return;
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape" && !isLoading) {
				onClose();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, isLoading, onClose]);

	if (!isOpen) return null;

	const getIcon = () => {
		if (variant === "danger") {
			return (
				<div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center shrink-0 text-rose-400">
					<AlertTriangle className="w-5 h-5" />
				</div>
			);
		}
		if (variant === "warning") {
			return (
				<div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-400">
					<AlertCircle className="w-5 h-5" />
				</div>
			);
		}
		return (
			<div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center shrink-0 text-sky-400">
				<HelpCircle className="w-5 h-5" />
			</div>
		);
	};

	const getConfirmButtonStyle = () => {
		if (variant === "danger") {
			return "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30 border-rose-500/40";
		}
		if (variant === "warning") {
			return "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30 border-amber-500/40";
		}
		return "bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/30 border-sky-500/40";
	};

	return (
		<div
			role="dialog"
			aria-modal="true"
			aria-labelledby="confirm-modal-title"
			tabIndex={-1}
			className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
			onKeyDown={(e) => {
				if (e.key === "Escape" && !isLoading) {
					onClose();
				}
			}}
			onClick={(e) => {
				if (e.target === e.currentTarget && !isLoading) {
					onClose();
				}
			}}
		>
			<div className="glass-panel rounded-2xl p-6 border-slate-700/80 shadow-2xl max-w-md w-full space-y-4 animate-in zoom-in-95 duration-200 bg-[#0d1424]/95">
				<div className="flex items-start gap-3.5">
					{getIcon()}
					<div className="space-y-1 min-w-0">
						<h3
							id="confirm-modal-title"
							className="text-sm font-bold text-white leading-snug"
						>
							{title}
						</h3>
						<p className="text-xs text-slate-300 leading-relaxed">
							{description}
						</p>
					</div>
				</div>

				<div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
					<button
						type="button"
						disabled={isLoading}
						onClick={onClose}
						className="px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
					>
						{cancelText}
					</button>

					<button
						type="button"
						disabled={isLoading}
						onClick={onConfirm}
						className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-lg border disabled:opacity-50 ${getConfirmButtonStyle()}`}
					>
						{isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
						<span>{confirmText}</span>
					</button>
				</div>
			</div>
		</div>
	);
}
