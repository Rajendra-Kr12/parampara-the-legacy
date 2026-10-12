import type { FailureCategory, FailureDiagnostic } from "./failure.js";
export const TIERS = ["T0", "T1", "T2", "T3", "R", "D"] as const;
export type Tier = (typeof TIERS)[number];

export const DATA_CLASSES = ["A", "B", "C", "D"] as const;
export type DataClass = (typeof DATA_CLASSES)[number];

export type Volume = "small" | "bulk";

export interface CatalogModel {
  readonly name: string;
  readonly id: string;
  readonly dataClass: DataClass;
  readonly tiers: readonly Tier[];
  readonly inputPrice?: number;
  readonly outputPrice?: number;
}

export interface Catalog {
  readonly models: readonly CatalogModel[];
}

export interface Classification {
  readonly tier: Tier;
  readonly tierProbabilities: Readonly<Record<Tier, number>>;
  readonly touchesHighRiskArea: boolean;
  readonly needsIndependentReview: boolean;
  readonly involvesSensitiveContext: boolean;
  readonly volume: Volume;
}

export interface SelectedModel {
  readonly id: string;
  readonly name: string;
  readonly dataClass: DataClass;
  readonly selectionReason: "default" | "bulk-class-b-free" | "bulk-cheap-paid";
}

export interface RoutingDecision {
  readonly status: "routed" | "refused";
  readonly routingPath: "laya" | "static" | "refused";
  readonly requiresHumanOrLeadDecision?: boolean;
  readonly fallbackReason?:
    | "no-api-key"
    | "laya-disabled-after-promotion"
    | FailureCategory;
  readonly diagnostic?: FailureDiagnostic;
  readonly refusalReason?: "possible-secret-or-personal-data" | "invalid-task-length";
  readonly tier?: Tier;
  readonly sensitiveContext?: boolean;
  readonly touchesHighRiskArea?: boolean;
  readonly needsIndependentReview?: boolean;
  readonly volume?: Volume;
  readonly model?: SelectedModel | { readonly name: string; readonly dataClass: "A" };
  readonly harness?: string;
}
