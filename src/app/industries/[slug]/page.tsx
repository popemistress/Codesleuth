import fs from "fs";
import path from "path";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import IndustryDetailClient from "./IndustryDetailClient";

// Industry data interface
interface IndustryData {
    slug: string;
    title: string;
    primaryKeyword: string;
    secondaryKeywords: string[];
    headline: string;
    sections: ContentSection[];
    excerpt: string;
}

interface ContentSection {
    type: "heading" | "paragraph" | "list";
    content: string;
    items?: string[];
    level?: number;
}

// Parse the markdown file into structured sections
function parseMarkdownToSections(content: string): ContentSection[] {
    const lines = content.split("\n");
    const sections: ContentSection[] = [];

    // Find the separator and main headline
    const separatorIndex = lines.findIndex((line) => line === "---");
    if (separatorIndex === -1) return sections;

    // Find the main headline after separator
    let headlineIndex = -1;
    for (let i = separatorIndex + 1; i < lines.length; i++) {
        if (lines[i].startsWith("# ")) {
            headlineIndex = i;
            break;
        }
    }

    if (headlineIndex === -1) return sections;

    // Parse content after headline
    let currentParagraph = "";
    for (let i = headlineIndex + 1; i < lines.length; i++) {
        const line = lines[i];

        // Skip metadata lines and separator
        if (line === "---" || line.startsWith("*Powered by")) continue;

        // Heading
        if (line.startsWith("## ")) {
            // Flush current paragraph
            if (currentParagraph.trim()) {
                sections.push({ type: "paragraph", content: currentParagraph.trim() });
                currentParagraph = "";
            }
            sections.push({
                type: "heading",
                content: line.replace("## ", "").trim(),
                level: 2,
            });
        }
        // List item
        else if (line.startsWith("- ")) {
            // Flush current paragraph
            if (currentParagraph.trim()) {
                sections.push({ type: "paragraph", content: currentParagraph.trim() });
                currentParagraph = "";
            }

            // Collect consecutive list items
            const items: string[] = [];
            let j = i;
            while (j < lines.length && lines[j].startsWith("- ")) {
                items.push(lines[j].replace("- ", "").trim());
                j++;
            }
            sections.push({ type: "list", content: "", items });
            i = j - 1; // Skip processed lines
        }
        // Empty line - flush paragraph
        else if (line.trim() === "") {
            if (currentParagraph.trim()) {
                sections.push({ type: "paragraph", content: currentParagraph.trim() });
                currentParagraph = "";
            }
        }
        // Regular text - accumulate into paragraph
        else {
            currentParagraph += (currentParagraph ? " " : "") + line.trim();
        }
    }

    // Flush remaining paragraph
    if (currentParagraph.trim()) {
        sections.push({ type: "paragraph", content: currentParagraph.trim() });
    }

    return sections;
}

// Parse the full markdown file
function parseIndustryFile(filePath: string): IndustryData | null {
    try {
        const content = fs.readFileSync(filePath, "utf-8");
        const lines = content.split("\n");

        // Extract title
        const titleLine = lines.find((line) => line.startsWith("# ") && !line.includes("---"));
        const title = titleLine?.replace("# ", "").trim() || "";

        // Extract primary keyword
        const primaryKeywordIndex = lines.findIndex((line) => line.includes("## Primary Keyword:"));
        const primaryKeyword = primaryKeywordIndex !== -1 ? lines[primaryKeywordIndex + 1]?.trim() || "" : "";

        // Extract secondary keywords
        const secondaryStartIndex = lines.findIndex((line) => line.includes("## Secondary Keywords:"));
        const secondaryKeywords: string[] = [];
        if (secondaryStartIndex !== -1) {
            for (let i = secondaryStartIndex + 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line.startsWith("- ")) {
                    secondaryKeywords.push(line.replace("- ", ""));
                } else if (line === "" || line.startsWith("#") || line === "---") {
                    break;
                }
            }
        }

        // Extract headline
        const separatorIndex = lines.findIndex((line) => line === "---");
        let headline = "";
        if (separatorIndex !== -1) {
            for (let i = separatorIndex + 1; i < lines.length; i++) {
                if (lines[i].startsWith("# ")) {
                    headline = lines[i].replace("# ", "").trim();
                    break;
                }
            }
        }

        // Parse sections
        const sections = parseMarkdownToSections(content);

        // Extract excerpt
        const firstParagraph = sections.find((s) => s.type === "paragraph");
        const excerpt = firstParagraph?.content.substring(0, 200) + "..." || "";

        // Generate slug
        const fileName = path.basename(filePath, ".md");
        const slug = fileName.replace(/^\d+-/, "");

        return {
            slug,
            title,
            primaryKeyword,
            secondaryKeywords,
            headline,
            sections,
            excerpt,
        };
    } catch (error) {
        console.error(`Error parsing ${filePath}:`, error);
        return null;
    }
}

// Get all industry slugs for static generation
export async function generateStaticParams() {
    const contentDir = path.join(process.cwd(), "content", "industry");
    const files = fs.readdirSync(contentDir).filter((file) => file.endsWith(".md"));

    return files.map((file) => ({
        slug: file.replace(/^\d+-/, "").replace(".md", ""),
    }));
}

// Generate metadata for SEO
export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await params;
    const contentDir = path.join(process.cwd(), "content", "industry");
    const files = fs.readdirSync(contentDir).filter((file) => file.endsWith(".md"));

    const matchingFile = files.find((file) => file.replace(/^\d+-/, "").replace(".md", "") === slug);

    if (!matchingFile) {
        return { title: "Industry Not Found | CodeSleuth" };
    }

    const data = parseIndustryFile(path.join(contentDir, matchingFile));

    if (!data) {
        return { title: "Industry Not Found | CodeSleuth" };
    }

    return {
        title: `${data.title} Software Solutions | CodeSleuth`,
        description: data.excerpt,
        keywords: [data.primaryKeyword, ...data.secondaryKeywords],
        openGraph: {
            title: `${data.title} Software Solutions | CodeSleuth`,
            description: data.excerpt,
            type: "article",
        },
    };
}

// Main page component
export default async function IndustryDetailPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const contentDir = path.join(process.cwd(), "content", "industry");
    const files = fs.readdirSync(contentDir).filter((file) => file.endsWith(".md"));

    const matchingFile = files.find((file) => file.replace(/^\d+-/, "").replace(".md", "") === slug);

    if (!matchingFile) {
        notFound();
    }

    const data = parseIndustryFile(path.join(contentDir, matchingFile));

    if (!data) {
        notFound();
    }

    return <IndustryDetailClient data={data} />;
}
