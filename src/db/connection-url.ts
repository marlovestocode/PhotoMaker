const legacySslModes = new Set(["prefer", "require", "verify-ca"]);

export function getDatabaseConnectionUrl(value: string): string {
    let url: URL;

    try {
        url = new URL(value);
    } catch (cause) {
        throw new Error("The database connection URL is invalid.", { cause });
    }

    if (!["postgres:", "postgresql:"].includes(url.protocol)) {
        throw new Error("The database connection URL must use the postgres or postgresql protocol.");
    }

    const sslMode = url.searchParams.get("sslmode");

    if (sslMode && legacySslModes.has(sslMode)) {
        url.searchParams.set("sslmode", "verify-full");
    }

    return url.toString();
}
