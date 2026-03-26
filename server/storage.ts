import {
  type Plan, type InsertPlan, plans,
  type Analysis, type InsertAnalysis, analyses,
  type Hazard, type InsertHazard, hazards,
  type MitigationAction, type InsertMitigationAction, mitigationActions,
  type ComplianceElement, type InsertComplianceElement, complianceElements,
  type ScenarioLink, type InsertScenarioLink, scenarioLinks,
  type GrantMatch, type InsertGrantMatch, grantMatches,
  type Finding, type InsertFinding, findings,
} from "@shared/schema";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, desc } from "drizzle-orm";

const sqlite = new Database("data.db");
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite);

export interface IStorage {
  // Plans
  createPlan(plan: InsertPlan): Plan;
  getPlan(id: number): Plan | undefined;
  getAllPlans(): Plan[];
  updatePlan(id: number, data: Partial<InsertPlan>): Plan | undefined;
  deletePlan(id: number): void;

  // Analyses
  createAnalysis(analysis: InsertAnalysis): Analysis;
  getAnalysisByPlanId(planId: number): Analysis | undefined;
  deleteAnalysesByPlanId(planId: number): void;

  // Hazards
  createHazard(hazard: InsertHazard): Hazard;
  getHazardsByAnalysisId(analysisId: number): Hazard[];
  deleteHazardsByAnalysisId(analysisId: number): void;

  // Mitigation Actions
  createMitigationAction(action: InsertMitigationAction): MitigationAction;
  getMitigationActionsByAnalysisId(analysisId: number): MitigationAction[];
  deleteMitigationActionsByAnalysisId(analysisId: number): void;

  // Compliance Elements
  createComplianceElement(element: InsertComplianceElement): ComplianceElement;
  getComplianceElementsByAnalysisId(analysisId: number): ComplianceElement[];
  deleteComplianceElementsByAnalysisId(analysisId: number): void;

  // Scenario Links
  createScenarioLink(link: InsertScenarioLink): ScenarioLink;
  getScenarioLinksByAnalysisId(analysisId: number): ScenarioLink[];
  deleteScenarioLinksByAnalysisId(analysisId: number): void;

  // Grant Matches
  createGrantMatch(grant: InsertGrantMatch): GrantMatch;
  getGrantMatchesByAnalysisId(analysisId: number): GrantMatch[];
  deleteGrantMatchesByAnalysisId(analysisId: number): void;

  // Findings
  createFinding(finding: InsertFinding): Finding;
  getFindingsByAnalysisId(analysisId: number): Finding[];
  deleteFindingsByAnalysisId(analysisId: number): void;
}

export class DatabaseStorage implements IStorage {
  // Plans
  createPlan(plan: InsertPlan): Plan {
    return db.insert(plans).values(plan).returning().get();
  }

  getPlan(id: number): Plan | undefined {
    return db.select().from(plans).where(eq(plans.id, id)).get();
  }

  getAllPlans(): Plan[] {
    return db.select().from(plans).orderBy(desc(plans.id)).all();
  }

  updatePlan(id: number, data: Partial<InsertPlan>): Plan | undefined {
    return db.update(plans).set(data).where(eq(plans.id, id)).returning().get();
  }

  deletePlan(id: number): void {
    // First delete related analyses and all their children
    const analysis = this.getAnalysisByPlanId(id);
    if (analysis) {
      this.deleteHazardsByAnalysisId(analysis.id);
      this.deleteMitigationActionsByAnalysisId(analysis.id);
      this.deleteComplianceElementsByAnalysisId(analysis.id);
      this.deleteScenarioLinksByAnalysisId(analysis.id);
      this.deleteGrantMatchesByAnalysisId(analysis.id);
      this.deleteFindingsByAnalysisId(analysis.id);
    }
    this.deleteAnalysesByPlanId(id);
    db.delete(plans).where(eq(plans.id, id)).run();
  }

  // Analyses
  createAnalysis(analysis: InsertAnalysis): Analysis {
    return db.insert(analyses).values(analysis).returning().get();
  }

  getAnalysisByPlanId(planId: number): Analysis | undefined {
    return db.select().from(analyses).where(eq(analyses.planId, planId)).get();
  }

  deleteAnalysesByPlanId(planId: number): void {
    db.delete(analyses).where(eq(analyses.planId, planId)).run();
  }

  // Hazards
  createHazard(hazard: InsertHazard): Hazard {
    return db.insert(hazards).values(hazard).returning().get();
  }

  getHazardsByAnalysisId(analysisId: number): Hazard[] {
    return db.select().from(hazards).where(eq(hazards.analysisId, analysisId)).all();
  }

  deleteHazardsByAnalysisId(analysisId: number): void {
    db.delete(hazards).where(eq(hazards.analysisId, analysisId)).run();
  }

  // Mitigation Actions
  createMitigationAction(action: InsertMitigationAction): MitigationAction {
    return db.insert(mitigationActions).values(action).returning().get();
  }

  getMitigationActionsByAnalysisId(analysisId: number): MitigationAction[] {
    return db.select().from(mitigationActions).where(eq(mitigationActions.analysisId, analysisId)).all();
  }

  deleteMitigationActionsByAnalysisId(analysisId: number): void {
    db.delete(mitigationActions).where(eq(mitigationActions.analysisId, analysisId)).run();
  }

  // Compliance Elements
  createComplianceElement(element: InsertComplianceElement): ComplianceElement {
    return db.insert(complianceElements).values(element).returning().get();
  }

  getComplianceElementsByAnalysisId(analysisId: number): ComplianceElement[] {
    return db.select().from(complianceElements).where(eq(complianceElements.analysisId, analysisId)).all();
  }

  deleteComplianceElementsByAnalysisId(analysisId: number): void {
    db.delete(complianceElements).where(eq(complianceElements.analysisId, analysisId)).run();
  }

  // Scenario Links
  createScenarioLink(link: InsertScenarioLink): ScenarioLink {
    return db.insert(scenarioLinks).values(link).returning().get();
  }

  getScenarioLinksByAnalysisId(analysisId: number): ScenarioLink[] {
    return db.select().from(scenarioLinks).where(eq(scenarioLinks.analysisId, analysisId)).all();
  }

  deleteScenarioLinksByAnalysisId(analysisId: number): void {
    db.delete(scenarioLinks).where(eq(scenarioLinks.analysisId, analysisId)).run();
  }

  // Grant Matches
  createGrantMatch(grant: InsertGrantMatch): GrantMatch {
    return db.insert(grantMatches).values(grant).returning().get();
  }

  getGrantMatchesByAnalysisId(analysisId: number): GrantMatch[] {
    return db.select().from(grantMatches).where(eq(grantMatches.analysisId, analysisId)).all();
  }

  deleteGrantMatchesByAnalysisId(analysisId: number): void {
    db.delete(grantMatches).where(eq(grantMatches.analysisId, analysisId)).run();
  }

  // Findings
  createFinding(finding: InsertFinding): Finding {
    return db.insert(findings).values(finding).returning().get();
  }

  getFindingsByAnalysisId(analysisId: number): Finding[] {
    return db.select().from(findings).where(eq(findings.analysisId, analysisId)).all();
  }

  deleteFindingsByAnalysisId(analysisId: number): void {
    db.delete(findings).where(eq(findings.analysisId, analysisId)).run();
  }
}

export const storage = new DatabaseStorage();
