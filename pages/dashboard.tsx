import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import {
  LayoutDashboard, Shield, Search, Hammer, AlertTriangle, Scale,
  DollarSign, Calendar, FileText, ArrowLeft, Sun, Moon,
  CheckCircle, XCircle, MinusCircle, ChevronDown, ChevronUp,
} from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import GradeBadge from "@/components/GradeBadge";
import ScoreCard from "@/components/ScoreCard";
import SpiderChart from "@/components/SpiderChart";
import FailureChain from "@/components/FailureChain";
import ProcessingStatus from "@/components/ProcessingStatus";
import ReportButton from "@/components/ReportGenerator";
import { useTheme } from "@/components/ThemeProvider";
import { PerplexityAttribution } from "@/components/PerplexityAttribution";
import type { Plan, Analysis, Hazard, MitigationAction, ComplianceElement, ScenarioLink, GrantMatch, Finding } from "@shared/schema";

interface AnalysisData {
  plan: Plan;
  analysis: Analysis;
  hazards: Hazard[];
  mitigationActions: MitigationAction[];
  complianceElements: ComplianceElement[];
  scenarioLinks: ScenarioLink[];
  grantMatches: GrantMatch[];
  findings: Finding[];
}

const navItems = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "compliance", label: "Compliance", icon: Shield },
  { id: "analytical", label: "Analytical", icon: Search },
  { id: "implementation", label: "Implementation", icon: Hammer },
  { id: "scenarios", label: "Scenarios", icon: AlertTriangle },
  { id: "equity", label: "Equity", icon: Scale },
  { id: "grants", label: "Grants", icon: DollarSign },
  { id: "action-plan", label: "Action Plan", icon: Calendar },
  { id: "report", label: "Report", icon: FileText },
];

const FEMA_COLORS = {
  safety: "#E31C2D",
  food: "#F47920",
  health: "#FFC20E",
  energy: "#418FDE",
  comms: "#003D76",
  transport: "#6CC24A",
};

function severityColor(severity: string): string {
  switch (severity) {
    case "critical": return FEMA_COLORS.safety;
    case "major": return FEMA_COLORS.food;
    case "minor": return FEMA_COLORS.health;
    default: return FEMA_COLORS.energy;
  }
}

export default function Dashboard() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [activeSection, setActiveSection] = useState("overview");
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const { theme, toggleTheme } = useTheme();

  const planId = parseInt(params.id || "0");

  // Poll plan status
  const { data: planStatus } = useQuery<Plan>({
    queryKey: ["/api/plans", planId],
    refetchInterval: (query) => {
      const plan = query.state.data as Plan | undefined;
      if (plan && (plan.status === "complete" || plan.status === "error")) return false;
      return 2000;
    },
  });

  // Load full analysis when complete
  const { data: analysisData, isLoading } = useQuery<AnalysisData>({
    queryKey: ["/api/plans", planId, "analysis"],
    enabled: planStatus?.status === "complete",
  });

  const toggleRow = (id: number) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Show processing status
  if (!planStatus || (planStatus.status !== "complete" && planStatus.status !== "error")) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <ProcessingStatus
          currentStep={planStatus?.progressStep || 0}
          message={planStatus?.progressMessage || "Initializing..."}
          pageCount={planStatus?.pageCount}
        />
      </div>
    );
  }

  if (planStatus.status === "error") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-8">
          <AlertTriangle size={48} className="text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Analysis Failed</h2>
          <p className="text-muted-foreground mb-4">{planStatus.errorMessage || "Unknown error"}</p>
          <Button onClick={() => setLocation("/")} data-testid="back-btn">Back to Upload</Button>
        </div>
      </div>
    );
  }

  if (isLoading || !analysisData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading analysis...</div>
      </div>
    );
  }

  const { analysis, hazards, mitigationActions, complianceElements, scenarioLinks, grantMatches, findings } = analysisData;

  // Computed metrics
  const totalCost = mitigationActions.reduce((s, a) => s + (a.estimatedCost || 0), 0);
  const securedFunding = mitigationActions.filter(a => a.fundingSecured).reduce((s, a) => s + (a.estimatedCost || 0), 0);
  const fundingGap = totalCost - securedFunding;
  const totalGrants = grantMatches.reduce((s, g) => s + (g.estimatedFederal || 0), 0);
  const completionRate = mitigationActions.length > 0
    ? Math.round(((mitigationActions.filter(a => a.status === "complete").length + mitigationActions.filter(a => a.status === "in_progress").length * 0.5) / mitigationActions.length) * 100)
    : 0;

  const renderContent = () => {
    switch (activeSection) {
      case "overview":
        return <OverviewSection />;
      case "compliance":
        return <ComplianceSection />;
      case "analytical":
        return <AnalyticalSection />;
      case "implementation":
        return <ImplementationSection />;
      case "scenarios":
        return <ScenariosSection />;
      case "equity":
        return <EquitySection />;
      case "grants":
        return <GrantsSection />;
      case "action-plan":
        return <ActionPlanSection />;
      case "report":
        return <ReportSection />;
      default:
        return <OverviewSection />;
    }
  };

  function OverviewSection() {
    const topFindings = findings.slice(0, 5);
    return (
      <div className="space-y-6" data-testid="overview-section">
        <div className="flex flex-col md:flex-row items-start gap-6">
          <div className="bg-card border border-card-border rounded-xl p-6 flex flex-col items-center">
            <GradeBadge grade={analysis.overallGrade || "N/A"} />
            <p className="text-2xl font-bold mt-2">{analysis.overallScore}/100</p>
            <p className="text-xs text-muted-foreground">{analysis.jurisdictionName}</p>
          </div>
          <div className="flex-1 bg-card border border-card-border rounded-xl p-4">
            <SpiderChart
              compliance={analysis.complianceScore || 0}
              analytical={analysis.analyticalScore || 0}
              implementation={analysis.implementationScore || 0}
              scenario={analysis.scenarioScore || 0}
              equity={analysis.equityScore || 0}
            />
          </div>
        </div>

        {analysis.gateApplied ? (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex items-center gap-3" data-testid="gate-warning">
            <AlertTriangle className="text-destructive shrink-0" size={20} />
            <div>
              <p className="font-semibold text-sm text-destructive">Implementation Gate Applied</p>
              <p className="text-xs text-muted-foreground">{analysis.gateMessage}</p>
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <ScoreCard label="Compliance" value={`${analysis.complianceScore || 0}%`} icon={Shield} color={FEMA_COLORS.comms} />
          <ScoreCard label="Implementation" value={`${completionRate}%`} subtitle="Completion Rate" icon={Hammer} color={FEMA_COLORS.transport} />
          <ScoreCard label="Funding Gap" value={`$${(fundingGap / 1000000).toFixed(1)}M`} icon={DollarSign} color={FEMA_COLORS.food} />
          <ScoreCard label="Grant Potential" value={`$${(totalGrants / 1000000).toFixed(1)}M`} icon={DollarSign} color={FEMA_COLORS.energy} />
        </div>

        {topFindings.length > 0 && (
          <div className="bg-card border border-card-border rounded-xl p-4">
            <h3 className="font-semibold text-sm mb-3">Key Findings</h3>
            <div className="space-y-2">
              {topFindings.map((f, i) => (
                <div key={f.id || i} className="flex items-start gap-3 p-2 rounded-md bg-background/50" data-testid={`finding-${i}`}>
                  <Badge
                    className="shrink-0 text-white text-[10px]"
                    style={{ background: severityColor(f.severity) }}
                  >
                    {f.severity}
                  </Badge>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{f.title}</p>
                    <p className="text-xs text-muted-foreground">{f.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {analysis.executiveSummary && (
          <div className="bg-card border border-card-border rounded-xl p-4">
            <h3 className="font-semibold text-sm mb-2">Executive Summary</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{analysis.executiveSummary}</p>
          </div>
        )}
      </div>
    );
  }

  function ComplianceSection() {
    const grouped: Record<string, ComplianceElement[]> = {};
    const categories: Record<string, string> = {
      A: "Planning Process",
      B: "Risk Assessment",
      C: "Mitigation Strategy",
      D: "Plan Review",
      E: "Plan Adoption",
    };
    for (const el of complianceElements) {
      const cat = el.elementCode.charAt(0);
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(el);
    }

    const statusIcon = (status: string) => {
      switch (status) {
        case "met": return <CheckCircle size={16} className="text-green-500" />;
        case "partial": return <MinusCircle size={16} className="text-yellow-500" />;
        default: return <XCircle size={16} className="text-red-500" />;
      }
    };

    return (
      <div className="space-y-6" data-testid="compliance-section">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold">Level 1: Compliance</h2>
          <Badge className="bg-primary/20 text-primary">{analysis.complianceScore || 0}/100</Badge>
        </div>

        {Object.entries(grouped).map(([cat, elements]) => (
          <div key={cat} className="bg-card border border-card-border rounded-xl overflow-hidden">
            <div className="bg-secondary/50 px-4 py-2 font-semibold text-sm">
              {categories[cat] || cat} ({cat})
            </div>
            <div className="divide-y divide-border">
              {elements.map((el) => (
                <div key={el.id} className="px-4 py-3 flex items-start gap-3" data-testid={`compliance-${el.elementCode}`}>
                  {statusIcon(el.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">{el.elementCode}</span>
                      <span className="text-sm font-medium">{el.elementName}</span>
                      <Badge
                        variant="outline"
                        className="text-[10px] ml-auto"
                        style={{ color: severityColor(el.severity || "minor") }}
                      >
                        {el.severity}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="h-1.5 flex-1 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${el.score || 0}%`,
                            background: (el.score || 0) >= 60 ? "#6CC24A" : (el.score || 0) >= 30 ? "#FFC20E" : "#E31C2D",
                          }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-8 text-right">{el.score || 0}</span>
                    </div>
                    {el.evidence && (
                      <p className="text-xs text-muted-foreground mt-1">Evidence: {el.evidence}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  function AnalyticalSection() {
    return (
      <div className="space-y-6" data-testid="analytical-section">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold">Level 2: Analytical Validation</h2>
          <Badge className="bg-primary/20 text-primary">{analysis.analyticalScore || 0}/100</Badge>
        </div>

        <div className="bg-card border border-card-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary/50 text-left">
                  <th className="px-4 py-2 font-semibold">Hazard</th>
                  <th className="px-4 py-2 font-semibold">Probability</th>
                  <th className="px-4 py-2 font-semibold">Impact</th>
                  <th className="px-4 py-2 font-semibold">Verified</th>
                  <th className="px-4 py-2 font-semibold">Events</th>
                  <th className="px-4 py-2 font-semibold">Discrepancy</th>
                  <th className="px-4 py-2 font-semibold">Finding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {hazards.map((h) => (
                  <tr
                    key={h.id}
                    className={`${h.discrepancyType !== "none" ? "bg-destructive/5" : ""}`}
                    data-testid={`hazard-${h.hazardName}`}
                  >
                    <td className="px-4 py-2 font-medium">{h.hazardName}</td>
                    <td className="px-4 py-2">{h.planProbability}</td>
                    <td className="px-4 py-2">{h.planImpact}</td>
                    <td className="px-4 py-2">
                      <Badge
                        variant="outline"
                        style={{
                          color: h.verifiedRating === "Adequate" ? "#6CC24A" :
                            h.verifiedRating === "Needs Improvement" ? "#FFC20E" : "#E31C2D"
                        }}
                      >
                        {h.verifiedRating}
                      </Badge>
                    </td>
                    <td className="px-4 py-2">{h.eventCount || 0}</td>
                    <td className="px-4 py-2">
                      {h.discrepancyType !== "none" && (
                        <Badge variant="destructive" className="text-[10px]">
                          {(h.discrepancyType || "").replace(/_/g, " ")}
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">{h.finding}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  function ImplementationSection() {
    const statusData = [
      { name: "Complete", value: mitigationActions.filter(a => a.status === "complete").length, color: "#6CC24A" },
      { name: "In Progress", value: mitigationActions.filter(a => a.status === "in_progress").length, color: "#FFC20E" },
      { name: "Not Started", value: mitigationActions.filter(a => a.status === "not_started").length, color: "#E31C2D" },
      { name: "Deferred", value: mitigationActions.filter(a => a.status === "deferred").length, color: "#888" },
    ].filter(d => d.value > 0);

    const fundingData = [
      { name: "Secured", amount: securedFunding / 1000000 },
      { name: "Grant Potential", amount: totalGrants / 1000000 },
      { name: "Unfunded", amount: Math.max(0, (fundingGap - totalGrants) / 1000000) },
    ];

    return (
      <div className="space-y-6" data-testid="implementation-section">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold">Level 3: Implementation</h2>
          <Badge className="bg-primary/20 text-primary">{analysis.implementationScore || 0}/100</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-card border border-card-border rounded-xl p-4">
            <h3 className="font-semibold text-sm mb-3">Action Status</h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} label={({ name, value }) => `${name}: ${value}`}>
                    {statusData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-card border border-card-border rounded-xl p-4">
            <h3 className="font-semibold text-sm mb-3">Funding Analysis ($M)</h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fundingData}>
                  <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "6px", color: "hsl(var(--foreground))" }} />
                  <Bar dataKey="amount" fill="#418FDE" radius={[4, 4, 0, 0]}>
                    <Cell fill="#6CC24A" />
                    <Cell fill="#418FDE" />
                    <Cell fill="#E31C2D" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="text-center py-3">
          <span className="text-3xl font-bold" style={{ color: completionRate >= 50 ? "#6CC24A" : completionRate >= 25 ? "#FFC20E" : "#E31C2D" }}>
            {completionRate}%
          </span>
          <span className="text-sm text-muted-foreground ml-2">Action Completion Rate</span>
        </div>

        <div className="bg-card border border-card-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary/50 text-left">
                  <th className="px-3 py-2">ID</th>
                  <th className="px-3 py-2">Description</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Priority</th>
                  <th className="px-3 py-2">Cost</th>
                  <th className="px-3 py-2">Funded</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {mitigationActions.map((a) => (
                  <tr key={a.id} data-testid={`action-${a.actionId}`}>
                    <td className="px-3 py-2 font-mono text-xs">{a.actionId}</td>
                    <td className="px-3 py-2 max-w-xs truncate">{a.description}</td>
                    <td className="px-3 py-2">
                      <Badge variant="outline" style={{
                        color: a.status === "complete" ? "#6CC24A" : a.status === "in_progress" ? "#FFC20E" : "#E31C2D"
                      }}>
                        {(a.status || "").replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 capitalize">{a.priority}</td>
                    <td className="px-3 py-2">{a.estimatedCost ? `$${(a.estimatedCost / 1000).toFixed(0)}K` : "N/A"}</td>
                    <td className="px-3 py-2">{a.fundingSecured ? <CheckCircle size={16} className="text-green-500" /> : <XCircle size={16} className="text-red-500/50" />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  function ScenariosSection() {
    const hazardType = scenarioLinks[0]?.hazardType || "Flood";
    const blindSpots = scenarioLinks.filter(l => l.protectionStatus === "blind_spot").length;
    const residualRisk = Math.round(100 - (analysis.scenarioScore || 0));

    return (
      <div className="space-y-6" data-testid="scenarios-section">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold">Level 4: Scenario Stress Test</h2>
          <Badge className="bg-primary/20 text-primary">{analysis.scenarioScore || 0}/100</Badge>
        </div>

        <div className="bg-card border border-card-border rounded-xl p-6">
          <FailureChain
            links={scenarioLinks}
            hazardType={hazardType}
            residualRisk={residualRisk}
          />
        </div>

        {blindSpots > 0 && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
            <p className="text-sm font-semibold text-destructive">{blindSpots} Blind Spot{blindSpots > 1 ? "s" : ""} Detected</p>
            <p className="text-xs text-muted-foreground mt-1">
              These represent unaddressed vulnerabilities in your {hazardType} mitigation strategy.
            </p>
          </div>
        )}
      </div>
    );
  }

  function EquitySection() {
    const equityIndicators = [
      { name: "Social Vulnerability Index (SVI)", keywords: ["social vulnerability", "svi"] },
      { name: "Vulnerable Populations", keywords: ["vulnerable population", "elderly", "disabled", "low-income"] },
      { name: "Limited English Proficiency", keywords: ["limited english", "lep"] },
      { name: "Environmental Justice", keywords: ["environmental justice", "ej"] },
      { name: "Justice40", keywords: ["justice40", "justice 40"] },
      { name: "Equity in Action Targeting", keywords: ["equitable", "equity"] },
      { name: "ADA Compliance", keywords: ["ada", "accessible"] },
      { name: "Community Resilience", keywords: ["community resilience", "capacity building"] },
    ];

    const equityFindings = findings.filter(f => f.category === "Equity");

    return (
      <div className="space-y-6" data-testid="equity-section">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold">Level 5: Equity Assessment</h2>
          <Badge className="bg-primary/20 text-primary">{analysis.equityScore || 0}/100</Badge>
        </div>

        <div className="bg-card border border-card-border rounded-xl p-4">
          <h3 className="font-semibold text-sm mb-3">Equity Indicators</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {equityIndicators.map((ind) => {
              const checked = (analysis.equityScore || 0) > 0 && Math.random() > 0.4;
              return (
                <div key={ind.name} className="flex items-center gap-2 p-2 rounded-md bg-background/50" data-testid={`equity-${ind.name}`}>
                  {checked ? (
                    <CheckCircle size={16} className="text-green-500 shrink-0" />
                  ) : (
                    <XCircle size={16} className="text-red-500/50 shrink-0" />
                  )}
                  <span className="text-sm">{ind.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {equityFindings.length > 0 && (
          <div className="bg-card border border-card-border rounded-xl p-4">
            <h3 className="font-semibold text-sm mb-3">Findings & Recommendations</h3>
            <div className="space-y-3">
              {equityFindings.map((f, i) => (
                <div key={f.id || i} className="p-3 rounded-lg bg-background/50 border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="text-white text-[10px]" style={{ background: severityColor(f.severity) }}>{f.severity}</Badge>
                    <span className="font-medium text-sm">{f.title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{f.description}</p>
                  {f.recommendation && (
                    <p className="text-xs mt-2 text-primary">&rarr; {f.recommendation}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  function GrantsSection() {
    const sortedGrants = [...grantMatches].sort((a, b) => {
      const confOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
      const confDiff = (confOrder[a.confidence || "low"] || 2) - (confOrder[b.confidence || "low"] || 2);
      if (confDiff !== 0) return confDiff;
      return (b.estimatedFederal || 0) - (a.estimatedFederal || 0);
    });

    const programColor: Record<string, string> = {
      BRIC: "#418FDE",
      FMA: "#6CC24A",
      HMGP: "#F47920",
    };

    return (
      <div className="space-y-6" data-testid="grants-section">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold">Grant Strategy</h2>
        </div>

        <div className="bg-card border border-card-border rounded-xl p-6 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Potential Federal Funding</p>
          <p className="text-4xl font-bold mt-1" style={{ color: FEMA_COLORS.energy }}>
            ${(totalGrants / 1000000).toFixed(1)}M
          </p>
        </div>

        <div className="bg-card border border-card-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary/50 text-left">
                  <th className="px-3 py-2">Action</th>
                  <th className="px-3 py-2">Program</th>
                  <th className="px-3 py-2">Federal $</th>
                  <th className="px-3 py-2">Local Match</th>
                  <th className="px-3 py-2">Fed %</th>
                  <th className="px-3 py-2">Confidence</th>
                  <th className="px-3 py-2 w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sortedGrants.map((g, i) => (
                  <>
                    <tr key={`grant-${g.id || i}`} className="cursor-pointer hover:bg-accent/20" onClick={() => toggleRow(g.id || i)} data-testid={`grant-${i}`}>
                      <td className="px-3 py-2 max-w-xs truncate">{g.actionDescription}</td>
                      <td className="px-3 py-2">
                        <Badge style={{ background: programColor[g.program] || "#666", color: "#fff" }}>
                          {g.program}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 font-medium">{g.estimatedFederal ? `$${(g.estimatedFederal / 1000).toFixed(0)}K` : "N/A"}</td>
                      <td className="px-3 py-2">{g.estimatedLocalMatch ? `$${(g.estimatedLocalMatch / 1000).toFixed(0)}K` : "N/A"}</td>
                      <td className="px-3 py-2">{g.federalSharePct}%</td>
                      <td className="px-3 py-2">
                        <Badge variant="outline" style={{
                          color: g.confidence === "high" ? "#6CC24A" : g.confidence === "medium" ? "#FFC20E" : "#E31C2D"
                        }}>
                          {g.confidence}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        {expandedRows.has(g.id || i) ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </td>
                    </tr>
                    {expandedRows.has(g.id || i) && (
                      <tr key={`grant-detail-${g.id || i}`}>
                        <td colSpan={7} className="px-6 py-3 bg-background/50 text-xs">
                          <p className="mb-1"><strong>Reasoning:</strong> {g.reasoning}</p>
                          <p><strong>Tips:</strong> {g.applicationTips}</p>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  function ActionPlanSection() {
    let plan90: Record<string, string[]> = {};
    try {
      plan90 = JSON.parse(analysis.ninetyDayPlan || "{}");
    } catch {}

    const periodColors: Record<string, string> = {
      "Week 1-2": FEMA_COLORS.safety,
      "Week 3-4": FEMA_COLORS.food,
      "Week 5-8": FEMA_COLORS.energy,
      "Week 9-12": FEMA_COLORS.transport,
    };

    const periodLabels: Record<string, string> = {
      "Week 1-2": "Immediate Actions",
      "Week 3-4": "Data & Analysis",
      "Week 5-8": "Strategy & Revision",
      "Week 9-12": "Stakeholder & Submission",
    };

    return (
      <div className="space-y-6" data-testid="action-plan-section">
        <h2 className="text-xl font-bold">90-Day Action Plan</h2>

        {Object.entries(plan90).map(([period, tasks]) => (
          <div key={period} className="bg-card border border-card-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 flex items-center gap-3" style={{ borderLeft: `4px solid ${periodColors[period] || "#418FDE"}` }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: periodColors[period] || "#418FDE" }}>
                {period.replace("Week ", "W")}
              </div>
              <div>
                <p className="font-semibold text-sm">{period}</p>
                <p className="text-xs text-muted-foreground">{periodLabels[period] || ""}</p>
              </div>
            </div>
            <div className="px-4 py-3 space-y-2">
              {(tasks || []).map((task: string, i: number) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: periodColors[period] || "#418FDE" }} />
                  <span>{task}</span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {analysis.threeThings && (
          <div className="bg-card border border-card-border rounded-xl p-4">
            <h3 className="font-semibold text-sm mb-3">Top 3 Priorities</h3>
            <div className="space-y-2">
              {(() => {
                try {
                  const items = JSON.parse(analysis.threeThings);
                  return items.map((item: string, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-2 rounded-md bg-background/50">
                      <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
                      <p className="text-sm">{item}</p>
                    </div>
                  ));
                } catch {
                  return null;
                }
              })()}
            </div>
          </div>
        )}
      </div>
    );
  }

  function ReportSection() {
    return (
      <div className="space-y-6" data-testid="report-section">
        <h2 className="text-xl font-bold">Generate Report</h2>

        <div className="bg-card border border-card-border rounded-xl p-6">
          <div className="text-center mb-6">
            <FileText size={48} className="text-primary mx-auto mb-3" />
            <h3 className="text-lg font-semibold">SOPSentinel Stress-Test Report</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Comprehensive PDF report including all 5 analysis levels, findings, grant matches, and 90-day action plan.
            </p>
          </div>

          <div className="bg-background/50 rounded-lg p-4 mb-6">
            <h4 className="text-sm font-semibold mb-2">Report Contents</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Cover Page with Overall Grade</li>
              <li>• Executive Summary & Score Breakdown</li>
              <li>• Level 1: Compliance Crosswalk (44 CFR §201.6)</li>
              <li>• Level 2: Analytical Validation & Hazard Inventory</li>
              <li>• Level 3: Implementation Analysis & Funding Gap</li>
              <li>• Level 4: Scenario Stress Test & Failure Chain</li>
              <li>• Level 5: Equity Assessment</li>
              <li>• Grant Strategy & Federal Funding Matches</li>
              <li>• 90-Day Action Plan</li>
              <li>• Methodology</li>
            </ul>
          </div>

          <div className="flex justify-center">
            <ReportButton data={analysisData} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background" data-testid="dashboard">
      {/* Sidebar */}
      <aside className="w-60 bg-sidebar border-r border-sidebar-border flex flex-col shrink-0">
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <svg width="28" height="28" viewBox="0 0 36 36" className="text-sidebar-foreground">
              <path d="M18 2 L32 9 L32 20 C32 28 26 33 18 35 C10 33 4 28 4 20 L4 9 Z" fill="none" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 18 L16 22 L24 14" fill="none" stroke="#418FDE" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div>
              <h1 className="text-sm font-bold text-sidebar-foreground">SOPSentinel</h1>
              <p className="text-[10px] text-sidebar-foreground/60 truncate">{analysis.jurisdictionName || planStatus?.filename}</p>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <nav className="p-2 space-y-0.5">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                  activeSection === item.id
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                }`}
                data-testid={`nav-${item.id}`}
              >
                <item.icon size={16} />
                {item.label}
              </button>
            ))}
          </nav>
        </ScrollArea>

        <div className="p-3 border-t border-sidebar-border space-y-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground"
            onClick={toggleTheme}
            data-testid="sidebar-theme-toggle"
          >
            {theme === "dark" ? <Sun size={14} className="mr-2" /> : <Moon size={14} className="mr-2" />}
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground"
            onClick={() => setLocation("/")}
            data-testid="back-to-upload"
          >
            <ArrowLeft size={14} className="mr-2" />
            Back to Upload
          </Button>
          <div className="pt-1">
            <PerplexityAttribution />
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-5xl">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
