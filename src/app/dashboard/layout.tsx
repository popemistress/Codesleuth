import { generatePageMetadata } from "@/lib/seo";

export const metadata = generatePageMetadata(
    "Dashboard",
    "Your CodeSleuth dashboard. Monitor agent activity, view analytics, and manage your development workflow.",
    "/dashboard"
);

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
