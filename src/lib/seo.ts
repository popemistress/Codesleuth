import { Metadata, Viewport } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://codesleuth.dev";

export const defaultMetadata: Metadata = {
    metadataBase: new URL(siteUrl),
    title: {
        default: "CodeSleuth | Multi-Agent Enterprise Development Lifecycle",
        template: "%s | CodeSleuth",
    },
    description:
        "A rigorous multi-agent orchestration platform for high-stakes AI agent development with enterprise-grade quality gates.",
    keywords: [
        "AI agents",
        "multi-agent orchestration",
        "enterprise development",
        "automated code review",
        "security audit",
        "product discovery",
        "software development lifecycle",
        "AI coding assistant",
        "code quality",
        "DevOps automation",
    ],
    authors: [{ name: "CodeSleuth", url: siteUrl }],
    creator: "CodeSleuth",
    publisher: "CodeSleuth",
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    openGraph: {
        type: "website",
        locale: "en_US",
        url: siteUrl,
        siteName: "CodeSleuth",
        title: "CodeSleuth | Multi-Agent Enterprise Development Lifecycle",
        description:
            "A rigorous multi-agent orchestration platform for high-stakes AI agent development.",
        images: [
            {
                url: `${siteUrl}/og-image.png`,
                width: 1200,
                height: 630,
                alt: "CodeSleuth - Multi-Agent Enterprise Development",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "CodeSleuth | Multi-Agent Enterprise Development Lifecycle",
        description:
            "A rigorous multi-agent orchestration platform for high-stakes AI agent development.",
        images: [`${siteUrl}/og-image.png`],
        creator: "@codesleuth",
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
        },
    },
    verification: {
        // Add when available
        // google: "google-site-verification-code",
        // yandex: "yandex-verification-code",
    },
    alternates: {
        canonical: siteUrl,
    },
};

export const defaultViewport: Viewport = {
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "#0a0a0f" },
        { media: "(prefers-color-scheme: dark)", color: "#0a0a0f" },
    ],
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
};

// Page-specific metadata generators
export function generatePageMetadata(
    title: string,
    description: string,
    path = ""
): Metadata {
    const url = `${siteUrl}${path}`;
    return {
        title,
        description,
        alternates: {
            canonical: url,
        },
        openGraph: {
            title: `${title} | CodeSleuth`,
            description,
            url,
        },
        twitter: {
            title: `${title} | CodeSleuth`,
            description,
        },
    };
}
