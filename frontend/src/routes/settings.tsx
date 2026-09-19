import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Camera, CheckCircle2, Phone } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { Avatar } from "@/components/user/Avatar";
import { PhoneVerificationModal } from "@/components/user/PhoneVerificationModal";
import { TextInput, TextArea } from "@/components/forms/TextInput";
import { Button } from "@/components/forms/Button";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useUpdateProfile, useUploadAvatar } from "@/hooks/useProfile";
import { extractApiError } from "@/api/axiosInstance";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Konfigurimet — Thrifted" },
      { name: "description", content: "Përditëso emrin, foton e profilit dhe bio-n tënde në Thrifted." },
    ],
  }),
  component: () => (
    <ProtectedRoute>
      <SettingsPage />
    </ProtectedRoute>
  ),
});

function SettingsPage() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const { notify } = useToast();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [phoneModalOpen, setPhoneModalOpen] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    username: "",
    location: "",
    bio: "",
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (user && !ready) {
      setForm({
        full_name: user.full_name ?? "",
        username: user.username,
        location: user.location ?? "",
        bio: user.bio ?? "",
      });
      setReady(true);
    }
  }, [user, ready]);

  if (!user) return null;

  const errors = {
    username:
      form.username.trim().length > 0 && form.username.trim().length < 3
        ? "Username duhet të ketë të paktën 3 karaktere"
        : undefined,
  };

  const canSubmit = form.username.trim().length >= 3;

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const updated = await uploadAvatar.mutateAsync(file);
      setUser(updated);
      notify("Foto e profilit u përditësua!", "success");
    } catch (err) {
      notify(extractApiError(err), "error");
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    try {
      const updated = await updateProfile.mutateAsync({
        full_name: form.full_name || undefined,
        username: form.username,
        location: form.location || undefined,
        bio: form.bio || undefined,
      });
      setUser(updated);
      notify("Profili u përditësua!", "success");
      navigate({ to: "/me" });
    } catch (err) {
      notify(extractApiError(err), "error");
    }
  };

  return (
    <PageContainer narrow className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-textPrimary">Konfigurimet</h1>

      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar src={user.profile_photo_url} name={user.full_name ?? user.username} size="xl" />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadAvatar.isPending}
            aria-label="Ndrysho foton e profilit"
            className="absolute -right-1 -bottom-1 flex size-8 items-center justify-center rounded-full border-2 border-surface bg-primary text-surface shadow-card transition-colors hover:bg-primary-hover disabled:opacity-60"
          >
            <Camera className="size-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
        <div>
          <p className="text-sm font-medium text-textPrimary">Foto e profilit</p>
          <p className="text-xs text-textSecondary">
            {uploadAvatar.isPending ? "Duke u ngarkuar…" : "JPG, PNG deri në 5MB"}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 rounded border border-border bg-surface p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border text-textSecondary">
            <Phone className="size-4" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-medium text-textPrimary">Numri i telefonit</p>
            {user.is_phone_verified && user.phone_number ? (
              <p className="flex items-center gap-1 text-sm text-textSecondary">
                {user.phone_number}
                <span className="flex items-center gap-1 text-success">
                  <CheckCircle2 className="size-3.5" aria-hidden="true" />
                  Verifikuar
                </span>
              </p>
            ) : (
              <p className="text-sm text-textSecondary">
                Nevojitet për të postuar një produkt
              </p>
            )}
          </div>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => setPhoneModalOpen(true)}>
          {user.is_phone_verified ? "Ndrysho" : "Shto numrin"}
        </Button>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-4">
        <TextInput
          label="Emri i plotë"
          value={form.full_name}
          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          placeholder="p.sh. Fabjan Daja"
        />
        <TextInput
          label="Username"
          value={form.username}
          error={errors.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          required
        />
        <TextInput
          label="Vendndodhja"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
          placeholder="p.sh. Tiranë"
        />
        <TextArea
          label="Bio"
          value={form.bio}
          onChange={(e) => setForm({ ...form, bio: e.target.value })}
          placeholder="Trego diçka për veten…"
        />
        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate({ to: "/me" })}>
            Anulo
          </Button>
          <Button type="submit" loading={updateProfile.isPending} disabled={!canSubmit}>
            Ruaj ndryshimet
          </Button>
        </div>
      </form>

      <PhoneVerificationModal
        open={phoneModalOpen}
        onClose={() => setPhoneModalOpen(false)}
        onVerified={() => setPhoneModalOpen(false)}
        description="Numri i telefonit shfaqet vetëm te ti - s'del kurrë publikisht te profili."
      />
    </PageContainer>
  );
}
