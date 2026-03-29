"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Camera, Upload, Clock, AlertTriangle, CheckCircle2, X } from "lucide-react";
import {
  getUserId,
  fetchDashboard,
  purchaseCheck,
  type PurchaseCheckResponse,
} from "@/lib/api";

export default function PurchaseAnalyzer() {
  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<PurchaseCheckResponse | null>(null);

  const [hourlyRate, setHourlyRate] = useState(0);
  const [budgetRemaining, setBudgetRemaining] = useState(0);
  const [monthlySavings, setMonthlySavings] = useState(0);

  useEffect(() => {
    const uid = getUserId();
    if (!uid) return;
    fetchDashboard(uid).then((d) => {
      const profile = d.financial_profile as {
        monthly_income?: number;
        monthly_budget?: number;
      } | null;
      const income = profile?.monthly_income || 0;
      const rate = income > 0 ? income / 160 : 0;
      setHourlyRate(Math.round(rate * 100) / 100);
      setBudgetRemaining(d.monthly_summary.remaining);
      setMonthlySavings(d.monthly_summary.income - d.monthly_summary.spent);
    }).catch(() => {});
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    setImageFile(file);
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
    if (!imageFile) return;
    const uid = getUserId();
    if (!uid) return;

    setAnalyzing(true);
    try {
      const res = await purchaseCheck(uid, imageFile);
      setResult(res);
    } catch {
      alert("Could not analyze the image. Make sure the backend is running.");
    } finally {
      setAnalyzing(false);
    }
  };

  const reset = () => {
    setImage(null);
    setImageFile(null);
    setResult(null);
  };

  const hoursOfWork = result && hourlyRate > 0 ? Math.round((result.price / hourlyRate) * 10) / 10 : null;
  const canAfford = result?.verdict === "yes";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Purchase Analyzer</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload a photo of something you want to buy. We&apos;ll tell you if you can afford it
          and how many hours of your life it costs.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl bg-card border border-border p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Your Hourly Rate (est.)</p>
          <p className="text-xl font-bold text-foreground tabular-nums">${hourlyRate.toFixed(2)}</p>
        </div>
        <div className="rounded-2xl bg-card border border-border p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Remaining Monthly Budget</p>
          <p className="text-xl font-bold text-foreground tabular-nums">${budgetRemaining.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl bg-card border border-border p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Monthly Savings</p>
          <p className="text-xl font-bold text-green-600 tabular-nums">${monthlySavings.toLocaleString()}</p>
        </div>
      </div>

      {!result ? (
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
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Analysis Results</h2>
            <button onClick={reset} className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              <X size={14} /> New analysis
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-2xl bg-card border border-border p-4">
              {image && <img src={image} alt="Analyzed" className="rounded-xl w-full object-contain" />}
            </div>
            <div className="col-span-2 rounded-2xl bg-card border border-border p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                  canAfford ? "bg-green-100" : "bg-red-100"
                }`}>
                  {canAfford ? (
                    <CheckCircle2 size={24} className="text-green-600" />
                  ) : (
                    <AlertTriangle size={24} className="text-red-500" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">{result.product}</h3>
                  <p className="text-2xl font-bold text-foreground tabular-nums mt-1">
                    {result.currency === "USD" ? "$" : result.currency}{result.price.toFixed(2)}
                  </p>
                  <span className={`inline-block mt-2 text-xs font-medium px-3 py-1 rounded-full ${
                    canAfford
                      ? "bg-green-100 text-green-700"
                      : result.verdict === "careful"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-600"
                  }`}>
                    {canAfford ? "You can afford this" : result.verdict === "careful" ? "Think twice" : "Not recommended right now"}
                  </span>
                </div>
              </div>

              {hoursOfWork !== null && (
                <div className="flex items-center gap-4 p-4 rounded-xl bg-warm mb-4">
                  <Clock size={20} className="text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">This purchase costs you</p>
                    <p className="text-2xl font-bold text-foreground">
                      {hoursOfWork} hours <span className="text-sm font-normal text-muted-foreground">of work</span>
                    </p>
                  </div>
                </div>
              )}

              <p className="text-sm text-muted-foreground leading-relaxed">{result.reasoning}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
