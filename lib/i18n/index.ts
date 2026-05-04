// Public entry: getDict(locale) and the Locale type.
// Server components import from here directly.
import sl from "./sl";
import en from "./en";
import { defaultLocale, type Locale } from "./config";

export type { Locale };
export { defaultLocale };

const dicts = { sl, en };

export function getDict(locale: Locale | undefined) {
  return dicts[locale ?? defaultLocale];
}

export type Dict = typeof sl;
