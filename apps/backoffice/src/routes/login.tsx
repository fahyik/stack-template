import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";

import { isAdminSession, signOut } from "../lib/auth";
import { supabase } from "../lib/supabase";

import { Spinner } from "@repo/ui/components/spinner";
import { Input } from "@repo/ui/components/ui/input";

type LoginSearch = {
  error?: "unauthorized";
};

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    error: search.error === "unauthorized" ? "unauthorized" : undefined,
  }),
  beforeLoad: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session && isAdminSession(session)) {
      throw redirect({ to: "/" });
    }
  },
  component: LoginPage,
});

type Step = "email" | "verify";

function LoginPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (search.error) {
      await navigate({ to: "/login", search: {} });
    }
    setPending(true);
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    setPending(false);
    if (otpError) {
      setError(otpError.message);
      return;
    }
    setStep("verify");
  }

  async function handleCodeSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "email",
    });
    setPending(false);
    if (verifyError) {
      setError(verifyError.message);
      return;
    }
    if (!data.session) {
      return;
    }

    if (!isAdminSession(data.session)) {
      await signOut();
      handleReset();
      await navigate({ to: "/login", search: { error: "unauthorized" } });
      return;
    }

    await navigate({ to: "/" });
  }

  function handleReset() {
    setStep("email");
    setCode("");
    setError(null);
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 shadow-brand-md">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Backoffice
        </p>
        <h1 className="mt-2 font-display text-3xl tracking-tight">
          {step === "email" ? "Sign in" : "Enter code"}
        </h1>
        <p className="mt-2 text-sm text-secondary-foreground">
          {step === "email"
            ? "We'll email you a 6-digit code."
            : `Code sent to ${email}.`}
        </p>

        {search.error === "unauthorized" ? (
          <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
            This account is not authorized.
          </div>
        ) : null}

        {step === "email" ? (
          <form
            onSubmit={handleEmailSubmit}
            className="mt-6 flex flex-col gap-4"
          >
            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                Email
              </span>
              <Input
                type="email"
                required
                autoFocus
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@example.com"
              />
            </label>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <PrimaryButton pending={pending}>Send code</PrimaryButton>
          </form>
        ) : (
          <form
            onSubmit={handleCodeSubmit}
            className="mt-6 flex flex-col gap-4"
          >
            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                6-digit code
              </span>
              <Input
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                required
                autoFocus
                autoComplete="one-time-code"
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="123456"
                className="font-mono text-lg tracking-widest"
              />
            </label>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <PrimaryButton pending={pending}>Verify</PrimaryButton>
            <button
              type="button"
              onClick={handleReset}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Use a different email
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

function PrimaryButton({
  children,
  pending,
}: {
  children: React.ReactNode;
  pending: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 font-medium text-primary-foreground shadow-brand-sm transition-[transform,box-shadow] duration-200 ease-spring hover:-translate-y-0.5 hover:shadow-brand-accent disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-brand-sm"
    >
      {pending ? <Spinner /> : children}
    </button>
  );
}
