import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { TextInput } from "@/components/forms/TextInput";
import { Button } from "@/components/forms/Button";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { extractApiError } from "@/api/axiosInstance";

type Search = { redirect_to?: string };

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    redirect_to: (s.redirect_to as string) || undefined,
  }),
  head: () => ({
    meta: [
      { title: "Hyr — Thrifted" },
      { name: "description", content: "Kyçu në llogarinë tënde Thrifted për të blerë dhe shitur rroba të përdorura." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { redirect_to } = useSearch({ from: "/login" });
  const navigate = useNavigate();
  const { login } = useAuth();
  const { notify } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login({ email, password });
      notify("Mirë se erdhe!", "success");
      navigate({ to: redirect_to ?? "/", replace: true });
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer narrow className="max-w-md">
      <div className="rounded-lg border border-border bg-surface p-6 shadow-card">
        <h1 className="mb-1 text-2xl font-semibold text-textPrimary">Mirë se erdhe përsëri</h1>
        <p className="mb-6 text-sm text-textSecondary">Kyçu në llogarinë tënde Thrifted.</p>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <TextInput label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          <TextInput label="Fjalëkalimi" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" loading={loading} fullWidth>Hyr</Button>
        </form>
        <div className="mt-4 flex flex-col gap-2 text-sm">
          <Link to="/forgot-password" className="text-primary hover:text-primary-hover">
            Harrova fjalëkalimin
          </Link>
          <p className="text-textSecondary">
            Nuk ke llogari?{" "}
            <Link to="/register" className="font-medium text-primary hover:text-primary-hover">
              Regjistrohu
            </Link>
          </p>
        </div>
      </div>
    </PageContainer>
  );
}
