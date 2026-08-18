import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { TextInput } from "@/components/forms/TextInput";
import { Button } from "@/components/forms/Button";
import { authApi } from "@/api/authApi";
import { extractApiError } from "@/api/axiosInstance";
import { useToast } from "@/context/ToastContext";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Regjistrohu — Thrifted" },
      { name: "description", content: "Krijo një llogari falas në Thrifted dhe fillo të blini e shisni rroba të përdorura." },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const { notify } = useToast();
  const [form, setForm] = useState({ email: "", username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await authApi.register(form);
      setDone(true);
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <PageContainer narrow className="max-w-md">
        <div className="rounded-lg border border-border bg-surface p-6 text-center shadow-card">
          <CheckCircle2 className="mx-auto mb-3 size-10 text-success" />
          <h1 className="mb-2 text-xl font-semibold text-textPrimary">Kontrollo email-in</h1>
          <p className="text-sm text-textSecondary">
            Të kemi dërguar një link verifikimi te <strong>{form.email}</strong>. Kliko atë për të aktivizuar llogarinë.
          </p>
          <Button className="mt-6" onClick={() => navigate({ to: "/login" })} fullWidth>
            Në faqen e hyrjes
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer narrow className="max-w-md">
      <div className="rounded-lg border border-border bg-surface p-6 shadow-card">
        <h1 className="mb-1 text-2xl font-semibold text-textPrimary">Krijo një llogari</h1>
        <p className="mb-6 text-sm text-textSecondary">Filloni të blini dhe të shesni në minuta.</p>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <TextInput label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required autoComplete="email" />
          <TextInput label="Emri i përdoruesit" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required autoComplete="username" />
          <TextInput label="Fjalëkalimi" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} hint="Të paktën 8 karaktere" autoComplete="new-password" />
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" loading={loading} fullWidth>Regjistrohu</Button>
        </form>
        <p className="mt-4 text-sm text-textSecondary">
          Ke tashmë një llogari?{" "}
          <Link to="/login" className="font-medium text-primary hover:text-primary-hover">Hyr</Link>
        </p>
      </div>
    </PageContainer>
  );
}
