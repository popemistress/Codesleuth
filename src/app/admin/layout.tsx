import { generatePageMetadata } from "@/lib/seo";

export const metadata = generatePageMetadata(
    "Admin Dashboard",
    "CodeSleuth administration panel. Manage users, view analytics, and configure platform settings.",
    "/admin"
);

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
