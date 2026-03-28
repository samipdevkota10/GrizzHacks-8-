"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Camera, Upload, Clock, DollarSign, AlertTriangle, CheckCircle2, X } from "lucide-react";
import { USER, MONTHLY } from "@/lib/mock-data";

type AnalysisResult = {
  product: string;
  estimatedPrice: number;
  canAfford: boolean;
  hoursOfWork: number;
  monthlyBudgetImpact: number;
  recommendation: string;
  breakdown: { label: string; value: string }[];
};

const MOCK_ANALYSES: Record<string, AnalysisResult> = {
  default: {
    product: "Sony WH-1000XM5 Headphones",
    estimatedPrice: 349.99,
    canAfford: true,
    hoursOfWork: 11.4,
    monthlyBudgetImpact: 7.8,
    recommendation:
      "You can afford this purchase. It would cost approximately 11.4 hours of your after-tax work time. This falls within your discretionary spending budget, but consider waiting for a sale if it's not urgent.",
    breakdown: [
      { label: "Your hourly rate (after tax)", value: `$${USER.netHourlyRate.toFixed(2)}/hr` },
      { label: "Hours of work needed", value: "11.4 hours" },
      { label: "Days of work needed", value: "1.4 days" },
      { label: "% of monthly income", value: "5.1%" },
      { label: "Remaining budget after", value: `$${(MONTHLY.budgetTotal - MONTHLY.budgetUsed - 349.99).toFixed(2)}` },
      { label: "Emergency fund impact", value: "None" },
    ],
  },
};

export default function PurchaseAnalyzer() {
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    maxFiles: 1,
  });

  const analyzeImage = async () => {
    setAnalyzing(true);
    await new Promise((r) => setTimeout(r, 2500));
    setResult(MOCK_ANALYSES.default);
    setAnalyzing(false);
  };

  const reset = () => {
    setImage(null);
    setResult(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Purchase Analyzer</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload a photo of something you want to buy. We&apos;ll tell you if you can afford it
          and how many hours of your life it costs.
        </p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl bg-card border border-border p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Your Hourly Rate (After Tax)</p>
          <p className="text-xl font-bold text-foreground tabular-nums">${USER.netHourlyRate.toFixed(2)}</p>
        </div>
        <div className="rounded-2xl bg-card border border-border p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Remaining Monthly Budget</p>
          <p className="text-xl font-bold text-foreground tabular-nums">
            ${(MONTHLY.budgetTotal - MONTHLY.budgetUsed).toLocaleString()}
          </p>
        </div>
        <div className="rounded-2xl bg-card border border-border p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Monthly Savings</p>
          <p className="text-xl font-bold text-green-600 tabular-nums">${MONTHLY.savings.toLocaleString()}</p>
        </div>
      </div>

      {!result ? (
        /* Upload Area */
        <div className="rounded-2xl bg-card border border-border p-8">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
              isDragActive
                ? "border-primary bg-light-accent"
                : "border-border hover:border-primary/50 hover:bg-warm"
            }`}
          >
            <input {...getInputProps()} />
            {image ? (
              <div className="space-y-4">
                <img src={image} alt="Upload preview" className="max-h-64 mx-auto rounded-xl object-contain" />
                <p className="text-sm text-muted-foreground">Click or drag to replace</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                  {isDragActive ? <Upload size={28} className="text-primary" /> : <Camera size={28} className="text-primary" />}
                </div>
                <div>
                  <p className="text-base font-medium text-foreground">
                    {isDragActive ? "Drop your image here" : "Upload a photo of what you want to buy"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Drag & drop or click to browse. PNG, JPG, WEBP supported.
                  </p>
                </div>
              </div>
            )}
          </div>

          {image && (
            <div className="flex justify-center mt-6">
              <button
                onClick={analyzeImage}
                disabled={analyzing}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-medium text-primary-foreground hover:opacity-90 transition-all disabled:opacity-60"
              >
                {analyzing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Camera size={16} />
                    Analyze Purchase
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Results */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Analysis Results</h2>
            <button onClick={reset} className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              <X size={14} /> New analysis
            </button>
          </div>

          {/* Preview + Verdict */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-2xl bg-card border border-border p-4">
              {image && <img src={image} alt="Analyzed" className="rounded-xl w-full object-contain" />}
            </div>
            <div className="col-span-2 rounded-2xl bg-card border border-border p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                  result.canAfford ? "bg-green-100" : "bg-red-100"
                }`}>
                  {result.canAfford ? (
                    <CheckCircle2 size={24} className="text-green-600" />
                  ) : (
                    <AlertTriangle size={24} className="text-red-500" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">{result.product}</h3>
                  <p className="text-2xl font-bold text-foreground tabular-nums mt-1">
                    ${result.estimatedPrice.toFixed(2)}
                  </p>
                  <span className={`inline-block mt-2 text-xs font-medium px-3 py-1 rounded-full ${
                    result.canAfford
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-600"
                  }`}>
                    {result.canAfford ? "✓ You can afford this" : "✗ Not recommended right now"}
                  </span>
                </div>
              </div>

              {/* Hours visualization */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-warm mb-4">
                <Clock size={20} className="text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">This purchase costs you</p>
                  <p className="text-2xl font-bold text-foreground">
                    {result.hoursOfWork} hours <span className="text-sm font-normal text-muted-foreground">of work</span>
                  </p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">{result.recommendation}</p>
            </div>
          </div>

          {/* Detailed Breakdown */}
          <div className="rounded-2xl bg-card border border-border p-5">
            <h3 className="text-sm font-bold text-foreground mb-4">Financial Breakdown</h3>
            <div className="grid grid-cols-3 gap-4">
              {result.breakdown.map((item) => (
                <div key={item.label} className="p-3 rounded-xl bg-background">
                  <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                  <p className="text-sm font-bold text-foreground">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
