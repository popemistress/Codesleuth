-- TimescaleDB initialization for Token Budget Management System
-- This script runs automatically when the container starts

-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- ============================================================================
-- TOKEN LEDGER (Append-only time-series)
-- ============================================================================

CREATE TABLE IF NOT EXISTS token_ledger (
  id              UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Context
  project_id      TEXT NOT NULL,
  phase_id        TEXT,
  agent_id        TEXT,
  user_id         TEXT NOT NULL,
  
  -- Model info
  provider        TEXT NOT NULL,          -- "anthropic", "openai", "google"
  model           TEXT NOT NULL,          -- "claude-3-opus", "gpt-4-turbo", etc.
  
  -- Token counts
  prompt_tokens   INTEGER NOT NULL,
  completion_tokens INTEGER NOT NULL,
  total_tokens    INTEGER GENERATED ALWAYS AS (prompt_tokens + completion_tokens) STORED,
  
  -- Cost (normalized to Credits, 1 Credit = $0.001)
  cost_credits    DOUBLE PRECISION NOT NULL,
  
  -- Enforcement state at time of call
  budget_percent_before DOUBLE PRECISION,
  enforcement_action    TEXT,             -- "none", "compress", "warn", "stop", "critical"
  
  -- Metadata
  request_id      UUID,                   -- For idempotency/deduplication
  
  -- Composite primary key for TimescaleDB (must include time column)
  PRIMARY KEY (id, created_at)
);

-- Convert to hypertable (partition by time for optimal time-series performance)
SELECT create_hypertable('token_ledger', 'created_at',
  chunk_time_interval => INTERVAL '1 day',
  if_not_exists => TRUE
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_ledger_project ON token_ledger (project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ledger_user ON token_ledger (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ledger_agent ON token_ledger (agent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ledger_phase ON token_ledger (phase_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ledger_request ON token_ledger (request_id);

-- ============================================================================
-- CONTINUOUS AGGREGATES (Materialized views for fast dashboard queries)
-- ============================================================================

-- Hourly usage metrics aggregate
CREATE MATERIALIZED VIEW IF NOT EXISTS usage_metrics_hourly
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 hour', created_at) AS bucket,
  project_id,
  agent_id,
  SUM(prompt_tokens) AS total_prompt_tokens,
  SUM(completion_tokens) AS total_completion_tokens,
  SUM(total_tokens) AS total_tokens,
  SUM(cost_credits) AS total_credits,
  COUNT(*) AS call_count
FROM token_ledger
GROUP BY bucket, project_id, agent_id
WITH NO DATA;

-- Refresh policy (every hour, with 2-hour lookback)
SELECT add_continuous_aggregate_policy('usage_metrics_hourly',
  start_offset => INTERVAL '2 hours',
  end_offset => INTERVAL '1 hour',
  schedule_interval => INTERVAL '1 hour',
  if_not_exists => TRUE
);

-- Daily usage metrics aggregate (for longer-term dashboards)
CREATE MATERIALIZED VIEW IF NOT EXISTS usage_metrics_daily
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 day', created_at) AS bucket,
  project_id,
  user_id,
  SUM(prompt_tokens) AS total_prompt_tokens,
  SUM(completion_tokens) AS total_completion_tokens,
  SUM(total_tokens) AS total_tokens,
  SUM(cost_credits) AS total_credits,
  COUNT(*) AS call_count
FROM token_ledger
GROUP BY bucket, project_id, user_id
WITH NO DATA;

-- Refresh policy for daily aggregate
SELECT add_continuous_aggregate_policy('usage_metrics_daily',
  start_offset => INTERVAL '2 days',
  end_offset => INTERVAL '1 day',
  schedule_interval => INTERVAL '1 day',
  if_not_exists => TRUE
);

-- ============================================================================
-- PROJECT COMPLETIONS (For projection training data)
-- ============================================================================

CREATE TABLE IF NOT EXISTS project_completions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      TEXT NOT NULL,
  
  -- Classification
  complexity_tier TEXT NOT NULL,          -- "simple", "medium", "complex", "enterprise"
  feature_count   INTEGER,
  
  -- Actual usage
  total_tokens    INTEGER NOT NULL,
  total_credits   DOUBLE PRECISION NOT NULL,
  duration_hours  DOUBLE PRECISION,
  
  -- Phase breakdown (JSONB for flexibility)
  phase_breakdown JSONB,
  
  -- Variance tracking
  predicted_credits DOUBLE PRECISION,
  variance_percent  DOUBLE PRECISION,
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_completions_tier ON project_completions (complexity_tier);
CREATE INDEX IF NOT EXISTS idx_completions_project ON project_completions (project_id);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get budget usage percentage
CREATE OR REPLACE FUNCTION get_project_usage(p_project_id TEXT, p_start_date TIMESTAMPTZ DEFAULT NULL)
RETURNS TABLE (
  total_prompt_tokens BIGINT,
  total_completion_tokens BIGINT,
  total_tokens BIGINT,
  total_credits DOUBLE PRECISION,
  call_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(tl.prompt_tokens), 0)::BIGINT,
    COALESCE(SUM(tl.completion_tokens), 0)::BIGINT,
    COALESCE(SUM(tl.total_tokens), 0)::BIGINT,
    COALESCE(SUM(tl.cost_credits), 0)::DOUBLE PRECISION,
    COALESCE(COUNT(*), 0)::BIGINT
  FROM token_ledger tl
  WHERE tl.project_id = p_project_id
    AND (p_start_date IS NULL OR tl.created_at >= p_start_date);
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO dbuser;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO dbuser;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO dbuser;
