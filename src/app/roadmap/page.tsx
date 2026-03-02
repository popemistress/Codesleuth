"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import { ArrowRight, X, ZoomIn } from "lucide-react";

// Roadmap phases with corresponding images
const roadmapPhases = [
    {
        id: 1,
        image: "/images/roadmap/image1-01.webp",
        title: "Product Discovery",
        subtitle: "Phase 01 — Foundation",
        description: "Every enterprise feature begins with exhaustive discovery. The Product Discovery Agent conducts a 13-phase structured interview to eliminate ambiguity before a single line of code is written.",
        highlights: [
            "13-phase structured discovery protocol",
            "Concept Validation Gate (KILL/PROCEED/PAUSE)",
            "Feature specification compilation",
            "Zero-ambiguity requirement enforcement",
        ],
    },
    {
        id: 2,
        image: "/images/roadmap/image1-02.webp",
        title: "Technical Design",
        subtitle: "Phase 02 — Architecture",
        description: "The Technical Designer Agent creates comprehensive blueprints for cross-platform development. Every architecture decision is documented across 7 TDD deliverables.",
        highlights: [
            "Cross-platform scoping (6 platforms)",
            "Unified sync strategy",
            "API contract definitions",
            "Blast radius analysis",
        ],
    },
    {
        id: 3,
        image: "/images/roadmap/image1-04.webp",
        title: "Application Building",
        subtitle: "Phase 03 — Implementation",
        description: "The Application Builder Agent implements features with strict quality gate enforcement. Every change must pass lint, typecheck, test, and build verification.",
        highlights: [
            "Quality gate enforcement (4 gates)",
            "Strike limit protocol for repair loops",
            "Progress tracking via phases.md",
            "Smallest possible diff philosophy",
        ],
    },
    {
        id: 4,
        image: "/images/roadmap/image1-05.webp",
        title: "Security Assessment",
        subtitle: "Phase 04 — Protection",
        description: "The Security Agent operates with an 'Assume Breach' mindset, evaluating code against 17 distinct security domains. No shortcuts, no suggestions—only BLOCK or APPROVE.",
        highlights: [
            "17 domain security assessment",
            "OWASP Top 10 compliance",
            "Platform-specific security annexes",
            "Mandatory security test coverage",
        ],
    },
    {
        id: 5,
        image: "/images/roadmap/image1-07.webp",
        title: "Product Critique",
        subtitle: "Phase 05 — Governance",
        description: "The Product Critic Agent provides 'truth-over-comfort' analysis. It has the power to halt projects that fail monetization or market differentiation criteria.",
        highlights: [
            "CRITICISM.md generation",
            "Top 10 Fix-First list",
            "Go/No-Go launch gate",
            "Red Team Mode analysis",
        ],
    },
    {
        id: 6,
        image: "/images/roadmap/image1-09.webp",
        title: "Platform Parity",
        subtitle: "Phase 06 — Unification",
        description: "Absolute platform parity is non-negotiable. Features must work identically across Web, Windows, macOS, Linux, iOS, and Android with unified architecture.",
        highlights: [
            "6-platform support matrix",
            "Unified API contracts",
            "Platform-specific implementations",
            "Cross-platform testing suite",
        ],
    },
    {
        id: 7,
        image: "/images/roadmap/image1-10.webp",
        title: "Quality Gates",
        subtitle: "Phase 07 — Enforcement",
        description: "Four mandatory quality gates must pass before any code ships. Red means stop. Green means ship. There is no middle ground in enterprise development.",
        highlights: [
            "Lint: Zero warnings policy",
            "Typecheck: Strict mode enforced",
            "Tests: Critical logic coverage",
            "Build: Production verification",
        ],
    },
    {
        id: 8,
        image: "/images/roadmap/image1-11.webp",
        title: "Documentation",
        subtitle: "Phase 08 — Knowledge",
        description: "Every project maintains comprehensive documentation through phases.md tracking. This enables context continuity across sessions and team members.",
        highlights: [
            "phases.md progress tracking",
            "Context window management",
            "Change log maintenance",
            "Implementation runbooks",
        ],
    },
    {
        id: 9,
        image: "/images/roadmap/image1-12.webp",
        title: "Repair Mode",
        subtitle: "Phase 09 — Recovery",
        description: "When gates fail, Repair Mode activates. The smallest possible surface area is fixed first. No refactors, no 'while I'm here' changes—only targeted repairs.",
        highlights: [
            "Minimal surface area fixes",
            "Re-run failing gate first",
            "Then verify all gates",
            "Exit only when all green",
        ],
    },
    {
        id: 10,
        image: "/images/roadmap/image1-14.webp",
        title: "Security Non-Negotiables",
        subtitle: "Phase 10 — Protection",
        description: "Some security rules cannot be overridden. Never hardcode secrets. Never log secrets. Validate all inputs. Fail closed on auth. No exceptions.",
        highlights: [
            "No hardcoded secrets",
            "No secret logging",
            "Input validation at boundary",
            "Fail closed on auth",
        ],
    },
    {
        id: 11,
        image: "/images/roadmap/image1-15.webp",
        title: "Ship Declaration",
        subtitle: "Phase 11 — Release",
        description: "Only after all gates pass can a Ship Declaration be made. This includes summary, gate status, PR notes, test instructions, and rollback procedures.",
        highlights: [
            "All gates verified green",
            "Complete change summary",
            "Manual test instructions",
            "Rollback documentation",
        ],
    },
    {
        id: 12,
        image: "/images/roadmap/image1-16.webp",
        title: "Continuous Monitoring",
        subtitle: "Phase 12 — Observability",
        description: "Post-deployment monitoring ensures production stability. Error rates, performance metrics, and user feedback create a continuous improvement loop.",
        highlights: [
            "Error rate monitoring",
            "Performance metrics",
            "User feedback integration",
            "Incident response protocols",
        ],
    },
];

// Lightbox Modal Component
function ImageLightbox({
    image,
    title,
    onClose,
}: {
    image: string;
    title: string;
    onClose: () => void;
}) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/90 backdrop-blur-md"
            onClick={onClose}
        >
            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 p-3 rounded-full bg-surface border border-border hover:bg-surface-elevated transition-colors"
                aria-label="Close lightbox"
            >
                <X className="w-6 h-6" />
            </button>

            {/* Image Container */}
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative max-w-[95vw] max-h-[90vh] rounded-2xl overflow-hidden border border-border shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <Image
                    src={image}
                    alt={title}
                    width={1920}
                    height={1080}
                    className="w-auto h-auto max-w-full max-h-[85vh] object-contain"
                    priority
                />

                {/* Title Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background to-transparent">
                    <p className="text-lg font-semibold text-foreground">{title}</p>
                </div>
            </motion.div>
        </motion.div>
    );
}

export default function RoadmapPage() {
    const [selectedImage, setSelectedImage] = useState<{ image: string; title: string } | null>(null);

    return (
        <div className="relative min-h-screen">
            <div className="fixed inset-0 bg-grid opacity-[0.02] pointer-events-none" />
            <Header />

            <main id="main-content" className="pt-24">
                {/* Hero */}
                <section className="section pb-8">
                    <div className="container">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="max-w-4xl mx-auto text-center"
                        >
                            <span className="badge badge-primary mb-4">Strategic Roadmap</span>
                            <h1 className="mb-4">
                                The <span className="gradient-text">Implementation</span> Journey
                            </h1>
                            <p className="text-foreground-muted text-lg max-w-2xl mx-auto">
                                A 12-phase comprehensive roadmap from Product Discovery to Continuous Monitoring.
                                Each phase builds upon the previous with strict handoff protocols
                                and quality gates.
                            </p>
                        </motion.div>
                    </div>
                </section>

                {/* Roadmap Phases */}
                <section className="section pt-8">
                    <div className="container">
                        <div className="space-y-24 md:space-y-32">
                            {roadmapPhases.map((phase, index) => {
                                const isEven = index % 2 === 0;

                                return (
                                    <motion.div
                                        key={phase.id}
                                        initial={{ opacity: 0, y: 40 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true, margin: "-100px" }}
                                        transition={{ duration: 0.6 }}
                                        className={`grid md:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center ${isEven ? "" : "md:flex-row-reverse"
                                            }`}
                                    >
                                        {/* Text Content */}
                                        <div className={`space-y-6 ${isEven ? "md:order-1" : "md:order-2"}`}>
                                            <div>
                                                <span className="text-primary font-mono text-sm">
                                                    {phase.subtitle}
                                                </span>
                                                <h2 className="text-3xl md:text-4xl font-bold mt-2">
                                                    {phase.title}
                                                </h2>
                                            </div>

                                            <p className="text-foreground-muted text-lg leading-relaxed">
                                                {phase.description}
                                            </p>

                                            <ul className="space-y-3">
                                                {phase.highlights.map((highlight, i) => (
                                                    <li key={i} className="flex items-start gap-3">
                                                        <ArrowRight className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                                        <span className="text-foreground-muted">{highlight}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        {/* Image */}
                                        <div className={`${isEven ? "md:order-2" : "md:order-1"}`}>
                                            <motion.div
                                                whileHover={{ scale: 1.02 }}
                                                transition={{ duration: 0.3 }}
                                                className="relative rounded-2xl overflow-hidden border border-border bg-surface shadow-2xl cursor-pointer group"
                                                onClick={() => setSelectedImage({ image: phase.image, title: phase.title })}
                                            >
                                                <Image
                                                    src={phase.image}
                                                    alt={phase.title}
                                                    width={800}
                                                    height={600}
                                                    className="w-full h-auto"
                                                    sizes="(max-width: 768px) 100vw, 50vw"
                                                />

                                                {/* Hover Overlay */}
                                                <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-white font-medium">
                                                        <ZoomIn className="w-5 h-5" />
                                                        <span>View Full Size</span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="section bg-background-subtle">
                    <div className="container">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-center max-w-2xl mx-auto"
                        >
                            <h2 className="mb-4">Ready to Transform Your Development?</h2>
                            <p className="text-foreground-muted mb-8">
                                Join the multi-agent revolution and experience enterprise-grade
                                development with rigorous quality gates.
                            </p>
                            <div className="flex flex-wrap gap-4 justify-center">
                                <Link href="/pricing" className="btn btn-primary">
                                    View Pricing
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                                <Link href="/contact" className="btn btn-secondary">
                                    Contact Sales
                                </Link>
                            </div>
                        </motion.div>
                    </div>
                </section>
            </main>

            <Footer />

            {/* Lightbox Modal */}
            <AnimatePresence>
                {selectedImage && (
                    <ImageLightbox
                        image={selectedImage.image}
                        title={selectedImage.title}
                        onClose={() => setSelectedImage(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
