import { formatPhoneDisplay, getPhoneCountry, countryFlag } from "@/lib/phone";

interface PhoneDisplayProps {
  phone: string | null | undefined;
  className?: string;
}

/** Numéro E.164 affiché lisiblement avec le drapeau du pays : 🇸🇳 +221 77 123 45 67 */
export function PhoneDisplay({ phone, className }: PhoneDisplayProps) {
  if (!phone) return null;
  const country = getPhoneCountry(phone);
  return (
    <span className={className}>
      {country && (
        <span aria-hidden className="mr-1">
          {countryFlag(country)}
        </span>
      )}
      {formatPhoneDisplay(phone)}
    </span>
  );
}
