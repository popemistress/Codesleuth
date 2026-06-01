"use client";

import { motion } from "framer-motion";
import {
    Zap,
    Target,
    Lock,
    Layers,
    CheckCircle2,
    AlertTriangle,
    FileCode,
} from "lucide-react";

const features = [
    {
        icon: Target,
        title: "5-Stage Repair System",
        description:
            "Every build failure is classified by mode — compiler error, test assertion, dependency missing, interface mismatch, or timeout — and the corresponding recovery strategy is applied immediately. After 5 attempts the pipeline halts with a full BLOCKED report.",
        highlight: "Prevents infinite repair loops",
    },
    {
        icon: Lock,
        title: "20 Security Domains",
        description:
            "Comprehensive security coverage from Release Integrity to Client-Side Secrets. Platform-specific annexes for Web, Mobile, and Desktop.",
        highlight: "Assume Breach philosophy",
    },
    {
        icon: Layers,
        title: "Multi-Platform Parity",
        description:
            "Unified architecture across Web, Windows, macOS, Linux, iOS, and Android. Blast radius analysis detects cross-platform regressions.",
        highlight: "6 target platforms",
    },
    {
        icon: FileCode,
        title: "phases.md Progress Contract",
        description:
            "Live, transparent tracking of vertical development slices. No dark work or unverified progress—every step is documented.",
        highlight: "Full execution visibility",
    },
    {
        icon: CheckCircle2,
        title: "Quality Gates",
        description:
            "Four mandatory gates: Lint, Typecheck, Tests, Build. All gates must pass before shipping. Red = Stop, Green = Ship.",
        highlight: "Zero-tolerance CI/CD",
    },
    {
        icon: AlertTriangle,
        title: "CRITICISM.md Deliverable",
        description:
            "Canonical record of product survival probability. Top 10 Fix-First list with assumption stress tests and failure costs.",
        highlight: "Truth over comfort",
    },
];

export function FeaturesSection() {
    return (
        <section id="features" className="section">
            <div className="container">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center max-w-3xl mx-auto mb-16"
                >
                    <span className="badge mb-4">Enterprise-Grade Features</span>
                    <h2 className="mb-4">
                        Built for <span className="gradient-text">High-Stakes</span> Development
                    </h2>
                    <p className="text-foreground-muted text-lg">
                        Every feature is designed to prevent the hallucination-to-production pipeline
                        that plagues amateur AI development.
                    </p>
                </motion.div>

                {/* Features Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="group relative"
                        >
                            {/* Card */}
                            <div className="relative h-full p-6 rounded-2xl border border-border bg-surface/50 hover:border-primary/50 transition-all duration-300">
                                {/* Icon */}
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                                    <feature.icon className="w-5 h-5 text-primary" />
                                </div>

                                {/* Content */}
                                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                                <p className="text-foreground-muted text-sm mb-4">
                                    {feature.description}
                                </p>

                                {/* Highlight */}
                                <div className="inline-flex items-center gap-2 text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-full">
                                    <Zap className="w-3 h-3" />
                                    {feature.highlight}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Bottom Quote */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="mt-16 text-center"
                >
                    <blockquote className="text-2xl md:text-3xl font-medium text-foreground-muted italic max-w-3xl mx-auto">
                        &ldquo;Are you prepared for a world where your AI agents are more paranoid,
                        more security-conscious, and more brutally honest than the developers who built them?&rdquo;
                    </blockquote>
                </motion.div>
            </div>
        </section>
    );
}
