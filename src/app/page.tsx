import { Header } from "@/components/header";
import { StudioView } from "@/components/studio-view";
import {
	getKeysData,
	getModelsCatalog,
	getVideoHistory,
} from "@/lib/server-api";

export const dynamic = "force-dynamic";

export default async function Home() {
	const [initialVideos, initialKeys, modelsData] = await Promise.all([
		getVideoHistory(),
		getKeysData(),
		getModelsCatalog(),
	]);

	const activeKey = initialKeys.find((k) => k.is_active);
	const activeKeyLabel = activeKey
		? `Key: ${activeKey.masked_key}`
		: "API Key Active";

	return (
		<div className="min-h-screen flex flex-col bg-[#090c13] text-slate-100 font-sans">
			<Header activeKeyLabel={activeKeyLabel} />
			<StudioView
				initialVideos={initialVideos}
				initialKeys={initialKeys}
				initialAdvisorList={modelsData.advisorList}
				initialThemes={modelsData.themes}
			/>
		</div>
	);
}
