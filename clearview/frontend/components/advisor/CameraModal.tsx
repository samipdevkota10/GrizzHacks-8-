"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { X, Camera, Upload, Loader2 } from "lucide-react";

type InputMode = "upload" | "camera";

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onResult: (result: unknown) => void;
}

async function postPurchaseCheck(file: File, userId: string): Promise<unknown> {
  const formData = new FormData();
  formData.append("image", file);
  formData.append("user_id", userId);

  const res = await fetch("/api/advisor/purchase-check", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed (${res.status})`);
  }

  return res.json();
}

export function CameraModal({
  isOpen,
  onClose,
  userId,
  onResult,
}: CameraModalProps) {
  const [mode, setMode] = useState<InputMode>("upload");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewObjectUrl = useRef<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const revokePreview = useCallback(() => {
    if (previewObjectUrl.current) {
      URL.revokeObjectURL(previewObjectUrl.current);
      previewObjectUrl.current = null;
    }
    setPreviewUrl(null);
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStream(null);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setLoading(false);
      setError(null);
      revokePreview();
      stopCamera();
      setMode("upload");
      return;
    }
    return () => {
      revokePreview();
      stopCamera();
    };
  }, [isOpen, revokePreview, stopCamera]);

  useEffect(() => {
    if (!stream || !videoRef.current) return;
    videoRef.current.srcObject = stream;
    void videoRef.current.play().catch(() => {});
  }, [stream]);

  const runAnalysis = useCallback(
    async (file: File) => {
      setError(null);
      setLoading(true);
      try {
        const data = await postPurchaseCheck(file, userId);
        onResult(data);
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    },
    [userId, onResult, onClose],
  );

  const handleFile = useCallback(
    (file: File | null) => {
      if (!file || !file.type.startsWith("image/")) return;
      revokePreview();
      const url = URL.createObjectURL(file);
      previewObjectUrl.current = url;
      setPreviewUrl(url);
      void runAnalysis(file);
    },
    [revokePreview, runAnalysis],
  );

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    handleFile(f);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (loading) return;
    const f = e.dataTransfer.files?.[0] ?? null;
    handleFile(f);
  };

  const startCamera = async () => {
    setError(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = s;
      setStream(s);
    } catch {
      setError("Could not access camera. Try upload instead.");
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    stopCamera();
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError("Could not capture image");
          return;
        }
        const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
        handleFile(file);
      },
      "image/jpeg",
      0.92,
    );
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="camera-modal-title"
    >
      <div className="mx-4 w-full max-w-lg rounded-2xl border border-border-subtle bg-bg-secondary p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 id="camera-modal-title" className="font-display text-xl font-semibold text-text-primary">
            Can I Afford This?
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 flex gap-2 rounded-xl bg-bg-tertiary p-1">
          <button
            type="button"
            onClick={() => {
              setMode("upload");
              stopCamera();
              setError(null);
            }}
            disabled={loading}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
              mode === "upload"
                ? "bg-bg-secondary text-text-primary shadow-sm"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <Upload className="h-4 w-4" />
            Upload
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("camera");
              revokePreview();
              setError(null);
              void startCamera();
            }}
            disabled={loading}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
              mode === "camera"
                ? "bg-bg-secondary text-text-primary shadow-sm"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <Camera className="h-4 w-4" />
            Camera
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFileChange}
        />

        {mode === "upload" && !previewUrl && !loading ? (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-border-default p-12 text-center transition-colors hover:border-border-emphasis hover:bg-bg-tertiary/30"
          >
            <Camera className="mb-3 h-12 w-12 text-text-secondary" aria-hidden />
            <span className="text-sm text-text-secondary">
              Drop an image or click to upload
            </span>
          </button>
        ) : null}

        {mode === "camera" && !previewUrl && !loading ? (
          <div className="space-y-3">
            {stream ? (
              <>
                <div className="relative overflow-hidden rounded-xl border border-border-subtle bg-black">
                  <video ref={videoRef} className="aspect-video w-full object-cover" playsInline muted />
                </div>
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="w-full rounded-xl bg-accent-blue py-3 font-medium text-white transition-colors hover:bg-accent-blue-dim"
                >
                  Capture
                </button>
              </>
            ) : (
              <p className="text-center text-sm text-text-secondary">Starting camera…</p>
            )}
          </div>
        ) : null}

        {previewUrl ? (
          <div className="relative overflow-hidden rounded-xl border border-border-subtle">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="Selected purchase" className="max-h-64 w-full object-contain" />
            {loading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 px-4">
                <Loader2 className="h-10 w-10 animate-spin text-vera-primary" aria-hidden />
                <p className="text-center text-sm text-text-primary">Analyzing…</p>
                <p className="text-center text-sm font-medium text-vera-primary">
                  Vera is analyzing your purchase…
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        {error ? <p className="mt-3 text-sm text-negative">{error}</p> : null}
      </div>
    </div>
  );
}
