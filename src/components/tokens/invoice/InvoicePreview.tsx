"use client";

/**
 * Invoice Preview Component
 * 
 * Displays an estimated invoice based on current usage and projected costs.
 */

import React, { useMemo } from "react";
import type { SubscriptionTier } from "@/types/tokens";

// ============================================================================
// TYPES
// ============================================================================

interface InvoiceLineItem {
    description: string;
    quantity?: number;
    unitPrice?: number;
    total: number;
}

interface InvoicePreviewProps {
    projectName: string;
    tier: SubscriptionTier;
    basePrice: number;
    creditsUsed: number;
    creditLimit: number;
    overageRate?: number; // Credits per dollar for overage
    period: {
        start: Date;
        end: Date;
    };
    showProjections?: boolean;
    projectedCredits?: number;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function InvoicePreview({
    projectName,
    tier,
    basePrice,
    creditsUsed,
    creditLimit,
    overageRate = 100, // 100 credits per dollar
    period,
    showProjections = false,
    projectedCredits,
}: InvoicePreviewProps) {
    const {
        lineItems,
        subtotal,
        overageCredits,
        overageAmount,
        projectedOverage,
        projectedTotal,
    } = useMemo(() => {
        const items: InvoiceLineItem[] = [];

        // Base subscription
        items.push({
            description: `${tier} Plan - Monthly Subscription`,
            total: basePrice,
        });

        // Calculate overage
        const overage = Math.max(0, creditsUsed - creditLimit);
        const overageUSD = overage > 0 ? overage / overageRate : 0;

        if (overage > 0) {
            items.push({
                description: "Credit Overage",
                quantity: Math.round(overage * 100) / 100,
                unitPrice: 1 / overageRate,
                total: overageUSD,
            });
        }

        const sub = items.reduce((sum, item) => sum + item.total, 0);

        // Calculate projected overage
        let projOverage = 0;
        let projTotal = sub;
        if (showProjections && projectedCredits !== undefined) {
            const projectedOverageCredits = Math.max(0, projectedCredits - creditLimit);
            projOverage = projectedOverageCredits > 0 ? projectedOverageCredits / overageRate : 0;
            projTotal = basePrice + projOverage;
        }

        return {
            lineItems: items,
            subtotal: sub,
            overageCredits: overage,
            overageAmount: overageUSD,
            projectedOverage: projOverage,
            projectedTotal: projTotal,
        };
    }, [basePrice, tier, creditsUsed, creditLimit, overageRate, showProjections, projectedCredits]);

    const formatDate = (date: Date) => {
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    return (
        <div className="invoice-preview">
            <style jsx>{`
        .invoice-preview {
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 24px;
          color: #e0e0e0;
          font-family: system-ui, -apple-system, sans-serif;
        }

        .invoice-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .invoice-title {
          font-size: 20px;
          font-weight: 600;
          color: #ffffff;
          margin: 0 0 4px 0;
        }

        .invoice-subtitle {
          font-size: 14px;
          color: #888;
        }

        .invoice-badge {
          padding: 4px 12px;
          border-radius: 16px;
          font-size: 12px;
          font-weight: 500;
          text-transform: uppercase;
        }

        .badge-free {
          background: rgba(100, 100, 100, 0.3);
          color: #aaa;
        }

        .badge-premium {
          background: rgba(59, 130, 246, 0.3);
          color: #60a5fa;
        }

        .badge-enterprise {
          background: rgba(139, 92, 246, 0.3);
          color: #a78bfa;
        }

        .invoice-period {
          text-align: center;
          margin-bottom: 20px;
          font-size: 13px;
          color: #888;
        }

        .invoice-table {
          width: 100%;
          margin-bottom: 20px;
        }

        .invoice-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .invoice-row:last-child {
          border-bottom: none;
        }

        .item-description {
          flex: 1;
        }

        .item-details {
          font-size: 12px;
          color: #666;
          margin-top: 2px;
        }

        .item-amount {
          font-weight: 500;
          font-variant-numeric: tabular-nums;
        }

        .invoice-totals {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          padding: 16px;
          margin-top: 16px;
        }

        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
        }

        .total-row.main {
          font-size: 18px;
          font-weight: 600;
          color: #ffffff;
          padding-top: 12px;
          margin-top: 8px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .projection-row {
          color: #888;
          font-style: italic;
        }

        .overage-warning {
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 8px;
          padding: 12px;
          margin-top: 16px;
          font-size: 13px;
          color: #f87171;
        }

        .usage-bar {
          height: 6px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          margin: 16px 0;
          overflow: hidden;
        }

        .usage-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.3s ease;
        }

        .usage-fill.normal {
          background: linear-gradient(90deg, #22c55e, #4ade80);
        }

        .usage-fill.warning {
          background: linear-gradient(90deg, #f59e0b, #fbbf24);
        }

        .usage-fill.danger {
          background: linear-gradient(90deg, #ef4444, #f87171);
        }

        .usage-stats {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #888;
        }
      `}</style>

            {/* Header */}
            <div className="invoice-header">
                <div>
                    <h3 className="invoice-title">Invoice Preview</h3>
                    <p className="invoice-subtitle">{projectName}</p>
                </div>
                <span className={`invoice-badge badge-${tier.toLowerCase()}`}>
                    {tier}
                </span>
            </div>

            {/* Period */}
            <div className="invoice-period">
                Billing Period: {formatDate(period.start)} – {formatDate(period.end)}
            </div>

            {/* Usage Bar */}
            <div className="usage-bar">
                <div
                    className={`usage-fill ${creditsUsed / creditLimit > 0.9
                        ? "danger"
                        : creditsUsed / creditLimit > 0.7
                            ? "warning"
                            : "normal"
                        }`}
                    style={{ width: `${Math.min(100, (creditsUsed / creditLimit) * 100)}%` }}
                />
            </div>
            <div className="usage-stats">
                <span>{creditsUsed.toFixed(0)} credits used</span>
                <span>{creditLimit.toLocaleString()} credit limit</span>
            </div>

            {/* Line Items */}
            <div className="invoice-table">
                {lineItems.map((item, index) => (
                    <div key={index} className="invoice-row">
                        <div className="item-description">
                            {item.description}
                            {item.quantity !== undefined && (
                                <div className="item-details">
                                    {item.quantity.toFixed(2)} credits × ${item.unitPrice?.toFixed(4)}/credit
                                </div>
                            )}
                        </div>
                        <div className="item-amount">
                            ${item.total.toFixed(2)}
                        </div>
                    </div>
                ))}
            </div>

            {/* Totals */}
            <div className="invoice-totals">
                <div className="total-row">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                </div>
                {showProjections && projectedCredits !== undefined && (
                    <div className="total-row projection-row">
                        <span>Projected Overage (est.)</span>
                        <span>+${projectedOverage.toFixed(2)}</span>
                    </div>
                )}
                <div className="total-row main">
                    <span>{showProjections ? "Projected Total" : "Current Total"}</span>
                    <span>${(showProjections ? projectedTotal : subtotal).toFixed(2)}</span>
                </div>
            </div>

            {/* Overage Warning */}
            {overageCredits > 0 && (
                <div className="overage-warning">
                    ⚠️ You&apos;ve exceeded your {creditLimit.toLocaleString()} credit limit by{" "}
                    {overageCredits.toFixed(0)} credits (${overageAmount.toFixed(2)} overage charge).
                    Consider upgrading your plan to avoid overage fees.
                </div>
            )}
        </div>
    );
}
