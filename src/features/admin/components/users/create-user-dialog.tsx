"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Check, Copy, Eye, EyeOff, Loader2, RefreshCw, UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { createUser } from "@/features/admin/server/actions/users.actions";

// ── Schéma local (single-select rôle → roleIds au submit) ────────────────────

const dialogSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis").max(50),
  lastName: z.string().min(1, "Le nom est requis").max(50),
  email: z.string().min(1, "L'email est requis").email("Email invalide").toLowerCase(),
  phone: z
    .string()
    .regex(/^\+221[0-9]{9}$/, "Format : +221XXXXXXXXX")
    .optional()
    .or(z.literal("")),
  jobTitle: z.string().max(100).optional().or(z.literal("")),
  roleId: z.string().min(1, "Choisissez un profil"),
  password: z.string().min(8, "Minimum 8 caractères").max(128),
});

type DialogFormValues = z.infer<typeof dialogSchema>;

// ── Helpers ───────────────────────────────────────────────────────────────────

function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!";
  return Array.from(
    { length: 12 },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roles: Array<{ id: string; name: string }>;
  onSuccess?: () => void;
}

// ── Composant ─────────────────────────────────────────────────────────────────

export function CreateUserDialog({
  open,
  onOpenChange,
  roles,
  onSuccess,
}: CreateUserDialogProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DialogFormValues>({
    resolver: zodResolver(dialogSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      jobTitle: "",
      roleId: "",
      password: generatePassword(),
    },
  });

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      reset({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        jobTitle: "",
        roleId: "",
        password: generatePassword(),
      });
      setShowPassword(false);
      setCopied(false);
    }
    onOpenChange(nextOpen);
  }

  function handleGenerate() {
    setValue("password", generatePassword(), { shouldValidate: false });
    setCopied(false);
  }

  async function handleCopy() {
    const pwd = watch("password");
    if (!pwd) return;
    await navigator.clipboard.writeText(pwd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function onSubmit(values: DialogFormValues) {
    const result = await createUser({
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      phone: values.phone || undefined,
      jobTitle: values.jobTitle || undefined,
      roleIds: [values.roleId],
      password: values.password,
      sendInvitation: false,
    });

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success(`${values.firstName} ${values.lastName} a été créé.`, {
      description: `Mot de passe temporaire : ${values.password}`,
      duration: 15000,
    });

    handleOpenChange(false);
    onSuccess?.();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nouveau membre</DialogTitle>
          <DialogDescription>
            Le membre pourra se connecter immédiatement avec ces identifiants.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-2 space-y-4">
          {/* Prénom + Nom */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="d-firstName">Prénom *</Label>
              <Input id="d-firstName" {...register("firstName")} placeholder="Aïssatou" />
              {errors.firstName && (
                <p className="text-xs text-red-600">{errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="d-lastName">Nom *</Label>
              <Input id="d-lastName" {...register("lastName")} placeholder="Diop" />
              {errors.lastName && (
                <p className="text-xs text-red-600">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="d-email">Adresse email *</Label>
            <Input
              id="d-email"
              type="email"
              {...register("email")}
              placeholder="prenom.nom@mondialhome.sn"
            />
            {errors.email && (
              <p className="text-xs text-red-600">{errors.email.message}</p>
            )}
          </div>

          {/* Téléphone */}
          <div className="space-y-1.5">
            <Label htmlFor="d-phone">
              Téléphone <span className="text-text-muted font-normal">(optionnel)</span>
            </Label>
            <Input id="d-phone" {...register("phone")} placeholder="+221 77 000 00 00" />
            {errors.phone && (
              <p className="text-xs text-red-600">{errors.phone.message}</p>
            )}
          </div>

          {/* Poste */}
          <div className="space-y-1.5">
            <Label htmlFor="d-jobTitle">
              Poste <span className="text-text-muted font-normal">(optionnel)</span>
            </Label>
            <Input
              id="d-jobTitle"
              {...register("jobTitle")}
              placeholder="Responsable Marketing"
            />
          </div>

          {/* Profil d'accès */}
          <div className="space-y-1.5">
            <Label>Profil d&apos;accès *</Label>
            <Select
              value={watch("roleId")}
              onValueChange={(v) =>
                v != null && setValue("roleId", v, { shouldValidate: true })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Choisir un profil..." />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.roleId && (
              <p className="text-xs text-red-600">{errors.roleId.message}</p>
            )}
          </div>

          {/* Mot de passe temporaire */}
          <div className="space-y-1.5">
            <Label htmlFor="d-password">Mot de passe temporaire *</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="d-password"
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  className="pr-10 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-text-secondary hover:text-text-primary absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Masquer" : "Afficher"}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleGenerate}
                title="Générer un nouveau mot de passe"
              >
                <RefreshCw className="size-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleCopy}
                className={cn(
                  copied ? "border-green-200 bg-green-50 text-green-600" : ""
                )}
                title="Copier le mot de passe"
              >
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              </Button>
            </div>
            <p className="text-text-muted text-xs">
              Transmettez ce mot de passe au membre. Il pourra le changer après connexion.
            </p>
            {errors.password && (
              <p className="text-xs text-red-600">{errors.password.message}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gold-deep hover:bg-gold-deep/90 text-cream flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 size-4" />
                  Créer le membre
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
