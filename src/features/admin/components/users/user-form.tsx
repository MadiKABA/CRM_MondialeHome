"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { createUser, updateUser } from "@/features/admin/server/actions/users.actions";
import { createUserSchema, updateUserSchema } from "@/features/admin/schemas/user.schema";
import type {
  CreateUserInput,
  CreateUserOutput,
  UpdateUserInput,
} from "@/features/admin/schemas/user.schema";
import type { UserDetailDTO, RoleListItemDTO } from "@/features/admin/types";

// ── Types ─────────────────────────────────────────────────────

interface UserFormCreateProps {
  mode: "create";
  availableRoles: RoleListItemDTO[];
}

interface UserFormEditProps {
  mode: "edit";
  user: UserDetailDTO;
  availableRoles: RoleListItemDTO[];
}

type UserFormProps = UserFormCreateProps | UserFormEditProps;

// ── Formulaire création ───────────────────────────────────────

function CreateUserForm({ availableRoles }: { availableRoles: RoleListItemDTO[] }) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserInput, unknown, CreateUserOutput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      jobTitle: "",
      department: "",
      language: "fr",
      timezone: "Africa/Dakar",
      roleIds: [],
      sendInvitation: true,
    },
  });

  const selectedRoleIds = watch("roleIds");

  function toggleRole(roleId: string) {
    const current = selectedRoleIds ?? [];
    if (current.includes(roleId)) {
      setValue(
        "roleIds",
        current.filter((id) => id !== roleId),
        { shouldValidate: true }
      );
    } else {
      setValue("roleIds", [...current, roleId], { shouldValidate: true });
    }
  }

  async function onSubmit(data: CreateUserOutput) {
    const result = await createUser(data);
    if (result.success) {
      toast.success("Utilisateur créé avec succès.");
      router.push(`/admin/users/${result.data.id}`);
    } else {
      toast.error(result.error);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Identité */}
      <div className="border-cream-darker rounded-xl border p-6">
        <h3 className="text-text-primary mb-4 font-semibold">Identité</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="c-firstName">Prénom *</Label>
            <Input id="c-firstName" {...register("firstName")} placeholder="Prénom" />
            {errors.firstName && (
              <p className="text-xs text-red-600">{errors.firstName.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-lastName">Nom *</Label>
            <Input
              id="c-lastName"
              {...register("lastName")}
              placeholder="Nom de famille"
            />
            {errors.lastName && (
              <p className="text-xs text-red-600">{errors.lastName.message}</p>
            )}
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="c-email">Email *</Label>
            <Input
              id="c-email"
              type="email"
              {...register("email")}
              placeholder="prenom.nom@example.com"
            />
            {errors.email && (
              <p className="text-xs text-red-600">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-phone">Téléphone</Label>
            <Input id="c-phone" {...register("phone")} placeholder="+221 77 000 00 00" />
            {errors.phone && (
              <p className="text-xs text-red-600">{errors.phone.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Poste */}
      <div className="border-cream-darker rounded-xl border p-6">
        <h3 className="text-text-primary mb-4 font-semibold">Poste</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="c-jobTitle">Intitulé de poste</Label>
            <Input
              id="c-jobTitle"
              {...register("jobTitle")}
              placeholder="Commercial, Comptable…"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-department">Service / Département</Label>
            <Input
              id="c-department"
              {...register("department")}
              placeholder="Commercial, Finance…"
            />
          </div>
        </div>
      </div>

      {/* Profils d'accès */}
      <div className="border-cream-darker rounded-xl border p-6">
        <h3 className="text-text-primary mb-1 font-semibold">{"Profils d'accès *"}</h3>
        <p className="text-text-secondary mb-4 text-xs">
          Les profils définissent ce que cet utilisateur peut faire dans le CRM.
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {availableRoles.map((role) => (
            <label
              key={role.id}
              className="border-cream-darker hover:bg-cream/50 flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors"
            >
              <Checkbox
                checked={selectedRoleIds?.includes(role.id) ?? false}
                onCheckedChange={() => toggleRole(role.id)}
                className="mt-0.5"
              />
              <div className="min-w-0">
                <p className="text-text-primary text-sm font-medium">{role.name}</p>
                {role.description && (
                  <p className="text-text-secondary mt-0.5 text-xs">{role.description}</p>
                )}
                <p className="text-text-secondary mt-0.5 text-xs">
                  {role.permissionCount} droit{role.permissionCount > 1 ? "s" : ""}
                </p>
              </div>
            </label>
          ))}
        </div>
        {errors.roleIds && (
          <p className="mt-2 text-xs text-red-600">{errors.roleIds.message}</p>
        )}
      </div>

      {/* Options */}
      <div className="border-cream-darker rounded-xl border p-6">
        <label className="flex cursor-pointer items-start gap-3">
          <Checkbox
            defaultChecked
            onCheckedChange={(checked) => setValue("sendInvitation", Boolean(checked))}
            className="mt-0.5"
          />
          <div>
            <p className="text-text-primary text-sm font-medium">
              Envoyer une invitation par email
            </p>
            <p className="text-text-secondary text-xs">
              {"L'utilisateur recevra un lien pour définir son mot de passe."}
            </p>
          </div>
        </label>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          className="border-cream-darker text-text-secondary"
          onClick={() => router.back()}
        >
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-gold-deep hover:bg-gold-deep/90 text-cream"
        >
          {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
          {"Créer l'utilisateur"}
        </Button>
      </div>
    </form>
  );
}

// ── Formulaire édition ────────────────────────────────────────

function EditUserForm({ user }: { user: UserDetailDTO }) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdateUserInput>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      phone: user.phone ?? "",
      jobTitle: user.jobTitle ?? "",
      department: user.department ?? "",
      language: (user.language as "fr" | "wo") ?? "fr",
      timezone: user.timezone ?? "Africa/Dakar",
    },
  });

  async function onSubmit(data: UpdateUserInput) {
    const result = await updateUser(user.id, data);
    if (result.success) {
      toast.success("Modifications enregistrées.");
      router.push(`/admin/users/${user.id}`);
    } else {
      toast.error(result.error);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Identité */}
      <div className="border-cream-darker rounded-xl border p-6">
        <h3 className="text-text-primary mb-4 font-semibold">Identité</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="e-firstName">Prénom</Label>
            <Input id="e-firstName" {...register("firstName")} />
            {errors.firstName && (
              <p className="text-xs text-red-600">{errors.firstName.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="e-lastName">Nom</Label>
            <Input id="e-lastName" {...register("lastName")} />
            {errors.lastName && (
              <p className="text-xs text-red-600">{errors.lastName.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="e-phone">Téléphone</Label>
            <Input id="e-phone" {...register("phone")} placeholder="+221 77 000 00 00" />
            {errors.phone && (
              <p className="text-xs text-red-600">{errors.phone.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Poste */}
      <div className="border-cream-darker rounded-xl border p-6">
        <h3 className="text-text-primary mb-4 font-semibold">Poste</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="e-jobTitle">Intitulé de poste</Label>
            <Input id="e-jobTitle" {...register("jobTitle")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="e-department">Service / Département</Label>
            <Input id="e-department" {...register("department")} />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          className="border-cream-darker text-text-secondary"
          onClick={() => router.back()}
        >
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-gold-deep hover:bg-gold-deep/90 text-cream"
        >
          {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
          Enregistrer les modifications
        </Button>
      </div>
    </form>
  );
}

// ── Point d'entrée ────────────────────────────────────────────

export function UserForm(props: UserFormProps) {
  if (props.mode === "create") {
    return <CreateUserForm availableRoles={props.availableRoles} />;
  }
  return <EditUserForm user={props.user} />;
}
