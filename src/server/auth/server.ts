import "server-only";

import { createNeonAuth } from "@neondatabase/auth/next/server";

function requiredEnvironmentVariable(name: string) {
    const value = process.env[name];

    if (!value) {
        throw new Error(`${name} is missing. Set it in .env.local and in your hosting environment.`);
    }

    return value;
}

export const auth = createNeonAuth({
    baseUrl: requiredEnvironmentVariable("NEON_AUTH_BASE_URL"),
    cookies: {
        secret: requiredEnvironmentVariable("NEON_AUTH_COOKIE_SECRET"),
    },
});
