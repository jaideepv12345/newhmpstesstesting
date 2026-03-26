import type { ScenarioLink } from "@shared/schema";

interface FailureChainProps {
  links: ScenarioLink[];
  hazardType: string;
  residualRisk?: number;
}

const statusColors: Record<string, string> = {
  protected: "#6CC24A",
  partially_protected: "#FFC20E",
  not_protected: "#E31C2D",
  blind_spot: "#1a1a2e",
};

const statusLabels: Record<string, string> = {
  protected: "Protected",
  partially_protected: "Partially Protected",
  not_protected: "Not Protected",
  blind_spot: "Blind Spot",
};

export default function FailureChain({ links, hazardType, residualRisk }: FailureChainProps) {
  return (
    <div data-testid="failure-chain" className="flex flex-col items-center gap-0">
      <div className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wide">
        {hazardType} Failure Chain Analysis
      </div>
      {links.map((link, i) => (
        <div key={link.id || i} className="flex flex-col items-center w-full">
          {/* Connector line */}
          {i > 0 && (
            <div className="w-0.5 h-6" style={{ background: "hsl(var(--border))" }} />
          )}
          {/* Node */}
          <div
            className="flex items-center gap-4 w-full max-w-lg rounded-lg border p-3"
            style={{
              borderColor: statusColors[link.protectionStatus] || "#666",
              borderLeftWidth: 4,
            }}
            data-testid={`chain-link-${i}`}
          >
            <div
              className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-white font-bold text-sm"
              style={{ background: statusColors[link.protectionStatus] || "#666" }}
            >
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-sm">{link.linkName}</span>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
                  style={{
                    background: `${statusColors[link.protectionStatus]}20`,
                    color: statusColors[link.protectionStatus],
                  }}
                >
                  {statusLabels[link.protectionStatus] || link.protectionStatus}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {link.evidence || "No evidence"}
              </p>
              {link.matchingActions && link.matchingActions !== "None" && (
                <p className="text-xs mt-1 opacity-70">
                  Actions: {link.matchingActions}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
      {residualRisk !== undefined && (
        <div className="mt-6 text-center">
          <div className="text-2xl font-bold" style={{ color: residualRisk > 50 ? "#E31C2D" : residualRisk > 25 ? "#F47920" : "#6CC24A" }}>
            {residualRisk}%
          </div>
          <div className="text-xs text-muted-foreground">Residual Risk</div>
        </div>
      )}
    </div>
  );
}
