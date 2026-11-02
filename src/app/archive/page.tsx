import { ArchiveView } from "@/components/archive-view";
import { Header } from "@/components/header";
import { getKeysData, getVideoHistory } from "@/lib/server-api";

export const dynamic = "force-dynamic";

export default async function ArchivePage() {
	const [initialVideos, keys] = await Promise.all([
		getVideoHistory(),
		getKeysData(),
	]);

	const activeKey = keys.find((k) => k.is_active);

	return (
		<div className="min-h-screen bg-[#090c13] text-slate-100 flex flex-col font-sans">
			<Header
				activeKeyLabel={
					activeKey ? `Key: ${activeKey.masked_key}` : "Connected"
				}
			/>
			<ArchiveView initialVideos={initialVideos} />
		</div>
	);
}
