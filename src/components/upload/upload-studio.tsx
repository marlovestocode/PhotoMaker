"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { authClient } from "@/server/auth/client";
import { CustomDropdown } from "@/components/ui/custom-dropdown";
import { CheckmarkCheckbox } from "@/components/ui/checkmark-checkbox";
import {
    updatePhotoResponseSchema,
    uploadResponseSchema,
    type PhotoCard,
} from "@/features/photos/contracts";

type CropShape = "original" | "square" | "landscape" | "portrait";

function getErrorMessage(result: unknown, fallback: string) {
    const parsed = apiErrorSchema.safeParse(result);
    return parsed.success ? parsed.data.error : fallback;
}

const apiErrorSchema = z.object({
    error: z.string(),
});

const deleteResponseSchema = z.object({
    deleted: z.literal(true),
    cleanupPending: z.boolean(),
});

export function UploadStudio({
    initialPhotos,
    ownerName,
}: {
    initialPhotos: PhotoCard[];
    ownerName: string;
}) {
    const [photos, setPhotos] = useState(initialPhotos);
    const [search, setSearch] = useState("");
    const [sortOrder, setSortOrder] = useState("newest");
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [editingPhoto, setEditingPhoto] = useState<PhotoCard | null>(null);
    const [cropPhoto, setCropPhoto] = useState<PhotoCard | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [editCaption, setEditCaption] = useState("");
    const [editAlbum, setEditAlbum] = useState("");
    const [editFavorite, setEditFavorite] = useState(false);
    const [cropShape, setCropShape] = useState<CropShape>("square");
    const [rotation, setRotation] = useState(0);
    const [error, setError] = useState("");
    const [status, setStatus] = useState("");
    const [busy, setBusy] = useState("");
    const router = useRouter();
    const editDialogRef = useRef<HTMLDialogElement>(null);
    const cropDialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        editDialogRef.current?.showModal();
    }, [editingPhoto]);

    useEffect(() => {
        cropDialogRef.current?.showModal();
    }, [cropPhoto]);

    function closeEditDialog() {
        if (editDialogRef.current?.open) {
            editDialogRef.current.close();
        } else {
            setEditingPhoto(null);
        }
    }

    function closeCropDialog() {
        if (cropDialogRef.current?.open) {
            cropDialogRef.current.close();
        } else {
            setCropPhoto(null);
        }
    }

    const visiblePhotos = useMemo(() => {
        const query = search.trim().toLocaleLowerCase();
        const matching = photos.filter((photo) =>
            `${photo.title} ${photo.caption}`.toLocaleLowerCase().includes(query),
        );

        return matching.sort((a, b) => {
            if (sortOrder === "title") {
                return a.title.localeCompare(b.title);
            }
            if (sortOrder === "oldest") {
                return photos.indexOf(b) - photos.indexOf(a);
            }
            return photos.indexOf(a) - photos.indexOf(b);
        });
    }, [photos, search, sortOrder]);

    function updatePhotoInGallery(updated: PhotoCard) {
        setPhotos((current) => current.map((photo) => (photo.id === updated.id ? updated : photo)));
    }

    async function uploadPhotos(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const form = event.currentTarget;
        const values = new FormData(form);
        const files = values.getAll("file").filter(
            (value): value is File => value instanceof File && value.size > 0,
        );

        if (files.length === 0) {
            setError("Choose at least one photo to upload.");
            return;
        }

        setError("");
        setStatus("");
        setBusy("upload");
        let uploadedCount = 0;
        const sharedTitle = String(values.get("title") ?? "").trim();
        const caption = String(values.get("caption") ?? "");
        const album = String(values.get("album") ?? "").trim();

        try {
            for (const [index, file] of files.entries()) {
                setStatus(`Uploading ${index + 1} of ${files.length}: ${file.name}`);
                const upload = new FormData();
                const filenameTitle = file.name.replace(/\.[^.]+$/, "").trim();
                upload.append("file", file);
                upload.append("title", sharedTitle || filenameTitle || "Untitled photo");
                upload.append("caption", caption);
                upload.append("album", album);

                const response = await fetch("/api/photos", { method: "POST", body: upload });
                const result: unknown = await response.json();

                if (!response.ok) {
                    throw new Error(getErrorMessage(result, `Could not upload ${file.name}.`));
                }

                const parsed = uploadResponseSchema.safeParse(result);

                if (!parsed.success) {
                    throw new Error("The server returned an unexpected upload response.");
                }

                setPhotos((current) => [parsed.data.photo, ...current]);
                uploadedCount += 1;
            }

            setStatus(`${uploadedCount} ${uploadedCount === 1 ? "photo was" : "photos were"} uploaded.`);
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "The photos could not be uploaded.");
            if (uploadedCount > 0) {
                setStatus(`Uploaded ${uploadedCount} of ${files.length} photos before the error.`);
            }
        } finally {
            if (uploadedCount > 0) {
                form.reset();
            }
            setBusy("");
        }
    }

    async function patchPhoto(photoId: string, updates: Record<string, string | number | boolean>) {
        const response = await fetch(`/api/photos/${photoId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates),
        });
        const result: unknown = await response.json();

        if (!response.ok) {
            throw new Error(getErrorMessage(result, "The photo could not be updated."));
        }

        const parsed = updatePhotoResponseSchema.safeParse(result);

        if (!parsed.success) {
            throw new Error("The server returned an unexpected photo update response.");
        }

        updatePhotoInGallery(parsed.data.photo);
        return parsed.data;
    }

    async function saveDetails(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!editingPhoto) return;
        setError("");
        setStatus("");
        setBusy(`edit:${editingPhoto.id}`);

        try {
            const result = await patchPhoto(editingPhoto.id, {
                title: editTitle,
                caption: editCaption,
                album: editAlbum,
                isFavorite: editFavorite,
            });
            setStatus(result.cleanupPending ? "Details saved; old image files still need cleanup." : "Photo details saved.");
            closeEditDialog();
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "The photo details could not be saved.");
        } finally {
            setBusy("");
        }
    }

    async function applyCrop() {
        if (!cropPhoto) return;
        setError("");
        setStatus("");
        setBusy(`crop:${cropPhoto.id}`);

        try {
            const updates: Record<string, string | number> = {};
            if (cropShape !== "original") updates.crop = cropShape;
            if (rotation !== 0) updates.rotation = rotation;
            const result = await patchPhoto(cropPhoto.id, updates);
            setStatus(result.cleanupPending ? "Edits saved; old image files still need cleanup." : "Crop and rotation saved.");
            closeCropDialog();
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "The photo could not be edited.");
        } finally {
            setBusy("");
        }
    }

    async function toggleVisibility(photo: PhotoCard) {
        const visibility = photo.visibility === "public" ? "private" : "public";
        setError("");
        setStatus("");
        setBusy(`visibility:${photo.id}`);

        try {
            await patchPhoto(photo.id, { visibility });
            setStatus(
                visibility === "public"
                    ? "Photo published to the public gallery."
                    : "Photo removed. Previously copied links may work for up to an hour; saved copies can’t be recalled.",
            );
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "The photo visibility could not be updated.");
        } finally {
            setBusy("");
        }
    }

    async function toggleFavorite(photo: PhotoCard) {
        setError("");
        setStatus("");
        setBusy(`favorite:${photo.id}`);

        try {
            await patchPhoto(photo.id, { isFavorite: !photo.isFavorite });
            setStatus(photo.isFavorite ? "Photo removed from favorites." : "Photo added to favorites.");
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "The favorite status could not be updated.");
        } finally {
            setBusy("");
        }
    }

    async function deleteSelected(ids: string[]) {
        if (ids.length === 0) return;
        const prompt = ids.length === 1 ? "Delete this photo permanently?" : `Delete these ${ids.length} photos permanently?`;
        if (!window.confirm(prompt)) return;

        setError("");
        setStatus("");
        setBusy("delete");
        let deletedCount = 0;
        let cleanupPending = false;

        try {
            for (const id of ids) {
                const response = await fetch(`/api/photos/${id}`, { method: "DELETE" });
                const result: unknown = await response.json();

                if (!response.ok) {
                    throw new Error(getErrorMessage(result, "The photo could not be deleted."));
                }

                const deletion = deleteResponseSchema.safeParse(result);
                if (!deletion.success) {
                    throw new Error("The server returned an unexpected delete response.");
                }
                cleanupPending ||= deletion.data.cleanupPending;
                setPhotos((current) => current.filter((photo) => photo.id !== id));
                setSelectedIds((current) => current.filter((selectedId) => selectedId !== id));
                deletedCount += 1;
            }

            setStatus(
                cleanupPending
                    ? "Photo records deleted; some storage files need cleanup."
                    : `${deletedCount} ${deletedCount === 1 ? "photo" : "photos"} deleted.`,
            );
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "The photo could not be deleted.");
            if (deletedCount > 0) {
                setStatus(`Deleted ${deletedCount} of ${ids.length} photos before the error.`);
            }
        } finally {
            setBusy("");
        }
    }

    async function copyPhotoLink(photo: PhotoCard) {
        try {
            await navigator.clipboard.writeText(photo.url);
            setError("");
            setStatus("A private, temporary photo link was copied.");
        } catch (cause) {
            console.error("Could not copy photo link:", cause);
            setError("Could not copy the photo link. Check your browser clipboard permissions.");
        }
    }

    async function signOut() {
        const result = await authClient.signOut();

        if (result.error) {
            setError(result.error.message || "Could not sign out.");
            return;
        }

        router.push("/auth/sign-in");
    }

    const allVisibleSelected =
        visiblePhotos.length > 0 && visiblePhotos.every((photo) => selectedIds.includes(photo.id));

    return (
        <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-6 sm:px-8 sm:py-10">
            <header className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 pb-6">
                <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-800">Photo Maker</p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900">Your photo book</h1>
                    <p className="mt-1 text-stone-600">Signed in as {ownerName}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <a
                        className="flex min-h-11 items-center rounded-xl border border-stone-300 px-4 font-medium text-stone-800 hover:bg-white"
                        href="/gallery"
                    >
                        View public gallery
                    </a>
                    <a
                        className="flex min-h-11 items-center rounded-xl border border-stone-300 px-4 font-medium text-stone-800 hover:bg-white"
                        href="/settings/design"
                    >
                        Design settings
                    </a>
                    <button
                        className="min-h-11 rounded-xl border border-stone-300 px-4 font-medium text-stone-800 hover:bg-white"
                        onClick={signOut}
                        type="button"
                    >
                        Sign out
                    </button>
                </div>
            </header>

            <section aria-labelledby="upload-heading" className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
                <div className="h-fit rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-7">
                    <h2 className="text-xl font-semibold text-stone-900" id="upload-heading">Add photos</h2>
                    <p className="mt-2 text-sm leading-6 text-stone-600">
                        Select multiple JPEG, PNG, or WebP files. Each photo is resized and stored privately.
                    </p>

                    <form className="mt-6 space-y-5" onSubmit={uploadPhotos}>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-stone-800" htmlFor="photo-file">
                                Choose photos
                            </label>
                            <input
                                accept="image/jpeg,image/png,image/webp"
                                className="block min-h-12 w-full rounded-xl border border-stone-300 bg-stone-50 p-2 text-sm file:mr-3 file:min-h-9 file:rounded-lg file:border-0 file:bg-stone-900 file:px-3 file:font-medium file:text-white"
                                id="photo-file"
                                multiple
                                name="file"
                                required
                                type="file"
                            />
                            <p className="mt-1 text-xs text-stone-500">Up to 15 MB per photo.</p>
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-stone-800" htmlFor="photo-title">
                                Title (optional)
                            </label>
                            <input
                                className="min-h-12 w-full rounded-xl border border-stone-300 px-4 outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-700/20"
                                id="photo-title"
                                maxLength={120}
                                name="title"
                                placeholder="Uses each filename if blank"
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-stone-800" htmlFor="photo-caption">
                                Caption (optional)
                            </label>
                            <textarea
                                className="min-h-24 w-full resize-y rounded-xl border border-stone-300 px-4 py-3 outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-700/20"
                                id="photo-caption"
                                maxLength={1000}
                                name="caption"
                                placeholder="Add a little story about these photos..."
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-stone-800" htmlFor="photo-album">
                                Album (optional)
                            </label>
                            <input
                                className="min-h-12 w-full rounded-xl border border-stone-300 px-4"
                                id="photo-album"
                                maxLength={80}
                                name="album"
                                placeholder="e.g. Summer holidays"
                            />
                        </div>
                        <button
                            className="site-primary-button min-h-12 w-full rounded-xl px-5 font-semibold transition disabled:cursor-wait disabled:opacity-60"
                            disabled={Boolean(busy)}
                            style={{ backgroundColor: "var(--site-button-background)", color: "var(--site-button-text)" }}
                            type="submit"
                        >
                            {busy === "upload" ? "Uploading photos..." : "Upload photos"}
                        </button>
                    </form>

                    <div aria-live="polite" className="mt-4 space-y-1 text-sm">
                        {status && <p className="text-emerald-800">{status}</p>}
                        {error && <p className="text-red-700">{error}</p>}
                    </div>
                </div>

                <section aria-labelledby="gallery-heading">
                    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <h2 className="text-xl font-semibold text-stone-900" id="gallery-heading">Photo library</h2>
                            <p className="mt-1 text-sm text-stone-600">
                                {visiblePhotos.length} of {photos.length} {photos.length === 1 ? "photo" : "photos"}
                            </p>
                        </div>
                        {photos.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                <label className="sr-only" htmlFor="photo-search">Search photos</label>
                                <input
                                    className="min-h-10 rounded-lg border border-stone-300 px-3 text-sm"
                                    id="photo-search"
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Search photos"
                                    type="search"
                                    value={search}
                                />
                                <CustomDropdown
                                    ariaLabel="Sort photos"
                                    buttonClassName="flex min-h-10 min-w-36 items-center justify-between gap-3 rounded-lg border border-stone-300 bg-white px-3 text-left text-sm text-stone-800 shadow-sm hover:bg-stone-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-800"
                                    id="photo-sort"
                                    onChange={setSortOrder}
                                    options={[
                                        { label: "Newest", value: "newest" },
                                        { label: "Oldest", value: "oldest" },
                                        { label: "Title", value: "title" },
                                    ]}
                                    value={sortOrder}
                                />
                            </div>
                        )}
                    </div>

                    {photos.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-stone-300 bg-white/60 px-6 py-16 text-center">
                            <p className="font-medium text-stone-800">Your gallery is ready for its first photo.</p>
                            <p className="mt-2 text-sm text-stone-600">Choose photos to begin building the family collection.</p>
                        </div>
                    ) : (
                        <>
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3">
                                <CheckmarkCheckbox
                                    checked={allVisibleSelected}
                                    className="min-h-8 text-sm font-medium text-stone-700"
                                    label="Select visible"
                                    onChange={(event) =>
                                        setSelectedIds((current) =>
                                            event.target.checked
                                                ? [...new Set([...current, ...visiblePhotos.map((photo) => photo.id)])]
                                                : current.filter((id) => !visiblePhotos.some((photo) => photo.id === id)),
                                        )
                                    }
                                />
                                {selectedIds.length > 0 && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <span>{selectedIds.length} selected</span>
                                        <button
                                            className="font-semibold text-red-700 underline disabled:opacity-50"
                                            disabled={Boolean(busy)}
                                            onClick={() => deleteSelected(selectedIds)}
                                            type="button"
                                        >
                                            Delete selected
                                        </button>
                                        <button
                                            className="text-stone-600 underline"
                                            onClick={() => setSelectedIds([])}
                                            type="button"
                                        >
                                            Clear
                                        </button>
                                    </div>
                                )}
                            </div>

                            {visiblePhotos.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-stone-300 bg-white/60 px-6 py-12 text-center">
                                    <p className="font-medium text-stone-800">No photos match that search.</p>
                                    <button className="mt-2 text-sm text-amber-900 underline" onClick={() => setSearch("")} type="button">
                                        Clear search
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                                    {visiblePhotos.map((photo) => (
                                        <article className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm" key={photo.id}>
                                            <div className="relative">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img alt={photo.title} className="aspect-[4/3] w-full bg-stone-100 object-contain" src={photo.url} />
                                                <CheckmarkCheckbox
                                                    checked={selectedIds.includes(photo.id)}
                                                    className="absolute left-3 top-3 min-h-9 rounded-lg bg-white/95 px-3 text-sm font-medium shadow"
                                                    label="Select"
                                                    onChange={(event) =>
                                                        setSelectedIds((current) =>
                                                            event.target.checked
                                                                ? [...current, photo.id]
                                                                : current.filter((id) => id !== photo.id),
                                                        )
                                                    }
                                                />
                                                <button
                                                    aria-label={photo.isFavorite ? `Remove ${photo.title} from favorites` : `Add ${photo.title} to favorites`}
                                                    aria-pressed={photo.isFavorite}
                                                    className={`absolute right-3 top-3 grid min-h-10 min-w-10 place-items-center rounded-full border bg-white/95 text-xl shadow transition hover:scale-105 disabled:cursor-wait disabled:opacity-60 ${photo.isFavorite ? "border-amber-400 text-amber-500" : "border-stone-300 text-stone-500"}`}
                                                    disabled={Boolean(busy)}
                                                    onClick={() => toggleFavorite(photo)}
                                                    type="button"
                                                >
                                                    <span aria-hidden="true">{photo.isFavorite ? "★" : "☆"}</span>
                                                </button>
                                            </div>
                                            <div className="p-4">
                                                <h3 className="font-semibold text-stone-900">{photo.title}</h3>
                                                {photo.caption && <p className="mt-1 whitespace-pre-wrap text-sm text-stone-600">{photo.caption}</p>}
                                                <p className="mt-1 text-xs text-stone-500">
                                                    {photo.album || "Uncategorized"}{photo.isFavorite ? " · Favorite" : ""}
                                                </p>
                                                <p className="mt-2 text-xs text-stone-500">{photo.width} × {photo.height}</p>
                                                <div className="mt-4 flex flex-wrap gap-2">
                                                    <button
                                                        className="min-h-9 rounded-lg border border-stone-300 px-3 text-sm font-medium hover:bg-stone-50"
                                                        onClick={() => {
                                                            setEditingPhoto(photo);
                                                            setEditTitle(photo.title);
                                                            setEditCaption(photo.caption);
                                                            setEditAlbum(photo.album);
                                                            setEditFavorite(photo.isFavorite);
                                                        }}
                                                        type="button"
                                                    >
                                                        Edit details
                                                    </button>
                                                    <button
                                                        className="min-h-9 rounded-lg border border-stone-300 px-3 text-sm font-medium hover:bg-stone-50"
                                                        onClick={() => {
                                                            setCropPhoto(photo);
                                                            setCropShape("square");
                                                            setRotation(0);
                                                        }}
                                                        type="button"
                                                    >
                                                        Crop / rotate
                                                    </button>
                                                    <a
                                                        className="flex min-h-9 items-center rounded-lg border border-stone-300 px-3 text-sm font-medium hover:bg-stone-50"
                                                        download={`${photo.title}.webp`}
                                                        href={photo.url}
                                                        rel="noreferrer"
                                                        target="_blank"
                                                    >
                                                        Download
                                                    </a>
                                                    <button
                                                        className="min-h-9 rounded-lg border border-stone-300 px-3 text-sm font-medium hover:bg-stone-50"
                                                        onClick={() => copyPhotoLink(photo)}
                                                        type="button"
                                                    >
                                                        Copy link
                                                    </button>
                                                    <button
                                                        aria-pressed={photo.visibility === "public"}
                                                        className={`min-h-9 rounded-lg border px-3 text-sm font-medium disabled:cursor-wait disabled:opacity-60 ${photo.visibility === "public" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-stone-300 hover:bg-stone-50"}`}
                                                        disabled={Boolean(busy)}
                                                        onClick={() => toggleVisibility(photo)}
                                                        type="button"
                                                    >
                                                        {busy === `visibility:${photo.id}`
                                                            ? "Saving..."
                                                            : photo.visibility === "public"
                                                              ? "Published · make private"
                                                              : "Publish to gallery"}
                                                    </button>
                                                    <button
                                                        className="min-h-9 rounded-lg border border-red-200 px-3 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                                                        disabled={Boolean(busy)}
                                                        onClick={() => deleteSelected([photo.id])}
                                                        type="button"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </section>
            </section>

            {editingPhoto && (
                <dialog
                    aria-labelledby="edit-photo-heading"
                    className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl border-0 bg-white p-6 shadow-xl backdrop:bg-stone-950/50"
                    onClose={() => setEditingPhoto(null)}
                    ref={editDialogRef}
                >
                        <h2 className="text-xl font-semibold text-stone-900" id="edit-photo-heading">Edit photo details</h2>
                        <form className="mt-5 space-y-4" onSubmit={saveDetails}>
                            <div>
                                <label className="mb-1 block text-sm font-medium" htmlFor="edit-photo-title">Title</label>
                                <input
                                    className="min-h-11 w-full rounded-lg border border-stone-300 px-3"
                                    id="edit-photo-title"
                                    maxLength={120}
                                    onChange={(event) => setEditTitle(event.target.value)}
                                    required
                                    value={editTitle}
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium" htmlFor="edit-photo-caption">Caption</label>
                                <textarea
                                    className="min-h-28 w-full rounded-lg border border-stone-300 px-3 py-2"
                                    id="edit-photo-caption"
                                    maxLength={1000}
                                    onChange={(event) => setEditCaption(event.target.value)}
                                    value={editCaption}
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium" htmlFor="edit-photo-album">Album</label>
                                <input
                                    className="min-h-11 w-full rounded-lg border border-stone-300 px-3"
                                    id="edit-photo-album"
                                    maxLength={80}
                                    onChange={(event) => setEditAlbum(event.target.value)}
                                    placeholder="Uncategorized"
                                    value={editAlbum}
                                />
                            </div>
                            <label className="flex min-h-10 items-center gap-2 text-sm font-medium">
                                <input
                                    checked={editFavorite}
                                    onChange={(event) => setEditFavorite(event.target.checked)}
                                    type="checkbox"
                                />
                                Mark as favorite
                            </label>
                            <div className="flex justify-end gap-3">
                                <button className="min-h-10 rounded-lg border border-stone-300 px-4" onClick={closeEditDialog} type="button">
                                    Cancel
                                </button>
                                <button
                                    className="site-primary-button min-h-10 rounded-lg px-4 font-medium disabled:opacity-50"
                                    disabled={Boolean(busy)}
                                    style={{ backgroundColor: "var(--site-button-background)", color: "var(--site-button-text)" }}
                                    type="submit"
                                >
                                    {busy === `edit:${editingPhoto.id}` ? "Saving..." : "Save details"}
                                </button>
                            </div>
                        </form>
                </dialog>
            )}

            {cropPhoto && (
                <dialog
                    aria-labelledby="crop-photo-heading"
                    className="max-h-[calc(100dvh-2rem)] w-full max-w-xl overflow-y-auto rounded-2xl border-0 bg-white p-6 shadow-xl backdrop:bg-stone-950/50"
                    onClose={() => setCropPhoto(null)}
                    ref={cropDialogRef}
                >
                        <h2 className="text-xl font-semibold text-stone-900" id="crop-photo-heading">Crop and rotate</h2>
                        <p className="mt-1 text-sm text-stone-600">Cropping is centered and replaces the current saved image.</p>
                        <div className="mt-4 overflow-hidden rounded-xl bg-stone-100">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                alt={`Crop preview for ${cropPhoto.title}`}
                                className={`mx-auto max-h-80 object-cover ${cropShape === "square" ? "aspect-square" : cropShape === "portrait" ? "aspect-[3/4]" : cropShape === "landscape" ? "aspect-[4/3]" : "max-w-full"}`}
                                src={cropPhoto.url}
                                style={{ transform: `rotate(${rotation}deg)`, width: "min(100%, 32rem)" }}
                            />
                        </div>
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                            <label className="text-sm font-medium" htmlFor="crop-shape">Crop ratio</label>
                            <CustomDropdown
                                ariaLabel="Crop ratio"
                                buttonClassName="flex min-h-10 min-w-36 items-center justify-between gap-3 rounded-lg border border-stone-300 bg-white px-3 text-left text-sm text-stone-800 shadow-sm hover:bg-stone-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-800"
                                id="crop-shape"
                                onChange={setCropShape}
                                options={[
                                    { label: "Original", value: "original" },
                                    { label: "Square", value: "square" },
                                    { label: "Landscape (4:3)", value: "landscape" },
                                    { label: "Portrait (3:4)", value: "portrait" },
                                ]}
                                value={cropShape}
                            />
                            <button
                                className="min-h-10 rounded-lg border border-stone-300 px-3 text-sm"
                                onClick={() => setRotation((current) => (current + 270) % 360)}
                                type="button"
                            >
                                Rotate left
                            </button>
                            <button
                                className="min-h-10 rounded-lg border border-stone-300 px-3 text-sm"
                                onClick={() => setRotation((current) => (current + 90) % 360)}
                                type="button"
                            >
                                Rotate right
                            </button>
                        </div>
                        <div className="mt-5 flex justify-end gap-3">
                            <button className="min-h-10 rounded-lg border border-stone-300 px-4" onClick={closeCropDialog} type="button">
                                Cancel
                            </button>
                            <button
                                className="site-primary-button min-h-10 rounded-lg px-4 font-medium disabled:opacity-50"
                                disabled={Boolean(busy) || (cropShape === "original" && rotation === 0)}
                                onClick={applyCrop}
                                style={{ backgroundColor: "var(--site-button-background)", color: "var(--site-button-text)" }}
                                type="button"
                            >
                                {busy === `crop:${cropPhoto.id}` ? "Applying..." : "Apply edits"}
                            </button>
                        </div>
                </dialog>
            )}
        </main>
    );
}
