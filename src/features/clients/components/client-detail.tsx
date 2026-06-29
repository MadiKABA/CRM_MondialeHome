"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Pencil,
  Phone,
  Mail,
  MapPin,
  MessageSquare,
  Star,
  ShoppingBag,
  Globe,
  Tag,
  UserCheck,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ClientAvatar } from "./client-avatar";
import { StatusChangeDropdown } from "./status-change-dropdown";
import { ConsentSection } from "./consent-section";
import { SellerAssignment } from "./seller-assignment";
import { DeleteClientDialog } from "./delete-client-dialog";
import { RFMBadge, RFMScoreDetail, RecalculateRFMButton } from "./rfm-badge";
import { toggleClientVip } from "../server/actions";
import type {
  ClientDetailDTO,
  ClientListItemDTO,
  ConsentLogDTO,
  SellerDTO,
} from "../types";

interface ClientDetailProps {
  client: ClientDetailDTO;
  consentLogs: ConsentLogDTO[];
  sellers: SellerDTO[];
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="text-text-secondary w-28 shrink-0 text-xs">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export function ClientDetail({ client, consentLogs, sellers }: ClientDetailProps) {
  const router = useRouter();
  const [toDelete, setToDelete] = useState(false);
  const [vipLoading, setVipLoading] = useState(false);

  const handleToggleVip = async () => {
    setVipLoading(true);
    const result = await toggleClientVip(client.id, !client.isVip);
    setVipLoading(false);
    if (result.success) {
      toast.success(client.isVip ? "Statut VIP retiré" : "Statut VIP accordé");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  };

  const formatDate = (d: Date | null | undefined) =>
    d ? new Date(d).toLocaleDateString("fr-FR") : null;

  const formatPhone = (p: string | null) => {
    if (!p) return null;
    return p.replace(/(\+221)(\d{2})(\d{3})(\d{2})(\d{2})/, "$1 $2 $3 $4 $5");
  };

  const currentSeller = client.assignedTo ?? null;

  return (
    <div className="space-y-6">
      {/* Profil card */}
      <Card className="border-border">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-start gap-4">
            <ClientAvatar name={client.fullName} id={client.id} size="lg" />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-heading text-2xl font-bold">{client.fullName}</h1>
                <StatusChangeDropdown
                  clientId={client.id}
                  currentStatus={client.status}
                  clientName={client.fullName}
                />
                {client.isVip && (
                  <Badge className="bg-gold-deep border-0 text-xs font-medium text-white">
                    VIP
                  </Badge>
                )}
              </div>
              {client.reference && (
                <p className="text-text-secondary font-mono text-sm">
                  {client.reference}
                </p>
              )}

              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                {client.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="text-text-secondary size-3.5" />
                    <span className="font-mono">{formatPhone(client.phone)}</span>
                  </span>
                )}
                {client.email && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="text-text-secondary size-3.5" />
                    {client.email}
                  </span>
                )}
                {(client.city || client.district) && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="text-text-secondary size-3.5" />
                    {[client.district, client.city].filter(Boolean).join(", ")}
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleVip}
                disabled={vipLoading}
                className={
                  client.isVip
                    ? "border-gold-light text-gold-deep hover:bg-gold-light/30"
                    : "border-border text-text-secondary hover:bg-cream"
                }
              >
                <Star className={`size-4 ${client.isVip ? "fill-current" : ""}`} />
                {client.isVip ? "Retirer VIP" : "VIP"}
              </Button>
              <Button
                size="sm"
                className="bg-gold-deep hover:bg-gold-darker text-white"
                render={<Link href={`/clients/${client.id}/edit`} />}
              >
                <Pencil className="size-4" />
                Modifier
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Statistiques d'achat */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <ShoppingBag className="text-gold-deep size-4" />
              {"Statistiques d'achat"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-text-secondary text-sm">Total dépensé</span>
              <span className="font-heading text-lg font-bold">
                {client.totalSpent.toLocaleString("fr-FR")}{" "}
                <span className="text-text-secondary text-xs font-normal">FCFA</span>
              </span>
            </div>
            <Separator className="bg-cream-darker" />
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Commandes</span>
                <span className="font-medium">{client.totalOrders}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Panier moyen</span>
                <span className="font-medium">
                  {client.averageBasket > 0
                    ? client.averageBasket.toLocaleString("fr-FR") + " FCFA"
                    : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Premier achat</span>
                <span className="font-medium">
                  {formatDate(client.firstPurchaseAt) ?? "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Dernier achat</span>
                <span className="font-medium">
                  {formatDate(client.lastPurchaseAt) ?? "—"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Score RFM */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm font-semibold">
              <span className="flex items-center gap-2">
                <Shield className="text-gold-deep size-4" />
                Score RFM
              </span>
              <RFMBadge profile={client.rfmScore} />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <RFMScoreDetail
              r={client.rfmRecency}
              f={client.rfmFrequency}
              m={client.rfmMonetary}
              calculatedAt={client.rfmCalculatedAt}
            />
            <RecalculateRFMButton clientId={client.id} />
          </CardContent>
        </Card>

        {/* Informations */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Globe className="text-gold-deep size-4" />
              Informations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <InfoRow label="Source" value={client.source} />
            <InfoRow label="Détails" value={client.sourceDetails} />
            <InfoRow
              label="Langue"
              value={
                client.language === "fr"
                  ? "Français"
                  : client.language === "wo"
                    ? "Wolof"
                    : "Anglais"
              }
            />
            <InfoRow
              label="Canal préféré"
              value={
                client.preferredChannel === "sms"
                  ? "SMS"
                  : client.preferredChannel === "whatsapp"
                    ? "WhatsApp"
                    : client.preferredChannel === "email"
                      ? "Email"
                      : null
              }
            />
            <InfoRow label="Inscription" value={formatDate(client.acquisitionDate)} />
            {client.address && <InfoRow label="Adresse" value={client.address} />}
            {client.region && <InfoRow label="Région" value={client.region} />}
          </CardContent>
        </Card>

        {/* Notes et tags */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <MessageSquare className="text-gold-deep size-4" />
              Notes & Tags
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {client.notes ? (
              <p className="text-sm leading-relaxed">{client.notes}</p>
            ) : (
              <p className="text-text-secondary text-sm italic">Aucune note</p>
            )}
            {client.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {client.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="border-gold/20 bg-gold-light/40 text-gold-darker text-xs"
                  >
                    <Tag className="size-2.5" />
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Consentements */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Shield className="text-gold-deep size-4" />
            Consentements Marketing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ConsentSection
            clientId={client.id}
            smsConsent={client.smsConsent}
            whatsappConsent={client.whatsappConsent}
            emailConsent={client.emailConsent}
            consentLogs={consentLogs}
          />
        </CardContent>
      </Card>

      {/* Vendeur assigné */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <UserCheck className="text-gold-deep size-4" />
            Vendeur attitré
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SellerAssignment
            clientId={client.id}
            currentSeller={currentSeller}
            sellers={sellers}
          />
        </CardContent>
      </Card>

      {/* Bouton supprimer */}
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setToDelete(true)}
          className="text-destructive hover:bg-destructive/10"
        >
          Supprimer ce client
        </Button>
      </div>

      <DeleteClientDialog
        client={client as ClientListItemDTO}
        open={toDelete}
        onOpenChange={setToDelete}
      />
    </div>
  );
}
