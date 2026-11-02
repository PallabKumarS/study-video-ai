import { KeysView } from "@/components/keys-view";
import { getKeysData } from "@/lib/server-api";

export const dynamic = "force-dynamic";

export default async function KeysPage() {
	const initialKeys = await getKeysData();
	return <KeysView initialKeys={initialKeys} />;
}
