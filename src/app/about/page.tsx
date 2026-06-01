"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
    Target,
    Users,
    Lightbulb,
    Shield,
    Award,
    Rocket,
} from "lucide-react";

const values = [
    {
        icon: Target,
        title: "Precision Over Speed",
        description: "We believe that ambiguity is the root of all production bugs. Every feature is exhaustively defined before a single line of code is written.",
    },
    {
        icon: Shield,
        title: "Security First",
        description: "With 20 security domains and an 'Assume Breach' philosophy, security is not an afterthought—it's a hard gate that blocks shipment.",
    },
    {
        icon: Lightbulb,
        title: "Evidence Over Assertion",
        description: "Our Verifier Agent treats every implementation as flawed until proven otherwise. Nothing ships without objective, verified proof.",
    },
    {
        icon: Award,
        title: "Truth Over Comfort",
        description: "The Product Critic operates in Red Team Mode, with the power to KILL projects that lack measurable business value.",
    },
];

const stats = [
    { value: "8", label: "Specialized Agents" },
    { value: "20", label: "Security Domains" },
    { value: "16", label: "Discovery Phases" },
    { value: "5", label: "Stage Repair System" },
];

const team = [
    {
        name: "The Director",
        role: "Orchestrator (Agent 0)",
        description: "Pipeline director and state manager. Never builds code — enforces human gates, routes stage transitions, and owns the Spec Change Protocol.",
    },
    {
        name: "The Discovery Agent",
        role: "Product Discovery (Agent 1)",
        description: "Governs the 16-phase structured discovery (Phase 0–15) with extreme granularity. Runs Capability Intelligence Analysis at 4 trigger points.",
    },
    {
        name: "The Architect",
        role: "Technical Designer (Agent 2)",
        description: "Translates requirements into cross-platform blueprints spanning Web, Windows, macOS, Linux, iOS, and Android.",
    },
    {
        name: "The Builder",
        role: "Application Builder (Agent 3)",
        description: "Operates under 'Red = Stop, Green = Ship' with a 5-stage repair system — each failure classified by mode, each mode with a prescribed recovery strategy.",
    },
    {
        name: "The Critic",
        role: "Product Critic (Agent 4)",
        description: "Truth-Over-Comfort mandate. 12-Dimension Product Scorecard — any dimension scoring 1 is an automatic HOLD. Red Team Mode with power to KILL or PAUSE.",
    },
    {
        name: "The Guardian",
        role: "Security Agent (Agent 5)",
        description: "Holds absolute BLOCK/APPROVE authority across 20 security domains with platform-specific annexes.",
    },
    {
        name: "The Skeptic",
        role: "Codebase Verifier (Agent 6)",
        description: "Performs blast radius analysis and cross-platform regression detection. Guilty until proven innocent.",
    },
    {
        name: "The Resident",
        role: "Maintenance Agent (Agent 7)",
        description: "Always-resident after ship. Handles feature requests and fixes on registered projects through the same quality gates as the original build.",
    },
];

export default function AboutPage() {
    return (
        <div className="relative min-h-screen">
            <div className="fixed inset-0 bg-grid opacity-[0.02] pointer-events-none" />
            <Header />

            <main className="pt-24">
                {/* Hero Section */}
                <section className="section">
                    <div className="container">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="max-w-4xl mx-auto text-center"
                        >
                            <span className="badge badge-primary mb-4">About CodeSleuth</span>
                            <h1 className="mb-6">
                                Building the Future of{" "}
                                <span className="gradient-text">Autonomous Engineering</span>
                            </h1>
                            <p className="text-foreground-muted text-lg md:text-xl max-w-2xl mx-auto">
                                CodeSleuth represents a fundamental shift toward an Autonomous Software Lifecycle
                                where AI agents are more paranoid, more security-conscious, and more brutally
                                honest than the developers who built them.
                            </p>
                        </motion.div>
                    </div>
                </section>

                {/* Stats */}
                <section className="py-16 bg-background-subtle">
                    <div className="container">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                            {stats.map((stat, index) => (
                                <motion.div
                                    key={stat.label}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <div className="text-4xl md:text-5xl font-bold gradient-text mb-2">
                                        {stat.value}
                                    </div>
                                    <div className="text-foreground-muted text-sm">{stat.label}</div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Mission */}
                <section className="section">
                    <div className="container">
                        <div className="max-w-4xl mx-auto">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="text-center mb-16"
                            >
                                <h2 className="mb-4">Our Mission</h2>
                                <p className="text-foreground-muted text-lg">
                                    To end the &quot;hallucination-to-production pipeline&quot; that plagues amateur AI development
                                    by providing rigorous multi-agent orchestration where every requirement is isolated,
                                    scrutinized, and confirmed.
                                </p>
                            </motion.div>

                            <div className="prose prose-invert max-w-none">
                                <blockquote className="text-2xl font-medium text-center italic border-l-4 border-primary pl-6 my-12">
                                    &quot;The popular image of AI development is a dangerous myth. It suggests that a
                                    developer can simply type a vague, &apos;magical&apos; prompt and watch a production-ready
                                    application materialize. In professional environments, this lazy prompt engineering
                                    culture is the fastest route to failure.&quot;
                                </blockquote>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Values */}
                <section className="section bg-background-subtle">
                    <div className="container">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-center mb-16"
                        >
                            <span className="badge mb-4">Core Values</span>
                            <h2>What We Believe</h2>
                        </motion.div>

                        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                            {values.map((value, index) => (
                                <motion.div
                                    key={value.title}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    className="card"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                                        <value.icon className="w-6 h-6 text-primary" />
                                    </div>
                                    <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                                    <p className="text-foreground-muted">{value.description}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Team */}
                <section className="section">
                    <div className="container">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-center mb-16"
                        >
                            <span className="badge badge-primary mb-4">The Agent Orchestra</span>
                            <h2>Meet the Team</h2>
                            <p className="text-foreground-muted text-lg mt-4 max-w-2xl mx-auto">
                                In this model, the human developer transitions from a &quot;writer of code&quot; to an
                                &quot;orchestrator of experts.&quot;
                            </p>
                        </motion.div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                            {team.map((member, index) => (
                                <motion.div
                                    key={member.name}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    className="card text-center"
                                >
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4">
                                        <Users className="w-8 h-8 text-white" />
                                    </div>
                                    <h3 className="text-lg font-semibold">{member.name}</h3>
                                    <p className="text-primary text-sm mb-3">{member.role}</p>
                                    <p className="text-foreground-muted text-sm">{member.description}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="section bg-background-subtle">
                    <div className="container">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-center max-w-2xl mx-auto"
                        >
                            <Rocket className="w-12 h-12 text-primary mx-auto mb-6" />
                            <h2 className="mb-4">Ready to Transform Your Development?</h2>
                            <p className="text-foreground-muted text-lg mb-8">
                                Join the engineers who are building software that survives the real world.
                            </p>
                            <Link href="/" className="btn btn-primary">
                                Get Started Today
                            </Link>
                        </motion.div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
