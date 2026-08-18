import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { TextInput } from "@/components/forms/TextInput";
import { Button } from "@/components/forms/Button";
import { authApi } from "@/api/authApi";
import { extractApiError } from "@/api/axiosInstance";
import { useToast } from "@/context/ToastContext";

export const Route = createFileRoute("/reset-password")({
  validateSearch: (s: Record<string, unknown>) => ({ token: (s.token as string) || "" }),
  head: () => ({
    meta: [
      { title: "Vendos fjalëkalim të ri — Thrifted" },
      { name: "description", content: "Vendos një fjalëkalim të ri për llogarinë tënde Thrifted." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { token } = useSearch({ from: "/reset-password" });
  const navigate = useNavigate();
  const { notify } = useToast();
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (pw !== confirm) {
      setError("Fjalëkalimet nuk përputhen.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await authApi.resetPassword(token, pw);
      notify("Fjalëkalimi u ndryshua. Kyçu përsëri.", "success");
      navigate({ to: "/login" });
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer narrow className="max-w-md">
      <div className="rounded-lg border border-border bg-surface p-6 shadow-card">
        <h1 className="mb-6 text-2xl font-semibold text-textPrimary">Vendos fjalëkalim të ri</h1>
        {!token ? (
          <p className="text-sm text-danger">Link i pavlefshëm ose i skaduar.</p>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-4">
            <TextInput label="Fjalëkalim i ri" type="password" value={pw} onChange={(e) => setPw(e.target.value)} required minLength={8} />
            <TextInput label="Konfirmo fjalëkalimin" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="submit" loading={loading} fullWidth>Ruaj fjalëkalimin</Button>
          </form>
        )}
        <p className="mt-4 text-sm text-textSecondary">
          <Link to="/login" className="text-primary hover:text-primary-hover">Kthehu te hyrja</Link>
        </p>
      </div>
    </PageContainer>
  );
}
