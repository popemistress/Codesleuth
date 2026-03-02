"use client";

import { useSession, signOut } from "next-auth/react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
    LayoutDashboard,
    User,
    Settings,
    LogOut,
    FileText,
    MessageSquare,
    BarChart3,
    Bell,
    ChevronRight,
    Bot,
} from "lucide-react";

const quickActions = [
    {
        title: "View Documentation",
        description: "Learn how to use CodeSleuth agents",
        icon: FileText,
        href: "/docs",
    },
    {
        title: "Contact Support",
        description: "Get help from our team",
        icon: MessageSquare,
        href: "/contact",
    },
    {
        title: "Usage Analytics",
        description: "View your agent usage stats",
        icon: BarChart3,
        href: "/dashboard/analytics",
    },
];

const recentActivity = [
    {
        id: 1,
        agent: "Product Discovery",
        action: "Completed 13-phase discovery for new feature",
        time: "2 hours ago",
    },
    {
        id: 2,
        agent: "Technical Designer",
        action: "Generated cross-platform blueprints",
        time: "5 hours ago",
    },
    {
        id: 3,
        agent: "Security Agent",
        action: "Completed security audit - 0 critical issues",
        time: "1 day ago",
    },
];

export default function DashboardPage() {
    const { data: session, status } = useSession();

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse text-foreground-muted">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="fixed inset-0 bg-grid opacity-[0.02] pointer-events-none" />

            {/* Sidebar */}
            <aside className="fixed left-0 top-0 h-full w-64 bg-surface border-r border-border p-4 z-50">
                <Link href="/" className="flex items-center gap-2 mb-8">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                        <span className="text-white font-bold text-sm">CS</span>
                    </div>
                    <span className="font-bold">CodeSleuth</span>
                </Link>

                <nav className="space-y-1">
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/10 text-primary"
                    >
                        <LayoutDashboard className="w-5 h-5" />
                        Dashboard
                    </Link>
                    <Link
                        href="/dashboard/agents"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-elevated text-foreground-muted hover:text-foreground transition-colors"
                    >
                        <Bot className="w-5 h-5" />
                        Agents
                    </Link>
                    <Link
                        href="/profile"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-elevated text-foreground-muted hover:text-foreground transition-colors"
                    >
                        <User className="w-5 h-5" />
                        Profile
                    </Link>
                    <Link
                        href="/dashboard/settings"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-elevated text-foreground-muted hover:text-foreground transition-colors"
                    >
                        <Settings className="w-5 h-5" />
                        Settings
                    </Link>
                </nav>

                <div className="absolute bottom-4 left-4 right-4">
                    <button
                        onClick={() => signOut({ callbackUrl: "/" })}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-error/10 text-foreground-muted hover:text-error transition-colors w-full"
                    >
                        <LogOut className="w-5 h-5" />
                        Sign out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="ml-64 p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold">
                            Welcome back, {session?.user?.name?.split(" ")[0] || "User"}
                        </h1>
                        <p className="text-foreground-muted">
                            Here&apos;s what&apos;s happening with your agents
                        </p>
                    </div>
                    <button className="relative p-2 rounded-lg hover:bg-surface-elevated transition-colors">
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
                    </button>
                </div>

                {/* Stats Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid md:grid-cols-4 gap-6 mb-8"
                >
                    {[
                        { label: "Active Agents", value: "6", change: "+0" },
                        { label: "Tasks Completed", value: "142", change: "+23" },
                        { label: "Security Score", value: "98%", change: "+2%" },
                        { label: "Build Passes", value: "47", change: "+12" },
                    ].map((stat) => (
                        <div key={stat.label} className="card">
                            <p className="text-foreground-muted text-sm mb-1">{stat.label}</p>
                            <div className="flex items-end gap-2">
                                <span className="text-3xl font-bold">{stat.value}</span>
                                <span className="text-success text-sm mb-1">{stat.change}</span>
                            </div>
                        </div>
                    ))}
                </motion.div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Quick Actions */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="lg:col-span-2"
                    >
                        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
                        <div className="grid md:grid-cols-3 gap-4">
                            {quickActions.map((action) => (
                                <Link key={action.title} href={action.href} className="card group">
                                    <action.icon className="w-8 h-8 text-primary mb-3" />
                                    <h3 className="font-medium mb-1 group-hover:text-primary transition-colors">
                                        {action.title}
                                    </h3>
                                    <p className="text-foreground-muted text-sm">
                                        {action.description}
                                    </p>
                                </Link>
                            ))}
                        </div>
                    </motion.div>

                    {/* Recent Activity */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold">Recent Activity</h2>
                            <Link
                                href="/dashboard/activity"
                                className="text-sm text-primary hover:underline"
                            >
                                View all
                            </Link>
                        </div>
                        <div className="card p-0 divide-y divide-border">
                            {recentActivity.map((activity) => (
                                <div key={activity.id} className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="font-medium text-sm">{activity.agent}</p>
                                            <p className="text-foreground-muted text-sm">
                                                {activity.action}
                                            </p>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-foreground-subtle" />
                                    </div>
                                    <p className="text-foreground-subtle text-xs mt-1">
                                        {activity.time}
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
