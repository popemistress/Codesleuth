import { generatePageMetadata } from "@/lib/seo";

export const metadata = generatePageMetadata(
    "Profile",
    "Manage your CodeSleuth profile and account settings.",
    "/profile"
);

export default function ProfileLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
