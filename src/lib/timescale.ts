/**
 * TimescaleDB Client for Token Ledger
 * 
 * Provides connection pooling and query functions for the token_ledger hypertable.
 * Uses pg (node-postgres) for direct PostgreSQL/TimescaleDB access.
 */

import { Pool, PoolClient } from "pg";
import type { TokenLedgerEntry, UsageBucket, EnforcementAction, Provider } from "@/types/tokens";

// Connection pool for TimescaleDB
const pool = new Pool({
    connectionString: process.env.TIMESCALE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Log pool errors
pool.on("error", (err) => {
    console.error("[TimescaleDB] Unexpected pool error:", err);
});

/**
 * Get a client from the pool for transactions
 */
export async function getClient(): Promise<PoolClient> {
    return pool.connect();
}

/**
 * Execute a raw SQL query (for custom queries)
 */
export async function query<T = Record<string, unknown>>(
    sql: string,
    params?: unknown[]
): Promise<T[]> {
    const client = await pool.connect();
    try {
        const result = await client.query(sql, params);
        return result.rows as T[];
    } finally {
        client.release();
    }
}

/**
 * Health check for TimescaleDB connection
 */
export async function healthCheck(): Promise<boolean> {
    const client = await pool.connect();
    try {
        await client.query("SELECT 1");
        return true;
    } catch {
        return false;
    } finally {
        client.release();
    }
}

/**
 * Record a token usage entry to the ledger
 */
export async function recordToLedger(
    entry: Omit<TokenLedgerEntry, "id" | "totalTokens" | "createdAt">
): Promise<{ id: string; createdAt: string }> {
    const client = await pool.connect();
    try {
        const result = await client.query(
            `INSERT INTO token_ledger 
       (project_id, phase_id, agent_id, user_id, provider, model, 
        prompt_tokens, completion_tokens, cost_credits, 
        budget_percent_before, enforcement_action, request_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id, created_at`,
            [
                entry.projectId,
                entry.phaseId || null,
                entry.agentId || null,
                entry.userId,
                entry.provider,
                entry.model,
                entry.promptTokens,
                entry.completionTokens,
                entry.costCredits,
                entry.budgetPercentBefore ?? null,
                entry.enforcementAction ?? null,
                entry.requestId || null,
            ]
        );
        return {
            id: result.rows[0].id,
            createdAt: result.rows[0].created_at.toISOString(),
        };
    } finally {
        client.release();
    }
}

/**
 * Get total usage for a project within a time range
 */
export async function getUsageByProject(
    projectId: string,
    startDate: Date,
    endDate: Date
): Promise<{
    totalPromptTokens: number;
    totalCompletionTokens: number;
    totalTokens: number;
    totalCredits: number;
    callCount: number;
}> {
    const client = await pool.connect();
    try {
        const result = await client.query(
            `SELECT 
         COALESCE(SUM(prompt_tokens), 0)::integer AS total_prompt_tokens,
         COALESCE(SUM(completion_tokens), 0)::integer AS total_completion_tokens,
         COALESCE(SUM(total_tokens), 0)::integer AS total_tokens,
         COALESCE(SUM(cost_credits), 0)::float AS total_credits,
         COUNT(*)::integer AS call_count
       FROM token_ledger
       WHERE project_id = $1 
         AND created_at >= $2 
         AND created_at <= $3`,
            [projectId, startDate, endDate]
        );
        return {
            totalPromptTokens: result.rows[0].total_prompt_tokens,
            totalCompletionTokens: result.rows[0].total_completion_tokens,
            totalTokens: result.rows[0].total_tokens,
            totalCredits: result.rows[0].total_credits,
            callCount: result.rows[0].call_count,
        };
    } finally {
        client.release();
    }
}

/**
 * Get all-time usage for a project (for budget tracking)
 */
export async function getProjectTotalUsage(
    projectId: string
): Promise<{
    totalPromptTokens: number;
    totalCompletionTokens: number;
    totalCredits: number;
    callCount: number;
}> {
    const client = await pool.connect();
    try {
        const result = await client.query(
            `SELECT 
         COALESCE(SUM(prompt_tokens), 0)::integer AS total_prompt_tokens,
         COALESCE(SUM(completion_tokens), 0)::integer AS total_completion_tokens,
         COALESCE(SUM(cost_credits), 0)::float AS total_credits,
         COUNT(*)::integer AS call_count
       FROM token_ledger
       WHERE project_id = $1`,
            [projectId]
        );
        return {
            totalPromptTokens: result.rows[0].total_prompt_tokens,
            totalCompletionTokens: result.rows[0].total_completion_tokens,
            totalCredits: result.rows[0].total_credits,
            callCount: result.rows[0].call_count,
        };
    } finally {
        client.release();
    }
}

/**
 * Get usage grouped by time buckets (hour or day)
 */
export async function getUsageByTimeRange(
    projectId: string,
    startDate: Date,
    endDate: Date,
    groupBy: "hour" | "day"
): Promise<UsageBucket[]> {
    const client = await pool.connect();
    try {
        const interval = groupBy === "hour" ? "1 hour" : "1 day";
        const result = await client.query(
            `SELECT 
         time_bucket($1::interval, created_at) AS bucket,
         SUM(prompt_tokens)::integer AS prompt_tokens,
         SUM(completion_tokens)::integer AS completion_tokens,
         SUM(cost_credits)::float AS credits,
         COUNT(*)::integer AS call_count
       FROM token_ledger
       WHERE project_id = $2 
         AND created_at >= $3 
         AND created_at <= $4
       GROUP BY bucket
       ORDER BY bucket`,
            [interval, projectId, startDate, endDate]
        );
        return result.rows.map((row) => ({
            bucket: row.bucket.toISOString(),
            promptTokens: row.prompt_tokens,
            completionTokens: row.completion_tokens,
            credits: row.credits,
            callCount: row.call_count,
        }));
    } finally {
        client.release();
    }
}

/**
 * Get usage grouped by agent
 */
export async function getUsageByAgent(
    projectId: string,
    startDate?: Date,
    endDate?: Date
): Promise<Array<UsageBucket & { agentId: string }>> {
    const client = await pool.connect();
    try {
        let query = `
      SELECT 
        agent_id,
        SUM(prompt_tokens)::integer AS prompt_tokens,
        SUM(completion_tokens)::integer AS completion_tokens,
        SUM(cost_credits)::float AS credits,
        COUNT(*)::integer AS call_count
      FROM token_ledger
      WHERE project_id = $1 AND agent_id IS NOT NULL
    `;
        const params: (string | Date)[] = [projectId];

        if (startDate) {
            query += ` AND created_at >= $${params.length + 1}`;
            params.push(startDate);
        }
        if (endDate) {
            query += ` AND created_at <= $${params.length + 1}`;
            params.push(endDate);
        }

        query += ` GROUP BY agent_id ORDER BY credits DESC`;

        const result = await client.query(query, params);
        return result.rows.map((row) => ({
            bucket: row.agent_id,
            agentId: row.agent_id,
            promptTokens: row.prompt_tokens,
            completionTokens: row.completion_tokens,
            credits: row.credits,
            callCount: row.call_count,
        }));
    } finally {
        client.release();
    }
}

/**
 * Get usage grouped by phase
 */
export async function getUsageByPhase(
    projectId: string,
    startDate?: Date,
    endDate?: Date
): Promise<Array<UsageBucket & { phaseId: string }>> {
    const client = await pool.connect();
    try {
        let query = `
      SELECT 
        phase_id,
        SUM(prompt_tokens)::integer AS prompt_tokens,
        SUM(completion_tokens)::integer AS completion_tokens,
        SUM(cost_credits)::float AS credits,
        COUNT(*)::integer AS call_count
      FROM token_ledger
      WHERE project_id = $1 AND phase_id IS NOT NULL
    `;
        const params: (string | Date)[] = [projectId];

        if (startDate) {
            query += ` AND created_at >= $${params.length + 1}`;
            params.push(startDate);
        }
        if (endDate) {
            query += ` AND created_at <= $${params.length + 1}`;
            params.push(endDate);
        }

        query += ` GROUP BY phase_id ORDER BY credits DESC`;

        const result = await client.query(query, params);
        return result.rows.map((row) => ({
            bucket: row.phase_id,
            phaseId: row.phase_id,
            promptTokens: row.prompt_tokens,
            completionTokens: row.completion_tokens,
            credits: row.credits,
            callCount: row.call_count,
        }));
    } finally {
        client.release();
    }
}

/**
 * Get recent ledger entries for a project
 */
export async function getRecentEntries(
    projectId: string,
    limit: number = 50
): Promise<TokenLedgerEntry[]> {
    const client = await pool.connect();
    try {
        const result = await client.query(
            `SELECT 
         id, project_id, phase_id, agent_id, user_id,
         provider, model, prompt_tokens, completion_tokens, total_tokens,
         cost_credits, budget_percent_before, enforcement_action,
         request_id, created_at
       FROM token_ledger
       WHERE project_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
            [projectId, limit]
        );
        return result.rows.map((row) => ({
            id: row.id,
            projectId: row.project_id,
            phaseId: row.phase_id,
            agentId: row.agent_id,
            userId: row.user_id,
            provider: row.provider as Provider,
            model: row.model,
            promptTokens: row.prompt_tokens,
            completionTokens: row.completion_tokens,
            totalTokens: row.total_tokens,
            costCredits: row.cost_credits,
            budgetPercentBefore: row.budget_percent_before,
            enforcementAction: row.enforcement_action as EnforcementAction,
            requestId: row.request_id,
            createdAt: row.created_at.toISOString(),
        }));
    } finally {
        client.release();
    }
}

/**
 * Check if a request has already been recorded (idempotency check)
 */
export async function checkRequestExists(requestId: string): Promise<boolean> {
    const client = await pool.connect();
    try {
        const result = await client.query(
            `SELECT EXISTS(SELECT 1 FROM token_ledger WHERE request_id = $1)`,
            [requestId]
        );
        return result.rows[0].exists;
    } finally {
        client.release();
    }
}

/**
 * Get usage for a user across all projects
 */
export async function getUserTotalUsage(
    userId: string,
    startDate?: Date,
    endDate?: Date
): Promise<{
    totalPromptTokens: number;
    totalCompletionTokens: number;
    totalCredits: number;
    callCount: number;
}> {
    const client = await pool.connect();
    try {
        let query = `
      SELECT 
        COALESCE(SUM(prompt_tokens), 0)::integer AS total_prompt_tokens,
        COALESCE(SUM(completion_tokens), 0)::integer AS total_completion_tokens,
        COALESCE(SUM(cost_credits), 0)::float AS total_credits,
        COUNT(*)::integer AS call_count
      FROM token_ledger
      WHERE user_id = $1
    `;
        const params: (string | Date)[] = [userId];

        if (startDate) {
            query += ` AND created_at >= $${params.length + 1}`;
            params.push(startDate);
        }
        if (endDate) {
            query += ` AND created_at <= $${params.length + 1}`;
            params.push(endDate);
        }

        const result = await client.query(query, params);
        return {
            totalPromptTokens: result.rows[0].total_prompt_tokens,
            totalCompletionTokens: result.rows[0].total_completion_tokens,
            totalCredits: result.rows[0].total_credits,
            callCount: result.rows[0].call_count,
        };
    } finally {
        client.release();
    }
}

/**
 * Close the connection pool (for graceful shutdown)
 */
export async function closePool(): Promise<void> {
    await pool.end();
}
