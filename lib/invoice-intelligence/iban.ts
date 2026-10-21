/** Shared client/server IBAN checks, without Node.js or environment dependencies. */
export function validateIban(value: string | null | undefined) {
  if (!value) return true;
  const compact = value.replace(/\s/g, "").toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(compact)) return false;
  let remainder = 0;
  for (const char of compact.slice(4) + compact.slice(0, 4)) {
    const chunk = /[A-Z]/.test(char) ? String(char.charCodeAt(0) - 55) : char;
    for (const digit of chunk) remainder = (remainder * 10 + Number(digit)) % 97;
  }
  return remainder === 1;
}

const ibanLengths: Record<string, number> = { SI:19, AT:20, DE:22, HR:21, IT:27, FR:27, BE:16, NL:18, ES:24, PT:25, IE:22, FI:18, EE:20, LV:21, LT:20, LU:20, SK:24, CZ:24, PL:28, HU:28, RO:24, BG:22, GR:27, CY:28, MT:31, CH:21, LI:21, GB:22, NO:15, DK:18, SE:24, IS:26 };
export function paymentIbanError(value: string | null | undefined, role: "plačnika" | "prejemnika") {
  const iban = (value || "").replace(/\s/g, "").toUpperCase();
  if (!iban) return role === "prejemnika" ? "Manjka IBAN prejemnika. Dopolnite IBAN dobavitelja v podatkih računa, nato shranite in znova potrdite račun." : "Vnesite svoj IBAN plačnika.";
  if (!validateIban(iban) || (ibanLengths[iban.slice(0, 2)] && iban.length !== ibanLengths[iban.slice(0, 2)])) return `IBAN ${role} ni veljaven. Preverite kontrolno številko in dolžino.`;
  return null;
}
