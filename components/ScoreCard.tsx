import { type LucideIcon } from "lucide-react";

interface ScoreCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: string;
}

export default function ScoreCard({ label, value, subtitle, icon: Icon, color = "#418FDE" }: ScoreCardProps) {
  return (
    <div
      className="bg-card border border-card-border rounded-lg p-4 flex items-start gap-3"
      data-testid={`scorecard-${label.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <div
        className="rounded-md p-2 shrink-0"
        style={{ background: `${color}20`, color }}
      >
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
        <p className="text-xl font-bold mt-0.5" style={{ color }}>
          {value}
        </p>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
