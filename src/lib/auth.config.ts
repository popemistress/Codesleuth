import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth";

// Edge-compatible auth config (no bcrypt/prisma)
export const authConfig: NextAuthConfig = {
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/login",
        error: "/login",
    },
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
        GitHub({
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
        }),
        // Credentials provider is declared here but authorize logic is in auth.ts
        Credentials({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize() {
                // This is a dummy authorize for edge - actual logic is in auth.ts
                return null;
            },
        }),
    ],
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isAdmin = auth?.user?.role === "ADMIN";

            const protectedRoutes = ["/dashboard", "/profile", "/admin"];
            const adminRoutes = ["/admin"];
            const authRoutes = ["/login", "/register"];

            const isProtectedRoute = protectedRoutes.some((route) =>
                nextUrl.pathname.startsWith(route)
            );
            const isAdminRoute = adminRoutes.some((route) =>
                nextUrl.pathname.startsWith(route)
            );
            const isAuthRoute = authRoutes.some((route) =>
                nextUrl.pathname.startsWith(route)
            );

            // Redirect authenticated users away from auth pages
            if (isAuthRoute && isLoggedIn) {
                return Response.redirect(new URL("/dashboard", nextUrl));
            }

            // Redirect unauthenticated users to login
            if (isProtectedRoute && !isLoggedIn) {
                const callbackUrl = encodeURIComponent(nextUrl.pathname);
                return Response.redirect(
                    new URL(`/login?callbackUrl=${callbackUrl}`, nextUrl)
                );
            }

            // Check admin access
            if (isAdminRoute && !isAdmin) {
                return Response.redirect(new URL("/dashboard", nextUrl));
            }

            return true;
        },
        jwt({ token, user }) {
            if (user) {
                token.id = user.id as string;
                token.role = (user as { role?: string }).role || "USER";
            }
            return token;
        },
        session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
            }
            return session;
        },
    },
};

export const { auth, handlers } = NextAuth(authConfig);
