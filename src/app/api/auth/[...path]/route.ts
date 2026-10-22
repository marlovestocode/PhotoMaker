import { auth } from "@/server/auth/server";

export const { GET, POST } = auth.handler();
