import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { TextInput, TextArea } from "@/components/forms/TextInput";
import { SelectDropdown } from "@/components/forms/SelectDropdown";
import { Button } from "@/components/forms/Button";
import { LoadingSpinner } from "@/components/feedback/LoadingSpinner";
import { CATEGORIES, SIZES, SELLING_TYPE_OPTIONS, CONDITION_OPTIONS } from "@/lib/constants";
import { useCreateProduct, useUploadImages } from "@/hooks/useProducts";
import { useToast } from "@/context/ToastContext";
import { extractApiError } from "@/api/axiosInstance";
import { cn } from "@/lib/utils";
import { UploadCloud, X, Check } from "lucide-react";
import type { SellingType } from "@/types";

export const Route = createFileRoute("/create-product")({
  head: () => ({
    meta: [
      { title: "Shit një produkt — Thrifted" },
      { name: "description", content: "Publiko një artikull të ri në Thrifted në pak hapa. Shto foto, detaje dhe çmim." },
    ],
  }),
  component: () => (
    <ProtectedRoute>
      <CreateProductPage />
    </ProtectedRoute>
  ),
});

const steps = ["Detaje", "Foto", "Rishikim"] as const;

function CreateProductPage() {
  const navigate = useNavigate();
  const { notify } = useToast();
  const create = useCreateProduct();
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [productId, setProductId] = useState<string | null>(null);
  const upload = useUploadImages(productId ?? "");

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
      ? form.title.trim().length >= 3 &&
        form.category !== "" &&
        !Number.isNaN(priceNum) &&
        priceNum > 0
      : step === 1
        ? files.length > 0
        : true;

  const submitDetails = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const p = await create.mutateAsync({
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
      setProductId(p.id);
      setStep(1);
    } catch (err) {
      notify(extractApiError(err), "error");
    }
  };

  const publish = async () => {
    if (!productId) return;
    try {
      if (files.length > 0) {
        await upload.mutateAsync(files);
      }
      notify("Produkti u publikua!", "success");
      navigate({ to: "/products/$id", params: { id: productId } });
    } catch (err) {
      notify(extractApiError(err), "error");
    }
  };

  return (
    <PageContainer narrow>
      <h1 className="mb-2 text-2xl font-semibold text-textPrimary">Krijo një produkt</h1>
      <p className="mb-6 text-sm text-textSecondary">Publikoje në 3 hapa të shpejtë.</p>

      <ol className="mb-8 flex items-center gap-3">
        {steps.map((label, i) => (
          <li key={label} className="flex flex-1 items-center gap-3">
            <button
              type="button"
              onClick={() => productId && setStep(i as 0 | 1 | 2)}
              disabled={!productId && i > 0}
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-colors",
                i === step
                  ? "border-primary bg-primary text-surface"
                  : i < step
                  ? "border-primary bg-primary/20 text-primary"
                  : "border-border bg-surface text-textSecondary",
              )}
            >
              {i < step ? <Check className="size-4" /> : i + 1}
            </button>
            <span className={cn("text-sm font-medium", i === step ? "text-textPrimary" : "text-textSecondary")}>
              {label}
            </span>
            {i < steps.length - 1 && <div className="ml-1 h-px flex-1 bg-border" />}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <form onSubmit={submitDetails} className="flex flex-col gap-4">
          <TextInput label="Titulli" required value={form.title} error={errors.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="p.sh. Xhaketë xhins vintage" />
          <TextArea label="Përshkrimi" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Trego historinë, gjendjen, detajet…" />
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectDropdown label="Kategoria" placeholder="Zgjidh" options={CATEGORIES} value={form.category} error={errors.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            <SelectDropdown label="Masa" placeholder="Zgjidh" options={SIZES} value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} />
            <TextInput label="Marka" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
            <TextInput label="Ngjyra" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
            <SelectDropdown label="Gjendja" options={CONDITION_OPTIONS.filter((o) => o.value !== "")} value={form.condition_rating} onChange={(e) => setForm({ ...form, condition_rating: e.target.value })} />
            <TextInput label="Çmimi (€)" type="number" min={0} required value={form.price} error={errors.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          </div>
          <SelectDropdown
            label="Lloji i shitjes"
            options={SELLING_TYPE_OPTIONS}
            value={form.selling_type}
            onChange={(e) => setForm({ ...form, selling_type: e.target.value as SellingType })}
          />
          <div className="flex justify-end">
            <Button type="submit" loading={create.isPending} disabled={!canGoNext}>Vazhdo</Button>
          </div>
        </form>
      )}

      {step === 1 && (
        <div className="flex flex-col gap-4">
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-surface p-8 text-center text-textSecondary transition-colors hover:border-primary hover:text-primary">
            <UploadCloud className="size-8" />
            <span className="text-sm font-medium">Kliko për të ngarkuar foto</span>
            <span className="text-xs">JPG, PNG deri në 5MB secila</span>
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => setFiles([...files, ...Array.from(e.target.files ?? [])])}
            />
          </label>
          {previews.length > 0 && (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {previews.map((url, i) => (
                <div key={url} className="relative aspect-square overflow-hidden rounded border border-border">
                  <img src={url} alt="" className="size-full object-cover" />
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
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(0)}>Kthehu</Button>
            <Button onClick={() => setStep(2)} disabled={!canGoNext}>Vazhdo</Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-border bg-surface p-5">
            <h2 className="mb-3 text-lg font-semibold text-textPrimary">{form.title}</h2>
            <p className="mb-3 text-sm text-textSecondary">{form.description || "Pa përshkrim"}</p>
            <div className="grid grid-cols-2 gap-2 text-sm text-textSecondary">
              <div><strong className="text-textPrimary">{form.price} €</strong> çmimi</div>
              <div>{CATEGORIES.find((c) => c.value === form.category)?.label ?? "—"}</div>
              <div>{form.brand || "—"}</div>
              <div>{form.size || "—"}</div>
              <div>{form.color || "—"}</div>
              <div>Gjendja: {form.condition_rating}/5</div>
            </div>
            <p className="mt-3 text-xs text-textSecondary">{files.length} foto për t'u ngarkuar</p>
          </div>
          {upload.isPending && <LoadingSpinner label="Duke ngarkuar fotot…" />}
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>Kthehu</Button>
            <Button onClick={publish} loading={upload.isPending}>Publiko produktin</Button>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
