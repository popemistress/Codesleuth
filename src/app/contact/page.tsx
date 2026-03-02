"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
    Mail,
    MapPin,

    Send,
    CheckCircle2,
    MessageSquare,
    Building,
    User,
} from "lucide-react";

const contactMethods = [
    {
        icon: Mail,
        title: "Email Us",
        description: "Send us an email anytime",
        value: "hello@codesleuth.dev",
        href: "mailto:hello@codesleuth.dev",
    },
    {
        icon: MessageSquare,
        title: "Live Chat",
        description: "Chat with our team",
        value: "Available 9am-6pm EST",
        href: "#",
    },
    {
        icon: MapPin,
        title: "Location",
        description: "Visit our headquarters",
        value: "San Francisco, CA",
        href: "#",
    },
];

export default function ContactPage() {
    const [formState, setFormState] = useState({
        name: "",
        email: "",
        company: "",
        subject: "",
        message: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formState),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Failed to send message");
                setIsSubmitting(false);
                return;
            }

            setIsSubmitting(false);
            setIsSubmitted(true);
        } catch {
            setError("Network error. Please try again.");
            setIsSubmitting(false);
        }
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        setFormState((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

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
                            <span className="badge badge-primary mb-4">Contact</span>
                            <h1 className="mb-4">Get in Touch</h1>
                            <p className="text-foreground-muted text-lg">
                                Have questions about multi-agent orchestration? Ready to transform
                                your development workflow? We&apos;d love to hear from you.
                            </p>
                        </motion.div>
                    </div>
                </section>

                {/* Contact Methods */}
                <section className="py-8">
                    <div className="container">
                        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                            {contactMethods.map((method, index) => (
                                <motion.a
                                    key={method.title}
                                    href={method.href}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    className="card text-center group hover:border-primary/50"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                                        <method.icon className="w-6 h-6 text-primary" />
                                    </div>
                                    <h3 className="font-semibold mb-1">{method.title}</h3>
                                    <p className="text-foreground-subtle text-sm mb-2">
                                        {method.description}
                                    </p>
                                    <p className="text-primary text-sm font-medium">{method.value}</p>
                                </motion.a>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Contact Form */}
                <section className="section">
                    <div className="container">
                        <div className="max-w-2xl mx-auto">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="card p-8"
                            >
                                {!isSubmitted ? (
                                    <>
                                        <h2 className="text-2xl font-bold mb-6 text-center">
                                            Send Us a Message
                                        </h2>
                                        {error && (
                                            <div className="mb-6 p-4 rounded-lg bg-error/10 border border-error/30 text-error text-sm">
                                                {error}
                                            </div>
                                        )}
                                        <form onSubmit={handleSubmit} className="space-y-6">
                                            <div className="grid md:grid-cols-2 gap-6">
                                                <div>
                                                    <label
                                                        htmlFor="name"
                                                        className="block text-sm font-medium mb-2"
                                                    >
                                                        Your Name
                                                    </label>
                                                    <div className="relative">
                                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-subtle" />
                                                        <input
                                                            type="text"
                                                            id="name"
                                                            name="name"
                                                            value={formState.name}
                                                            onChange={handleChange}
                                                            placeholder="John Doe"
                                                            className="input pl-12"
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label
                                                        htmlFor="email"
                                                        className="block text-sm font-medium mb-2"
                                                    >
                                                        Email Address
                                                    </label>
                                                    <div className="relative">
                                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-subtle" />
                                                        <input
                                                            type="email"
                                                            id="email"
                                                            name="email"
                                                            value={formState.email}
                                                            onChange={handleChange}
                                                            placeholder="john@company.com"
                                                            className="input pl-12"
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <label
                                                    htmlFor="company"
                                                    className="block text-sm font-medium mb-2"
                                                >
                                                    Company (Optional)
                                                </label>
                                                <div className="relative">
                                                    <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-subtle" />
                                                    <input
                                                        type="text"
                                                        id="company"
                                                        name="company"
                                                        value={formState.company}
                                                        onChange={handleChange}
                                                        placeholder="Acme Inc."
                                                        className="input pl-12"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label
                                                    htmlFor="subject"
                                                    className="block text-sm font-medium mb-2"
                                                >
                                                    Subject
                                                </label>
                                                <select
                                                    id="subject"
                                                    name="subject"
                                                    value={formState.subject}
                                                    onChange={handleChange}
                                                    className="input"
                                                    required
                                                >
                                                    <option value="">Select a topic...</option>
                                                    <option value="General Inquiry">General Inquiry</option>
                                                    <option value="Enterprise Demo">Enterprise Demo Request</option>
                                                    <option value="Technical Support">Technical Support</option>
                                                    <option value="Partnership">Partnership Opportunities</option>
                                                    <option value="Careers">Careers</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label
                                                    htmlFor="message"
                                                    className="block text-sm font-medium mb-2"
                                                >
                                                    Message
                                                </label>
                                                <textarea
                                                    id="message"
                                                    name="message"
                                                    value={formState.message}
                                                    onChange={handleChange}
                                                    placeholder="Tell us about your project or ask us a question..."
                                                    rows={5}
                                                    className="input resize-none"
                                                    required
                                                />
                                            </div>

                                            <button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="btn btn-primary w-full"
                                            >
                                                {isSubmitting ? (
                                                    <span className="animate-pulse">Sending...</span>
                                                ) : (
                                                    <>
                                                        Send Message
                                                        <Send className="w-4 h-4" />
                                                    </>
                                                )}
                                            </button>
                                        </form>
                                    </>
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="text-center py-12"
                                    >
                                        <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
                                            <CheckCircle2 className="w-8 h-8 text-success" />
                                        </div>
                                        <h2 className="text-2xl font-bold mb-4">Message Sent!</h2>
                                        <p className="text-foreground-muted mb-6">
                                            Thank you for reaching out. We&apos;ll get back to you within 24 hours.
                                        </p>
                                        <button
                                            onClick={() => {
                                                setIsSubmitted(false);
                                                setFormState({ name: "", email: "", company: "", subject: "", message: "" });
                                            }}
                                            className="btn btn-secondary"
                                        >
                                            Send Another Message
                                        </button>
                                    </motion.div>
                                )}
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* FAQ Teaser */}
                <section className="section bg-background-subtle">
                    <div className="container">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-center max-w-2xl mx-auto"
                        >
                            <h2 className="mb-4">Frequently Asked Questions</h2>
                            <p className="text-foreground-muted mb-8">
                                Find quick answers to common questions about CodeSleuth.
                            </p>
                            <div className="space-y-4 text-left">
                                {[
                                    {
                                        q: "What is multi-agent orchestration?",
                                        a: "Multi-agent orchestration is a development methodology where specialized AI agents work together, each with distinct responsibilities and absolute authority in their domain.",
                                    },
                                    {
                                        q: "How does the Three Strikes Protocol work?",
                                        a: "When an agent encounters repeated errors (80%+ fingerprint match), it escalates after three attempts to prevent infinite repair loops.",
                                    },
                                    {
                                        q: "What platforms are supported?",
                                        a: "CodeSleuth supports Web, Windows, macOS, Linux, iOS, and Android with unified architecture and blast radius analysis.",
                                    },
                                ].map((faq) => (
                                    <div key={faq.q} className="card">
                                        <h3 className="font-semibold mb-2">{faq.q}</h3>
                                        <p className="text-foreground-muted text-sm">{faq.a}</p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
