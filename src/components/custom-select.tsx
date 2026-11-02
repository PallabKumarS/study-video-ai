"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export interface SelectOption {
	value: string;
	label: string;
	badge?: string;
	badgeColor?: "sky" | "emerald" | "amber" | "purple" | "slate";
	subtitle?: string;
}

interface CustomSelectProps {
	value: string;
	onChange: (value: string) => void;
	options: SelectOption[];
	placeholder?: string;
	className?: string;
	id?: string;
}

export function CustomSelect({
	value,
	onChange,
	options,
	placeholder = "Select...",
	className = "",
	id,
}: CustomSelectProps) {
	const [isOpen, setIsOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	const selectedOption = options.find((opt) => opt.value === value);

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		}

		if (isOpen) {
			document.addEventListener("mousedown", handleClickOutside);
		}
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isOpen]);

	const badgeStyles = {
		sky: "bg-sky-500/15 text-sky-300 border-sky-500/30",
		emerald: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
		amber: "bg-amber-500/15 text-amber-300 border-amber-500/30",
		purple: "bg-purple-500/15 text-purple-300 border-purple-500/30",
		slate: "bg-slate-800 text-slate-300 border-slate-700",
	};

	const fullTitle = selectedOption
		? `${selectedOption.label}${selectedOption.subtitle ? ` — ${selectedOption.subtitle}` : ""}${selectedOption.badge ? ` [${selectedOption.badge}]` : ""}`
		: placeholder;

	return (
		<div ref={containerRef} className={`relative ${className}`} id={id}>
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				title={fullTitle}
				className={`w-full h-11 px-3.5 rounded-xl bg-[#141b2a] border transition-all flex items-center justify-between text-left text-xs cursor-pointer focus:outline-none ${
					isOpen
						? "border-sky-500 ring-1 ring-sky-500/30 shadow-lg shadow-sky-500/10"
						: "border-slate-800 hover:border-slate-700 text-slate-200"
				}`}
			>
				<span className="truncate pr-2 font-medium">
					{selectedOption ? selectedOption.label : placeholder}
				</span>
				<div className="flex items-center gap-1.5 shrink-0">
					{selectedOption?.badge && (
						<span
							className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold hidden sm:inline-block max-w-[120px] truncate ${
								badgeStyles[selectedOption.badgeColor || "sky"]
							}`}
						>
							{selectedOption.badge}
						</span>
					)}
					<ChevronDown
						className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${
							isOpen ? "rotate-180 text-sky-400" : ""
						}`}
					/>
				</div>
			</button>

			{isOpen && (
				<div className="absolute left-0 w-full min-w-[260px] max-w-[calc(100vw-2rem)] sm:max-w-md mt-1.5 py-1.5 rounded-xl bg-[#0d1424] border border-slate-700/80 shadow-2xl z-50 max-h-64 overflow-y-auto backdrop-blur-md">
					{options.map((opt) => {
						const isSelected = opt.value === value;
						const optTitle = `${opt.label}${opt.subtitle ? ` — ${opt.subtitle}` : ""}${opt.badge ? ` [${opt.badge}]` : ""}`;
						return (
							<button
								key={opt.value}
								type="button"
								onClick={() => {
									onChange(opt.value);
									setIsOpen(false);
								}}
								title={optTitle}
								className={`w-full px-3.5 py-2.5 text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
									isSelected
										? "bg-sky-500/15 text-sky-200 font-semibold"
										: "text-slate-300 hover:bg-slate-800/60 hover:text-white"
								}`}
							>
								<div className="space-y-0.5 truncate pr-2">
									<div className="truncate">{opt.label}</div>
									{opt.subtitle && (
										<div className="text-[10px] text-slate-400 truncate">
											{opt.subtitle}
										</div>
									)}
								</div>

								<div className="flex items-center gap-2 shrink-0">
									{opt.badge && (
										<span
											className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${
												badgeStyles[opt.badgeColor || "sky"]
											}`}
										>
											{opt.badge}
										</span>
									)}
									{isSelected && <Check className="w-3.5 h-3.5 text-sky-400" />}
								</div>
							</button>
						);
					})}
				</div>
			)}
		</div>
	);
}
