"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  quickCreateArticleSchema,
  type QuickCreateArticleInput,
} from "../schemas/article.schema";
import { createArticleQuick } from "../server/actions";
import { uploadArticleMainImage } from "../server/image-actions";
import {
  ArticleMainImagePicker,
  type SelectedImageFile,
} from "./article-main-image-picker";
import type { CategorySelectOption } from "@/features/catalogue/categories/types";

interface ArticleQuickCreateFormProps {
  categories: CategorySelectOption[];
}

export function ArticleQuickCreateForm({ categories }: ArticleQuickCreateFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedImageFile, setSelectedImageFile] = useState<SelectedImageFile | null>(
    null
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<QuickCreateArticleInput>({
    resolver: zodResolver(quickCreateArticleSchema),
    defaultValues: { name: "", categoryId: "", isNew: false, mainImage: null },
  });

  const watchedIsNew = watch("isNew");
  const watchedCategoryId = watch("categoryId");

  const onSubmit = (values: QuickCreateArticleInput) => {
    startTransition(async () => {
      const createResult = await createArticleQuick({ ...values, mainImage: null });
      if (!createResult.success) {
        toast.error(createResult.error);
        return;
      }

      const articleId = createResult.data?.id;

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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-1.5">
        <Label>Photo</Label>
        <ArticleMainImagePicker
          value={selectedImageFile}
          onChange={setSelectedImageFile}
          disabled={isPending}
        />
        {selectedImageFile && (
          <p className="flex items-center gap-1 text-xs text-amber-600">
            <span>⏳</span>
            L&apos;image sera uploadée lors de la création de l&apos;article
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="name">
          Nom de l&apos;article <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          placeholder="Ex : Canapé Oslo 3 places"
          {...register("name")}
          className={errors.name ? "border-destructive" : ""}
          autoFocus
        />
        {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="categoryId">
          Catégorie <span className="text-destructive">*</span>
        </Label>
        <Select
          value={watchedCategoryId}
          onValueChange={(v) => setValue("categoryId", v ?? "", { shouldValidate: true })}
        >
          <SelectTrigger
            id="categoryId"
            className={errors.categoryId ? "border-destructive" : ""}
          >
            <SelectValue>
              {(value: string) =>
                categories.find((cat) => cat.id === value)?.displayName ??
                "Sélectionner une catégorie…"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id} disabled={!cat.isActive}>
                {cat.displayName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.categoryId && (
          <p className="text-destructive text-xs">{errors.categoryId.message}</p>
        )}
      </div>

      <div
        tabIndex={isPending ? -1 : 0}
        onClick={() => !isPending && setValue("isNew", !watchedIsNew)}
        onKeyDown={(e) => {
          if (isPending) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setValue("isNew", !watchedIsNew);
          }
        }}
        className="data-[active=true]:border-primary data-[active=true]:bg-primary/5 flex w-full cursor-pointer items-center justify-between rounded-xl border-2 p-4 transition-colors"
        data-active={watchedIsNew}
      >
        <div className="flex items-center gap-3">
          <div
            className="bg-muted data-[active=true]:bg-primary flex size-10 items-center justify-center rounded-xl"
            data-active={watchedIsNew}
          >
            <Sparkles
              className="text-muted-foreground data-[active=true]:text-primary-foreground size-5"
              data-active={watchedIsNew}
            />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold">Nouvel arrivage</p>
            <p className="text-muted-foreground text-xs">
              Affiche le badge « Nouveau » sur l&apos;article
            </p>
          </div>
        </div>
        <span onClick={(e) => e.stopPropagation()}>
          <Switch
            checked={watchedIsNew}
            onCheckedChange={(v) => setValue("isNew", v)}
            disabled={isPending}
          />
        </span>
      </div>

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
              Création…
            </>
          ) : (
            <>
              <Plus className="mr-2 size-4" />
              Créer l&apos;article
            </>
          )}
        </Button>
      </div>

      <p className="text-muted-foreground text-center text-xs">
        La référence sera générée automatiquement. Vous pourrez compléter le prix, le
        stock et les autres informations après la création.
      </p>
    </form>
  );
}
