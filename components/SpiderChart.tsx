import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface SpiderChartProps {
  compliance: number;
  analytical: number;
  implementation: number;
  scenario: number;
  equity: number;
}

export default function SpiderChart({
  compliance,
  analytical,
  implementation,
  scenario,
  equity,
}: SpiderChartProps) {
  const data = [
    { subject: "Compliance", score: compliance, fullMark: 100 },
    { subject: "Analytical", score: analytical, fullMark: 100 },
    { subject: "Implementation", score: implementation, fullMark: 100 },
    { subject: "Scenario", score: scenario, fullMark: 100 },
    { subject: "Equity", score: equity, fullMark: 100 },
  ];

  return (
    <div data-testid="spider-chart" className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid
            stroke="hsl(var(--border))"
            strokeDasharray="3 3"
          />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
          />
          <Radar
            name="Score"
            dataKey="score"
            stroke="#418FDE"
            fill="#418FDE"
            fillOpacity={0.25}
            strokeWidth={2}
          />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "6px",
              color: "hsl(var(--foreground))",
              fontSize: "12px",
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
