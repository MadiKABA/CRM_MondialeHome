export interface SmsClientData {
  firstName: string;
}

export interface SmsCampaignVars {
  produit?: string | null;
  reduction?: string | null;
}

export function personalizeSmsMessage(
  message: string,
  client: SmsClientData,
  campaignVars?: SmsCampaignVars
): string {
  const replacements: Record<string, string> = {
    "{{prenom}}": client.firstName ?? "",
    "{{produit}}": campaignVars?.produit ?? "",
    "{{reduction}}": campaignVars?.reduction ?? "",
  };

  return Object.entries(replacements).reduce(
    (result, [variable, value]) => result.replaceAll(variable, value),
    message
  );
}
