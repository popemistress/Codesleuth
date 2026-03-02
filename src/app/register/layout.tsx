import { generatePageMetadata } from "@/lib/seo";

export const metadata = generatePageMetadata(
    "Create Account",
    "Create your CodeSleuth account and start building with enterprise-grade multi-agent orchestration.",
    "/register"
);

export default function RegisterLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
