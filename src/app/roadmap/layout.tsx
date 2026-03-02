import { generatePageMetadata } from "@/lib/seo";

export const metadata = generatePageMetadata(
    "Roadmap",
    "Explore the 18-phase implementation journey of CodeSleuth's multi-agent orchestration platform. From Product Discovery to Future Vision.",
    "/roadmap"
);

export default function RoadmapLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
