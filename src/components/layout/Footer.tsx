import Link from "next/link";
import { Code2, Github, Twitter, Linkedin } from "lucide-react";

const footerLinks = {
    product: [
        { label: "Features", href: "#features" },
        { label: "Agents", href: "#agents" },
        { label: "Pricing", href: "/pricing" },
        { label: "Roadmap", href: "#roadmap" },
    ],
    resources: [
        { label: "Documentation", href: "/docs" },
        { label: "API Reference", href: "/api" },
        { label: "Changelog", href: "/changelog" },
    ],
    company: [
        { label: "About", href: "/about" },
        { label: "Careers", href: "/careers" },
        { label: "Contact", href: "/contact" },
        { label: "Partners", href: "/partners" },
    ],
    legal: [
        { label: "Privacy", href: "/privacy" },
        { label: "Terms", href: "/terms" },
        { label: "Security", href: "/security" },
    ],
};

const socialLinks = [
    { icon: Github, href: "https://github.com/codesleuth", label: "GitHub" },
    { icon: Twitter, href: "https://twitter.com/codesleuth", label: "Twitter" },
    { icon: Linkedin, href: "https://linkedin.com/company/codesleuth", label: "LinkedIn" },
];

export function Footer() {
    return (
        <footer className="border-t border-border bg-background-subtle">
            <div className="container py-16">
                <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
                    {/* Brand Column */}
                    <div className="col-span-2">
                        <Link href="/" className="flex items-center gap-2 mb-4">
                            <div className="bg-gradient-to-br from-primary to-secondary p-2 rounded-lg">
                                <Code2 className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold">
                                Code<span className="text-primary">Sleuth</span>
                            </span>
                        </Link>
                        <p className="text-foreground-muted text-sm mb-6 max-w-xs">
                            Multi-Agent Enterprise Development Lifecycle. The end of &quot;just prompting&quot; — rigorous orchestration for high-stakes AI development.
                        </p>
                        <div className="flex gap-4">
                            {socialLinks.map((social) => (
                                <a
                                    key={social.label}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 rounded-lg bg-surface hover:bg-surface-elevated transition-colors"
                                    aria-label={social.label}
                                >
                                    <social.icon className="w-5 h-5 text-foreground-muted" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Link Columns */}
                    <div>
                        <h4 className="font-semibold text-sm mb-4">Product</h4>
                        <ul className="space-y-3">
                            {footerLinks.product.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        href={link.href}
                                        className="text-foreground-muted hover:text-foreground text-sm transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold text-sm mb-4">Resources</h4>
                        <ul className="space-y-3">
                            {footerLinks.resources.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        href={link.href}
                                        className="text-foreground-muted hover:text-foreground text-sm transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold text-sm mb-4">Company</h4>
                        <ul className="space-y-3">
                            {footerLinks.company.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        href={link.href}
                                        className="text-foreground-muted hover:text-foreground text-sm transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold text-sm mb-4">Legal</h4>
                        <ul className="space-y-3">
                            {footerLinks.legal.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        href={link.href}
                                        className="text-foreground-muted hover:text-foreground text-sm transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-16 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-foreground-subtle text-sm">
                        © {new Date().getFullYear()} CodeSleuth. All rights reserved.
                    </p>
                    <p className="text-foreground-subtle text-sm">
                        Built with rigorous multi-agent orchestration
                    </p>
                </div>
            </div>
        </footer>
    );
}
