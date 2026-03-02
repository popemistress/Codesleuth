"use client";

import { motion } from "framer-motion";
import {
    Brain,
    FileSearch,
    Code2,
    Shield,
    Eye,
    MessageSquareWarning,
    ArrowRight,
} from "lucide-react";

const agents = [
    {
        id: 1,
        name: "Product Discovery",
        icon: Brain,
        color: "primary",
        description:
            "13-phase structured discovery. One question at a time. The word 'also' is forbidden to prevent compound logic.",
        features: [
            "Extreme granularity over speed",
            "Stack Probes for technical extraction",
            "Zero clarifying questions for builder",
        ],
    },
    {
        id: 2,
        name: "Technical Designer",
        icon: FileSearch,
        color: "secondary",
        description:
            "Translates product requirements into executable blueprints with cross-platform parity.",
        features: [
            "7 mandatory TDD deliverables",
            "Multi-platform architecture (Web, Desktop, Mobile)",
            "Unified data & sync strategy",
        ],
    },
    {
        id: 3,
        name: "Application Builder",
        icon: Code2,
        color: "accent",
        description:
            "'Red = Stop, Green = Ship.' Three-strike error fingerprinting prevents infinite repair loops.",
        features: [
            "80%+ error match detection",
            "Quality gates: Lint, Type, Test, Build",
            "phases.md progress contract",
        ],
    },
    {
        id: 4,
        name: "Security Agent",
        icon: Shield,
        color: "error",
        description:
            "Assume Breach philosophy. 17 security domains with absolute BLOCK/APPROVE authority.",
        features: [
            "Domain 12: Release Integrity",
            "Domain 13: Client-Side Secrets",
            "Platform-specific annexes",
        ],
    },
    {
        id: 5,
        name: "Codebase Verifier",
        icon: Eye,
        color: "info",
        description:
            "'Guilty until proven innocent.' Blast radius analysis across all six target platforms.",
        features: [
            "Evidence over assertion",
            "Cross-platform regression detection",
            "Plan compliance verification",
        ],
    },
    {
        id: 6,
        name: "Product Critic",
        icon: MessageSquareWarning,
        color: "warning",
        description:
            "Truth-Over-Comfort mandate. Red Team Mode with power to KILL or PAUSE before code is written.",
        features: [
            "CRITICISM.md deliverable",
            "Top 10 Fix-First prioritization",
            "Go/No-Go launch gate",
        ],
    },
];

const colorMap: Record<string, string> = {
    primary: "from-primary to-primary-hover",
    secondary: "from-secondary to-secondary-hover",
    accent: "from-accent to-pink-600",
    error: "from-error to-red-600",
    info: "from-info to-blue-600",
    warning: "from-warning to-amber-600",
};

const glowMap: Record<string, string> = {
    primary: "shadow-primary/30",
    secondary: "shadow-secondary/30",
    accent: "shadow-accent/30",
    error: "shadow-error/30",
    info: "shadow-info/30",
    warning: "shadow-warning/30",
};

export function AgentsSection() {
    return (
        <section id="agents" className="section bg-background-subtle">
            <div className="container">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center max-w-3xl mx-auto mb-16"
                >
                    <span className="badge badge-primary mb-4">6 Specialized Agents</span>
                    <h2 className="mb-4">
                        The <span className="gradient-text">Agent Orchestra</span>
                    </h2>
                    <p className="text-foreground-muted text-lg">
                        Each agent operates with strict protocols, absolute authority in their domain,
                        and a single mission: ship production-ready software that survives the real world.
                    </p>
                </motion.div>

                {/* Agents Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {agents.map((agent, index) => (
                        <motion.div
                            key={agent.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="group card card-glow"
                        >
                            {/* Icon */}
                            <div
                                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorMap[agent.color]} flex items-center justify-center mb-4 shadow-lg ${glowMap[agent.color]}`}
                            >
                                <agent.icon className="w-6 h-6 text-white" />
                            </div>

                            {/* Agent Number */}
                            <div className="absolute top-6 right-6 text-foreground-subtle/20 text-4xl font-bold">
                                0{agent.id}
                            </div>

                            {/* Content */}
                            <h3 className="text-xl font-semibold mb-2">{agent.name}</h3>
                            <p className="text-foreground-muted text-sm mb-4">
                                {agent.description}
                            </p>

                            {/* Features */}
                            <ul className="space-y-2 mb-4">
                                {agent.features.map((feature) => (
                                    <li
                                        key={feature}
                                        className="flex items-start gap-2 text-sm text-foreground-subtle"
                                    >
                                        <span className="text-success mt-0.5">✓</span>
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            {/* Link */}
                            <button className="inline-flex items-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all">
                                Learn more
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
