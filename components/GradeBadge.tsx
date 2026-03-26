interface GradeBadgeProps {
  grade: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

function getGradeColor(grade: string): string {
  if (grade.startsWith("A")) return "#6CC24A";
  if (grade.startsWith("B")) return "#418FDE";
  if (grade.startsWith("C")) return "#FFC20E";
  if (grade === "D") return "#F47920";
  return "#E31C2D";
}

export default function GradeBadge({ grade, size = "lg", showLabel = true }: GradeBadgeProps) {
  const color = getGradeColor(grade);
  const sizeMap = {
    sm: { circle: 48, font: "text-lg", label: "text-xs" },
    md: { circle: 72, font: "text-2xl", label: "text-sm" },
    lg: { circle: 120, font: "text-5xl", label: "text-base" },
  };
  const s = sizeMap[size];

  return (
    <div className="flex flex-col items-center gap-2" data-testid="grade-badge">
      <div
        className="rounded-full flex items-center justify-center font-bold border-4"
        style={{
          width: s.circle,
          height: s.circle,
          borderColor: color,
          color: color,
          background: `${color}15`,
        }}
      >
        <span className={s.font}>{grade}</span>
      </div>
      {showLabel && (
        <span className={`${s.label} text-muted-foreground font-medium`}>
          Overall Grade
        </span>
      )}
    </div>
  );
}
