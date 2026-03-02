import { generatePageMetadata } from "@/lib/seo";

export const metadata = generatePageMetadata(
    "Sign In",
    "Sign in to your CodeSleuth account to access your dashboard and manage your agents.",
    "/login"
);

export default function LoginLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
