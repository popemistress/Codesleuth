"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import {
    ArrowRight,
    X,
    Search,
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
    type LucideIcon,
} from "lucide-react";

// Industry data with custom ordering (Cannabis at position 3)
interface Industry {
    slug: string;
    title: string;
    tagline: string;
    excerpt: string;
    icon: LucideIcon;
    gradient: { from: string; to: string };
}

const industries: Industry[] = [
    {
        slug: "technology",
        title: "Technology",
        tagline: "Engineering Discipline at Scale",
        excerpt: "Platform fragmentation, API stability, and regulatory traceability for technology companies building the infrastructure everyone depends on.",
        icon: Code2,
        gradient: { from: "#8b5cf6", to: "#06b6d4" },
    },
    {
        slug: "healthcare",
        title: "Healthcare",
        tagline: "HIPAA-Ready Software Systems",
        excerpt: "Clinical workflow verification, patient safety enforcement, and audit-ready documentation for healthcare organizations.",
        icon: Heart,
        gradient: { from: "#ef4444", to: "#f472b6" },
    },
    {
        slug: "cannabis",
        title: "Cannabis",
        tagline: "Seed-to-Sale Compliance",
        excerpt: "State tracking system integration, multi-state compliance variation, and license-specific requirements for cannabis operators.",
        icon: Leaf,
        gradient: { from: "#22c55e", to: "#84cc16" },
    },
    {
        slug: "pharmaceuticals-biotechnology",
        title: "Pharmaceuticals & Biotechnology",
        tagline: "FDA & GxP Compliance",
        excerpt: "Clinical trial data integrity, regulatory submission accuracy, and validated software systems for pharma and biotech.",
        icon: FlaskConical,
        gradient: { from: "#3b82f6", to: "#8b5cf6" },
    },
    {
        slug: "financial-services",
        title: "Financial Services",
        tagline: "Regulatory Precision",
        excerpt: "SOX compliance, trading system reliability, and financial data integrity for banks, investment firms, and fintech.",
        icon: Landmark,
        gradient: { from: "#f59e0b", to: "#eab308" },
    },
    {
        slug: "insurance",
        title: "Insurance",
        tagline: "Claims & Underwriting Accuracy",
        excerpt: "Policy administration reliability, claims processing verification, and regulatory compliance across state jurisdictions.",
        icon: Shield,
        gradient: { from: "#06b6d4", to: "#3b82f6" },
    },
    {
        slug: "manufacturing",
        title: "Manufacturing",
        tagline: "Industrial Control Systems",
        excerpt: "Production line integration, quality control automation, and supply chain software reliability for manufacturers.",
        icon: Factory,
        gradient: { from: "#6366f1", to: "#8b5cf6" },
    },
    {
        slug: "energy",
        title: "Energy",
        tagline: "Grid & Infrastructure Systems",
        excerpt: "SCADA system reliability, grid management software, and regulatory compliance for utilities and energy producers.",
        icon: Zap,
        gradient: { from: "#f59e0b", to: "#ef4444" },
    },
    {
        slug: "retail",
        title: "Retail",
        tagline: "Omnichannel Excellence",
        excerpt: "Inventory management, POS system reliability, and customer experience software for retail operations.",
        icon: ShoppingBag,
        gradient: { from: "#ec4899", to: "#f472b6" },
    },
    {
        slug: "real-estate",
        title: "Real Estate",
        tagline: "Transaction & Property Management",
        excerpt: "Property management systems, transaction platforms, and compliance software for real estate professionals.",
        icon: Building2,
        gradient: { from: "#14b8a6", to: "#22c55e" },
    },
    {
        slug: "construction",
        title: "Construction",
        tagline: "Project & Safety Management",
        excerpt: "Project management software, safety compliance systems, and field operation platforms for construction firms.",
        icon: HardHat,
        gradient: { from: "#f97316", to: "#f59e0b" },
    },
    {
        slug: "transportation-logistics",
        title: "Transportation & Logistics",
        tagline: "Fleet & Supply Chain Operations",
        excerpt: "Fleet management, route optimization, and logistics platform reliability for transportation companies.",
        icon: Truck,
        gradient: { from: "#3b82f6", to: "#06b6d4" },
    },
    {
        slug: "automotive",
        title: "Automotive",
        tagline: "Connected Vehicle Systems",
        excerpt: "Automotive software reliability, connected vehicle platforms, and manufacturing integration systems.",
        icon: Car,
        gradient: { from: "#6366f1", to: "#3b82f6" },
    },
    {
        slug: "aerospace-defense",
        title: "Aerospace & Defense",
        tagline: "Mission-Critical Systems",
        excerpt: "DO-178C compliance, defense system reliability, and safety-critical software for aerospace and defense.",
        icon: Plane,
        gradient: { from: "#64748b", to: "#475569" },
    },
    {
        slug: "telecommunications",
        title: "Telecommunications",
        tagline: "Network Infrastructure",
        excerpt: "Network management systems, billing platforms, and service delivery software for telecom operators.",
        icon: Radio,
        gradient: { from: "#8b5cf6", to: "#a855f7" },
    },
    {
        slug: "media-entertainment",
        title: "Media & Entertainment",
        tagline: "Content & Distribution Platforms",
        excerpt: "Content management systems, streaming platforms, and rights management software for media companies.",
        icon: Film,
        gradient: { from: "#ec4899", to: "#8b5cf6" },
    },
    {
        slug: "gaming-esports",
        title: "Gaming & Esports",
        tagline: "Real-Time Game Systems",
        excerpt: "Game server reliability, matchmaking systems, and esports platform stability for gaming companies.",
        icon: Gamepad2,
        gradient: { from: "#10b981", to: "#06b6d4" },
    },
    {
        slug: "education",
        title: "Education",
        tagline: "Learning Management Systems",
        excerpt: "EdTech platform reliability, student data protection, and accessibility compliance for educational institutions.",
        icon: GraduationCap,
        gradient: { from: "#3b82f6", to: "#6366f1" },
    },
    {
        slug: "professional-services",
        title: "Professional Services",
        tagline: "Client & Practice Management",
        excerpt: "Practice management software, client engagement platforms, and billing systems for professional firms.",
        icon: Briefcase,
        gradient: { from: "#6366f1", to: "#8b5cf6" },
    },
    {
        slug: "marketing-advertising",
        title: "Marketing & Advertising",
        tagline: "Campaign & Analytics Platforms",
        excerpt: "Marketing automation, ad platform reliability, and analytics system accuracy for marketing agencies.",
        icon: Megaphone,
        gradient: { from: "#f472b6", to: "#ec4899" },
    },
    {
        slug: "agriculture-food-production",
        title: "Agriculture",
        tagline: "AgTech & Farm Management",
        excerpt: "Precision agriculture systems, farm management software, and supply chain traceability for agriculture.",
        icon: Wheat,
        gradient: { from: "#84cc16", to: "#22c55e" },
    },
    {
        slug: "food-beverage",
        title: "Food & Beverage",
        tagline: "Food Safety & Supply Chain",
        excerpt: "Food safety compliance, inventory management, and supply chain software for F&B companies.",
        icon: UtensilsCrossed,
        gradient: { from: "#f97316", to: "#ef4444" },
    },
    {
        slug: "hospitality-travel",
        title: "Hospitality & Travel",
        tagline: "Booking & Guest Management",
        excerpt: "Reservation systems, property management, and guest experience platforms for hospitality operators.",
        icon: Hotel,
        gradient: { from: "#06b6d4", to: "#14b8a6" },
    },
    {
        slug: "consumer-electronics",
        title: "Consumer Electronics",
        tagline: "IoT & Device Software",
        excerpt: "Firmware reliability, IoT platform stability, and device management software for electronics manufacturers.",
        icon: Smartphone,
        gradient: { from: "#8b5cf6", to: "#6366f1" },
    },
    {
        slug: "fashion-apparel",
        title: "Fashion & Apparel",
        tagline: "Design & Supply Chain Systems",
        excerpt: "PLM systems, inventory management, and e-commerce platforms for fashion and apparel brands.",
        icon: Shirt,
        gradient: { from: "#f472b6", to: "#ec4899" },
    },
    {
        slug: "beauty-personal-care",
        title: "Beauty & Personal Care",
        tagline: "Product & Compliance Management",
        excerpt: "Product formulation systems, regulatory compliance, and e-commerce platforms for beauty brands.",
        icon: Sparkles,
        gradient: { from: "#d946ef", to: "#f472b6" },
    },
    {
        slug: "mining-natural-resources",
        title: "Mining & Natural Resources",
        tagline: "Resource & Safety Systems",
        excerpt: "Mining operations software, safety management systems, and resource tracking for extraction industries.",
        icon: Mountain,
        gradient: { from: "#78716c", to: "#57534e" },
    },
    {
        slug: "chemicals-materials",
        title: "Chemicals & Materials",
        tagline: "Process & Safety Management",
        excerpt: "Process control systems, safety compliance software, and materials tracking for chemical manufacturers.",
        icon: Atom,
        gradient: { from: "#06b6d4", to: "#0891b2" },
    },
    {
        slug: "environmental-services",
        title: "Environmental Services",
        tagline: "Sustainability & Compliance",
        excerpt: "Environmental monitoring systems, compliance tracking, and sustainability reporting software.",
        icon: TreePine,
        gradient: { from: "#22c55e", to: "#14b8a6" },
    },
    {
        slug: "government-public-sector",
        title: "Government & Public Sector",
        tagline: "Citizen Services & Compliance",
        excerpt: "Government software reliability, citizen service platforms, and FedRAMP compliance for public sector.",
        icon: Building,
        gradient: { from: "#3b82f6", to: "#1d4ed8" },
    },
    {
        slug: "nonprofit-ngo",
        title: "Nonprofits & Social Impact",
        tagline: "Mission-Driven Technology",
        excerpt: "Donor management systems, program tracking, and impact measurement platforms for nonprofits.",
        icon: HandHeart,
        gradient: { from: "#ec4899", to: "#f472b6" },
    },
];

// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
            delayChildren: 0.1,
        },
    },
};

const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            type: "spring" as const,
            damping: 20,
            stiffness: 100,
        },
    },
};

// Industry Card Component
function IndustryCard({ industry }: { industry: Industry }) {
    const Icon = industry.icon;

    return (
        <motion.div
            variants={cardVariants}
            whileHover={{ y: -8, transition: { duration: 0.2 } }}
            className="group relative"
        >
            <Link href={`/industries/${industry.slug}`} className="block h-full">
                <div className="relative h-full overflow-hidden rounded-2xl border border-border bg-surface transition-all duration-300 group-hover:border-border-hover group-hover:shadow-2xl">
                    {/* Gradient Glow Effect */}
                    <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500"
                        style={{
                            background: `linear-gradient(135deg, ${industry.gradient.from}, ${industry.gradient.to})`,
                        }}
                    />

                    {/* Content */}
                    <div className="relative p-6 flex flex-col h-full">
                        {/* Icon */}
                        <div
                            className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
                            style={{
                                background: `linear-gradient(135deg, ${industry.gradient.from}20, ${industry.gradient.to}20)`,
                                border: `1px solid ${industry.gradient.from}40`,
                            }}
                        >
                            <Icon
                                className="w-7 h-7 transition-colors duration-300"
                                style={{ color: industry.gradient.from }}
                            />
                        </div>

                        {/* Title & Tagline */}
                        <h3 className="text-xl font-bold mb-1 text-foreground group-hover:text-primary transition-colors">
                            {industry.title}
                        </h3>
                        <p
                            className="text-sm font-medium mb-3"
                            style={{ color: industry.gradient.from }}
                        >
                            {industry.tagline}
                        </p>

                        {/* Excerpt */}
                        <p className="text-foreground-muted text-sm leading-relaxed flex-grow">
                            {industry.excerpt}
                        </p>

                        {/* Learn More */}
                        <div className="flex items-center gap-2 mt-4 text-sm font-medium text-foreground-muted group-hover:text-primary transition-colors">
                            <span>Explore Use Cases</span>
                            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}

export default function IndustriesPage() {
    const [searchQuery, setSearchQuery] = useState("");

    // Filter industries based on search
    const filteredIndustries = useMemo(() => {
        if (!searchQuery.trim()) {
            return industries;
        }

        const query = searchQuery.toLowerCase();
        return industries.filter(
            (ind) =>
                ind.title.toLowerCase().includes(query) ||
                ind.tagline.toLowerCase().includes(query) ||
                ind.excerpt.toLowerCase().includes(query)
        );
    }, [searchQuery]);

    return (
        <div className="relative min-h-screen">
            <div className="fixed inset-0 bg-grid opacity-[0.02] pointer-events-none" />
            <Header />

            <main id="main-content" className="pt-24">
                {/* Hero Section */}
                <section className="section pb-12">
                    <div className="container">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="max-w-4xl mx-auto text-center"
                        >
                            <span className="badge badge-primary mb-4">
                                Industry Solutions
                            </span>
                            <h1 className="mb-6">
                                Why CodeSleuth Works for{" "}
                                <span className="gradient-text">Your Industry</span>
                            </h1>
                            <p className="text-foreground-muted text-lg max-w-3xl mx-auto mb-8">
                                Every industry faces unique software challenges. Discover how
                                CodeSleuth&apos;s multi-agent architecture enforces the discipline
                                your sector demands—from regulatory compliance to operational
                                reliability.
                            </p>

                            {/* Search */}
                            <div className="relative max-w-md mx-auto">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-subtle" />
                                <input
                                    type="text"
                                    placeholder="Search industries..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="input !pl-12 pr-4 py-3"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery("")}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-surface-elevated transition-colors"
                                        aria-label="Clear search"
                                    >
                                        <X className="w-4 h-4 text-foreground-subtle" />
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Industries Grid */}
                <section className="section pt-0">
                    <div className="container">
                        <AnimatePresence mode="wait">
                            {filteredIndustries.length > 0 ? (
                                <motion.div
                                    key="grid"
                                    variants={containerVariants}
                                    initial="hidden"
                                    animate="visible"
                                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                                >
                                    {filteredIndustries.map((industry) => (
                                        <IndustryCard
                                            key={industry.slug}
                                            industry={industry}
                                        />
                                    ))}
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="empty"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="text-center py-20"
                                >
                                    <p className="text-foreground-muted text-lg mb-4">
                                        No industries found matching &quot;{searchQuery}&quot;
                                    </p>
                                    <button
                                        onClick={() => setSearchQuery("")}
                                        className="btn btn-secondary"
                                    >
                                        Clear Search
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </section>

                {/* Stats Section */}
                <section className="section bg-background-subtle">
                    <div className="container">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="grid grid-cols-2 md:grid-cols-4 gap-8"
                        >
                            {[
                                { value: "31+", label: "Industries Covered" },
                                { value: "6", label: "Platform Support" },
                                { value: "17", label: "Security Domains" },
                                { value: "100%", label: "Verification Coverage" },
                            ].map((stat, index) => (
                                <motion.div
                                    key={stat.label}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    className="text-center"
                                >
                                    <div className="text-4xl md:text-5xl font-bold gradient-text mb-2">
                                        {stat.value}
                                    </div>
                                    <div className="text-foreground-muted text-sm">
                                        {stat.label}
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="section">
                    <div className="container">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-center max-w-2xl mx-auto"
                        >
                            <h2 className="mb-4">Don&apos;t See Your Industry?</h2>
                            <p className="text-foreground-muted mb-8">
                                CodeSleuth&apos;s multi-agent architecture adapts to any sector.
                                Contact us to discuss your specific requirements and regulatory
                                compliance needs.
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
            </main>

            <Footer />
        </div>
    );
}
