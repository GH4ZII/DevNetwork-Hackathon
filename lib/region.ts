const TZ_COUNTRY: Record<string, string> = {
  "Europe/Oslo": "no",
  "Europe/Stockholm": "se",
  "Europe/Copenhagen": "dk",
  "Europe/Helsinki": "fi",
  "Europe/Berlin": "de",
  "Europe/Paris": "fr",
  "Europe/Amsterdam": "nl",
  "Europe/Rome": "it",
  "Europe/Madrid": "es",
  "Europe/London": "gb",
  "Europe/Dublin": "ie",
  "Europe/Vienna": "at",
  "Europe/Zurich": "ch",
  "Europe/Brussels": "be",
  "Europe/Warsaw": "pl",
};

const COUNTRY_CURRENCY: Record<string, string> = {
  no: "NOK",
  se: "SEK",
  dk: "DKK",
  fi: "EUR",
  de: "EUR",
  fr: "EUR",
  nl: "EUR",
  it: "EUR",
  es: "EUR",
  at: "EUR",
  be: "EUR",
  ie: "EUR",
  pl: "PLN",
  ch: "CHF",
  gb: "GBP",
  us: "USD",
};

const COUNTRY_LOCALE: Record<string, string> = {
  no: "nb-NO",
  se: "sv-SE",
  dk: "da-DK",
  fi: "fi-FI",
  de: "de-DE",
  fr: "fr-FR",
  nl: "nl-NL",
  it: "it-IT",
  es: "es-ES",
  at: "de-AT",
  be: "nl-BE",
  ie: "en-IE",
  pl: "pl-PL",
  ch: "de-CH",
  gb: "en-GB",
  us: "en-US",
};

export function deviceCountry(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && TZ_COUNTRY[tz]) return TZ_COUNTRY[tz];
  } catch {
    // ignore
  }

  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    const region = locale.match(/[-_]([A-Za-z]{2})$/)?.[1]?.toLowerCase();
    if (region && /^[a-z]{2}$/.test(region)) {
      return region === "uk" ? "gb" : region;
    }
  } catch {
    // ignore
  }

  return "no";
}

export function currencyForCountry(country: string): string {
  return COUNTRY_CURRENCY[country] ?? "NOK";
}

export function localeForCountry(country: string): string {
  return COUNTRY_LOCALE[country] ?? "nb-NO";
}

export function normalizeCurrencyCode(
  raw: string | undefined,
  country: string,
): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const upper = trimmed.toUpperCase();
  if (/^[A-Z]{3}$/.test(upper)) return upper;
  if (trimmed === "$" || upper === "US$" || upper === "USD$") return "USD";
  if (trimmed === "€") return "EUR";
  if (trimmed === "£") return "GBP";
  if (/^kr\.?$/i.test(trimmed)) return currencyForCountry(country);
  return undefined;
}

export function formatMoney(
  value: number,
  currency: string,
  country: string,
): string {
  const locale = localeForCountry(country);
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: value % 1 === 0 ? 0 : 2,
    }).format(value);
  } catch {
    return `${value} ${currency}`;
  }
}
