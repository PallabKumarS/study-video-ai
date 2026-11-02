import type { Metadata } from "next";
import { Toaster } from "sonner";
import { GenerationFloatingWidget } from "@/components/generation-floating-widget";
import { GenerationProvider } from "@/context/generation-context";
import "./globals.css";

export const metadata: Metadata = {
	title: "Study Video Studio AI — Gemini & Veo Video Engine",
	description:
		"Create cinematic study reels and educational videos with exact science ray diagrams, multi-segment planning, and bilingual voiceovers.",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" className="dark">
			<body className="min-h-screen flex flex-col bg-[#090c13] text-slate-100 antialiased">
				<Toaster position="top-right" richColors />
				<GenerationProvider>
					{children}
					<GenerationFloatingWidget />
				</GenerationProvider>
			</body>
		</html>
	);
}
