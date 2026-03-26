import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import { PDFParse } from "pdf-parse";
import { runAnalysis } from "./analysis-engine";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Upload PDF
  app.post("/api/plans/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const plan = storage.createPlan({
        filename: req.file.originalname,
        fileSize: req.file.size,
        uploadedAt: new Date().toISOString(),
        status: "uploading",
        rawText: null,
        pageCount: null,
        progressStep: 0,
        progressMessage: "Uploading...",
        errorMessage: null,
      });

      // Parse PDF
      storage.updatePlan(plan.id, { status: "parsing", progressStep: 1, progressMessage: "Parsing PDF..." });

      let rawText = "";
      let pageCount = 0;
      try {
        const parser = new PDFParse({ data: req.file.buffer });
        await parser.load();
        const info = await parser.getInfo();
        pageCount = info?.numPages || 0;

        // Extract text from all pages
        const textResult = await parser.getText();
        rawText = textResult?.text || "";

        await parser.destroy();
      } catch (err: any) {
        storage.updatePlan(plan.id, { status: "error", errorMessage: "Failed to parse PDF: " + err.message });
        return res.status(400).json({ error: "Failed to parse PDF" });
      }

      storage.updatePlan(plan.id, {
        rawText,
        pageCount,
        progressStep: 1,
        progressMessage: `Parsed ${pageCount} pages`,
      });

      // Start analysis in background
      runAnalysis(plan.id, rawText).catch(err => {
        console.error("Background analysis error:", err);
        storage.updatePlan(plan.id, { status: "error", errorMessage: err.message });
      });

      res.json({ id: plan.id, filename: plan.filename, status: "parsing" });
    } catch (error: any) {
      console.error("Upload error:", error);
      res.status(500).json({ error: error.message || "Upload failed" });
    }
  });

  // List all plans
  app.get("/api/plans", async (_req, res) => {
    try {
      const allPlans = storage.getAllPlans();
      // Don't send rawText in list view
      const plans = allPlans.map(p => ({
        ...p,
        rawText: undefined,
      }));
      res.json(plans);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get single plan
  app.get("/api/plans/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

      const plan = storage.getPlan(id);
      if (!plan) return res.status(404).json({ error: "Plan not found" });

      // Don't send rawText
      res.json({ ...plan, rawText: undefined });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get full analysis
  app.get("/api/plans/:id/analysis", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

      const plan = storage.getPlan(id);
      if (!plan) return res.status(404).json({ error: "Plan not found" });

      const analysis = storage.getAnalysisByPlanId(id);
      if (!analysis) return res.status(404).json({ error: "Analysis not found" });

      const hazards = storage.getHazardsByAnalysisId(analysis.id);
      const mitigationActions = storage.getMitigationActionsByAnalysisId(analysis.id);
      const complianceElements = storage.getComplianceElementsByAnalysisId(analysis.id);
      const scenarioLinks = storage.getScenarioLinksByAnalysisId(analysis.id);
      const grantMatches = storage.getGrantMatchesByAnalysisId(analysis.id);
      const findings = storage.getFindingsByAnalysisId(analysis.id);

      res.json({
        plan: { ...plan, rawText: undefined },
        analysis,
        hazards,
        mitigationActions,
        complianceElements,
        scenarioLinks,
        grantMatches,
        findings,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete plan
  app.delete("/api/plans/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

      const plan = storage.getPlan(id);
      if (!plan) return res.status(404).json({ error: "Plan not found" });

      storage.deletePlan(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return httpServer;
}
