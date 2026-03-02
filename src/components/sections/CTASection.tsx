"use client";

import { motion } from "framer-motion";
import { ArrowRight, Mail, Sparkles } from "lucide-react";
import { useState } from "react";

export function CTASection() {
    const [email, setEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setIsSubmitting(true);
        // TODO: Implement newsletter subscription
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setIsSubmitting(false);
        setIsSubmitted(true);
        setEmail("");
    };

    return (
        <section className="section relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-radial opacity-50" />

            <div className="container relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="max-w-4xl mx-auto"
                >
                    {/* Main CTA Card */}
                    <div className="relative p-8 md:p-12 rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
                        {/* Decorative Elements */}
                        <div className="absolute top-4 right-4">
                            <Sparkles className="w-6 h-6 text-primary/50" />
                        </div>
                        <div className="absolute bottom-4 left-4">
                            <Sparkles className="w-6 h-6 text-secondary/50" />
                        </div>

                        <div className="text-center">
                            <h2 className="mb-4">
                                Ready to End <span className="gradient-text">&quot;Just Prompting&quot;</span>?
                            </h2>
                            <p className="text-foreground-muted text-lg max-w-2xl mx-auto mb-8">
                                Join the engineers who are transitioning from &quot;writers of code&quot; to
                                &quot;orchestrators of experts.&quot; Get early access to CodeSleuth.
                            </p>

                            {/* Email Form */}
                            {!isSubmitted ? (
                                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                                    <div className="relative flex-1">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-subtle" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="Enter your email"
                                            className="input pl-12"
                                            required
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="btn btn-primary px-8"
                                    >
                                        {isSubmitting ? (
                                            <span className="animate-pulse">Joining...</span>
                                        ) : (
                                            <>
                                                Get Early Access
                                                <ArrowRight className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>
                                </form>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-success/10 text-success border border-success/30"
                                >
                                    <Sparkles className="w-5 h-5" />
                                    <span className="font-medium">Welcome to the future of autonomous engineering!</span>
                                </motion.div>
                            )}

                            <p className="text-foreground-subtle text-sm mt-4">
                                No spam. Unsubscribe anytime. We respect your inbox.
                            </p>
                        </div>
                    </div>

                    {/* Stats */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                        className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
                    >
                        {[
                            { value: "6", label: "Specialized Agents" },
                            { value: "17", label: "Security Domains" },
                            { value: "13", label: "Discovery Phases" },
                            { value: "4", label: "Quality Gates" },
                        ].map((stat) => (
                            <div key={stat.label}>
                                <div className="text-4xl md:text-5xl font-bold gradient-text mb-2">
                                    {stat.value}
                                </div>
                                <div className="text-foreground-muted text-sm">{stat.label}</div>
                            </div>
                        ))}
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}
