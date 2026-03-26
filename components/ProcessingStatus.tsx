import { CheckCircle, Loader2, Circle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ProcessingStatusProps {
  currentStep: number;
  message: string;
  pageCount?: number | null;
}

const steps = [
  { step: 1, label: "Uploading PDF..." },
  { step: 2, label: "Parsing document..." },
  { step: 3, label: "Running compliance checks..." },
  { step: 4, label: "Validating analytical integrity..." },
  { step: 5, label: "Assessing implementation feasibility..." },
  { step: 6, label: "Simulating hazard scenarios..." },
  { step: 7, label: "Evaluating equity considerations..." },
  { step: 8, label: "Matching grant opportunities..." },
  { step: 9, label: "Analysis complete!" },
];

export default function ProcessingStatus({ currentStep, message, pageCount }: ProcessingStatusProps) {
  const progress = Math.round((currentStep / 9) * 100);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8" data-testid="processing-status">
      {/* Shield animation */}
      <div className="relative mb-8">
        <svg width="80" height="80" viewBox="0 0 80 80" className="animate-pulse">
          <path
            d="M40 8 L68 22 L68 42 C68 56 56 68 40 74 C24 68 12 56 12 42 L12 22 Z"
            fill="none"
            stroke="#418FDE"
            strokeWidth="3"
          />
          <path
            d="M30 40 L37 47 L52 32"
            fill="none"
            stroke="#6CC24A"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={currentStep >= 9 ? 1 : 0.2}
          />
        </svg>
        {currentStep < 9 && (
          <Loader2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary animate-spin" size={24} />
        )}
      </div>

      <h2 className="text-xl font-bold mb-2">Analyzing Hazard Mitigation Plan</h2>
      {pageCount && (
        <p className="text-sm text-muted-foreground mb-4">Processing {pageCount} pages</p>
      )}

      <div className="w-full max-w-md mb-6">
        <Progress value={progress} className="h-2" />
        <p className="text-xs text-muted-foreground text-center mt-1">{progress}% complete</p>
      </div>

      <div className="w-full max-w-md space-y-2">
        {steps.map((s) => (
          <div
            key={s.step}
            className="flex items-center gap-3 text-sm"
            data-testid={`step-${s.step}`}
          >
            {s.step < currentStep ? (
              <CheckCircle size={18} className="text-green-500 shrink-0" />
            ) : s.step === currentStep ? (
              <Loader2 size={18} className="text-primary animate-spin shrink-0" />
            ) : (
              <Circle size={18} className="text-muted-foreground/30 shrink-0" />
            )}
            <span className={s.step <= currentStep ? "text-foreground" : "text-muted-foreground/50"}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {message && (
        <p className="text-xs text-muted-foreground mt-4 italic">{message}</p>
      )}
    </div>
  );
}
