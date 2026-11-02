"use client";

import { Film, Key, Video } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Container } from "./container";

interface HeaderProps {
	activeKeyLabel?: string;
}

export function Header({ activeKeyLabel }: HeaderProps) {
	const pathname = usePathname();

	const navItems = [
		{ href: "/", label: "Studio", icon: Video },
		{ href: "/archive", label: "Archive", icon: Film },
		{ href: "/keys", label: "API Keys & Quota", icon: Key },
	];

	return (
		<header className="border-b border-slate-800 bg-[#0a0d14]/90 backdrop-blur-md sticky top-0 z-50">
			<Container className="h-16 flex items-center justify-between">
				<div className="flex items-center space-x-6">
					<Link href="/" className="flex items-center space-x-3 group">
						<div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-sky-500/20 group-hover:scale-105 transition">
							<Video className="w-5 h-5" />
						</div>
						<div>
							<span className="font-bold text-base sm:text-lg tracking-tight bg-gradient-to-r from-white via-sky-200 to-sky-400 bg-clip-text text-transparent">
								Study Video Studio AI
							</span>
							<span className="text-[11px] text-sky-400/80 block">
								Next.js 16 • React 19 • Skia Engine
							</span>
						</div>
					</Link>

					<nav className="hidden md:flex items-center space-x-1 pl-4 border-l border-slate-800">
						{navItems.map((item) => {
							const Icon = item.icon;
							const isActive = pathname === item.href;
							return (
								<Link
									key={item.href}
									href={item.href}
									className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
										isActive
											? "bg-sky-500/15 text-sky-300 border border-sky-500/30 shadow-xs"
											: "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
									}`}
								>
									<Icon className="w-3.5 h-3.5" />
									<span>{item.label}</span>
								</Link>
							);
						})}
					</nav>
				</div>

				<div className="flex items-center space-x-2.5 text-xs">
					<Link
						href="/keys"
						className="inline-flex items-center px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 font-medium transition cursor-pointer"
					>
						<span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse" />
						<span>{activeKeyLabel || "API Key Active"}</span>
					</Link>
					<span className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/20 font-medium">
						1080p Standard
					</span>
				</div>
			</Container>

			{/* Mobile Nav Tabs */}
			<div className="flex md:hidden border-t border-slate-800/80 px-4 py-2 gap-1 overflow-x-auto bg-[#0a0d14]">
				{navItems.map((item) => {
					const Icon = item.icon;
					const isActive = pathname === item.href;
					return (
						<Link
							key={item.href}
							href={item.href}
							className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 shrink-0 ${
								isActive
									? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
									: "text-slate-400 hover:text-slate-200"
							}`}
						>
							<Icon className="w-3.5 h-3.5" />
							<span>{item.label}</span>
						</Link>
					);
				})}
			</div>
		</header>
	);
}
