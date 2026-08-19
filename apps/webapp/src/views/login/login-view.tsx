import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { useNavigate, useRouter, useSearch } from "@tanstack/react-router";
import {
  type SubmitEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { supabase } from "../../lib/supabase";

import { Spinner } from "@repo/ui/components/spinner";
import { Button } from "@repo/ui/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@repo/ui/components/ui/field";
import { Input } from "@repo/ui/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@repo/ui/components/ui/input-otp";

type Step = "email" | "verify";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;
// Turnstile is opt-in: without a site key the widget is skipped entirely,
// so a fresh checkout can sign in without a Cloudflare account. Set
// VITE_TURNSTILE_SITE_KEY to switch bot protection on.
const TURNSTILE_ENABLED = Boolean(TURNSTILE_SITE_KEY);

function validateEmail(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return "Email is required.";
  }
  if (!EMAIL_RE.test(trimmed)) {
    return "Enter a valid email address.";
  }
  return null;
}

export function LoginView() {
  const router = useRouter();
  const navigate = useNavigate();
  const search = useSearch({ from: "/login" });
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState(() => search.auto_login ?? "");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  // Turnstile runs in interaction-only mode: invisible unless it decides a
  // visitor needs an interactive challenge. Track that so we can swap our own
  // spinner for the real widget instead of stacking both.
  const [challengeVisible, setChallengeVisible] = useState(false);
  const turnstileRef = useRef<TurnstileInstance>(null);
  const autoLoginRan = useRef(false);
  const autoLoginEmail = useRef<string | null>(null);
  const autoSent = useRef(false);

  const sendOtp = useCallback(
    async (args: { email: string; captchaToken: string | null }) => {
      setEmailError(null);
      setError(null);
      setPending(true);
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: args.email.trim(),
        options: {
          shouldCreateUser: true,
          ...(args.captchaToken ? { captchaToken: args.captchaToken } : {}),
        },
      });
      setPending(false);
      // Turnstile tokens are single-use: reset the widget so a retry gets a
      // fresh one.
      turnstileRef.current?.reset();
      setCaptchaToken(null);
      if (otpError) {
        setError(otpError.message);
        return;
      }
      setStep("verify");
    },
    []
  );

  useEffect(() => {
    if (autoLoginRan.current) {
      return;
    }
    autoLoginRan.current = true;
    const candidate = search.auto_login;
    if (!candidate || validateEmail(candidate)) {
      return;
    }
    // Queue the OTP send for when the captcha token resolves (see the effect
    // below). Strip the email from the URL so it doesn't linger in history.
    autoLoginEmail.current = candidate;
    void navigate({
      to: "/login",
      search: { auto_login: undefined },
      replace: true,
    });
  }, [search.auto_login, navigate]);

  useEffect(() => {
    if (autoSent.current || !autoLoginEmail.current) {
      return;
    }
    if (TURNSTILE_ENABLED && !captchaToken) {
      return;
    }
    autoSent.current = true;
    void sendOtp({ email: autoLoginEmail.current, captchaToken });
  }, [captchaToken, sendOtp]);

  async function handleEmailSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = validateEmail(email);
    if (validation) {
      setEmailError(validation);
      return;
    }
    if (TURNSTILE_ENABLED && !captchaToken) {
      setError("Please complete the verification challenge.");
      return;
    }
    await sendOtp({ email, captchaToken });
  }

  async function handleCodeSubmit(event: SubmitEvent<HTMLFormElement>) {
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

    await router.invalidate();
    await navigate({ to: "/" });
  }

  function handleReset() {
    setStep("email");
    setCode("");
    setError(null);
    setCaptchaToken(null);
    turnstileRef.current?.reset();
  }

  return (
    <main className="flex flex-col min-h-svh items-center justify-center bg-background p-6 gap-8">
      <p className="font-display italic text-5xl brand-text animate-brand-sweep bg-size-[80%_100%]">
        Welcome back.
      </p>
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 shadow-brand-md">
        <h1 className="mt-2 font-display text-3xl tracking-tight">
          {step === "email" ? "Sign In" : "Enter code"}
        </h1>
        <p className="mt-2 text-sm text-secondary-foreground">
          {step === "email" ? (
            "Please enter a valid email to continue."
          ) : (
            <span>
              A verificiation code was sent to{" "}
              <span className="underline">{`${email}`}</span>.
            </span>
          )}
        </p>

        {step === "email" ? (
          <form
            onSubmit={handleEmailSubmit}
            noValidate
            autoComplete="off"
            className="mt-6"
          >
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="login-email">Email</FieldLabel>
                <Input
                  id="login-email"
                  type="email"
                  required
                  autoFocus
                  autoComplete="off"
                  data-1p-ignore="true"
                  data-lpignore="true"
                  data-bwignore=""
                  data-form-type="other"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) {
                      setEmailError(null);
                    }
                    // A manual edit cancels any queued auto-login send.
                    autoLoginEmail.current = null;
                  }}
                  onBlur={() => {
                    if (email) {
                      setEmailError(validateEmail(email));
                    }
                  }}
                  placeholder="you@example.com"
                  aria-invalid={emailError || error ? true : undefined}
                />
                {emailError ? (
                  <FieldError>{emailError}</FieldError>
                ) : error ? (
                  <FieldError>{error}</FieldError>
                ) : null}
              </Field>
              <Button
                type="submit"
                size={"lg"}
                disabled={pending || (TURNSTILE_ENABLED && !captchaToken)}
              >
                {pending || (TURNSTILE_ENABLED && !captchaToken) ? (
                  <Spinner />
                ) : (
                  "Continue"
                )}
              </Button>
            </FieldGroup>
            {/* Mounted always so Turnstile runs on load; in interaction-only
                mode it stays invisible (and takes no layout space) unless a
                real challenge is required, so it only reserves room then. */}
            {TURNSTILE_ENABLED ? (
              <div
                className={
                  challengeVisible ? "mt-4 flex justify-center" : undefined
                }
              >
                <Turnstile
                  ref={turnstileRef}
                  siteKey={TURNSTILE_SITE_KEY}
                  onSuccess={(token) => {
                    setCaptchaToken(token);
                    setChallengeVisible(false);
                  }}
                  onError={() => {
                    setCaptchaToken(null);
                    setChallengeVisible(false);
                    setError("Verification failed. Please try again.");
                  }}
                  onExpire={() => setCaptchaToken(null)}
                  onBeforeInteractive={() => setChallengeVisible(true)}
                  onAfterInteractive={() => setChallengeVisible(false)}
                  options={{ theme: "light", appearance: "interaction-only" }}
                />
              </div>
            ) : null}
          </form>
        ) : (
          <form
            onSubmit={handleCodeSubmit}
            noValidate
            autoComplete="off"
            className="mt-6"
          >
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="login-code">6-digit OTP</FieldLabel>
                <InputOTP
                  id="login-code"
                  maxLength={6}
                  autoFocus
                  value={code}
                  onChange={setCode}
                  containerClassName="justify-center"
                  aria-invalid={error ? true : undefined}
                  autoComplete="off"
                  data-1p-ignore="true"
                  data-lpignore="true"
                  data-bwignore=""
                  data-form-type="other"
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} className="size-14 text-lg" />
                    <InputOTPSlot index={1} className="size-14 text-lg" />
                    <InputOTPSlot index={2} className="size-14 text-lg" />
                    <InputOTPSlot index={3} className="size-14 text-lg" />
                    <InputOTPSlot index={4} className="size-14 text-lg" />
                    <InputOTPSlot index={5} className="size-14 text-lg" />
                  </InputOTPGroup>
                </InputOTP>
                <FieldDescription className="text-center">
                  Please enter the 6-digit code to continue.
                </FieldDescription>
                {error ? <FieldError>{error}</FieldError> : null}
              </Field>
              <Button
                type="submit"
                size={"lg"}
                disabled={pending || code.length < 6}
              >
                {pending ? <Spinner /> : "Verify"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size={"lg"}
                onClick={handleReset}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Use a different email
              </Button>
            </FieldGroup>
          </form>
        )}
      </div>
    </main>
  );
}
