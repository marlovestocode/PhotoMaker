import "server-only";

import { auth } from "./server";

type SessionResult = Awaited<ReturnType<typeof auth.getSession>>;
export type AuthenticatedUser = NonNullable<NonNullable<SessionResult["data"]>["user"]>;

type OwnerAccess =
    | { ok: true; user: AuthenticatedUser }
    | { ok: false; status: 401 | 403 | 502 | 503; message: string };

export async function getOwnerAccess(): Promise<OwnerAccess> {
    const result = await auth.getSession();

    if (result.error) {
        console.error("Could not load the Neon Auth session:", result.error);
        return { ok: false, status: 502, message: "Could not verify your sign-in. Please try again." };
    }

    const user = result.data?.user;

    if (!user) {
        return { ok: false, status: 401, message: "Please sign in to continue." };
    }

    const ownerEmail = process.env.OWNER_EMAIL?.trim().toLowerCase();

    if (!ownerEmail) {
        return { ok: false, status: 503, message: "Set OWNER_EMAIL in .env.local to enable owner-only editing." };
    }

    if (user.email.trim().toLowerCase() !== ownerEmail) {
        return { ok: false, status: 403, message: "This account does not have owner access." };
    }

    return { ok: true, user };
}
