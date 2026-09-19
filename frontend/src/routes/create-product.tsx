import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { TextInput, TextArea } from "@/components/forms/TextInput";
import { SelectDropdown } from "@/components/forms/SelectDropdown";
import { Button } from "@/components/forms/Button";
import { LoadingSpinner } from "@/components/feedback/LoadingSpinner";
import { CATEGORIES, SIZES, SELLING_TYPE_OPTIONS, CONDITION_OPTIONS } from "@/lib/constants";
import { useCreateProduct, productKeys } from "@/hooks/useProducts";
import { productsApi } from "@/api/productsApi";
import { useToast } from "@/context/ToastContext";
import { extractApiError } from "@/api/axiosInstance";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { UploadCloud, X, Check } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import type { SellingType } from "@/types";

export const Route = createFileRoute("/create-product")({
  head: () => ({
    meta: [
      { title: "Posto një produkt — Thrifted" },
      { name: "description", content: "Publiko një artikull të ri në Thrifted në katër hapa të shpejtë." },
    ],
  }),
  component: () => (
    <ProtectedRoute>
      <CreateProductPage />
    </ProtectedRoute>
  ),
});

// Wizard 4-hapesh sipas Thrifted-dizajni.pptx (slide 11): Foto -> Detaje ->
// Cmimi -> Rishiko. Produkti KRIJOHET vetem ne fund (publish), jo ne kalimin
// Detaje->Foto - qe fotot te mund te jene hapi i pare pa pasur ende nje
// product_id. Gate-i i verifikimit te numrit te telefonit (implementuar
// 2026-09-01) u HOQ 2026-09-06 me kerkese te userit - postimi i produktit
// s'kerkon me telefon te verifikuar. Vete verifikimi mbetet i disponueshem
// si opsion vullnetar te /settings (components/user/PhoneVerificationModal.tsx).
const steps = ["Foto", "Detaje", "Çmimi", "Rishiko"] as const;

function CreateProductPage() {
  const navigate = useNavigate();
  const { notify } = useToast();
  const create = useCreateProduct();
  const qc = useQueryClient();
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [publishing, setPublishing] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    brand: "",
    size: "",
    color: "",
    condition_rating: "5",
    price: "",
    selling_type: "fixed_price" as SellingType,
  });
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files]);


  const priceNum = Number(form.price);
  const errors = {
    title:
      form.title.trim().length > 0 && form.title.trim().length < 3
        ? "Titulli duhet të ketë të paktën 3 karaktere"
        : undefined,
    category: form.category === "" ? "Zgjidh një kategori" : undefined,
    price:
      form.price !== "" && (Number.isNaN(priceNum) || priceNum <= 0)
        ? "Çmimi duhet të jetë më i madh se 0"
        : undefined,
  };

  const canGoNext =
    step === 0
      ? files.length > 0
      : step === 1
        ? form.title.trim().length >= 3 && form.category !== ""
        : step === 2
          ? !Number.isNaN(priceNum) && priceNum > 0
          : true;

  const goNext = (e?: FormEvent) => {
    e?.preventDefault();
    if (!canGoNext) return;
    setStep((s) => (s < 3 ? ((s + 1) as typeof s) : s));
  };

  const publish = async () => {
    setPublishing(true);
    try {
      const product = await create.mutateAsync({
        title: form.title,
        description: form.description || undefined,
        category: form.category || undefined,
        brand: form.brand || undefined,
        size: form.size || undefined,
        color: form.color || undefined,
        condition_rating: Number(form.condition_rating),
        price: Number(form.price),
        selling_type: form.selling_type,
      });
      if (files.length > 0) {
        await productsApi.uploadImages(product.id, files);
        qc.invalidateQueries({ queryKey: productKeys.detail(product.id) });
      }
      notify("Produkti u publikua!", "success");
      navigate({ to: "/products/$id", params: { id: product.id } });
    } catch (err) {
      notify(extractApiError(err), "error");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <PageContainer narrow>
      <h1 className="mb-2 font-display text-3xl font-semibold text-textPrimary">Posto një produkt</h1>
      <p className="mb-8 text-sm text-textSecondary">Formulari i ndarë mban vetëm një vendim në ekran.</p>

      <ol className="mb-8 flex items-center gap-2">
        {steps.map((label, i) => (
          <li key={label} className="flex flex-1 items-center gap-2">
            <button
              type="button"
              onClick={() => i <= step && setStep(i as typeof step)}
              disabled={i > step}
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-colors",
                i === step
                  ? "border-primary text-primary"
                  : i < step
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-textSecondary",
              )}
            >
              {i < step ? <Check className="size-4" /> : i + 1}
            </button>
            <span className={cn("hidden text-sm font-medium sm:inline", i === step ? "text-textPrimary" : "text-textSecondary")}>
              {label}
            </span>
            {i < steps.length - 1 && <div className="h-px flex-1 bg-border" />}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <form onSubmit={goNext} className="flex flex-col gap-4">
          <h2 className="font-display text-2xl font-semibold text-textPrimary">1. Fotot</h2>
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded border-2 border-dashed border-border bg-surface p-8 text-center text-textSecondary transition-colors hover:border-primary hover:text-primary">
            <UploadCloud className="size-8" />
            <span className="text-sm font-medium">Kliko për të ngarkuar foto</span>
            <span className="text-xs">Deri në 20 foto — e para bëhet kopertinë. JPG, PNG deri në 5MB secila.</span>
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => setFiles([...files, ...Array.from(e.target.files ?? [])].slice(0, 20))}
            />
          </label>
          {previews.length > 0 && (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {previews.map((url, i) => (
                <div key={url} className="relative aspect-square overflow-hidden rounded border border-border">
                  <img src={url} alt="" className="size-full object-cover" />
                  {i === 0 && (
                    <span className="absolute left-1 top-1 rounded bg-textPrimary/80 px-1.5 py-0.5 text-[10px] font-medium text-surface">
                      Kopertina
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setFiles(files.filter((_, j) => j !== i))}
                    aria-label="Hiq foton"
                    className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-textPrimary/70 text-surface"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {files.length === 0 && (
            <p className="text-sm text-danger">Shto të paktën 1 foto para se të vazhdosh — produktet pa foto besohen shumë më pak.</p>
          )}
          <div className="flex justify-end">
            <Button type="submit" disabled={!canGoNext}>Vazhdo</Button>
          </div>
        </form>
      )}

      {step === 1 && (
        <form onSubmit={goNext} className="flex flex-col gap-4">
          <h2 className="font-display text-2xl font-semibold text-textPrimary">2. Detajet e produktit</h2>
          <TextInput label="Titulli" required value={form.title} error={errors.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="p.sh. Fustan Vintage me Lule" />
          <TextArea label="Përshkrimi" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Trego historinë, gjendjen, detajet…" />
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectDropdown label="Kategoria" placeholder="Zgjidh…" options={CATEGORIES} value={form.category} error={errors.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            <TextInput label="Marka" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
            <SelectDropdown label="Madhësia" placeholder="Zgjidh…" options={SIZES} value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} />
            <TextInput label="Ngjyra" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
            <SelectDropdown label="Gjendja" options={CONDITION_OPTIONS.filter((o) => o.value !== "")} value={form.condition_rating} onChange={(e) => setForm({ ...form, condition_rating: e.target.value })} />
          </div>
          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => setStep(0)}>Kthehu</Button>
            <Button type="submit" disabled={!canGoNext}>Vazhdo</Button>
          </div>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={goNext} className="flex flex-col gap-4">
          <h2 className="font-display text-2xl font-semibold text-textPrimary">3. Çmimi</h2>
          <TextInput
            label="Çmimi (Lekë)"
            type="number"
            min={0}
            required
            value={form.price}
            error={errors.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
          />
          <SelectDropdown
            label="Lloji i shitjes"
            options={SELLING_TYPE_OPTIONS}
            value={form.selling_type}
            onChange={(e) => setForm({ ...form, selling_type: e.target.value as SellingType })}
          />
          {!Number.isNaN(priceNum) && priceNum > 0 && (
            <div className="rounded border border-border bg-surface p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-textSecondary">Çmimi i listuar</span>
                <span className="font-display text-lg font-semibold text-textPrimary">{formatPrice(priceNum)}</span>
              </div>
            </div>
          )}
          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => setStep(1)}>Kthehu</Button>
            <Button type="submit" disabled={!canGoNext}>Vazhdo</Button>
          </div>
        </form>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-4">
          <h2 className="font-display text-2xl font-semibold text-textPrimary">4. Rishiko &amp; Publiko</h2>
          <div className="flex flex-col gap-3 rounded border border-border bg-surface p-5">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-semibold text-textPrimary">{form.title}</h3>
              <span className="font-display text-xl font-semibold text-textPrimary">{formatPrice(priceNum)}</span>
            </div>
            <p className="text-sm text-textSecondary">{form.description || "Pa përshkrim"}</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-border pt-3 text-sm">
              <Row label="Kategoria" value={CATEGORIES.find((c) => c.value === form.category)?.label} />
              <Row label="Marka" value={form.brand} />
              <Row label="Madhësia" value={form.size} />
              <Row label="Ngjyra" value={form.color} />
              <Row label="Gjendja" value={CONDITION_OPTIONS.find((o) => o.value === form.condition_rating)?.label} />
              <Row label="Foto" value={`${files.length}`} />
            </div>
          </div>
          {publishing && <LoadingSpinner label="Duke publikuar…" />}
          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => setStep(2)} disabled={publishing}>Kthehu</Button>
            <Button onClick={publish} loading={publishing}>Publiko</Button>
          </div>
        </div>
      )}
    </PageContainer>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-textSecondary">{label}</span>
      <span className="font-medium text-textPrimary">{value || "—"}</span>
    </div>
  );
}
