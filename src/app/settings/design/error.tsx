"use client";

import { useEffect } from "react";
import { StudioIcon } from "@/components/Theme/design-studio/icons";

export default function DesignSettingsError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <main className="studio-error-page">
            <div className="studio-error-card" role="alert">
                <span aria-hidden="true" className="studio-error-card__icon">
                    <StudioIcon name="warning" size={20} />
                </span>
                <h1>The design studio could not open</h1>
                <p>
                    Your published design is unchanged. Try loading the workspace again, or return
                    to the photo studio.
                </p>
                {error.digest && (
                    <p>
                        Reference <code>{error.digest}</code>
                    </p>
                )}
                <div className="studio-error-card__actions">
                    <button className="studio-button studio-button--primary" onClick={reset} type="button">
                        Try again
                    </button>
                    <a className="studio-button studio-button--secondary" href="/upload">
                        Back to the photo studio
                    </a>
                </div>
            </div>
        </main>
    );
}
