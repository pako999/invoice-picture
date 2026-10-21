import { z } from "zod";
import { paymentIban } from "@/lib/invoice-intelligence/sepa";

export const companyBankProfileSchema = z.object({
  name: z.string().trim().max(70),
  iban: z.string().max(50).transform(v => v.replace(/\s/g, "").toUpperCase()),
  bic: z.string().trim().max(11).transform(v => v.toUpperCase()),
  city: z.string().trim().max(35),
  country: z.string().trim().length(2).transform(v => v.toUpperCase()),
}).superRefine((data, ctx) => {
  if (!/^[A-Z]{2}$/.test(data.country)) ctx.addIssue({ code: "custom", path: ["country"], message: "Državo vpišite z dvema črkama, npr. SI." });
  if (data.iban) { try { paymentIban(data.iban); } catch { ctx.addIssue({ code: "custom", path: ["iban"], message: "IBAN nima pravilne dolžine, oblike ali kontrolne številke." }); } }
  if (data.bic && !/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(data.bic)) ctx.addIssue({ code: "custom", path: ["bic"], message: "BIC/SWIFT mora imeti 8 ali 11 znakov." });
  if (data.iban && (!data.name || !data.city)) ctx.addIssue({ code: "custom", message: "Ob IBAN-u vnesite tudi naziv in mesto plačnika." });
  if ([data.name, data.city].some(v => /[\u0000-\u001f\u007f]/.test(v))) ctx.addIssue({ code: "custom", message: "Naziv in mesto vsebujeta neveljavne znake." });
});

export type CompanyBankProfile = z.infer<typeof companyBankProfileSchema>;

export function companyBankProfile(company: { name: string; bankPayerName: string | null; bankIban: string | null; bankBic: string | null; bankCity: string | null; bankCountry: string | null }): CompanyBankProfile {
  return { name: company.bankPayerName ?? company.name, iban: company.bankIban ?? "", bic: company.bankBic ?? "", city: company.bankCity ?? "", country: company.bankCountry ?? "SI" };
}
