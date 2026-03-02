"use client";

import { motion } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import Image from "next/image";
import {
    ArrowLeft,
    ArrowRight,
    Code2,
    Heart,
    Leaf,
    FlaskConical,
    Landmark,
    Shield,
    Factory,
    Zap,
    ShoppingBag,
    Building2,
    HardHat,
    Truck,
    Car,
    Plane,
    Radio,
    Film,
    Gamepad2,
    GraduationCap,
    Briefcase,
    Megaphone,
    Wheat,
    UtensilsCrossed,
    Hotel,
    Smartphone,
    Shirt,
    Sparkles,
    Mountain,
    Atom,
    TreePine,
    Building,
    HandHeart,
    Scale,
    Users,
    Dumbbell,
    Anchor,
    Package,
    CheckCircle2,
    type LucideIcon,
} from "lucide-react";

interface ContentSection {
    type: "heading" | "paragraph" | "list";
    content: string;
    items?: string[];
    level?: number;
}

interface IndustryData {
    slug: string;
    title: string;
    primaryKeyword: string;
    secondaryKeywords: string[];
    headline: string;
    sections: ContentSection[];
    excerpt: string;
}

// Industry config mapping
const INDUSTRY_CONFIG: Record<
    string,
    { icon: LucideIcon; gradient: { from: string; to: string }; image: string }
> = {
    technology: {
        icon: Code2,
        gradient: { from: "#8b5cf6", to: "#06b6d4" },
        image: "/images/industries/technology.webp",
    },
    healthcare: {
        icon: Heart,
        gradient: { from: "#ef4444", to: "#f472b6" },
        image: "/images/industries/healthcare.webp",
    },
    cannabis: {
        icon: Leaf,
        gradient: { from: "#22c55e", to: "#84cc16" },
        image: "/images/industries/cannabis.webp",
    },
    "pharmaceuticals-biotechnology": {
        icon: FlaskConical,
        gradient: { from: "#3b82f6", to: "#8b5cf6" },
        image: "/images/industries/pharma.webp",
    },
    "financial-services": {
        icon: Landmark,
        gradient: { from: "#f59e0b", to: "#eab308" },
        image: "/images/industries/finance.webp",
    },
    insurance: {
        icon: Shield,
        gradient: { from: "#06b6d4", to: "#3b82f6" },
        image: "/images/industries/insurance.webp",
    },
    manufacturing: {
        icon: Factory,
        gradient: { from: "#6366f1", to: "#8b5cf6" },
        image: "/images/industries/manufacturing.webp",
    },
    energy: {
        icon: Zap,
        gradient: { from: "#f59e0b", to: "#ef4444" },
        image: "/images/industries/energy.webp",
    },
    retail: {
        icon: ShoppingBag,
        gradient: { from: "#ec4899", to: "#f472b6" },
        image: "/images/industries/retail.webp",
    },
    "real-estate": {
        icon: Building2,
        gradient: { from: "#14b8a6", to: "#22c55e" },
        image: "/images/industries/realestate.webp",
    },
    construction: {
        icon: HardHat,
        gradient: { from: "#f97316", to: "#f59e0b" },
        image: "/images/industries/construction.webp",
    },
    "transportation-logistics": {
        icon: Truck,
        gradient: { from: "#3b82f6", to: "#06b6d4" },
        image: "/images/industries/logistics.webp",
    },
    automotive: {
        icon: Car,
        gradient: { from: "#6366f1", to: "#3b82f6" },
        image: "/images/industries/automotive.webp",
    },
    "aerospace-defense": {
        icon: Plane,
        gradient: { from: "#64748b", to: "#475569" },
        image: "/images/industries/aerospace.webp",
    },
    telecommunications: {
        icon: Radio,
        gradient: { from: "#8b5cf6", to: "#a855f7" },
        image: "/images/industries/telecom.webp",
    },
    "media-entertainment": {
        icon: Film,
        gradient: { from: "#ec4899", to: "#8b5cf6" },
        image: "/images/industries/media.webp",
    },
    "gaming-esports": {
        icon: Gamepad2,
        gradient: { from: "#10b981", to: "#06b6d4" },
        image: "/images/industries/gaming.webp",
    },
    education: {
        icon: GraduationCap,
        gradient: { from: "#3b82f6", to: "#6366f1" },
        image: "/images/industries/education.webp",
    },
    "professional-services": {
        icon: Briefcase,
        gradient: { from: "#6366f1", to: "#8b5cf6" },
        image: "/images/industries/government.webp",
    },
    "marketing-advertising": {
        icon: Megaphone,
        gradient: { from: "#f472b6", to: "#ec4899" },
        image: "/images/industries/marketing.webp",
    },
    "agriculture-food-production": {
        icon: Wheat,
        gradient: { from: "#84cc16", to: "#22c55e" },
        image: "/images/industries/agriculture.webp",
    },
    "food-beverage": {
        icon: UtensilsCrossed,
        gradient: { from: "#f97316", to: "#ef4444" },
        image: "/images/industries/food.webp",
    },
    "hospitality-travel": {
        icon: Hotel,
        gradient: { from: "#06b6d4", to: "#14b8a6" },
        image: "/images/industries/hospitality.webp",
    },
    "consumer-electronics": {
        icon: Smartphone,
        gradient: { from: "#8b5cf6", to: "#6366f1" },
        image: "/images/industries/electronics.webp",
    },
    "fashion-apparel": {
        icon: Shirt,
        gradient: { from: "#f472b6", to: "#ec4899" },
        image: "/images/industries/fashion.webp",
    },
    "beauty-personal-care": {
        icon: Sparkles,
        gradient: { from: "#d946ef", to: "#f472b6" },
        image: "/images/industries/beauty.webp",
    },
    "mining-natural-resources": {
        icon: Mountain,
        gradient: { from: "#78716c", to: "#57534e" },
        image: "/images/industries/mining.webp",
    },
    "chemicals-materials": {
        icon: Atom,
        gradient: { from: "#06b6d4", to: "#0891b2" },
        image: "/images/industries/chemicals.webp",
    },
    "environmental-services": {
        icon: TreePine,
        gradient: { from: "#22c55e", to: "#14b8a6" },
        image: "/images/industries/environmental.webp",
    },
    "government-public-sector": {
        icon: Building,
        gradient: { from: "#3b82f6", to: "#1d4ed8" },
        image: "/images/industries/government.webp",
    },
    "nonprofit-ngo": {
        icon: HandHeart,
        gradient: { from: "#ec4899", to: "#f472b6" },
        image: "/images/industries/nonprofit.webp",
    },
    "legal-services": {
        icon: Scale,
        gradient: { from: "#475569", to: "#64748b" },
        image: "/images/industries/legal.webp",
    },
    "human-resources-recruiting": {
        icon: Users,
        gradient: { from: "#8b5cf6", to: "#a855f7" },
        image: "/images/industries/hr.webp",
    },
    "sports-fitness": {
        icon: Dumbbell,
        gradient: { from: "#ef4444", to: "#f97316" },
        image: "/images/industries/sports.webp",
    },
    "utilities-infrastructure": {
        icon: Zap,
        gradient: { from: "#3b82f6", to: "#06b6d4" },
        image: "/images/industries/energy.webp",
    },
    "shipping-maritime": {
        icon: Anchor,
        gradient: { from: "#0ea5e9", to: "#3b82f6" },
        image: "/images/industries/logistics.webp",
    },
    "supply-chain-procurement": {
        icon: Package,
        gradient: { from: "#f59e0b", to: "#d97706" },
        image: "/images/industries/logistics.webp",
    },
};

// Default config for unknown industries
const DEFAULT_CONFIG = {
    icon: Building,
    gradient: { from: "#6366f1", to: "#8b5cf6" },
    image: "/images/industries/default.webp",
};

// Animation variants
const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: "easeOut" as const },
    },
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2,
        },
    },
};

const listItemVariant = {
    hidden: { opacity: 0, x: -20 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.4, ease: "easeOut" as const },
    },
};

export default function IndustryDetailClient({ data }: { data: IndustryData }) {
    const config = INDUSTRY_CONFIG[data.slug] || DEFAULT_CONFIG;
    const Icon = config.icon;

    // Group sections for visual layout
    let sectionIndex = 0;

    return (
        <div className="relative min-h-screen">
            <div className="fixed inset-0 bg-grid opacity-[0.02] pointer-events-none" />
            <Header />

            <main id="main-content" className="pt-24">
                {/* Hero Section */}
                <section className="section pb-0 overflow-hidden">
                    <div className="container">
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={staggerContainer}
                            className="max-w-4xl mx-auto"
                        >
                            {/* Breadcrumb */}
                            <motion.div variants={fadeInUp} className="mb-8">
                                <Link
                                    href="/industries"
                                    className="inline-flex items-center gap-2 text-foreground-muted hover:text-foreground transition-colors"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    <span>Back to Industries</span>
                                </Link>
                            </motion.div>

                            {/* Hero Content */}
                            <div className="relative">
                                {/* Gradient Background */}
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 0.15, scale: 1 }}
                                    transition={{ duration: 0.8 }}
                                    className="absolute -top-20 -left-20 w-96 h-96 rounded-full blur-3xl"
                                    style={{
                                        background: `radial-gradient(circle, ${config.gradient.from}, transparent)`,
                                    }}
                                />

                                {/* Icon */}
                                <motion.div
                                    variants={fadeInUp}
                                    className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6"
                                    style={{
                                        background: `linear-gradient(135deg, ${config.gradient.from}20, ${config.gradient.to}20)`,
                                        border: `2px solid ${config.gradient.from}40`,
                                    }}
                                >
                                    <Icon
                                        className="w-10 h-10"
                                        style={{ color: config.gradient.from }}
                                    />
                                </motion.div>

                                {/* Title */}
                                <motion.h1 variants={fadeInUp} className="mb-4">
                                    <span
                                        className="bg-clip-text text-transparent"
                                        style={{
                                            backgroundImage: `linear-gradient(135deg, ${config.gradient.from}, ${config.gradient.to})`,
                                        }}
                                    >
                                        {data.title}
                                    </span>
                                </motion.h1>

                                {/* Headline */}
                                <motion.h2
                                    variants={fadeInUp}
                                    className="text-2xl md:text-3xl font-semibold text-foreground mb-6"
                                >
                                    {data.headline}
                                </motion.h2>

                                {/* Keywords */}
                                <motion.div
                                    variants={fadeInUp}
                                    className="flex flex-wrap gap-2 mb-8"
                                >
                                    {data.secondaryKeywords.slice(0, 6).map((keyword) => (
                                        <span
                                            key={keyword}
                                            className="px-3 py-1 rounded-full text-sm font-medium"
                                            style={{
                                                backgroundColor: `${config.gradient.from}15`,
                                                color: config.gradient.from,
                                                border: `1px solid ${config.gradient.from}30`,
                                            }}
                                        >
                                            {keyword}
                                        </span>
                                    ))}
                                </motion.div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Hero Image */}
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="mt-12 relative"
                    >
                        <div className="container">
                            <motion.div
                                className="relative h-64 md:h-96 rounded-2xl overflow-hidden border border-border shadow-2xl"
                                style={{
                                    background: `linear-gradient(135deg, ${config.gradient.from}10, ${config.gradient.to}10)`,
                                }}
                            >
                                {/* Background Effects */}
                                <div className="absolute inset-0 bg-grid opacity-10 z-0" />

                                {/* The Image */}
                                <Image
                                    src={config.image}
                                    alt={`${data.title} Industry Visualization`}
                                    fill
                                    className="object-cover z-10 opacity-90 hover:opacity-100 transition-opacity duration-700"
                                    blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
                                    placeholder="blur"
                                />

                                {/* Overlay Gradient */}
                                <div
                                    className="absolute inset-0 z-20 mix-blend-overlay opacity-30 pointer-events-none"
                                    style={{
                                        background: `linear-gradient(135deg, ${config.gradient.from}, ${config.gradient.to})`,
                                    }}
                                />
                            </motion.div>
                        </div>
                    </motion.div>
                </section>

                {/* Content Sections */}
                <section className="section">
                    <div className="container">
                        <div className="max-w-4xl mx-auto">
                            <motion.div
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true, margin: "-50px" }}
                                variants={staggerContainer}
                                className="space-y-8"
                            >
                                {data.sections.map((section, index) => {
                                    // Alternate visual treatment for sections
                                    if (section.type === "heading") {
                                        sectionIndex++;
                                        const isEvenSection = sectionIndex % 2 === 0;

                                        return (
                                            <motion.div
                                                key={index}
                                                variants={fadeInUp}
                                                className="pt-8"
                                            >
                                                <div
                                                    className={`flex items-center gap-4 mb-4 ${isEvenSection ? "" : ""
                                                        }`}
                                                >
                                                    <div
                                                        className="w-1 h-8 rounded-full"
                                                        style={{
                                                            background: `linear-gradient(to bottom, ${config.gradient.from}, ${config.gradient.to})`,
                                                        }}
                                                    />
                                                    <h3 className="text-2xl md:text-3xl font-bold text-foreground">
                                                        {section.content}
                                                    </h3>
                                                </div>
                                            </motion.div>
                                        );
                                    }

                                    if (section.type === "paragraph") {
                                        return (
                                            <motion.p
                                                key={index}
                                                variants={fadeInUp}
                                                className="text-foreground-muted text-lg leading-relaxed"
                                            >
                                                {section.content}
                                            </motion.p>
                                        );
                                    }

                                    if (section.type === "list" && section.items) {
                                        return (
                                            <motion.ul
                                                key={index}
                                                variants={staggerContainer}
                                                className="space-y-3 pl-4"
                                            >
                                                {section.items.map((item, i) => (
                                                    <motion.li
                                                        key={i}
                                                        variants={listItemVariant}
                                                        className="flex items-start gap-3"
                                                    >
                                                        <CheckCircle2
                                                            className="w-5 h-5 flex-shrink-0 mt-1"
                                                            style={{ color: config.gradient.from }}
                                                        />
                                                        <span className="text-foreground-muted">
                                                            {item}
                                                        </span>
                                                    </motion.li>
                                                ))}
                                            </motion.ul>
                                        );
                                    }

                                    return null;
                                })}
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="section bg-background-subtle">
                    <div className="container">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="max-w-2xl mx-auto text-center"
                        >
                            <div
                                className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center"
                                style={{
                                    background: `linear-gradient(135deg, ${config.gradient.from}, ${config.gradient.to})`,
                                }}
                            >
                                <Icon className="w-8 h-8 text-white" />
                            </div>
                            <h2 className="mb-4">
                                Ready to Transform {data.title} Software?
                            </h2>
                            <p className="text-foreground-muted mb-8">
                                Discover how CodeSleuth&apos;s multi-agent architecture can enforce
                                the discipline your {data.title.toLowerCase()} organization demands.
                            </p>
                            <div className="flex flex-wrap gap-4 justify-center">
                                <Link href="/contact" className="btn btn-primary">
                                    Contact Sales
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                                <Link href="/pricing" className="btn btn-secondary">
                                    View Pricing
                                </Link>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Related Industries */}
                <section className="section">
                    <div className="container">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-center mb-12"
                        >
                            <h2 className="mb-4">Explore Other Industries</h2>
                            <p className="text-foreground-muted">
                                See how CodeSleuth works across different sectors
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            className="flex justify-center"
                        >
                            <Link
                                href="/industries"
                                className="btn btn-secondary inline-flex items-center gap-2"
                            >
                                <span>View All Industries</span>
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </motion.div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
