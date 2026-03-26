import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { Analysis, Hazard, MitigationAction, ComplianceElement, ScenarioLink, GrantMatch, Finding } from "@shared/schema";

interface ReportData {
  plan: { filename: string; pageCount: number | null };
  analysis: Analysis;
  hazards: Hazard[];
  mitigationActions: MitigationAction[];
  complianceElements: ComplianceElement[];
  scenarioLinks: ScenarioLink[];
  grantMatches: GrantMatch[];
  findings: Finding[];
}

export function generateReport(data: ReportData) {
  const doc = new jsPDF("p", "mm", "letter");
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let currentPage = 1;

  function addHeader() {
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text("SOPSentinel HMP Stress-Test Report", margin, 10);
    doc.text(`Page ${currentPage}`, pageWidth - margin, 10, { align: "right" });
  }

  function addFooter() {
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text(
      `Generated ${new Date().toLocaleDateString()} | SOPSentinel v1.0`,
      pageWidth / 2,
      pageHeight - 8,
      { align: "center" }
    );
  }

  function newPage() {
    doc.addPage();
    currentPage++;
    addHeader();
    addFooter();
  }

  function checkSpace(needed: number, y: number): number {
    if (y + needed > pageHeight - 25) {
      newPage();
      return 25;
    }
    return y;
  }

  // ========= COVER PAGE =========
  doc.setFillColor(21, 32, 48);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // Title
  doc.setTextColor(255);
  doc.setFontSize(32);
  doc.text("SOPSentinel", pageWidth / 2, 60, { align: "center" });

  doc.setFontSize(14);
  doc.setTextColor(65, 143, 222);
  doc.text("HMP Stress-Test Report", pageWidth / 2, 72, { align: "center" });

  // Plan info
  doc.setFontSize(16);
  doc.setTextColor(255);
  doc.text(data.analysis.jurisdictionName || "Unknown Jurisdiction", pageWidth / 2, 100, { align: "center" });

  doc.setFontSize(11);
  doc.setTextColor(200);
  doc.text(`${data.analysis.stateName || ""} | ${data.analysis.planType || ""}`, pageWidth / 2, 110, { align: "center" });
  doc.text(`Source: ${data.plan.filename}`, pageWidth / 2, 120, { align: "center" });
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 130, { align: "center" });

  // Grade circle
  const grade = data.analysis.overallGrade || "N/A";
  const score = data.analysis.overallScore || 0;
  doc.setDrawColor(65, 143, 222);
  doc.setLineWidth(2);
  doc.circle(pageWidth / 2, 170, 25);
  doc.setFontSize(36);
  doc.setTextColor(65, 143, 222);
  doc.text(grade, pageWidth / 2, 176, { align: "center" });
  doc.setFontSize(10);
  doc.setTextColor(200);
  doc.text(`Overall Score: ${score}/100`, pageWidth / 2, 200, { align: "center" });

  addFooter();

  // ========= EXECUTIVE SUMMARY =========
  newPage();
  doc.setFontSize(18);
  doc.setTextColor(33, 37, 41);
  doc.text("Executive Summary", margin, 30);

  doc.setFontSize(10);
  doc.setTextColor(60);
  const summaryLines = doc.splitTextToSize(data.analysis.executiveSummary || "No summary available.", contentWidth);
  doc.text(summaryLines, margin, 42);

  let y = 42 + summaryLines.length * 5 + 10;

  // Score summary table
  doc.setFontSize(12);
  doc.setTextColor(33, 37, 41);
  doc.text("Score Breakdown", margin, y);
  y += 5;

  autoTable(doc, {
    startY: y,
    head: [["Level", "Category", "Score", "Weight"]],
    body: [
      ["1", "Compliance", `${data.analysis.complianceScore || 0}`, "20%"],
      ["2", "Analytical", `${data.analysis.analyticalScore || 0}`, "15%"],
      ["3", "Implementation", `${data.analysis.implementationScore || 0}`, "30%"],
      ["4", "Scenario", `${data.analysis.scenarioScore || 0}`, "25%"],
      ["5", "Equity", `${data.analysis.equityScore || 0}`, "10%"],
      ["", "OVERALL", `${data.analysis.overallScore || 0} (${data.analysis.overallGrade})`, "100%"],
    ],
    margin: { left: margin, right: margin },
    headStyles: { fillColor: [0, 61, 118], textColor: [255, 255, 255], fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: [245, 247, 250] },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // Key findings
  if (data.findings.length > 0) {
    y = checkSpace(30, y);
    doc.setFontSize(12);
    doc.setTextColor(33, 37, 41);
    doc.text("Key Findings", margin, y);
    y += 5;

    const topFindings = data.findings.slice(0, 10);
    autoTable(doc, {
      startY: y,
      head: [["Level", "Severity", "Title", "Description"]],
      body: topFindings.map(f => [
        `L${f.level}`,
        f.severity,
        f.title,
        (f.description || "").slice(0, 80),
      ]),
      margin: { left: margin, right: margin },
      headStyles: { fillColor: [0, 61, 118], textColor: [255, 255, 255], fontSize: 8 },
      bodyStyles: { fontSize: 7 },
      columnStyles: {
        0: { cellWidth: 12 },
        1: { cellWidth: 18 },
        2: { cellWidth: 50 },
        3: { cellWidth: contentWidth - 80 },
      },
    });
  }

  // ========= COMPLIANCE CROSSWALK =========
  newPage();
  doc.setFontSize(18);
  doc.setTextColor(33, 37, 41);
  doc.text("Level 1: Compliance Crosswalk", margin, 30);
  doc.setFontSize(10);
  doc.text(`Score: ${data.analysis.complianceScore || 0}/100`, margin, 38);

  autoTable(doc, {
    startY: 44,
    head: [["Code", "Element", "Status", "Score", "Evidence"]],
    body: data.complianceElements.map(e => [
      e.elementCode,
      e.elementName,
      e.status.toUpperCase(),
      `${e.score || 0}`,
      (e.evidence || "").slice(0, 60),
    ]),
    margin: { left: margin, right: margin },
    headStyles: { fillColor: [0, 61, 118], textColor: [255, 255, 255], fontSize: 8 },
    bodyStyles: { fontSize: 7 },
    columnStyles: {
      0: { cellWidth: 12 },
      1: { cellWidth: 38 },
      2: { cellWidth: 20 },
      3: { cellWidth: 14 },
    },
    didParseCell: (hookData: any) => {
      if (hookData.column.index === 2 && hookData.section === "body") {
        const val = hookData.cell.raw as string;
        if (val === "MET") hookData.cell.styles.textColor = [0, 150, 0];
        else if (val === "PARTIAL") hookData.cell.styles.textColor = [200, 150, 0];
        else hookData.cell.styles.textColor = [200, 0, 0];
      }
    },
  });

  // ========= HAZARD ANALYSIS =========
  newPage();
  doc.setFontSize(18);
  doc.setTextColor(33, 37, 41);
  doc.text("Level 2: Analytical Validation", margin, 30);
  doc.setFontSize(10);
  doc.text(`Score: ${data.analysis.analyticalScore || 0}/100`, margin, 38);

  autoTable(doc, {
    startY: 44,
    head: [["Hazard", "Probability", "Impact", "Verified", "Events", "Discrepancy"]],
    body: data.hazards.map(h => [
      h.hazardName,
      h.planProbability || "N/A",
      h.planImpact || "N/A",
      h.verifiedRating || "N/A",
      `${h.eventCount || 0}`,
      h.discrepancyType || "none",
    ]),
    margin: { left: margin, right: margin },
    headStyles: { fillColor: [0, 61, 118], textColor: [255, 255, 255], fontSize: 8 },
    bodyStyles: { fontSize: 7 },
  });

  // ========= IMPLEMENTATION =========
  newPage();
  doc.setFontSize(18);
  doc.setTextColor(33, 37, 41);
  doc.text("Level 3: Implementation Analysis", margin, 30);
  doc.setFontSize(10);
  doc.text(`Score: ${data.analysis.implementationScore || 0}/100`, margin, 38);

  const complete = data.mitigationActions.filter(a => a.status === "complete").length;
  const inProgress = data.mitigationActions.filter(a => a.status === "in_progress").length;
  const notStarted = data.mitigationActions.filter(a => a.status === "not_started").length;
  const totalCost = data.mitigationActions.reduce((s, a) => s + (a.estimatedCost || 0), 0);
  const secured = data.mitigationActions.filter(a => a.fundingSecured).reduce((s, a) => s + (a.estimatedCost || 0), 0);

  doc.text(`Actions: ${data.mitigationActions.length} total | ${complete} complete | ${inProgress} in progress | ${notStarted} not started`, margin, 46);
  doc.text(`Funding: $${(totalCost / 1000000).toFixed(1)}M total | $${(secured / 1000000).toFixed(1)}M secured | $${((totalCost - secured) / 1000000).toFixed(1)}M gap`, margin, 52);

  autoTable(doc, {
    startY: 58,
    head: [["ID", "Description", "Status", "Priority", "Cost", "Funded"]],
    body: data.mitigationActions.map(a => [
      a.actionId || "-",
      (a.description || "").slice(0, 50),
      a.status || "N/A",
      a.priority || "N/A",
      a.estimatedCost ? `$${(a.estimatedCost / 1000).toFixed(0)}K` : "N/A",
      a.fundingSecured ? "Yes" : "No",
    ]),
    margin: { left: margin, right: margin },
    headStyles: { fillColor: [0, 61, 118], textColor: [255, 255, 255], fontSize: 8 },
    bodyStyles: { fontSize: 7 },
  });

  // ========= SCENARIO =========
  newPage();
  doc.setFontSize(18);
  doc.setTextColor(33, 37, 41);
  doc.text("Level 4: Scenario Stress Test", margin, 30);
  doc.setFontSize(10);
  doc.text(`Score: ${data.analysis.scenarioScore || 0}/100`, margin, 38);

  autoTable(doc, {
    startY: 44,
    head: [["Link", "Status", "Evidence", "Actions"]],
    body: data.scenarioLinks.map(l => [
      l.linkName,
      l.protectionStatus.replace(/_/g, " "),
      (l.evidence || "").slice(0, 60),
      l.matchingActions || "None",
    ]),
    margin: { left: margin, right: margin },
    headStyles: { fillColor: [0, 61, 118], textColor: [255, 255, 255], fontSize: 8 },
    bodyStyles: { fontSize: 7 },
    didParseCell: (hookData: any) => {
      if (hookData.column.index === 1 && hookData.section === "body") {
        const val = (hookData.cell.raw as string).toLowerCase();
        if (val === "protected") hookData.cell.styles.textColor = [0, 150, 0];
        else if (val.includes("partial")) hookData.cell.styles.textColor = [200, 150, 0];
        else if (val === "blind spot") hookData.cell.styles.textColor = [150, 0, 0];
        else hookData.cell.styles.textColor = [200, 0, 0];
      }
    },
  });

  // ========= EQUITY =========
  y = (doc as any).lastAutoTable.finalY + 15;
  y = checkSpace(30, y);
  doc.setFontSize(18);
  doc.setTextColor(33, 37, 41);
  doc.text("Level 5: Equity Assessment", margin, y);
  doc.setFontSize(10);
  doc.text(`Score: ${data.analysis.equityScore || 0}/100`, margin, y + 8);

  // ========= GRANTS =========
  if (data.grantMatches.length > 0) {
    newPage();
    doc.setFontSize(18);
    doc.setTextColor(33, 37, 41);
    doc.text("Grant Strategy", margin, 30);

    const totalFederal = data.grantMatches.reduce((s, g) => s + (g.estimatedFederal || 0), 0);
    doc.setFontSize(10);
    doc.text(`Total Potential Federal Funding: $${(totalFederal / 1000000).toFixed(1)}M`, margin, 38);

    autoTable(doc, {
      startY: 44,
      head: [["Action", "Program", "Federal $", "Local Match", "Fed %", "Confidence"]],
      body: data.grantMatches.slice(0, 20).map(g => [
        (g.actionDescription || "").slice(0, 40),
        g.program,
        g.estimatedFederal ? `$${(g.estimatedFederal / 1000).toFixed(0)}K` : "N/A",
        g.estimatedLocalMatch ? `$${(g.estimatedLocalMatch / 1000).toFixed(0)}K` : "N/A",
        g.federalSharePct ? `${g.federalSharePct}%` : "N/A",
        g.confidence || "N/A",
      ]),
      margin: { left: margin, right: margin },
      headStyles: { fillColor: [0, 61, 118], textColor: [255, 255, 255], fontSize: 8 },
      bodyStyles: { fontSize: 7 },
    });
  }

  // ========= 90-DAY ACTION PLAN =========
  newPage();
  doc.setFontSize(18);
  doc.setTextColor(33, 37, 41);
  doc.text("90-Day Action Plan", margin, 30);

  try {
    const plan90 = JSON.parse(data.analysis.ninetyDayPlan || "{}");
    y = 40;
    for (const [period, tasks] of Object.entries(plan90)) {
      y = checkSpace(20, y);
      doc.setFontSize(11);
      doc.setTextColor(65, 143, 222);
      doc.text(period, margin, y);
      y += 5;
      doc.setFontSize(9);
      doc.setTextColor(60);
      for (const task of tasks as string[]) {
        y = checkSpace(8, y);
        const lines = doc.splitTextToSize(`• ${task}`, contentWidth - 5);
        doc.text(lines, margin + 5, y);
        y += lines.length * 4 + 2;
      }
      y += 3;
    }
  } catch {
    doc.setFontSize(10);
    doc.text("90-day action plan data not available.", margin, 40);
  }

  // ========= METHODOLOGY =========
  newPage();
  doc.setFontSize(18);
  doc.setTextColor(33, 37, 41);
  doc.text("Methodology", margin, 30);

  doc.setFontSize(9);
  doc.setTextColor(60);
  const methodology = [
    "SOPSentinel employs a 5-level stress-test methodology to evaluate Hazard Mitigation Plans:",
    "",
    "Level 1 - Compliance (20%): Checks 14 elements against 44 CFR §201.6 requirements using text evidence analysis.",
    "Level 2 - Analytical (15%): Validates hazard data completeness, historical accuracy, and loss estimation methodology.",
    "Level 3 - Implementation (30%): Assesses action completion rates, funding gaps, and institutional capacity.",
    "Level 4 - Scenario (25%): Builds failure chains for primary hazards and tests mitigation coverage across 7 links.",
    "Level 5 - Equity (10%): Evaluates social vulnerability, environmental justice, and equitable resource targeting.",
    "",
    "Implementation Gate: If implementation score falls below thresholds (20/40/55), overall score is capped.",
    "Grant Matching: Unfunded actions are matched to FEMA BRIC, FMA, and HMGP programs with cost share estimates.",
    "",
    "Grading Scale: A+ (95-100), A (90-94), A- (85-89), B+ (80-84), B (75-79), B- (70-74),",
    "C+ (65-69), C (60-64), C- (55-59), D (45-54), F (0-44)",
  ];

  const methodLines = doc.splitTextToSize(methodology.join("\n"), contentWidth);
  doc.text(methodLines, margin, 40);

  // Save
  const filename = `SOPSentinel_Report_${(data.analysis.jurisdictionName || "Plan").replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(filename);
}

interface ReportButtonProps {
  data: ReportData;
}

export default function ReportButton({ data }: ReportButtonProps) {
  return (
    <button
      onClick={() => generateReport(data)}
      className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
      data-testid="download-report-btn"
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 3v10m0 0l-3-3m3 3l3-3M3 14v2a1 1 0 001 1h12a1 1 0 001-1v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      Download Full PDF Report
    </button>
  );
}
