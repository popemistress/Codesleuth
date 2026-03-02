/**
 * Projections Module Index
 */

export {
    getHistoricalSummary,
    getPhaseHistoricalData,
    getAgentHistoricalData,
    recordProjectCompletion,
    type HistoricalSummary,
    type PhaseHistoricalData,
    type AgentHistoricalData,
} from "./historical-data";

export {
    generateProjection,
    quickEstimate,
    calculateVariance,
    type ProjectionResult,
    type ProjectionInput,
    type VarianceReport,
} from "./projection-algorithm";
