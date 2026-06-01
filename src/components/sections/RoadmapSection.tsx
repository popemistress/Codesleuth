"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";

const phases = [
    {
        number: "01",
        title: "Planning & Strategy",
        subtitle: "Product Discovery Agent",
        status: "complete",
        items: [
            "16-phase structured discovery (Phase 0–15)",
            "Concept Validation Gate",
            "Feature Specification compilation",
        ],
    },
    {
        number: "02",
        title: "Architecture",
        subtitle: "Technical Designer",
        status: "complete",
        items: [
            "Cross-platform scoping",
            "7 TDD deliverables",
            "Unified sync strategy",
        ],
    },
    {
        number: "03",
        title: "Building",
        subtitle: "Application Builder Agent",
        status: "in-progress",
        items: [
            "Pre-build infrastructure discovery",
            "Quality gate enforcement",
            "5-stage repair system with failure-mode classification",
        ],
    },
    {
        number: "04",
        title: "Security",
        subtitle: "Security Agent",
        status: "upcoming",
        items: [
            "20 domain security assessment",
            "Platform-specific annexes",
            "Security test mandates",
        ],
    },
    {
        number: "05",
        title: "Verification",
        subtitle: "Codebase Verifier Agent",
        status: "upcoming",
        items: [
            "Plan compliance audit",
            "Blast radius analysis",
            "Cross-platform regression",
        ],
    },
    {
        number: "06",
        title: "Governance",
        subtitle: "Product Critic Agent",
        status: "upcoming",
        items: [
            "CRITICISM.md generation",
            "Top 10 Fix-First list",
            "Go/No-Go launch gate",
        ],
    },
];

const statusColors: Record<string, { bg: string; text: string; border: string }> = {
    complete: {
        bg: "bg-success/10",
        text: "text-success",
        border: "border-success/30",
    },
    "in-progress": {
        bg: "bg-primary/10",
        text: "text-primary",
        border: "border-primary/30",
    },
    upcoming: {
        bg: "bg-foreground-subtle/10",
        text: "text-foreground-subtle",
        border: "border-border",
    },
};

export function RoadmapSection() {
    return (
        <section id="roadmap" className="section bg-background-subtle">
            <div className="container">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center max-w-3xl mx-auto mb-16"
                >
                    <span className="badge badge-primary mb-4">Strategic Roadmap</span>
                    <h2 className="mb-4">
                        The <span className="gradient-text">Implementation</span> Journey
                    </h2>
                    <p className="text-foreground-muted text-lg">
                        A 6-layer roadmap from Product Discovery to Go/No-Go Launch Gate.
                        Each layer feeds into the next with strict handoff protocols.
                    </p>
                </motion.div>

                {/* Roadmap Timeline */}
                <div className="relative">
                    {/* Connection Line */}
                    <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-success via-primary to-border hidden md:block" />

                    <div className="space-y-6">
                        {phases.map((phase, index) => (
                            <motion.div
                                key={phase.number}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="relative flex gap-6"
                            >
                                {/* Status Indicator */}
                                <div className="hidden md:flex flex-shrink-0 w-16 items-start justify-center pt-8">
                                    <div
                                        className={`w-4 h-4 rounded-full ${phase.status === "complete"
                                                ? "bg-success"
                                                : phase.status === "in-progress"
                                                    ? "bg-primary animate-pulse"
                                                    : "bg-border"
                                            }`}
                                    />
                                </div>

                                {/* Card */}
                                <div
                                    className={`flex-1 p-6 rounded-2xl border ${statusColors[phase.status].border} ${statusColors[phase.status].bg}`}
                                >
                                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                        <div className="flex-1">
                                            {/* Phase Number & Title */}
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="text-foreground-subtle font-mono text-sm">
                                                    Phase {phase.number}
                                                </span>
                                                <span
                                                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[phase.status].bg} ${statusColors[phase.status].text}`}
                                                >
                                                    {phase.status === "complete"
                                                        ? "Complete"
                                                        : phase.status === "in-progress"
                                                            ? "In Progress"
                                                            : "Upcoming"}
                                                </span>
                                            </div>
                                            <h3 className="text-xl font-semibold mb-1">
                                                {phase.title}
                                            </h3>
                                            <p className="text-foreground-muted text-sm mb-4">
                                                {phase.subtitle}
                                            </p>

                                            {/* Items */}
                                            <ul className="space-y-2">
                                                {phase.items.map((item) => (
                                                    <li
                                                        key={item}
                                                        className="flex items-center gap-2 text-sm"
                                                    >
                                                        {phase.status === "complete" ? (
                                                            <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                                                        ) : (
                                                            <Circle className="w-4 h-4 text-foreground-subtle flex-shrink-0" />
                                                        )}
                                                        <span className="text-foreground-muted">{item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        {/* Arrow to next */}
                                        {index < phases.length - 1 && (
                                            <div className="hidden lg:flex items-center">
                                                <ArrowRight className="w-5 h-5 text-foreground-subtle" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
