import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { useProfile } from "@/lib/intelliplay/store";
import logoImg from "@/assets/logo.png";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign In — MindWeave" },
      { name: "description", content: "Sign in or create an account to start playing MindWeave." },
    ],
  }),
  component: LoginPage,
});

const FIREBASE_ERRORS: Record<string, string> = {
  "auth/invalid-credential": "Incorrect email or password.",
  "auth/user-not-found": "No account with that email. Try creating one!",
  "auth/wrong-password": "Incorrect password. Please try again.",
  "auth/email-already-in-use": "An account with this email already exists. Try signing in.",
  "auth/weak-password": "Password must be at least 6 characters.",
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/popup-closed-by-user": "Sign-in popup was closed. Please try again.",
  "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
  "auth/operation-not-allowed": "Email/Password sign-in is not enabled in Firebase Console yet.",
  "auth/configuration-not-found": "Authentication service is not set up in Firebase Console yet.",
  "auth/network-request-failed": "Network error. Check your connection and try again.",
};

function friendlyError(code: string) {
  return FIREBASE_ERRORS[code] ?? "Something went wrong. Please try again.";
}

function LoginPage() {
  const navigate = useNavigate();
  const { user, ready } = useProfile();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const goHome = () => navigate({ to: "/" });

  useEffect(() => {
    if (ready && user) {
      goHome();
    }
  }, [ready, user]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (tab === "signin") {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      goHome();
    } catch (err: any) {
      setError(friendlyError(err.code ?? ""));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      goHome();
    } catch (err: any) {
      setError(friendlyError(err.code ?? ""));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <img
            src={logoImg}
            alt="MindWeave"
            className="h-auto w-36 object-contain"
            width={144}
            height={81}
          />
        </div>

        <div className="panel space-y-6 p-8">
          {/* Tabs */}
          <div className="flex rounded-2xl bg-muted p-1 text-sm font-bold">
            <button
              onClick={() => { setTab("signin"); setError(null); }}
              className={`flex-1 rounded-xl py-2 transition-colors ${
                tab === "signin"
                  ? "bg-card shadow-soft text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign in
            </button>
            <button
              onClick={() => { setTab("signup"); setError(null); }}
              className={`flex-1 rounded-xl py-2 transition-colors ${
                tab === "signup"
                  ? "bg-card shadow-soft text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Create account
            </button>
          </div>

          <h1 className="font-display text-2xl font-bold">
            {tab === "signin" ? "Caregiver Sign In 👋" : "Caregiver Registration 🧠"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign in to manage patient profiles, memory flashcards, and daily routine schedules.
          </p>

          {/* Error */}
          {error && (
            <div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive border border-destructive/20">
              {error}
            </div>
          )}

          {/* Email / Password form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <label className="block text-sm font-bold">
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                disabled={loading}
                className="mt-1 w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-base font-semibold outline-none focus:border-primary disabled:opacity-50"
              />
            </label>
            <label className="block text-sm font-bold">
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={tab === "signup" ? "At least 6 characters" : "Your password"}
                required
                disabled={loading}
                className="mt-1 w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-base font-semibold outline-none focus:border-primary disabled:opacity-50"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="toy-press w-full rounded-full bg-primary px-6 py-4 font-display text-xl font-bold text-primary-foreground shadow-toy disabled:opacity-60"
            >
              {loading ? "Please wait…" : tab === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground">
            <div className="flex-1 border-t border-border" />
            or
            <div className="flex-1 border-t border-border" />
          </div>

          {/* Google */}
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="toy-press flex w-full items-center justify-center gap-3 rounded-full border-2 border-border bg-card px-6 py-3 font-display text-base font-bold shadow-soft disabled:opacity-60"
          >
            {/* Google G SVG */}
            <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden>
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
}
