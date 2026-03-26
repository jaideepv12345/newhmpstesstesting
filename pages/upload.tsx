import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Upload, FileText, Clock, CheckCircle, AlertTriangle, Trash2, Shield, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useTheme } from "@/components/ThemeProvider";
import { PerplexityAttribution } from "@/components/PerplexityAttribution";
import type { Plan } from "@shared/schema";

export default function UploadPage() {
  const [, setLocation] = useLocation();
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();

  const { data: plans = [] } = useQuery<Plan[]>({
    queryKey: ["/api/plans"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/plans/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plans"] });
      toast({ title: "Plan deleted" });
    },
  });

  const handleUpload = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      toast({ title: "Error", description: "Please upload a PDF file", variant: "destructive" });
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(
        `${"__PORT_5000__".startsWith("__") ? "" : "__PORT_5000__"}/api/plans/upload`,
        { method: "POST", body: formData }
      );
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
      }
      const data = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/plans"] });
      setLocation(`/dashboard/${data.id}`);
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }, [setLocation, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  }, [handleUpload]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  }, [handleUpload]);

  const statusBadge = (status: string) => {
    switch (status) {
      case "complete":
        return <Badge className="bg-green-600/20 text-green-400 border-green-600/30 gap-1"><CheckCircle size={12} /> Complete</Badge>;
      case "error":
        return <Badge variant="destructive" className="gap-1"><AlertTriangle size={12} /> Error</Badge>;
      case "uploading":
      case "parsing":
      case "analyzing":
        return <Badge className="bg-blue-600/20 text-blue-400 border-blue-600/30 gap-1 animate-pulse"><Clock size={12} /> {status}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg width="36" height="36" viewBox="0 0 36 36" aria-label="SOPSentinel" data-testid="logo">
              <path d="M18 2 L32 9 L32 20 C32 28 26 33 18 35 C10 33 4 28 4 20 L4 9 Z" fill="none" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 18 L16 22 L24 14" fill="none" stroke="#418FDE" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="18" y1="8" x2="18" y2="11" stroke="#E31C2D" strokeWidth="1.5"/>
              <line x1="25" y1="12" x2="23" y2="14" stroke="#F47920" strokeWidth="1.5"/>
              <line x1="11" y1="12" x2="13" y2="14" stroke="#6CC24A" strokeWidth="1.5"/>
            </svg>
            <div>
              <h1 className="text-lg font-bold tracking-tight">SOPSentinel</h1>
              <p className="text-xs text-muted-foreground">HMP Stress-Test Engine</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={toggleTheme} data-testid="theme-toggle">
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-xs font-medium mb-4">
            <Shield size={14} />
            FEMA 44 CFR §201.6 Compliance Analysis
          </div>
          <h2 className="text-3xl font-bold mb-3">Stress-Test Your Hazard Mitigation Plan</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Upload a county or multi-jurisdictional HMP PDF. SOPSentinel runs a comprehensive 5-level analysis
            covering compliance, analytical validation, implementation feasibility, scenario stress testing,
            and equity assessment.
          </p>
        </div>

        {/* Upload Zone */}
        <div
          className={`
            border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all
            ${isDragOver ? "border-primary bg-primary/5 scale-[1.01]" : "border-border hover:border-primary/50"}
            ${uploading ? "opacity-50 pointer-events-none" : ""}
          `}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById("file-input")?.click()}
          data-testid="upload-zone"
        >
          <input
            type="file"
            id="file-input"
            accept=".pdf"
            className="hidden"
            onChange={handleFileInput}
            data-testid="file-input"
          />
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Upload size={28} className="text-primary" />
            </div>
            <div>
              <p className="font-semibold text-lg">
                {uploading ? "Uploading..." : "Drop your HMP PDF here"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                or click to browse • PDF up to 100MB • Up to 500 pages
              </p>
            </div>
            {!uploading && (
              <Button variant="outline" className="mt-2" data-testid="browse-btn">
                <FileText size={16} className="mr-2" />
                Select PDF File
              </Button>
            )}
          </div>
        </div>

        {/* FEMA Lifeline Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-8 mb-12">
          {[
            { color: "#E31C2D", label: "Safety/Security" },
            { color: "#F47920", label: "Food/Water" },
            { color: "#FFC20E", label: "Health/Medical" },
            { color: "#418FDE", label: "Energy" },
            { color: "#003D76", label: "Communications" },
            { color: "#6CC24A", label: "Transportation" },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ background: l.color }} />
              <span className="text-xs text-muted-foreground">{l.label}</span>
            </div>
          ))}
        </div>

        {/* Previous Plans */}
        {plans.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
              Previous Analyses
            </h3>
            <div className="space-y-2">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className="bg-card border border-card-border rounded-lg p-4 flex items-center justify-between hover:bg-accent/30 transition-colors cursor-pointer group"
                  onClick={() => setLocation(`/dashboard/${plan.id}`)}
                  data-testid={`plan-card-${plan.id}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText size={20} className="text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{plan.filename}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(plan.uploadedAt).toLocaleDateString()} • {plan.pageCount ? `${plan.pageCount} pages` : ""} • {((plan.fileSize || 0) / 1024 / 1024).toFixed(1)} MB
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {statusBadge(plan.status)}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(plan.id); }}
                      data-testid={`delete-plan-${plan.id}`}
                    >
                      <Trash2 size={16} className="text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-border mt-auto">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>SOPSentinel v1.0 • HMP Stress-Test Engine</span>
          <PerplexityAttribution />
        </div>
      </footer>
    </div>
  );
}
