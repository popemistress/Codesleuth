"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
    Check,
    X,
    Zap,
    Building,
    Rocket,
    ArrowRight,
    HelpCircle,
} from "lucide-react";

const plans = [
    {
        name: "Starter",
        description: "For individual developers and small projects",
        price: { monthly: 29, yearly: 290 },
        icon: Zap,
        popular: false,
        features: [
            { name: "3 AI Agent types", included: true },
            { name: "100 build minutes/month", included: true },
            { name: "1 team member", included: true },
            { name: "Community support", included: true },
            { name: "Basic quality gates", included: true },
            { name: "Security scanning", included: false },
            { name: "Priority support", included: false },
            { name: "Custom integrations", included: false },
        ],
    },
    {
        name: "Professional",
        description: "For growing teams and serious projects",
        price: { monthly: 99, yearly: 990 },
        icon: Rocket,
        popular: true,
        features: [
            { name: "8 AI Agent types", included: true },
            { name: "Unlimited build minutes", included: true },
            { name: "Up to 10 team members", included: true },
            { name: "Priority support", included: true },
            { name: "Full quality gates", included: true },
            { name: "20 security domains", included: true },
            { name: "Slack integration", included: true },
            { name: "Custom integrations", included: false },
        ],
    },
    {
        name: "Enterprise",
        description: "For organizations with advanced needs",
        price: { monthly: null, yearly: null },
        icon: Building,
        popular: false,
        features: [
            { name: "All 8 AI Agents", included: true },
            { name: "Unlimited everything", included: true },
            { name: "Unlimited team members", included: true },
            { name: "24/7 dedicated support", included: true },
            { name: "Custom quality gates", included: true },
            { name: "Custom security policies", included: true },
            { name: "All integrations", included: true },
            { name: "On-premise deployment", included: true },
        ],
    },
];

const faqs = [
    {
        question: "What counts as a build minute?",
        answer: "Build minutes are calculated based on the time your AI agents spend actively processing code, running quality gates, and performing security scans. Idle time is not counted.",
    },
    {
        question: "Can I change plans later?",
        answer: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle.",
    },
    {
        question: "What's included in the security scanning?",
        answer: "Security scanning covers all 20 security domains including Release Integrity, Client-Side Secrets, authentication flows, and platform-specific annexes.",
    },
    {
        question: "Do you offer discounts for startups?",
        answer: "Yes! Qualifying startups can receive up to 50% off Professional plans for the first year. Contact us to learn more.",
    },
];

export default function PricingPage() {
    const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");

    return (
        <div className="relative min-h-screen">
            <div className="fixed inset-0 bg-grid opacity-[0.02] pointer-events-none" />
            <Header />

            <main className="pt-24">
                {/* Hero */}
                <section className="section pb-8">
                    <div className="container">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="max-w-3xl mx-auto text-center"
                        >
                            <span className="badge badge-primary mb-4">Pricing</span>
                            <h1 className="mb-4">
                                Simple, Transparent <span className="gradient-text">Pricing</span>
                            </h1>
                            <p className="text-foreground-muted text-lg mb-8">
                                Choose the plan that fits your team. All plans include access to our
                                core multi-agent orchestration platform.
                            </p>

                            {/* Billing Toggle */}
                            <div className="inline-flex items-center gap-4 p-1 bg-surface rounded-full">
                                <button
                                    onClick={() => setBillingCycle("monthly")}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${billingCycle === "monthly"
                                            ? "bg-primary text-white"
                                            : "text-foreground-muted hover:text-foreground"
                                        }`}
                                >
                                    Monthly
                                </button>
                                <button
                                    onClick={() => setBillingCycle("yearly")}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${billingCycle === "yearly"
                                            ? "bg-primary text-white"
                                            : "text-foreground-muted hover:text-foreground"
                                        }`}
                                >
                                    Yearly
                                    <span className="ml-2 text-xs bg-success/20 text-success px-2 py-0.5 rounded-full">
                                        Save 17%
                                    </span>
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Pricing Cards */}
                <section className="section pt-8">
                    <div className="container">
                        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                            {plans.map((plan, index) => (
                                <motion.div
                                    key={plan.name}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    className={`relative card ${plan.popular
                                            ? "border-primary ring-2 ring-primary/20"
                                            : ""
                                        }`}
                                >
                                    {plan.popular && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                            <span className="bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full">
                                                Most Popular
                                            </span>
                                        </div>
                                    )}

                                    <div className="text-center mb-6">
                                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                            <plan.icon className="w-6 h-6 text-primary" />
                                        </div>
                                        <h3 className="text-xl font-bold">{plan.name}</h3>
                                        <p className="text-foreground-muted text-sm mt-1">
                                            {plan.description}
                                        </p>
                                    </div>

                                    <div className="text-center mb-8">
                                        {plan.price.monthly !== null ? (
                                            <>
                                                <span className="text-5xl font-bold">
                                                    ${billingCycle === "monthly" ? plan.price.monthly : Math.round(plan.price.yearly / 12)}
                                                </span>
                                                <span className="text-foreground-muted">/month</span>
                                                {billingCycle === "yearly" && (
                                                    <p className="text-success text-sm mt-1">
                                                        Billed ${plan.price.yearly}/year
                                                    </p>
                                                )}
                                            </>
                                        ) : (
                                            <span className="text-3xl font-bold">Custom</span>
                                        )}
                                    </div>

                                    <ul className="space-y-3 mb-8">
                                        {plan.features.map((feature) => (
                                            <li
                                                key={feature.name}
                                                className="flex items-center gap-3 text-sm"
                                            >
                                                {feature.included ? (
                                                    <Check className="w-4 h-4 text-success flex-shrink-0" />
                                                ) : (
                                                    <X className="w-4 h-4 text-foreground-subtle flex-shrink-0" />
                                                )}
                                                <span
                                                    className={
                                                        feature.included
                                                            ? "text-foreground"
                                                            : "text-foreground-subtle"
                                                    }
                                                >
                                                    {feature.name}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>

                                    <button
                                        className={`btn w-full ${plan.popular ? "btn-primary" : "btn-secondary"
                                            }`}
                                    >
                                        {plan.price.monthly !== null ? (
                                            <>
                                                Get Started
                                                <ArrowRight className="w-4 h-4" />
                                            </>
                                        ) : (
                                            "Contact Sales"
                                        )}
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* FAQs */}
                <section className="section bg-background-subtle">
                    <div className="container">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="max-w-3xl mx-auto"
                        >
                            <div className="text-center mb-12">
                                <HelpCircle className="w-8 h-8 text-primary mx-auto mb-4" />
                                <h2 className="mb-4">Frequently Asked Questions</h2>
                            </div>

                            <div className="space-y-4">
                                {faqs.map((faq) => (
                                    <div key={faq.question} className="card">
                                        <h3 className="font-semibold mb-2">{faq.question}</h3>
                                        <p className="text-foreground-muted text-sm">{faq.answer}</p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* CTA */}
                <section className="section">
                    <div className="container">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-center max-w-2xl mx-auto"
                        >
                            <h2 className="mb-4">Still Have Questions?</h2>
                            <p className="text-foreground-muted text-lg mb-8">
                                Our team is here to help you find the perfect plan for your needs.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <a href="/contact" className="btn btn-primary">
                                    Contact Sales
                                </a>
                                <a href="/demo" className="btn btn-secondary">
                                    Book a Demo
                                </a>
                            </div>
                        </motion.div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
