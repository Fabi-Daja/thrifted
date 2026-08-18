import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { LoadingSpinner } from "@/components/feedback/LoadingSpinner";
import { TextInput, TextArea } from "@/components/forms/TextInput";
import { SelectDropdown } from "@/components/forms/SelectDropdown";
import { Button } from "@/components/forms/Button";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { CATEGORIES, SIZES, SELLING_TYPE_OPTIONS, CONDITION_OPTIONS } from "@/lib/constants";
import { useProduct, useUpdateProduct } from "@/hooks/useProducts";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { extractApiError } from "@/api/axiosInstance";
import type { SellingType } from "@/types";

export const Route = createFileRoute("/products/$id/edit")({
  component: () => (
    <ProtectedRoute>
      <EditProductPage />
    </ProtectedRoute>
  ),
});

function EditProductPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notify } = useToast();
  const { data: product, isLoading } = useProduct(id);
  const update = useUpdateProduct(id);

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
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (product && !ready) {
      setForm({
        title: product.title,
        description: product.description ?? "",
        category: product.category ?? "",
        brand: product.brand ?? "",
        size: product.size ?? "",
        color: product.color ?? "",
        condition_rating: String(product.condition_rating),
        price: String(product.price),
        selling_type: product.selling_type,
      });
      setReady(true);
    }
  }, [product, ready]);

  if (isLoading) return <LoadingSpinner fullPage />;
  if (!product) return <PageContainer><p>Produkti nuk u gjet.</p></PageContainer>;
  if (user && product.owner_id !== user.id) {
    return (
      <PageContainer>
        <p className="text-textSecondary">Nuk ke të drejta për këtë produkt.</p>
      </PageContainer>
    );
  }

  const priceNum = Number(form.price);
  const canSubmit =
    form.title.trim().length >= 3 &&
    form.category !== "" &&
    !Number.isNaN(priceNum) &&
    priceNum > 0;

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

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    try {
      await update.mutateAsync({
        title: form.title,
        description: form.description || undefined,
        category: form.category || undefined,
        brand: form.brand || undefined,
        size: form.size || undefined,
        color: form.color || undefined,
        condition_rating: Number(form.condition_rating),
        price: priceNum,
        selling_type: form.selling_type,
      });
      notify("Produkti u përditësua!", "success");
      navigate({ to: "/products/$id", params: { id } });
    } catch (err) {
      notify(extractApiError(err), "error");
    }
  };

  return (
    <PageContainer narrow>
      <h1 className="mb-6 text-2xl font-semibold text-textPrimary">Edito produktin</h1>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <TextInput label="Titulli" value={form.title} error={errors.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <TextArea label="Përshkrimi" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectDropdown label="Kategoria" placeholder="Zgjidh" options={CATEGORIES} value={form.category} error={errors.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <SelectDropdown label="Masa" placeholder="Zgjidh" options={SIZES} value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} />
          <TextInput label="Marka" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
          <TextInput label="Ngjyra" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
          <SelectDropdown
            label="Gjendja"
            options={CONDITION_OPTIONS.filter((o) => o.value !== "")}
            value={form.condition_rating}
            onChange={(e) => setForm({ ...form, condition_rating: e.target.value })}
          />
          <TextInput label="Çmimi (€)" type="number" min={0} value={form.price} error={errors.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
        </div>
        <SelectDropdown
          label="Lloji i shitjes"
          options={SELLING_TYPE_OPTIONS}
          value={form.selling_type}
          onChange={(e) => setForm({ ...form, selling_type: e.target.value as SellingType })}
        />
        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate({ to: "/products/$id", params: { id } })}>
            Anulo
          </Button>
          <Button type="submit" loading={update.isPending} disabled={!canSubmit}>
            Ruaj ndryshimet
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}
