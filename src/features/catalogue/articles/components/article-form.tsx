"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  articleSchema,
  type ArticleInput,
  type ArticleOutput,
} from "../schemas/article.schema";
import { createArticle, updateArticle } from "../server/actions";
import { uploadArticleMainImage } from "../server/image-actions";
import { ArticleImagesUpload } from "./article-images-upload";
import {
  ArticleMainImagePicker,
  type SelectedImageFile,
} from "./article-main-image-picker";
import type { ArticleDetailDTO } from "../types";
import type { CategorySelectOption } from "@/features/catalogue/categories/types";

interface ArticleFormProps {
  article?: ArticleDetailDTO;
  categories: CategorySelectOption[];
  canManagePrices: boolean;
  canViewCost: boolean;
}

type FormValues = ArticleInput;

export function ArticleForm({
  article,
  categories,
  canManagePrices,
  canViewCost,
}: ArticleFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [tagInput, setTagInput] = useState("");
  const [selectedImageFile, setSelectedImageFile] = useState<SelectedImageFile | null>(
    null
  );
  const isEditing = !!article;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(articleSchema),
    defaultValues: article
      ? {
          name: article.name,
          reference: article.reference,
          barcode: article.barcode ?? "",
          shortDescription: article.shortDescription ?? "",
          description: article.description ?? "",
          categoryId: article.categoryId ?? null,
          brand: article.brand ?? "",
          supplier: article.supplier ?? "",
          color: article.color ?? "",
          material: article.material ?? "",
          dimensions: article.dimensions ?? "",
          weight: article.weight ?? undefined,
          attributes: article.attributes,
          price: article.price,
          promoPrice: article.promoPrice ?? undefined,
          currency: article.currency as "XOF" | "EUR" | "USD",
          stock: article.stock,
          stockAlert: article.stockAlert,
          status: article.status,
          isNew: article.isNew,
          mainImage: article.mainImage ?? undefined,
          images: article.images,
          tags: article.tags,
          metadata: article.metadata as Record<string, unknown>,
        }
      : {
          name: "",
          reference: "",
          barcode: "",
          shortDescription: "",
          description: "",
          categoryId: null,
          brand: "",
          supplier: "",
          color: "",
          material: "",
          dimensions: "",
          attributes: {},
          price: 0,
          currency: "XOF",
          stock: 0,
          stockAlert: 5,
          status: "AVAILABLE",
          isNew: false,
          images: [],
          tags: [],
          metadata: {},
        },
  });

  const watchedPrice = watch("price");
  const watchedPromoPrice = watch("promoPrice");
  const watchedCostPrice = watch("costPrice" as keyof FormValues);
  const watchedImages = watch("images");
  const watchedTags = watch("tags");
  const watchedIsNew = watch("isNew");
  const watchedStatus = watch("status");
  const watchedMainImage = watch("mainImage");

  const margin =
    canViewCost && watchedCostPrice && watchedPrice
      ? Math.round(
          ((Number(watchedPrice) - Number(watchedCostPrice)) / Number(watchedPrice)) * 100
        )
      : null;

  const addTag = () => {
    const tag = tagInput.trim();
    if (!tag) return;
    const current = watchedTags ?? [];
    if (!current.includes(tag) && current.length < 20) {
      setValue("tags", [...current, tag]);
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setValue(
      "tags",
      (watchedTags ?? []).filter((t) => t !== tag)
    );
  };

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      if (isEditing) {
        const result = await updateArticle(article.id, values);
        if (result.success) {
          toast.success("Article modifié");
          router.push(`/catalogue/articles/${article.id}`);
        } else {
          toast.error(result.error);
        }
        return;
      }

      // Mode création : créer l'article sans image d'abord, puis uploader
      const createResult = await createArticle({ ...values, mainImage: null });
      if (!createResult.success) {
        toast.error(createResult.error);
        return;
      }

      const articleId = (createResult as { data?: { id: string } }).data?.id;

      if (articleId && selectedImageFile) {
        const formData = new FormData();
        formData.append("file", selectedImageFile.file);
        URL.revokeObjectURL(selectedImageFile.previewUrl);
        setSelectedImageFile(null);

        const imgResult = await uploadArticleMainImage(articleId, formData);
        if (!imgResult.success) {
          toast.warning("Article créé, mais l'image n'a pas pu être uploadée", {
            description: imgResult.error,
            duration: 6000,
          });
        }
      }

      toast.success("Article créé");
      router.push(articleId ? `/catalogue/articles/${articleId}` : "/catalogue/articles");
    });
  };

  function FieldError({ name }: { name: keyof typeof errors }) {
    const err = errors[name];
    if (!err) return null;
    return <p className="text-destructive mt-1 text-xs">{err.message as string}</p>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* INFORMATIONS GÉNÉRALES */}
      <section className="space-y-4">
        <h2 className="font-heading text-base font-semibold">Informations générales</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="reference">
              Référence <span className="text-destructive">*</span>
            </Label>
            <Input
              id="reference"
              placeholder="MH-001"
              {...register("reference")}
              onChange={(e) =>
                setValue("reference", e.target.value.toUpperCase(), {
                  shouldValidate: true,
                })
              }
              className={errors.reference ? "border-destructive" : ""}
            />
            <FieldError name="reference" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="name">
              Nom <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Canapé 3 places Oslo"
              {...register("name")}
              className={errors.name ? "border-destructive" : ""}
            />
            <FieldError name="name" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="barcode">Code-barres</Label>
            <Input id="barcode" placeholder="EAN-13" {...register("barcode")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="categoryId">Catégorie</Label>
            <Select
              defaultValue={article?.categoryId ?? undefined}
              onValueChange={(v) => setValue("categoryId", v || null)}
            >
              <SelectTrigger id="categoryId">
                <SelectValue placeholder="Choisir une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id} disabled={!cat.isActive}>
                    {cat.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="brand">Marque</Label>
            <Input id="brand" placeholder="ScanDesign" {...register("brand")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="supplier">Fournisseur</Label>
            <Input
              id="supplier"
              placeholder="Nom du fournisseur"
              {...register("supplier")}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="shortDescription">Description courte</Label>
          <Input
            id="shortDescription"
            placeholder="Résumé en 1-2 phrases"
            {...register("shortDescription")}
            maxLength={300}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Description complète</Label>
          <Textarea
            id="description"
            placeholder="Description détaillée du produit…"
            rows={4}
            {...register("description")}
          />
        </div>
      </section>

      <Separator />

      {/* ATTRIBUTS PHYSIQUES */}
      <section className="space-y-4">
        <h2 className="font-heading text-base font-semibold">Attributs physiques</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="color">Couleur</Label>
            <Input id="color" placeholder="Beige" {...register("color")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="material">Matière</Label>
            <Input
              id="material"
              placeholder="Cuir synthétique"
              {...register("material")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dimensions">Dimensions</Label>
            <Input
              id="dimensions"
              placeholder="220x90x85 cm"
              {...register("dimensions")}
            />
          </div>
        </div>
        <div className="w-40 space-y-1.5">
          <Label htmlFor="weight">Poids (kg)</Label>
          <Input
            id="weight"
            type="number"
            step="0.1"
            min={0}
            placeholder="45"
            {...register("weight")}
          />
        </div>
      </section>

      <Separator />

      {/* PRIX & STOCK */}
      <section className="space-y-4">
        <h2 className="font-heading text-base font-semibold">Prix & Stock</h2>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="price">
              Prix de vente <span className="text-destructive">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="price"
                type="number"
                min={0}
                step={100}
                {...register("price")}
                className={errors.price ? "border-destructive" : ""}
              />
              <span className="text-muted-foreground text-sm">FCFA</span>
            </div>
            <FieldError name="price" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="stock">
              Stock actuel <span className="text-destructive">*</span>
            </Label>
            <Input
              id="stock"
              type="number"
              min={0}
              {...register("stock")}
              className={errors.stock ? "border-destructive" : ""}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="stockAlert">Seuil d&apos;alerte</Label>
            <Input id="stockAlert" type="number" min={0} {...register("stockAlert")} />
          </div>
        </div>

        {canManagePrices && (
          <div className="bg-muted/30 space-y-4 rounded-lg border p-4">
            <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
              Promotion
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="promoPrice">Prix promotionnel</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="promoPrice"
                    type="number"
                    min={0}
                    step={100}
                    placeholder="0"
                    {...register("promoPrice")}
                    className={errors.promoPrice ? "border-destructive" : ""}
                  />
                  <span className="text-muted-foreground text-sm">FCFA</span>
                </div>
                {errors.promoPrice && (
                  <p className="text-destructive text-xs">{errors.promoPrice.message}</p>
                )}
                {watchedPromoPrice && watchedPrice && Number(watchedPromoPrice) > 0 && (
                  <p className="text-muted-foreground text-xs">
                    Remise :{" "}
                    {Math.round(
                      ((Number(watchedPrice) - Number(watchedPromoPrice)) /
                        Number(watchedPrice)) *
                        100
                    )}
                    %
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="promoStartDate">Début promo</Label>
                <Input id="promoStartDate" type="date" {...register("promoStartDate")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="promoEndDate">Fin promo</Label>
                <Input id="promoEndDate" type="date" {...register("promoEndDate")} />
              </div>
            </div>
          </div>
        )}

        {canViewCost && (
          <div className="bg-muted/30 space-y-2 rounded-lg border p-4">
            <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
              Prix d&apos;achat (confidentiel)
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  step={100}
                  placeholder="0"
                  {...register("costPrice" as keyof FormValues)}
                  className="w-40"
                />
                <span className="text-muted-foreground text-sm">FCFA</span>
              </div>
              {margin !== null && (
                <span className="text-muted-foreground text-sm">
                  Marge :{" "}
                  <strong className={margin > 30 ? "text-emerald-600" : "text-amber-600"}>
                    {margin}%
                  </strong>
                </span>
              )}
            </div>
          </div>
        )}
      </section>

      <Separator />

      {/* STATUT */}
      <section className="space-y-4">
        <h2 className="font-heading text-base font-semibold">Statut</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="status">Statut</Label>
            <Select
              defaultValue={watchedStatus}
              onValueChange={(v) => setValue("status", v as ArticleOutput["status"])}
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AVAILABLE">Disponible</SelectItem>
                <SelectItem value="OUT_OF_STOCK">Rupture de stock</SelectItem>
                <SelectItem value="COMING_SOON">Bientôt disponible</SelectItem>
                <SelectItem value="ARCHIVED">Archivé</SelectItem>
                <SelectItem value="DISCONTINUED">Arrêté</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="arrivalDate">Date d&apos;arrivée</Label>
            <Input id="arrivalDate" type="date" {...register("arrivalDate")} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Switch
            id="isNew"
            checked={watchedIsNew}
            onCheckedChange={(checked) => setValue("isNew", checked)}
          />
          <Label htmlFor="isNew" className="cursor-pointer">
            Marquer comme nouveauté
          </Label>
        </div>
      </section>

      <Separator />

      {/* PHOTOS */}
      <section className="space-y-4">
        <h2 className="font-heading text-base font-semibold">Photos</h2>

        {isEditing ? (
          // Mode édition : upload immédiat via Server Actions
          <ArticleImagesUpload
            articleId={article.id}
            mainImage={watchedMainImage ?? null}
            images={watchedImages ?? []}
            onMainImageChange={(url) => setValue("mainImage", url, { shouldDirty: true })}
            onImagesChange={(urls) => setValue("images", urls, { shouldDirty: true })}
            disabled={isPending}
          />
        ) : (
          // Mode création : sélection locale, upload différé au submit
          <div className="space-y-2">
            <ArticleMainImagePicker
              value={selectedImageFile ?? watchedMainImage ?? null}
              onChange={(selected) => {
                setSelectedImageFile(selected);
                // Stocker l'URL blob dans RHF pour passer la validation (acceptée par le schéma)
                setValue("mainImage", selected?.previewUrl ?? null, {
                  shouldValidate: false,
                });
              }}
              disabled={isPending}
            />
            {selectedImageFile && (
              <p className="flex items-center gap-1 text-xs text-amber-600">
                <span>⏳</span>
                L&apos;image sera uploadée lors de la création de l&apos;article
              </p>
            )}
          </div>
        )}
      </section>

      <Separator />

      {/* TAGS */}
      <section className="space-y-4">
        <h2 className="font-heading text-base font-semibold">Tags</h2>
        <div className="flex gap-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder="Ajouter un tag…"
            className="max-w-xs"
          />
          <Button type="button" variant="outline" size="sm" onClick={addTag}>
            <Plus className="size-4" />
          </Button>
        </div>
        {(watchedTags ?? []).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {(watchedTags ?? []).map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1">
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-1 rounded-full hover:bg-black/10"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </section>

      {/* ACTIONS */}
      <div className="flex justify-end gap-3 border-t pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Annuler
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              {isEditing ? "Enregistrement…" : "Création…"}
            </>
          ) : isEditing ? (
            "Enregistrer les modifications"
          ) : (
            <>
              <Plus className="mr-2 size-4" />
              Créer l&apos;article
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
