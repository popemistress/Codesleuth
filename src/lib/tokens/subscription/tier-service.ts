/**
 * Subscription Tier Service
 * 
 * Manages subscription tiers, feature access, and usage limits.
 */

import { prisma } from "@/lib/prisma";
import type { SubscriptionTier, SubscriptionLimits } from "@/types/tokens";
import { SUBSCRIPTION_LIMITS } from "@/types/tokens";

// ============================================================================
// TYPES
// ============================================================================

export interface UserSubscription {
    tier: SubscriptionTier;
    limits: SubscriptionLimits;
    usage: {
        creditsUsed: number;
        creditsRemaining: number;
        projectCount: number;
        projectsRemaining: number;
    };
    period: {
        start: Date;
        end: Date;
        daysRemaining: number;
    };
    isActive: boolean;
}

export interface FeatureAccess {
    hasAccess: boolean;
    reason?: string;
    upgradeRequired?: SubscriptionTier;
}

// ============================================================================
// SUBSCRIPTION SERVICE
// ============================================================================

/**
 * Get user's current subscription with usage
 */
export async function getUserSubscription(userId: string): Promise<UserSubscription> {
    // Get subscription from database
    const subscription = await prisma.subscription.findUnique({
        where: { userId },
        include: {
            user: {
                include: {
                    projects: {
                        where: { status: { not: "ARCHIVED" } },
                    },
                },
            },
        },
    });

    // Default to FREE tier if no subscription
    const tier: SubscriptionTier = (subscription?.tier as SubscriptionTier) || "FREE";
    const limits = SUBSCRIPTION_LIMITS[tier];

    // Get current period
    const now = new Date();
    const periodStart = subscription?.currentPeriodStart
        ? new Date(subscription.currentPeriodStart)
        : new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = subscription?.currentPeriodEnd
        ? new Date(subscription.currentPeriodEnd)
        : new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Calculate days remaining
    const daysRemaining = Math.max(0, Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    // Get credits used this period (from TimescaleDB)
    const creditsUsed = await getCreditsUsedInPeriod(userId, periodStart, periodEnd);

    // Calculate remaining
    const creditsRemaining = Math.max(0, limits.monthlyCredits - creditsUsed);
    const projectCount = subscription?.user?.projects?.length || 0;
    const projectsRemaining = limits.projectLimit === -1 ? Infinity : Math.max(0, limits.projectLimit - projectCount);

    return {
        tier,
        limits,
        usage: {
            creditsUsed: Math.round(creditsUsed * 100) / 100,
            creditsRemaining: Math.round(creditsRemaining * 100) / 100,
            projectCount,
            projectsRemaining: projectsRemaining === Infinity ? -1 : projectsRemaining,
        },
        period: {
            start: periodStart,
            end: periodEnd,
            daysRemaining,
        },
        isActive: creditsRemaining > 0,
    };
}

/**
 * Check if user has access to a specific feature
 */
export async function checkFeatureAccess(
    userId: string,
    feature: keyof SubscriptionLimits["features"]
): Promise<FeatureAccess> {
    const subscription = await getUserSubscription(userId);
    const hasAccess = subscription.limits.features[feature];

    if (hasAccess) {
        return { hasAccess: true };
    }

    // Determine minimum tier required for this feature
    let requiredTier: SubscriptionTier = "ENTERPRISE";
    if (SUBSCRIPTION_LIMITS.PREMIUM.features[feature]) {
        requiredTier = "PREMIUM";
    }

    return {
        hasAccess: false,
        reason: `This feature requires a ${requiredTier} subscription.`,
        upgradeRequired: requiredTier,
    };
}

/**
 * Check if user can create a new project
 */
export async function canCreateProject(userId: string): Promise<{
    allowed: boolean;
    reason?: string;
}> {
    const subscription = await getUserSubscription(userId);

    if (subscription.usage.projectsRemaining === -1 || subscription.usage.projectsRemaining > 0) {
        return { allowed: true };
    }

    return {
        allowed: false,
        reason: `You've reached the ${subscription.limits.projectLimit} project limit for the ${subscription.tier} tier. Upgrade to create more projects.`,
    };
}

/**
 * Check if user has credits remaining
 */
export async function hasCreditsRemaining(userId: string): Promise<{
    hasCredits: boolean;
    creditsRemaining: number;
    percentUsed: number;
}> {
    const subscription = await getUserSubscription(userId);

    return {
        hasCredits: subscription.usage.creditsRemaining > 0,
        creditsRemaining: subscription.usage.creditsRemaining,
        percentUsed: subscription.limits.monthlyCredits > 0
            ? Math.round((subscription.usage.creditsUsed / subscription.limits.monthlyCredits) * 10000) / 100
            : 0,
    };
}

/**
 * Get tier upgrade benefits
 */
export function getUpgradeBenefits(
    currentTier: SubscriptionTier,
    targetTier: SubscriptionTier
): {
    creditIncrease: number;
    projectIncrease: number;
    newFeatures: string[];
} {
    const current = SUBSCRIPTION_LIMITS[currentTier];
    const target = SUBSCRIPTION_LIMITS[targetTier];

    const creditIncrease = target.monthlyCredits - current.monthlyCredits;
    const projectIncrease = target.projectLimit === -1
        ? -1
        : target.projectLimit - current.projectLimit;

    const newFeatures: string[] = [];
    const featureNames: Record<string, string> = {
        realtimeDashboard: "Real-time Dashboard",
        phaseBreakdown: "Phase Breakdown Analytics",
        agentAttribution: "Agent Attribution",
        projections: "Cost Projections",
        export: "Data Export",
        apiAccess: "API Access",
    };

    for (const [key, name] of Object.entries(featureNames)) {
        const featureKey = key as keyof SubscriptionLimits["features"];
        if (!current.features[featureKey] && target.features[featureKey]) {
            newFeatures.push(name);
        }
    }

    return {
        creditIncrease,
        projectIncrease,
        newFeatures,
    };
}

// ============================================================================
// PRICING
// ============================================================================

export const TIER_PRICING: Record<SubscriptionTier, { monthly: number; yearly: number }> = {
    FREE: { monthly: 0, yearly: 0 },
    PREMIUM: { monthly: 29, yearly: 290 },
    ENTERPRISE: { monthly: 99, yearly: 990 },
};

/**
 * Get pricing for a tier
 */
export function getTierPricing(tier: SubscriptionTier): {
    monthly: number;
    yearly: number;
    yearlyDiscount: number;
} {
    const pricing = TIER_PRICING[tier];
    const yearlyMonthly = pricing.yearly / 12;
    const discount = pricing.monthly > 0
        ? Math.round(((pricing.monthly - yearlyMonthly) / pricing.monthly) * 100)
        : 0;

    return {
        monthly: pricing.monthly,
        yearly: pricing.yearly,
        yearlyDiscount: discount,
    };
}

// ============================================================================
// HELPERS
// ============================================================================

async function getCreditsUsedInPeriod(
    userId: string,
    startDate: Date,
    endDate: Date
): Promise<number> {
    const { getUserTotalUsage } = await import("@/lib/timescale");
    const usage = await getUserTotalUsage(userId, startDate, endDate);
    return usage.totalCredits;
}
