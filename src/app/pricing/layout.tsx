import { generatePageMetadata } from "@/lib/seo";

export const metadata = generatePageMetadata(
    "Pricing",
    "Choose the right CodeSleuth plan for your team. From startups to enterprise, we have options for every stage of growth.",
    "/pricing"
);

export default function PricingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
