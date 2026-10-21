import { randomUUID } from "node:crypto";
import type { NormalizedInvoice } from "./types";
import { validateIban } from "./validation";

export type SepaPayer = { name: string; iban: string; city: string; country: string; executionDate: string };
const ibanLengths: Record<string, number> = { SI:19, AT:20, DE:22, HR:21, IT:27, FR:27, BE:16, NL:18, ES:24, PT:25, IE:22, FI:18, EE:20, LV:21, LT:20, LU:20, SK:24, CZ:24, PL:28, HU:28, RO:24, BG:22, GR:27, CY:28, MT:31, CH:21, LI:21, GB:22, NO:15, DK:18, SE:24, IS:26 };
export function paymentIban(value: string | null | undefined) {
  const iban = (value || "").replace(/\s/g, "").toUpperCase();
  if (!iban || !validateIban(iban) || (ibanLengths[iban.slice(0,2)] && iban.length !== ibanLengths[iban.slice(0,2)])) throw new Error("Preverite IBAN plačnika in prejemnika (kontrolna številka ali dolžina ni pravilna).");
  return iban;
}
export function bankDate(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone:"Europe/Ljubljana", year:"numeric",month:"2-digit",day:"2-digit" }).format(now);
}
function text(value: string | null | undefined, max: number, label: string) {
  const result = (value || "").trim();
  if (!result || result.length > max || /[\u0000-\u001f\u007f]/.test(result)) throw new Error(`Preverite podatek: ${label}.`);
  return result;
}
function xml(value: string) { return value.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;"); }
function referenceXml(reference: string | null, purpose: string) {
  if (!reference?.trim()) return `<RmtInf><Ustrd>${xml(purpose)}</Ustrd></RmtInf>`;
  const original = text(reference, 140, "sklic");
  const ref = original.replace(/\s/g, "").toUpperCase();
  if (ref.startsWith("RF")) {
    if (!/^RF\d{2}[A-Z0-9]{1,21}$/.test(ref)) throw new Error("RF sklic ni pravilne oblike.");
    let remainder = 0;
    for (const c of ref.slice(4) + ref.slice(0,4)) for (const digit of /[A-Z]/.test(c) ? String(c.charCodeAt(0)-55) : c) remainder = (remainder*10+Number(digit))%97;
    if (remainder !== 1) throw new Error("RF sklic nima pravilne kontrolne številke.");
  } else if (ref.startsWith("SI")) {
    if (!/^SI\d{2}[0-9-]{0,22}$/.test(ref)) throw new Error("SI sklic ni pravilne oblike. Preverite model in sklic na računu.");
  } else {
    return `<RmtInf><Ustrd>${xml(original)}</Ustrd></RmtInf>`;
  }
  return `<RmtInf><Strd><CdtrRefInf><Tp><CdOrPrtry><Cd>SCOR</Cd></CdOrPrtry>${ref.startsWith("RF")?"<Issr>ISO</Issr>":""}</Tp><Ref>${xml(ref)}</Ref></CdtrRefInf><AddtlRmtInf>${xml(purpose)}</AddtlRmtInf></Strd></RmtInf>`;
}

/** Creates a bank-import file only; never executes or marks a payment as paid. */
export function generateSepaPayment(invoice: NormalizedInvoice, payer: SepaPayer, now = new Date()) {
  if (invoice.documentType !== "invoice") throw new Error("SEPA izvoz je na voljo za račune, ne za dobropise ali ponudbe.");
  if (invoice.currency !== "EUR") throw new Error("SEPA plačilo zahteva račun v valuti EUR.");
  // Never replace a missing/zero remaining balance with the full gross total.
  const rawAmount = invoice.totals.amountDue;
  if (!rawAmount || !/^\d{1,9}(?:\.\d{1,2})?$/.test(rawAmount) || Number(rawAmount) <= 0) throw new Error("Preverite preostali znesek za plačilo. Plačanih računov ali neznanega zneska ni mogoče izvoziti.");
  const amount = Number(rawAmount).toFixed(2);
  const debtorIban = paymentIban(payer.iban), creditorIban = paymentIban(invoice.supplier.iban);
  if (debtorIban === creditorIban) throw new Error("IBAN plačnika in prejemnika ne smeta biti enaka.");
  const name = text(payer.name, 70, "naziv plačnika"), city = text(payer.city,35,"mesto plačnika");
  const creditor = text(invoice.supplier.name,70,"naziv prejemnika"), creditorCity = text(invoice.supplier.city,35,"mesto prejemnika");
  const country = payer.country.toUpperCase(), creditorCountry = (invoice.supplier.countryCode || "").toUpperCase();
  if (!/^[A-Z]{2}$/.test(country) || !/^[A-Z]{2}$/.test(creditorCountry)) throw new Error("Vnesite dvočrkovno državo plačnika in prejemnika (npr. SI).");
  const date = payer.executionDate;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0,10) !== date || date < bankDate(now)) throw new Error("Datum izvršitve mora biti veljaven in ne sme biti v preteklosti.");
  const purpose = `Racun ${text(invoice.invoiceNumber,100,"številka računa")}`.slice(0,140);
  const id = `SR${randomUUID().replace(/-/g,"")}`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.09"><CstmrCdtTrfInitn>
<GrpHdr><MsgId>${id}</MsgId><CreDtTm>${now.toISOString()}</CreDtTm><NbOfTxs>1</NbOfTxs><CtrlSum>${amount}</CtrlSum><InitgPty><Nm>${xml(name)}</Nm></InitgPty></GrpHdr>
<PmtInf><PmtInfId>${id}</PmtInfId><PmtMtd>TRF</PmtMtd><NbOfTxs>1</NbOfTxs><CtrlSum>${amount}</CtrlSum><PmtTpInf><SvcLvl><Cd>SEPA</Cd></SvcLvl></PmtTpInf><ReqdExctnDt><Dt>${date}</Dt></ReqdExctnDt>
<Dbtr><Nm>${xml(name)}</Nm><PstlAdr><TwnNm>${xml(city)}</TwnNm><Ctry>${country}</Ctry></PstlAdr></Dbtr><DbtrAcct><Id><IBAN>${debtorIban}</IBAN></Id></DbtrAcct><DbtrAgt><FinInstnId><Othr><Id>NOTPROVIDED</Id></Othr></FinInstnId></DbtrAgt><ChrgBr>SLEV</ChrgBr>
<CdtTrfTxInf><PmtId><EndToEndId>${id}</EndToEndId></PmtId><Amt><InstdAmt Ccy="EUR">${amount}</InstdAmt></Amt><Cdtr><Nm>${xml(creditor)}</Nm><PstlAdr><TwnNm>${xml(creditorCity)}</TwnNm><Ctry>${creditorCountry}</Ctry></PstlAdr></Cdtr><CdtrAcct><Id><IBAN>${creditorIban}</IBAN></Id></CdtrAcct>${referenceXml(invoice.paymentReference,purpose)}</CdtTrfTxInf>
</PmtInf></CstmrCdtTrfInitn></Document>`;
}
