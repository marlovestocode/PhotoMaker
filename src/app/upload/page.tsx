import { connection } from "next/server";
import { redirect } from "next/navigation";
import { UploadStudio } from "@/components/upload/upload-studio";
import { getOwnerAccess } from "@/server/auth/owner";
import { listOwnerPhotos } from "@/server/photos";

export const instant = false;

export default async function UploadPage() {
    await connection();
    const access = await getOwnerAccess();

    if (!access.ok && access.status === 401) {
        redirect("/auth/sign-in");
    }

    if (!access.ok) {
        return (
            <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-6">
                <h1 className="text-2xl font-semibold text-stone-900">Setup needed</h1>
                <p className="mt-3 leading-7 text-stone-700">{access.message}</p>
                <a className="mt-5 font-medium text-amber-900 underline" href="/auth/sign-in">Go to sign in</a>
            </main>
        );
    }

    const photos = await listOwnerPhotos(access.user.id);
    return <UploadStudio initialPhotos={photos} ownerName={access.user.name || access.user.email} />;
}
