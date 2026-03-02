"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
    User,
    Mail,
    Shield,
    Camera,
    Save,
    ArrowLeft,
    Loader2,
    CheckCircle2,
} from "lucide-react";

export default function ProfilePage() {
    const { data: session, status, update } = useSession();

    const [name, setName] = useState(session?.user?.name || "");
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        // TODO: Implement profile update API
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Update session with new name
        await update({ name });

        setIsSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

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

            <div className="container max-w-2xl py-12">
                {/* Back Link */}
                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 text-foreground-muted hover:text-foreground mb-8 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                </Link>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h1 className="text-3xl font-bold mb-2">Profile Settings</h1>
                    <p className="text-foreground-muted mb-8">
                        Manage your account settings and preferences
                    </p>

                    {/* Profile Card */}
                    <div className="card mb-8">
                        <div className="flex items-center gap-6 mb-8">
                            {/* Avatar */}
                            <div className="relative">
                                {session?.user?.image ? (
                                    <Image
                                        src={session.user.image}
                                        alt={session.user.name || "Profile"}
                                        width={80}
                                        height={80}
                                        className="w-20 h-20 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                                        <span className="text-white text-2xl font-bold">
                                            {session?.user?.name?.[0]?.toUpperCase() || "U"}
                                        </span>
                                    </div>
                                )}
                                <button className="absolute bottom-0 right-0 p-1.5 rounded-full bg-primary text-white hover:bg-primary/90 transition-colors">
                                    <Camera className="w-4 h-4" />
                                </button>
                            </div>

                            <div>
                                <h2 className="text-xl font-semibold">{session?.user?.name}</h2>
                                <p className="text-foreground-muted">{session?.user?.email}</p>
                                <span className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                                    <Shield className="w-3 h-3" />
                                    {session?.user?.role || "USER"}
                                </span>
                            </div>
                        </div>

                        <form onSubmit={handleSave} className="space-y-6">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium mb-2">
                                    Full Name
                                </label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-subtle" />
                                    <input
                                        type="text"
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="input pl-12"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium mb-2">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-subtle" />
                                    <input
                                        type="email"
                                        id="email"
                                        value={session?.user?.email || ""}
                                        disabled
                                        className="input pl-12 opacity-60 cursor-not-allowed"
                                    />
                                </div>
                                <p className="text-foreground-subtle text-xs mt-1">
                                    Email cannot be changed
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={isSaving}
                                className="btn btn-primary"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : saved ? (
                                    <>
                                        <CheckCircle2 className="w-4 h-4" />
                                        Saved!
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        Save Changes
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Danger Zone */}
                    <div className="card border-error/30">
                        <h3 className="text-lg font-semibold text-error mb-2">Danger Zone</h3>
                        <p className="text-foreground-muted text-sm mb-4">
                            Once you delete your account, there is no going back. Please be certain.
                        </p>
                        <button className="btn bg-error/10 text-error hover:bg-error/20 border-error/30">
                            Delete Account
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
