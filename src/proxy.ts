import { auth } from "@/server/auth/server";

const protectOwnerRoutes = auth.middleware({ loginUrl: "/auth/sign-in" });

export default protectOwnerRoutes;

export const config = {
    matcher: ["/upload/:path*", "/settings/:path*"],
};
