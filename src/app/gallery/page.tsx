import type { Metadata } from "next";
import "./gallery.css";
import { GalleryExperience } from "./gallery-experience";
import { listPublicPhotos } from "@/server/photos";
import { getSiteDesign } from "@/server/site-design";
import { defaultGalleryContent, resolvePageDesignOverrides } from "@/theme/design-system";

export async function generateMetadata(): Promise<Metadata> {
    const design = await getSiteDesign();
    const galleryOverrides = resolvePageDesignOverrides(design, "/gallery")?.galleryContent;
    const content = { ...defaultGalleryContent, ...galleryOverrides };

    return {
        title: content.pageTitle,
        description: content.pageDescription,
    };
}

export const instant = false;

export default async function GalleryPage() {
    const photos = await listPublicPhotos();
    return <GalleryExperience photos={photos} />;
}
