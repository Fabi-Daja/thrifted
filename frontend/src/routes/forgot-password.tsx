import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { TextInput } from "@/components/forms/TextInput";
import { Button } from "@/components/forms/Button";
import { authApi } from "@/api/authApi";
import { extractApiError } from "@/api/axiosInstance";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Rikuperim fjalëkalimi — Thrifted" },
      { name: "description", content: "Rikupero fjalëkalimin e llogarisë tënde Thrifted." },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer narrow className="max-w-md">
      <div className="rounded-lg border border-border bg-surface p-6 shadow-card">
        <h1 className="mb-1 text-2xl font-semibold text-textPrimary">Rikuperim fjalëkalimi</h1>
        <p className="mb-6 text-sm text-textSecondary">
          Vendos email-in dhe do të dërgojmë një link për ta rivendosur.
        </p>
        {sent ? (
          <div className="flex flex-col items-center text-center">
            <CheckCircle2 className="mb-3 size-10 text-success" />
            <p className="text-sm text-textSecondary">
              Nëse ekziston një llogari me këtë email, do të marrësh një link brenda pak minutash.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-4">
            <TextInput label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="submit" loading={loading} fullWidth>Dërgo linkun</Button>
          </form>
        )}
        <p className="mt-4 text-sm text-textSecondary">
          <Link to="/login" className="text-primary hover:text-primary-hover">Kthehu te hyrja</Link>
        </p>
      </div>
    </PageContainer>
  );
}
