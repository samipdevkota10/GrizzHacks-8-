"use client";

import { useState, Suspense } from "react";
import { motion, AnimatePresence } from "motion/react";
import dynamic from "next/dynamic";
import {
  Eye,
  EyeOff,
  ArrowRight,
  Mail,
  Lock,
  User,
  Github,
  Chrome,
} from "lucide-react";

const FloatingOrbs = dynamic(
  () => import("@/components/three/FloatingOrbs").then((m) => m.FloatingOrbs),
  { ssr: false }
);

type AuthMode = "login" | "signup";

function GemIcon() {
  return (
    <svg
      width={36}
      height={36}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M12 2L20 8.5L12 22L4 8.5L12 2Z"
        fill="#4F8EF7"
        fillOpacity={0.95}
      />
      <path d="M12 2L8 8.5H16L12 2Z" fill="#4F8EF7" fillOpacity={0.5} />
    </svg>
  );
}

const formVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 40 : -40,
    opacity: 0,
    filter: "blur(6px)",
  }),
  center: {
    x: 0,
    opacity: 1,
    filter: "blur(0px)",
    transition: { duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] as const },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -40 : 40,
    opacity: 0,
    filter: "blur(6px)",
    transition: { duration: 0.3 },
  }),
};

const inputClasses =
  "w-full rounded-xl bg-white/[0.04] border border-white/[0.08] px-4 py-3.5 pl-11 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-blue/40 focus:border-accent-blue/30 transition-all duration-300";

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [direction, setDirection] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const switchMode = (newMode: AuthMode) => {
    setDirection(newMode === "signup" ? 1 : -1);
    setMode(newMode);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    if (typeof window !== "undefined") {
      localStorage.setItem("clearview_user_id", "DEMO");
    }
    window.location.href = "/dashboard";
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg-primary">
      <Suspense fallback={null}>
        <FloatingOrbs />
      </Suspense>

      <div className="absolute inset-0 bg-gradient-to-br from-accent-blue/[0.06] via-transparent to-vera-primary/[0.04]" />
      <div className="absolute inset-0 auth-grid-bg opacity-30" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="relative z-10 w-full max-w-[440px] px-4"
      >
        <motion.div
          className="auth-glass rounded-3xl p-8"
          whileHover={{ borderColor: "rgba(79, 142, 247, 0.15)" }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8 flex flex-col items-center text-center"
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-blue/10 ring-1 ring-accent-blue/20">
              <GemIcon />
            </div>
            <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-text-primary">
              {mode === "login" ? "Welcome back" : "Create account"}
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              {mode === "login"
                ? "Sign in to your financial command center"
                : "Start your journey to financial clarity"}
            </p>
          </motion.div>

          <div className="mb-6 grid grid-cols-2 gap-3">
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] py-3 text-sm font-medium text-text-primary transition-colors hover:bg-white/[0.06]"
            >
              <Chrome className="size-4" />
              Google
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] py-3 text-sm font-medium text-text-primary transition-colors hover:bg-white/[0.06]"
            >
              <Github className="size-4" />
              GitHub
            </motion.button>
          </div>

          <div className="mb-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/[0.06]" />
            <span className="text-xs font-medium uppercase tracking-wider text-text-muted">
              or continue with
            </span>
            <div className="h-px flex-1 bg-white/[0.06]" />
          </div>

          <AnimatePresence mode="wait" custom={direction}>
            <motion.form
              key={mode}
              variants={formVariants}
              initial="enter"
              animate="center"
              exit="exit"
              custom={direction}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {mode === "signup" && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="relative"
                >
                  <User className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text"
                    placeholder="Full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputClasses}
                    required
                  />
                </motion.div>
              )}

              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClasses}
                  required
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClasses}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>

              {mode === "login" && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="text-xs font-medium text-accent-blue hover:text-accent-blue/80 transition-colors cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.01, y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="group relative flex w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-xl bg-accent-blue py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-accent-blue/90 hover:shadow-[0_0_30px_rgba(79,142,247,0.3)] disabled:opacity-60"
              >
                {loading ? (
                  <motion.div
                    className="size-5 rounded-full border-2 border-white/30 border-t-white"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                  />
                ) : (
                  <>
                    {mode === "login" ? "Sign in" : "Create account"}
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              </motion.button>
            </motion.form>
          </AnimatePresence>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 text-center text-sm text-text-secondary"
          >
            {mode === "login" ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("signup")}
                  className="font-semibold text-accent-blue hover:text-accent-blue/80 transition-colors cursor-pointer"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="font-semibold text-accent-blue hover:text-accent-blue/80 transition-colors cursor-pointer"
                >
                  Sign in
                </button>
              </>
            )}
          </motion.p>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-6 text-center text-xs text-text-muted"
        >
          By continuing, you agree to our Terms of Service and Privacy Policy
        </motion.p>
      </motion.div>
    </div>
  );
}
