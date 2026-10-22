"use client";

import { useState, type FormEvent } from "react";
import { authClient } from "@/server/auth/client";

export function SignInForm() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [pending, setPending] = useState(false);

    async function sendMagicLink(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setMessage("");
        setError("");
        setPending(true);

        try {
            const result = await authClient.signIn.magicLink({
                email,
                callbackURL: `${window.location.origin}/upload`,
            });

            if (result.error) {
                setError(result.error.message || "Could not send a sign-in link.");
            } else {
                setMessage("Check your email for a secure sign-in link.");
            }
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Could not send a sign-in link.");
        } finally {
            setPending(false);
        }
    }

    async function signInWithGoogle() {
        setMessage("");
        setError("");
        setPending(true);

        try {
            const result = await authClient.signIn.social({
                provider: "google",
                callbackURL: `${window.location.origin}/upload`,
            });

            if (result.error) {
                setError(result.error.message || "Could not start Google sign-in.");
            }
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Could not start Google sign-in.");
        } finally {
            setPending(false);
        }
    }

    return (
        <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <form className="space-y-4" onSubmit={sendMagicLink}>
                <label className="block text-sm font-medium text-stone-800" htmlFor="email">
                    Email address
                </label>
                <input
                    autoComplete="email"
                    className="min-h-12 w-full rounded-xl border border-stone-300 px-4 text-base outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-700/20"
                    id="email"
                    name="email"
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    type="email"
                    value={email}
                />
                <button
                    className="site-primary-button min-h-12 w-full rounded-xl px-5 font-semibold transition disabled:cursor-wait disabled:opacity-60"
                    disabled={pending}
                    style={{ backgroundColor: "var(--site-button-background)", color: "var(--site-button-text)" }}
                    type="submit"
                >
                    {pending ? "Sending..." : "Email me a sign-in link"}
                </button>
            </form>

            <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wider text-stone-400">
                <span className="h-px flex-1 bg-stone-200" />
                or
                <span className="h-px flex-1 bg-stone-200" />
            </div>

            <button
                className="min-h-12 w-full rounded-xl border border-stone-300 bg-white px-5 font-semibold text-stone-800 transition hover:bg-stone-50 disabled:cursor-wait disabled:opacity-60"
                disabled={pending}
                onClick={signInWithGoogle}
                type="button"
            >
                Continue with Google
            </button>

            <div aria-live="polite" className="mt-4 text-sm">
                {message && <p className="text-emerald-800">{message}</p>}
                {error && <p className="text-red-700">{error}</p>}
            </div>
        </div>
    );
}
