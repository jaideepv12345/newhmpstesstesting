import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const plans = sqliteTable("plans", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  filename: text("filename").notNull(),
  fileSize: integer("file_size").notNull(),
  uploadedAt: text("uploaded_at").notNull(),
  status: text("status").notNull().default("uploading"),
  rawText: text("raw_text"),
  pageCount: integer("page_count"),
  progressStep: integer("progress_step").default(0),
  progressMessage: text("progress_message"),
  errorMessage: text("error_message"),
});

export const analyses = sqliteTable("analyses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  planId: integer("plan_id").notNull(),
  overallScore: real("overall_score"),
  overallGrade: text("overall_grade"),
  complianceScore: real("compliance_score"),
  analyticalScore: real("analytical_score"),
  implementationScore: real("implementation_score"),
  scenarioScore: real("scenario_score"),
  equityScore: real("equity_score"),
  gateApplied: integer("gate_applied"),
  gateMessage: text("gate_message"),
  jurisdictionName: text("jurisdiction_name"),
  stateName: text("state_name"),
  countyFips: text("county_fips"),
  planType: text("plan_type"),
  extractionConfidence: real("extraction_confidence"),
  executiveSummary: text("executive_summary"),
  threeThings: text("three_things"),
  ninetyDayPlan: text("ninety_day_plan"),
  createdAt: text("created_at").notNull(),
});

export const hazards = sqliteTable("hazards", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  analysisId: integer("analysis_id").notNull(),
  hazardName: text("hazard_name").notNull(),
  planProbability: text("plan_probability"),
  planImpact: text("plan_impact"),
  planLossEstimate: real("plan_loss_estimate"),
  verifiedRating: text("verified_rating"),
  eventCount: integer("event_count"),
  discrepancyType: text("discrepancy_type"),
  finding: text("finding"),
});

export const mitigationActions = sqliteTable("mitigation_actions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  analysisId: integer("analysis_id").notNull(),
  actionId: text("action_id"),
  description: text("description").notNull(),
  hazardsAddressed: text("hazards_addressed"),
  responsibleParty: text("responsible_party"),
  timeline: text("timeline"),
  estimatedCost: real("estimated_cost"),
  fundingSource: text("funding_source"),
  fundingSecured: integer("funding_secured"),
  status: text("status"),
  priority: text("priority"),
  actionType: text("action_type"),
  actionQuality: real("action_quality"),
});

export const complianceElements = sqliteTable("compliance_elements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  analysisId: integer("analysis_id").notNull(),
  elementCode: text("element_code").notNull(),
  elementName: text("element_name").notNull(),
  status: text("status").notNull(),
  score: real("score"),
  evidence: text("evidence"),
  severity: text("severity"),
});

export const scenarioLinks = sqliteTable("scenario_links", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  analysisId: integer("analysis_id").notNull(),
  hazardType: text("hazard_type").notNull(),
  linkName: text("link_name").notNull(),
  protectionStatus: text("protection_status").notNull(),
  evidence: text("evidence"),
  matchingActions: text("matching_actions"),
});

export const grantMatches = sqliteTable("grant_matches", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  analysisId: integer("analysis_id").notNull(),
  actionDescription: text("action_description"),
  program: text("program").notNull(),
  estimatedFederal: real("estimated_federal"),
  estimatedLocalMatch: real("estimated_local_match"),
  federalSharePct: real("federal_share_pct"),
  confidence: text("confidence"),
  reasoning: text("reasoning"),
  applicationTips: text("application_tips"),
});

export const findings = sqliteTable("findings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  analysisId: integer("analysis_id").notNull(),
  level: integer("level").notNull(),
  category: text("category").notNull(),
  severity: text("severity").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  recommendation: text("recommendation"),
});

// Insert schemas
export const insertPlanSchema = createInsertSchema(plans).omit({ id: true });
export const insertAnalysisSchema = createInsertSchema(analyses).omit({ id: true });
export const insertHazardSchema = createInsertSchema(hazards).omit({ id: true });
export const insertMitigationActionSchema = createInsertSchema(mitigationActions).omit({ id: true });
export const insertComplianceElementSchema = createInsertSchema(complianceElements).omit({ id: true });
export const insertScenarioLinkSchema = createInsertSchema(scenarioLinks).omit({ id: true });
export const insertGrantMatchSchema = createInsertSchema(grantMatches).omit({ id: true });
export const insertFindingSchema = createInsertSchema(findings).omit({ id: true });

// Types
export type Plan = typeof plans.$inferSelect;
export type InsertPlan = z.infer<typeof insertPlanSchema>;
export type Analysis = typeof analyses.$inferSelect;
export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
export type Hazard = typeof hazards.$inferSelect;
export type InsertHazard = z.infer<typeof insertHazardSchema>;
export type MitigationAction = typeof mitigationActions.$inferSelect;
export type InsertMitigationAction = z.infer<typeof insertMitigationActionSchema>;
export type ComplianceElement = typeof complianceElements.$inferSelect;
export type InsertComplianceElement = z.infer<typeof insertComplianceElementSchema>;
export type ScenarioLink = typeof scenarioLinks.$inferSelect;
export type InsertScenarioLink = z.infer<typeof insertScenarioLinkSchema>;
export type GrantMatch = typeof grantMatches.$inferSelect;
export type InsertGrantMatch = z.infer<typeof insertGrantMatchSchema>;
export type Finding = typeof findings.$inferSelect;
export type InsertFinding = z.infer<typeof insertFindingSchema>;

// Full analysis result type for API response
export interface FullAnalysis {
  analysis: Analysis;
  hazards: Hazard[];
  mitigationActions: MitigationAction[];
  complianceElements: ComplianceElement[];
  scenarioLinks: ScenarioLink[];
  grantMatches: GrantMatch[];
  findings: Finding[];
}
