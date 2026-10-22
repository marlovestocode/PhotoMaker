import { connection } from "next/server";
import { redirect } from "next/navigation";
import { DesignStudio } from "@/components/Theme/design-studio";
import { getOwnerAccess } from "@/server/auth/owner";
import { getOwnerDesignPresets, getSiteDesign } from "@/server/site-design";

export const instant = false;

export default async function DesignSettingsPage() {
    await connection();
    const access = await getOwnerAccess();

    if (!access.ok && access.status === 401) {
        redirect("/auth/sign-in");
    }

    if (!access.ok) {
        return (
            <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-6">
                <h1 className="text-2xl font-semibold">Design settings unavailable</h1>
                <p className="mt-3 leading-7">{access.message}</p>
            </main>
        );
    }

    const [design, customPresets] = await Promise.all([
        getSiteDesign(access.user.id),
        getOwnerDesignPresets(access.user.id),
    ]);

    return <DesignStudio initialDesign={design} customPresets={customPresets} />;
}
