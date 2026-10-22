import type { Metadata } from "next";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { DesignStudio } from "@/components/Theme/design-studio";
import { StudioIcon } from "@/components/Theme/design-studio/icons";
import { getOwnerAccess } from "@/server/auth/owner";
import { getOwnerDesignPresets, getSiteDesign } from "@/server/site-design";

export const metadata: Metadata = {
    title: "Design studio · Photo Maker",
    description:
        "Shape the typography, color, layout, and per-page styling of your Photo Maker site with a live preview.",
};

export const instant = false;

export default async function DesignSettingsPage(props: PageProps<"/settings/design">) {
    await connection();
    const searchParams = await props.searchParams;
    const access = await getOwnerAccess();

    if (!access.ok && access.status === 401) {
        redirect("/auth/sign-in");
    }

    if (!access.ok) {
        return (
            <main className="studio-error-page">
                <div className="studio-error-card" role="alert">
                    <span aria-hidden="true" className="studio-error-card__icon">
                        <StudioIcon name="warning" size={20} />
                    </span>
                    <h1>Design studio unavailable</h1>
                    <p>{access.message}</p>
                    <div className="studio-error-card__actions">
                        <a className="studio-button studio-button--secondary" href="/upload">
                            Back to the photo studio
                        </a>
                    </div>
                </div>
            </main>
        );
    }

    if (searchParams.designPreview === "1") {
        return (
            <main className="studio-embedded">
                <div className="studio-embedded__card">
                    <span aria-hidden="true" className="studio-embedded__mark">
                        <StudioIcon name="aperture" size={22} />
                    </span>
                    <h1>Design studio</h1>
                    <p>
                        This route is the editing workspace itself. Choose any other page in the
                        preview to see your design changes in place.
                    </p>
                </div>
            </main>
        );
    }

    const [design, customPresets] = await Promise.all([
        getSiteDesign(access.user.id),
        getOwnerDesignPresets(access.user.id),
    ]);

    return <DesignStudio initialDesign={design} customPresets={customPresets} />;
}
