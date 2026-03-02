import { generatePageMetadata } from "@/lib/seo";

export const metadata = generatePageMetadata(
    "About Us",
    "Learn about CodeSleuth's mission to transform enterprise software development through rigorous multi-agent orchestration and AI-powered quality gates.",
    "/about"
);

export default function AboutLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
