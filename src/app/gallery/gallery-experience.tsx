"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { PublicPhotoCard } from "@/features/photos/contracts";
import { useGalleryContent } from "@/components/Theme/site-design-provider";
import { CustomDropdown } from "@/components/ui/custom-dropdown";

export function GalleryExperience({ photos }: { photos: PublicPhotoCard[] }) {
    const content = useGalleryContent();
    const [search, setSearch] = useState("");
    const [selectedAlbum, setSelectedAlbum] = useState("");
    const [favoritesOnly, setFavoritesOnly] = useState(false);
    const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "title">("newest");
    const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);
    const [zoomed, setZoomed] = useState(false);
    const dialogRef = useRef<HTMLDialogElement>(null);
    const touchStartX = useRef<number | null>(null);
    const albums = [...new Set(photos.map((photo) => photo.album.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    const visiblePhotos = useMemo(() => {
        const query = search.trim().toLocaleLowerCase();
        return photos
            .map((photo, index) => ({ photo, index }))
            .filter(({ photo }) =>
                (!selectedAlbum || photo.album.trim() === selectedAlbum) &&
                (!favoritesOnly || photo.isFavorite) &&
                (!query || `${photo.title} ${photo.caption} ${photo.album}`.toLocaleLowerCase().includes(query)),
            )
            .sort((left, right) => {
                if (sortOrder === "title") {
                    return left.photo.title.localeCompare(right.photo.title);
                }
                return sortOrder === "oldest"
                    ? right.index - left.index
                    : left.index - right.index;
            })
            .map(({ photo }) => photo);
    }, [favoritesOnly, photos, search, selectedAlbum, sortOrder]);
    const featuredPhoto = visiblePhotos[0];
    const collagePhotos = visiblePhotos.slice(0, content.collageImageCount);
    const collageFocalIndex = Math.floor((collagePhotos.length - 1) / 2);
    const layoutClass = content.collectionLayout === "masonry" ? "gallery-masonry" : "gallery-grid";
    const activePhoto = activePhotoIndex === null ? null : visiblePhotos[activePhotoIndex] ?? null;
    const photoOrder = useMemo(
        () => new Map(visiblePhotos.map((photo, index) => [photo.id, index + 1])),
        [visiblePhotos],
    );
    const albumGroups = useMemo(() => {
        const grouped = new Map<string, PublicPhotoCard[]>();
        for (const photo of visiblePhotos) {
            const album = photo.album.trim() || "Uncategorized";
            grouped.set(album, [...(grouped.get(album) ?? []), photo]);
        }
        return [...grouped.entries()].sort(([left], [right]) => {
            if (left === "Uncategorized") return 1;
            if (right === "Uncategorized") return -1;
            return left.localeCompare(right);
        });
    }, [visiblePhotos]);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        if (activePhoto && !dialog.open) dialog.showModal();
        if (!activePhoto && dialog.open) dialog.close();
    }, [activePhoto]);

    useEffect(() => {
        if (!activePhoto) return;
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                event.preventDefault();
                dialogRef.current?.close();
            } else if (event.key === "ArrowRight") {
                event.preventDefault();
                setActivePhotoIndex((index) => index === null ? null : (index + 1) % visiblePhotos.length);
                setZoomed(false);
            } else if (event.key === "ArrowLeft") {
                event.preventDefault();
                setActivePhotoIndex((index) => index === null ? null : (index - 1 + visiblePhotos.length) % visiblePhotos.length);
                setZoomed(false);
            } else if (event.key === "+" || event.key === "=") {
                setZoomed(true);
            } else if (event.key === "-") {
                setZoomed(false);
            }
        }
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [activePhoto, visiblePhotos.length]);

    function showPhoto(photo: PublicPhotoCard) {
        const index = visiblePhotos.findIndex((candidate) => candidate.id === photo.id);
        if (index >= 0) {
            setZoomed(false);
            setActivePhotoIndex(index);
        }
    }

    function showAdjacentPhoto(direction: -1 | 1) {
        setZoomed(false);
        setActivePhotoIndex((index) =>
            index === null ? null : (index + direction + visiblePhotos.length) % visiblePhotos.length,
        );
    }

    return (
        <main
            className="gallery-page"
            id="top"
            style={{
                "--gallery-header-background": content.headerBackground,
                "--gallery-hero-scale": content.heroScale / 100,
                "--gallery-hero-background": content.heroBackground,
                "--gallery-featured-background": content.featuredBackground,
                "--gallery-collection-background": content.collectionBackground,
                "--gallery-visit-background": content.visitBackground,
                "--gallery-footer-background": content.footerBackground,
                "--gallery-photo-card-background": content.photoCardBackground,
                "--gallery-photo-card-border": content.photoCardBorder,
                "--gallery-collage-frame-background": content.collageFrameBackground,
            } as CSSProperties}
        >
            {content.showHeader && <header className="gallery-header">
                <a aria-label={`${content.brandName} ${content.brandDescriptor}`} className="gallery-wordmark" href="#top">
                    <span>{content.brandName}</span>
                    <span className="gallery-brand-descriptor">{content.brandDescriptor}</span>
                </a>
                <nav aria-label={`${content.brandName} navigation`} className="gallery-nav">
                    <a href="#exhibition">{content.exhibitionNavLabel}</a>
                    {content.showCollection && <a href="#collection">{content.collectionNavLabel}</a>}
                    {content.showVisit && <a href="#visit">{content.visitNavLabel}</a>}
                </nav>
            </header>}

            <section aria-labelledby="gallery-title" className="gallery-hero" id="exhibition">
                <div className="gallery-hero-kicker">
                    <span>{content.exhibitionNumber}</span>
                    {content.showStatus && (
                        <span className="gallery-status">
                            <i aria-hidden="true" />
                            {content.statusLabel} · {photos.length} {photos.length === 1 ? content.workSingularLabel : content.workPluralLabel}
                        </span>
                    )}
                </div>
                <div className="gallery-hero-copy">
                    <h1 id="gallery-title">
                        {content.heroTitle}{" "}
                        <em>{content.heroEmphasis}</em>
                    </h1>
                    <p>{content.heroDescription}</p>
                </div>
                {content.showCollage && collagePhotos.length > 0 && (
                    <div
                        aria-label={`${collagePhotos.length} ${content.photoPluralLabel} from ${content.brandName}`}
                        className="gallery-collage"
                        style={{ "--collage-count": collagePhotos.length } as CSSProperties}
                    >
                        {collagePhotos.map((photo, index) => (
                            <button
                                aria-label={`${content.photoOpenLabel} ${photo.title}`}
                                className="gallery-collage-frame"
                                key={`${photo.id}-collage`}
                                onClick={() => showPhoto(photo)}
                                type="button"
                                style={{ "--collage-index": index } as CSSProperties}
                            >
                                <span aria-hidden="true" className="gallery-open-label">
                                    {content.photoOpenLabel} ↗
                                </span>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    alt={photo.title}
                                    decoding="async"
                                    fetchPriority={index === collageFocalIndex ? "high" : "auto"}
                                    height={photo.height}
                                    loading={index === collageFocalIndex ? "eager" : "lazy"}
                                    sizes="(max-width: 640px) 28vw, (max-width: 1100px) 22vw, 18vw"
                                    src={photo.thumbnailUrl}
                                    width={photo.width}
                                />
                            </button>
                        ))}
                    </div>
                )}
                {content.showCollage && collagePhotos.length === 0 && (
                    <div className="gallery-collage-empty">
                        <span>{content.collageEmptyLabel}</span>
                    </div>
                )}
            </section>

            {content.showFeatured && featuredPhoto && (
                <section aria-labelledby="featured-title" className="gallery-featured">
                    <div className="gallery-featured-heading">
                        <span>{content.featuredLabel}</span>
                        <span>01 / {String(photos.length).padStart(2, "0")}</span>
                    </div>
                    <article className={`gallery-featured-work gallery-featured-${content.featureImageSide}`}>
                        <button
                            aria-label={`${content.photoOpenLabel} ${featuredPhoto.title}`}
                            className="gallery-featured-image"
                            onClick={() => showPhoto(featuredPhoto)}
                            type="button"
                        >
                            <span aria-hidden="true" className="gallery-open-label">
                                {content.photoOpenLabel} ↗
                            </span>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                alt={featuredPhoto.title}
                                decoding="async"
                                height={featuredPhoto.height}
                                loading="lazy"
                                sizes="(max-width: 760px) 100vw, 58vw"
                                src={featuredPhoto.thumbnailUrl}
                                width={featuredPhoto.width}
                            />
                        </button>
                        <div className="gallery-featured-copy">
                            <p className="gallery-room-label">{content.featuredRoomLabel}</p>
                            <p className="gallery-photo-index">01</p>
                            <h2 id="featured-title">{featuredPhoto.title}</h2>
                            <p className="gallery-featured-byline">{content.brandName} · {content.featuredByline}</p>
                            {featuredPhoto.caption && <p className="gallery-featured-caption">{featuredPhoto.caption}</p>}
                            <p className="gallery-featured-meta">{content.featuredMeta}</p>
                        </div>
                    </article>
                </section>
            )}

            {content.showCollection && (
                <section aria-labelledby="collection-title" className="gallery-collection" id="collection">
                    <div className="gallery-collection-heading">
                        <p className="gallery-section-label">{content.collectionLabel}</p>
                        <div className="gallery-collection-title-row">
                            <h2 id="collection-title">{content.collectionTitle}</h2>
                            <span>{visiblePhotos.length} {visiblePhotos.length === 1 ? content.photoSingularLabel : content.photoPluralLabel}</span>
                        </div>
                    </div>
                    <div className="gallery-filters" aria-label="Filter and sort photographs">
                        <label>
                            <span>Search</span>
                            <input
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Title, caption, album"
                                type="search"
                                value={search}
                            />
                        </label>
                        <label>
                            <span>Album</span>
                            <CustomDropdown
                                ariaLabel="Filter by album"
                                buttonClassName="flex min-h-10 min-w-36 items-center justify-between gap-3 rounded-lg border border-stone-300 bg-white px-3 text-left text-sm text-stone-800 shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gallery-accent)]"
                                onChange={setSelectedAlbum}
                                options={[
                                    { value: "", label: "All albums" },
                                    ...albums.map((album) => ({ value: album, label: album })),
                                ]}
                                value={selectedAlbum}
                            />
                        </label>
                        <label>
                            <span>Sort</span>
                            <CustomDropdown<"newest" | "oldest" | "title">
                                ariaLabel="Sort photographs"
                                buttonClassName="flex min-h-10 min-w-36 items-center justify-between gap-3 rounded-lg border border-stone-300 bg-white px-3 text-left text-sm text-stone-800 shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gallery-accent)]"
                                onChange={setSortOrder}
                                options={[
                                    { value: "newest", label: "Newest" },
                                    { value: "oldest", label: "Oldest" },
                                    { value: "title", label: "Title" },
                                ]}
                                value={sortOrder}
                            />
                        </label>
                        <label className="gallery-favorites-filter">
                            <input checked={favoritesOnly} onChange={(event) => setFavoritesOnly(event.target.checked)} type="checkbox" />
                            Favorites
                        </label>
                    </div>
                    {visiblePhotos.length === 0 ? (
                        <div className="gallery-empty">
                            <h3>{photos.length ? "No photographs match these filters." : content.emptyTitle}</h3>
                            <p>{photos.length ? "Try changing your search or filter." : content.emptyDescription}</p>
                        </div>
                    ) : (
                        albumGroups.map(([album, albumPhotos]) => (
                            <div className="gallery-album-group" key={album}>
                                {(albumGroups.length > 1 || album !== "Uncategorized") && <h3>{album}</h3>}
                                <div
                                    className={layoutClass}
                                    style={{ "--gallery-columns": content.collectionColumns } as CSSProperties}
                                >
                                    {albumPhotos.map((photo) => (
                                            <figure className="gallery-work" key={photo.id}>
                                                <button
                                                    aria-label={`${content.photoOpenLabel} ${photo.title}`}
                                                    className="gallery-work-image"
                                                    onClick={() => showPhoto(photo)}
                                                    type="button"
                                                >
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        alt={photo.title}
                                                        decoding="async"
                                                        height={photo.height}
                                                        loading="lazy"
                                                        sizes="(max-width: 640px) 50vw, (max-width: 1100px) 33vw, 25vw"
                                                        src={photo.thumbnailUrl}
                                                        width={photo.width}
                                                    />
                                                    <span aria-hidden="true" className="gallery-open-label">{content.photoOpenLabel} ↗</span>
                                                </button>
                                                <figcaption>
                                                    <span>{photo.title}</span>
                                                    <span>{String(photoOrder.get(photo.id) ?? 0).padStart(2, "0")}</span>
                                                    {photo.isFavorite && <span aria-label="Favorite" className="gallery-favorite-indicator">★</span>}
                                                    {photo.caption && <p>{photo.caption}</p>}
                                                </figcaption>
                                            </figure>
                                        ))}
                                </div>
                            </div>
                        ))
                    )}
                </section>
            )}

            {content.showVisit && (
                <section aria-labelledby="visit-title" className="gallery-visit" id="visit">
                    <p className="gallery-section-label">{content.visitLabel}</p>
                    <h2 id="visit-title">{content.visitTitle}</h2>
                    <p className="gallery-visit-description">{content.visitDescription}</p>
                    <a href={content.showCollection ? "#collection" : "#exhibition"}>
                        {content.visitLinkLabel}<span aria-hidden="true">↗</span>
                    </a>
                </section>
            )}

            {content.showFooter && (
                <footer className="gallery-footer">
                    <a className="gallery-footer-brand" href="#top">
                        {content.brandName}<span>{content.brandDescriptor}</span>
                    </a>
                    <p>{content.footerNote}</p>
                    <a href="#top">{content.backToTopLabel} ↑</a>
                </footer>
            )}
            <dialog
                aria-label="Photo viewer"
                className="gallery-lightbox"
                onClose={() => {
                    setActivePhotoIndex(null);
                    setZoomed(false);
                }}
                onClick={(event) => {
                    if (event.target === dialogRef.current) dialogRef.current?.close();
                }}
                onTouchStart={(event) => { touchStartX.current = event.changedTouches[0]?.clientX ?? null; }}
                onTouchEnd={(event) => {
                    const startX = touchStartX.current;
                    const endX = event.changedTouches[0]?.clientX;
                    touchStartX.current = null;
                    if (startX === null || endX === undefined || zoomed || Math.abs(endX - startX) < 50) return;
                    showAdjacentPhoto(endX < startX ? 1 : -1);
                }}
                ref={dialogRef}
            >
                {activePhoto && (
                    <div className="gallery-lightbox-content">
                        <div className="gallery-lightbox-toolbar">
                            <span>{activePhotoIndex! + 1} / {visiblePhotos.length}</span>
                            <button aria-label={zoomed ? "Zoom out" : "Zoom in"} onClick={() => setZoomed((current) => !current)} type="button">
                                {zoomed ? "−" : "+"}
                            </button>
                            <button aria-label="Close photo viewer" onClick={() => dialogRef.current?.close()} type="button">×</button>
                        </div>
                        <button aria-label="Previous photograph" className="gallery-lightbox-nav gallery-lightbox-previous" onClick={() => showAdjacentPhoto(-1)} type="button">‹</button>
                        <div className={`gallery-lightbox-image-wrap${zoomed ? " is-zoomed" : ""}`}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                alt={activePhoto.title}
                                onClick={() => setZoomed((current) => !current)}
                                src={activePhoto.imageUrl}
                            />
                        </div>
                        <button aria-label="Next photograph" className="gallery-lightbox-nav gallery-lightbox-next" onClick={() => showAdjacentPhoto(1)} type="button">›</button>
                        <div className="gallery-lightbox-caption">
                            <h2>{activePhoto.title}</h2>
                            {activePhoto.caption && <p>{activePhoto.caption}</p>}
                        </div>
                    </div>
                )}
            </dialog>
        </main>
    );
}
