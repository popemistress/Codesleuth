/**
 * Infra Preset Router
 * - Input: Product Discovery Template ID (e.g., "PD-CONST-01")
 * - Output: Infra Preset ID (e.g., "INFRA-ANDROID-FIELD")
 * - Fail-closed: unknown template IDs throw
 */

export type InfraPresetId =
    | "INFRA-WEB-STD"
    | "INFRA-ANDROID-FIELD"
    | "INFRA-WIN-ENT"
    | "INFRA-LINUX-OPS";

export type Platform = "Web" | "Android" | "Windows" | "Linux";

export type TemplateBinding = {
    templateId: string;
    platform: Platform;
    infraPresetId: InfraPresetId;
};

const BINDINGS: Record<string, TemplateBinding> = {
    // 🌐 WEB → INFRA-WEB-STD
    "PD-TECH-01": { templateId: "PD-TECH-01", platform: "Web", infraPresetId: "INFRA-WEB-STD" },
    "PD-HEALTH-01": { templateId: "PD-HEALTH-01", platform: "Web", infraPresetId: "INFRA-WEB-STD" },
    "PD-FIN-01": { templateId: "PD-FIN-01", platform: "Web", infraPresetId: "INFRA-WEB-STD" },
    "PD-INS-01": { templateId: "PD-INS-01", platform: "Web", infraPresetId: "INFRA-WEB-STD" },
    "PD-RETAIL-01": { templateId: "PD-RETAIL-01", platform: "Web", infraPresetId: "INFRA-WEB-STD" },
    "PD-RE-01": { templateId: "PD-RE-01", platform: "Web", infraPresetId: "INFRA-WEB-STD" },
    "PD-LOG-01": { templateId: "PD-LOG-01", platform: "Web", infraPresetId: "INFRA-WEB-STD" },
    "PD-AUTO-01": { templateId: "PD-AUTO-01", platform: "Web", infraPresetId: "INFRA-WEB-STD" },
    "PD-MEDIA-01": { templateId: "PD-MEDIA-01", platform: "Web", infraPresetId: "INFRA-WEB-STD" },
    "PD-GAME-01": { templateId: "PD-GAME-01", platform: "Web", infraPresetId: "INFRA-WEB-STD" },
    "PD-EDU-01": { templateId: "PD-EDU-01", platform: "Web", infraPresetId: "INFRA-WEB-STD" },
    "PD-PRO-01": { templateId: "PD-PRO-01", platform: "Web", infraPresetId: "INFRA-WEB-STD" },
    "PD-MKT-01": { templateId: "PD-MKT-01", platform: "Web", infraPresetId: "INFRA-WEB-STD" },
    "PD-HOSP-01": { templateId: "PD-HOSP-01", platform: "Web", infraPresetId: "INFRA-WEB-STD" },
    "PD-CE-01": { templateId: "PD-CE-01", platform: "Web", infraPresetId: "INFRA-WEB-STD" },
    "PD-FASH-01": { templateId: "PD-FASH-01", platform: "Web", infraPresetId: "INFRA-WEB-STD" },
    "PD-GOV-01": { templateId: "PD-GOV-01", platform: "Web", infraPresetId: "INFRA-WEB-STD" },
    "PD-NP-01": { templateId: "PD-NP-01", platform: "Web", infraPresetId: "INFRA-WEB-STD" },

    // 🤖 ANDROID → INFRA-ANDROID-FIELD
    "PD-MFG-01": { templateId: "PD-MFG-01", platform: "Android", infraPresetId: "INFRA-ANDROID-FIELD" },
    "PD-CONST-01": { templateId: "PD-CONST-01", platform: "Android", infraPresetId: "INFRA-ANDROID-FIELD" },
    "PD-AG-01": { templateId: "PD-AG-01", platform: "Android", infraPresetId: "INFRA-ANDROID-FIELD" },
    "PD-MINE-01": { templateId: "PD-MINE-01", platform: "Android", infraPresetId: "INFRA-ANDROID-FIELD" },

    // 🪟 WINDOWS → INFRA-WIN-ENT
    "PD-PHARMA-01": { templateId: "PD-PHARMA-01", platform: "Windows", infraPresetId: "INFRA-WIN-ENT" },
    "PD-ENERGY-01": { templateId: "PD-ENERGY-01", platform: "Windows", infraPresetId: "INFRA-WIN-ENT" },
    "PD-TEL-01": { templateId: "PD-TEL-01", platform: "Windows", infraPresetId: "INFRA-WIN-ENT" },
    "PD-FOOD-01": { templateId: "PD-FOOD-01", platform: "Windows", infraPresetId: "INFRA-WIN-ENT" },
    "PD-BEAUTY-01": { templateId: "PD-BEAUTY-01", platform: "Windows", infraPresetId: "INFRA-WIN-ENT" },
    "PD-CHEM-01": { templateId: "PD-CHEM-01", platform: "Windows", infraPresetId: "INFRA-WIN-ENT" },
    "PD-ENV-01": { templateId: "PD-ENV-01", platform: "Windows", infraPresetId: "INFRA-WIN-ENT" },
    "PD-CANN-01": { templateId: "PD-CANN-01", platform: "Windows", infraPresetId: "INFRA-WIN-ENT" },

    // 🐧 LINUX → INFRA-LINUX-OPS
    "PD-AERO-01": { templateId: "PD-AERO-01", platform: "Linux", infraPresetId: "INFRA-LINUX-OPS" },
    "PD-INT-01": { templateId: "PD-INT-01", platform: "Linux", infraPresetId: "INFRA-LINUX-OPS" },
};

export function selectInfraPreset(templateId: string): TemplateBinding {
    const binding = BINDINGS[templateId];
    if (!binding) {
        // Fail closed: do not “guess” infra
        throw new Error(
            `Unknown templateId "${templateId}". Add it to agents/infraPresetRouter.ts (fail-closed).`
        );
    }
    return binding;
}

/**
 * Convenience helper: if you only need the preset id.
 */
export function getInfraPresetId(templateId: string): InfraPresetId {
    return selectInfraPreset(templateId).infraPresetId;
}
