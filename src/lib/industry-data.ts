import fs from "fs";
import path from "path";

export interface IndustryData {
    slug: string;
    title: string;
    primaryKeyword: string;
    secondaryKeywords: string[];
    headline: string;
    content: string;
    excerpt: string;
}

// Industry ordering with Cannabis at position 3 as requested
const INDUSTRY_ORDER = [
    "Technology",
    "Healthcare",
    "Cannabis",  // 3rd position as requested
    "Pharmaceuticals & Biotechnology",
    "Financial Services",
    "Insurance",
    "Manufacturing",
    "Energy",
    "Retail",
    "Real Estate",
    "Construction",
    "Transportation & Logistics",
    "Automotive",
    "Aerospace & Defense",
    "Telecommunications",
    "Media & Entertainment",
    "Gaming & Esports",
    "Education",
    "Professional Services",
    "Marketing & Advertising",
    "Agriculture",
    "Food & Beverage",
    "Hospitality & Travel",
    "Consumer Electronics",
    "Fashion & Apparel",
    "Beauty & Personal Care",
    "Mining & Natural Resources",
    "Chemicals & Materials",
    "Environmental Services",
    "Government & Public Sector",
    "Nonprofits & Social Impact",
];

// Map file names to display titles (for industries with different file naming)
const FILE_TO_TITLE_MAP: Record<string, string> = {
    "pharmaceuticals-biotechnology": "Pharmaceuticals & Biotechnology",
    "transportation-logistics": "Transportation & Logistics",
    "aerospace-defense": "Aerospace & Defense",
    "media-entertainment": "Media & Entertainment",
    "gaming-esports": "Gaming & Esports",
    "hospitality-travel": "Hospitality & Travel",
    "legal-services": "Legal Services",
    "nonprofit-ngo": "Nonprofits & Social Impact",
    "government-public-sector": "Government & Public Sector",
    "agriculture-food-production": "Agriculture",
    "mining-natural-resources": "Mining & Natural Resources",
    "human-resources-recruiting": "Human Resources & Recruiting",
    "sports-fitness": "Sports & Fitness",
    "environmental-services": "Environmental Services",
    "utilities-infrastructure": "Utilities & Infrastructure",
    "shipping-maritime": "Shipping & Maritime",
    "supply-chain-procurement": "Supply Chain & Procurement",
};

// Industry icons mapping (Lucide icon names)
export const INDUSTRY_ICONS: Record<string, string> = {
    "Technology": "Code2",
    "Healthcare": "Heart",
    "Cannabis": "Leaf",
    "Pharmaceuticals & Biotechnology": "Flask",
    "Financial Services": "Landmark",
    "Insurance": "Shield",
    "Manufacturing": "Factory",
    "Energy": "Zap",
    "Retail": "ShoppingBag",
    "Real Estate": "Building2",
    "Construction": "HardHat",
    "Transportation & Logistics": "Truck",
    "Automotive": "Car",
    "Aerospace & Defense": "Plane",
    "Telecommunications": "Radio",
    "Media & Entertainment": "Film",
    "Gaming & Esports": "Gamepad2",
    "Education": "GraduationCap",
    "Professional Services": "Briefcase",
    "Marketing & Advertising": "Megaphone",
    "Agriculture": "Wheat",
    "Food & Beverage": "UtensilsCrossed",
    "Hospitality & Travel": "Hotel",
    "Consumer Electronics": "Smartphone",
    "Fashion & Apparel": "Shirt",
    "Beauty & Personal Care": "Sparkles",
    "Mining & Natural Resources": "Mountain",
    "Chemicals & Materials": "Atom",
    "Environmental Services": "TreePine",
    "Government & Public Sector": "Building",
    "Nonprofits & Social Impact": "HandHeart",
    "Legal Services": "Scale",
    "Human Resources & Recruiting": "Users",
    "Sports & Fitness": "Dumbbell",
    "Utilities & Infrastructure": "Power",
    "Shipping & Maritime": "Ship",
    "Supply Chain & Procurement": "Package",
};

// Color gradients for each industry (for visual variety)
export const INDUSTRY_COLORS: Record<string, { from: string; to: string }> = {
    "Technology": { from: "#8b5cf6", to: "#06b6d4" },
    "Healthcare": { from: "#ef4444", to: "#f472b6" },
    "Cannabis": { from: "#22c55e", to: "#84cc16" },
    "Pharmaceuticals & Biotechnology": { from: "#3b82f6", to: "#8b5cf6" },
    "Financial Services": { from: "#f59e0b", to: "#eab308" },
    "Insurance": { from: "#06b6d4", to: "#3b82f6" },
    "Manufacturing": { from: "#6366f1", to: "#8b5cf6" },
    "Energy": { from: "#f59e0b", to: "#ef4444" },
    "Retail": { from: "#ec4899", to: "#f472b6" },
    "Real Estate": { from: "#14b8a6", to: "#22c55e" },
    "Construction": { from: "#f97316", to: "#f59e0b" },
    "Transportation & Logistics": { from: "#3b82f6", to: "#06b6d4" },
    "Automotive": { from: "#6366f1", to: "#3b82f6" },
    "Aerospace & Defense": { from: "#64748b", to: "#475569" },
    "Telecommunications": { from: "#8b5cf6", to: "#a855f7" },
    "Media & Entertainment": { from: "#ec4899", to: "#8b5cf6" },
    "Gaming & Esports": { from: "#10b981", to: "#06b6d4" },
    "Education": { from: "#3b82f6", to: "#6366f1" },
    "Professional Services": { from: "#6366f1", to: "#8b5cf6" },
    "Marketing & Advertising": { from: "#f472b6", to: "#ec4899" },
    "Agriculture": { from: "#84cc16", to: "#22c55e" },
    "Food & Beverage": { from: "#f97316", to: "#ef4444" },
    "Hospitality & Travel": { from: "#06b6d4", to: "#14b8a6" },
    "Consumer Electronics": { from: "#8b5cf6", to: "#6366f1" },
    "Fashion & Apparel": { from: "#f472b6", to: "#ec4899" },
    "Beauty & Personal Care": { from: "#d946ef", to: "#f472b6" },
    "Mining & Natural Resources": { from: "#78716c", to: "#57534e" },
    "Chemicals & Materials": { from: "#06b6d4", to: "#0891b2" },
    "Environmental Services": { from: "#22c55e", to: "#14b8a6" },
    "Government & Public Sector": { from: "#3b82f6", to: "#1d4ed8" },
    "Nonprofits & Social Impact": { from: "#ec4899", to: "#f472b6" },
    "Legal Services": { from: "#475569", to: "#64748b" },
    "Human Resources & Recruiting": { from: "#8b5cf6", to: "#a855f7" },
    "Sports & Fitness": { from: "#ef4444", to: "#f97316" },
    "Utilities & Infrastructure": { from: "#f59e0b", to: "#eab308" },
    "Shipping & Maritime": { from: "#0891b2", to: "#0e7490" },
    "Supply Chain & Procurement": { from: "#6366f1", to: "#4f46e5" },
};

function parseMarkdownFile(filePath: string): IndustryData | null {
    try {
        const content = fs.readFileSync(filePath, "utf-8");
        const lines = content.split("\n");

        // Extract title (first # heading)
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

        // Extract headline (second # heading after ---)
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

        // Extract content (everything after the headline)
        const headlineIndex = lines.findIndex(
            (line) => separatorIndex !== -1 && lines.indexOf(line) > separatorIndex && line.startsWith("# ")
        );
        const contentLines = headlineIndex !== -1 ? lines.slice(headlineIndex + 1) : [];
        const fullContent = contentLines.join("\n").trim();

        // Extract excerpt (first paragraph after headline)
        let excerpt = "";
        for (const line of contentLines) {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith("#") && !trimmed.startsWith("---") && !trimmed.startsWith("*")) {
                excerpt = trimmed.substring(0, 200);
                if (trimmed.length > 200) excerpt += "...";
                break;
            }
        }

        // Generate slug from filename
        const fileName = path.basename(filePath, ".md");
        const slugPart = fileName.replace(/^\d+-/, ""); // Remove leading numbers
        const slug = slugPart;

        return {
            slug,
            title,
            primaryKeyword,
            secondaryKeywords,
            headline,
            content: fullContent,
            excerpt,
        };
    } catch (error) {
        console.error(`Error parsing ${filePath}:`, error);
        return null;
    }
}

export function getAllIndustries(): IndustryData[] {
    const contentDir = path.join(process.cwd(), "content", "industry");
    const files = fs.readdirSync(contentDir).filter((file) => file.endsWith(".md"));

    const industries: IndustryData[] = [];

    for (const file of files) {
        const filePath = path.join(contentDir, file);
        const data = parseMarkdownFile(filePath);
        if (data) {
            // Map file-based title to display title if needed
            const mappedTitle = FILE_TO_TITLE_MAP[data.slug] || data.title;
            industries.push({
                ...data,
                title: mappedTitle || data.title,
            });
        }
    }

    // Sort industries according to INDUSTRY_ORDER, with Cannabis at position 3
    industries.sort((a, b) => {
        const indexA = INDUSTRY_ORDER.findIndex(
            (name) => name.toLowerCase() === a.title.toLowerCase()
        );
        const indexB = INDUSTRY_ORDER.findIndex(
            (name) => name.toLowerCase() === b.title.toLowerCase()
        );

        // If not in order list, put at end
        const posA = indexA === -1 ? 999 : indexA;
        const posB = indexB === -1 ? 999 : indexB;

        return posA - posB;
    });

    return industries;
}

export function getIndustryBySlug(slug: string): IndustryData | null {
    const industries = getAllIndustries();
    return industries.find((ind) => ind.slug === slug) || null;
}
