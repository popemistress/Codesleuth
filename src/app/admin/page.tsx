"use client";

import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
    LayoutDashboard,
    Users,
    MessageSquare,
    Mail,
    Settings,
    ArrowLeft,
    TrendingUp,
    AlertTriangle,
    CheckCircle2,
    Clock,
    Shield,
} from "lucide-react";

// Mock data - would come from API in production
const stats = [
    { label: "Total Users", value: "1,234", change: "+12%", icon: Users },
    { label: "Subscribers", value: "856", change: "+8%", icon: Mail },
    { label: "Contact Submissions", value: "47", change: "+23", icon: MessageSquare },
    { label: "Active Sessions", value: "142", change: "+5%", icon: TrendingUp },
];

const recentUsers = [
    { id: "1", name: "John Doe", email: "john@example.com", role: "USER", createdAt: "2 hours ago" },
    { id: "2", name: "Jane Smith", email: "jane@example.com", role: "USER", createdAt: "5 hours ago" },
    { id: "3", name: "Bob Wilson", email: "bob@example.com", role: "ADMIN", createdAt: "1 day ago" },
];

const recentContacts = [
    { id: "1", name: "Alice Brown", email: "alice@company.com", status: "NEW", message: "Interested in enterprise pricing..." },
    { id: "2", name: "Charlie Davis", email: "charlie@startup.io", status: "READ", message: "Question about the security agent..." },
    { id: "3", name: "Eve Miller", email: "eve@agency.com", status: "REPLIED", message: "Need help with integration..." },
];

export default function AdminDashboard() {
    const { data: session, status } = useSession();

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse text-foreground-muted">Loading...</div>
            </div>
        );
    }

    // Double-check admin role (middleware should handle this, but extra safety)
    if (session?.user?.role !== "ADMIN") {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <AlertTriangle className="w-12 h-12 text-error mx-auto mb-4" />
                    <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
                    <p className="text-foreground-muted mb-4">
                        You don&apos;t have permission to access this page.
                    </p>
                    <Link href="/dashboard" className="btn btn-primary">
                        Return to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="fixed inset-0 bg-grid opacity-[0.02] pointer-events-none" />

            {/* Admin Sidebar */}
            <aside className="fixed left-0 top-0 h-full w-64 bg-surface border-r border-border p-4 z-50">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                        <Shield className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-bold">Admin Panel</span>
                </div>
                <p className="text-foreground-subtle text-xs mb-8">CodeSleuth Administration</p>

                <nav className="space-y-1">
                    <Link
                        href="/admin"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/10 text-primary"
                    >
                        <LayoutDashboard className="w-5 h-5" />
                        Overview
                    </Link>
                    <Link
                        href="/admin/users"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-elevated text-foreground-muted hover:text-foreground transition-colors"
                    >
                        <Users className="w-5 h-5" />
                        Users
                    </Link>
                    <Link
                        href="/admin/subscribers"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-elevated text-foreground-muted hover:text-foreground transition-colors"
                    >
                        <Mail className="w-5 h-5" />
                        Subscribers
                    </Link>
                    <Link
                        href="/admin/contacts"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-elevated text-foreground-muted hover:text-foreground transition-colors"
                    >
                        <MessageSquare className="w-5 h-5" />
                        Contacts
                    </Link>
                    <Link
                        href="/admin/settings"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-elevated text-foreground-muted hover:text-foreground transition-colors"
                    >
                        <Settings className="w-5 h-5" />
                        Settings
                    </Link>
                </nav>

                <div className="absolute bottom-4 left-4">
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-2 text-sm text-foreground-muted hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="ml-64 p-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold">Admin Overview</h1>
                    <p className="text-foreground-muted">
                        Monitor and manage your CodeSleuth platform
                    </p>
                </div>

                {/* Stats Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid md:grid-cols-4 gap-6 mb-8"
                >
                    {stats.map((stat) => (
                        <div key={stat.label} className="card">
                            <div className="flex items-start justify-between mb-2">
                                <stat.icon className="w-5 h-5 text-primary" />
                                <span className="text-success text-xs font-medium">
                                    {stat.change}
                                </span>
                            </div>
                            <p className="text-foreground-muted text-sm">{stat.label}</p>
                            <p className="text-2xl font-bold">{stat.value}</p>
                        </div>
                    ))}
                </motion.div>

                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Recent Users */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold">Recent Users</h2>
                            <Link
                                href="/admin/users"
                                className="text-sm text-primary hover:underline"
                            >
                                View all
                            </Link>
                        </div>
                        <div className="card p-0">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-border text-left text-xs text-foreground-muted">
                                        <th className="p-4">User</th>
                                        <th className="p-4">Role</th>
                                        <th className="p-4">Joined</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {recentUsers.map((user) => (
                                        <tr key={user.id} className="hover:bg-surface-elevated transition-colors">
                                            <td className="p-4">
                                                <p className="font-medium text-sm">{user.name}</p>
                                                <p className="text-foreground-subtle text-xs">{user.email}</p>
                                            </td>
                                            <td className="p-4">
                                                <span
                                                    className={`text-xs font-medium px-2 py-1 rounded-full ${user.role === "ADMIN"
                                                            ? "bg-primary/10 text-primary"
                                                            : "bg-surface-elevated text-foreground-muted"
                                                        }`}
                                                >
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="p-4 text-foreground-muted text-sm">
                                                {user.createdAt}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>

                    {/* Recent Contacts */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold">Contact Submissions</h2>
                            <Link
                                href="/admin/contacts"
                                className="text-sm text-primary hover:underline"
                            >
                                View all
                            </Link>
                        </div>
                        <div className="card p-0 divide-y divide-border">
                            {recentContacts.map((contact) => (
                                <div key={contact.id} className="p-4 hover:bg-surface-elevated transition-colors">
                                    <div className="flex items-start justify-between mb-1">
                                        <div>
                                            <p className="font-medium text-sm">{contact.name}</p>
                                            <p className="text-foreground-subtle text-xs">{contact.email}</p>
                                        </div>
                                        <span
                                            className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${contact.status === "NEW"
                                                    ? "bg-primary/10 text-primary"
                                                    : contact.status === "READ"
                                                        ? "bg-warning/10 text-warning"
                                                        : "bg-success/10 text-success"
                                                }`}
                                        >
                                            {contact.status === "NEW" ? (
                                                <AlertTriangle className="w-3 h-3" />
                                            ) : contact.status === "READ" ? (
                                                <Clock className="w-3 h-3" />
                                            ) : (
                                                <CheckCircle2 className="w-3 h-3" />
                                            )}
                                            {contact.status}
                                        </span>
                                    </div>
                                    <p className="text-foreground-muted text-sm line-clamp-1">
                                        {contact.message}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
