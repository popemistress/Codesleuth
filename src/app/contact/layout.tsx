import { generatePageMetadata } from "@/lib/seo";

export const metadata = generatePageMetadata(
    "Contact",
    "Get in touch with the CodeSleuth team. We'd love to hear about your multi-agent orchestration needs.",
    "/contact"
);

export default function ContactLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
