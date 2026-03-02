"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Play } from "lucide-react";
import Link from "next/link";

export function HeroSection() {
    return (
        <section className="relative min-h-screen flex items-center justify-center pt-24 pb-16">
            <div className="container relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center max-w-4xl mx-auto"
                >
                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="inline-flex items-center gap-2 badge badge-primary mb-8"
                    >
                        <Sparkles className="w-4 h-4" />
                        <span>The Future of Autonomous Engineering</span>
                    </motion.div>

                    {/* Headline */}
                    <h1 className="mb-6">

                        <span className="gradient-text animate-gradient">
                            Multi-Agent Enterprise
                        </span>
                        <br />
                        <span className="text-foreground">Development Lifecycle</span>
                    </h1>

                    {/* Subheadline */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-foreground-muted text-lg md:text-xl max-w-2xl mx-auto mb-10"
                    >
                        In professional environments, lazy prompt engineering is the fastest route to failure.
                        CodeSleuth provides rigorous multi-agent orchestration where{" "}
                        <span className="text-primary font-semibold">Ambiguity = Bugs in Production</span>.
                    </motion.p>

                    {/* CTA Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4"
                    >
                        <Link href="/demo" className="btn btn-primary text-base px-8 py-4 animate-pulse-glow">
                            Start Building
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <button className="btn btn-secondary text-base px-8 py-4 group">
                            <Play className="w-5 h-5 group-hover:text-primary transition-colors" />
                            Watch Demo
                        </button>
                    </motion.div>

                    {/* Trust Indicators */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="mt-16 pt-16 border-t border-border"
                    >
                        <p className="text-foreground-subtle text-sm mb-6">
                            Trusted by engineering teams at
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-8 opacity-50">
                            {["Fortune 500", "Series A Startups", "Enterprise Teams", "Solo Developers"].map(
                                (name) => (
                                    <span
                                        key={name}
                                        className="text-foreground-muted font-medium text-sm"
                                    >
                                        {name}
                                    </span>
                                )
                            )}
                        </div>
                    </motion.div>
                </motion.div>

                {/* Floating Elements */}
                <div className="absolute top-1/4 left-10 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-float" />
                <div className="absolute bottom-1/4 right-10 w-80 h-80 bg-secondary/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "-3s" }} />
            </div>
        </section>
    );
}
