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

const KNOWN_ISO = /\b(USD|EUR|GBP|NOK|SEK|DKK|CHF|PLN|CAD|AUD|JPY)\b/;

export function normalizeCurrencyCode(
  raw: string | undefined,
): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const upper = trimmed.toUpperCase();
  if (/^[A-Z]{3}$/.test(upper)) return upper;
  const iso = upper.match(KNOWN_ISO);
  if (iso) return iso[1];
  if (trimmed === "$" || upper === "US$" || upper === "USD$" || /\$/.test(trimmed)) {
    return "USD";
  }
  if (trimmed === "€" || trimmed.includes("€")) return "EUR";
  if (trimmed === "£" || trimmed.includes("£")) return "GBP";
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

const NIKE_PREFIX =
  /^\/(us|gb|no|se|dk|de|fr|it|es|nl|ie|pl|fi|at|be|ch)(?=\/|$)/i;

function zalandoHostFor(country: string): string {
  return country === "gb" ? "zalando.co.uk" : `zalando.${country}`;
}

function countryTld(country: string): string {
  if (country === "gb") return ".co.uk";
  return `.${country}`;
}

export function isLocalMarketUrl(raw: string, country: string): boolean {
  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");

    if (host.includes("zalando.")) {
      return host === zalandoHostFor(country);
    }

    if (host === "zara.com" || host.endsWith(".zara.com")) {
      return url.pathname.toLowerCase().startsWith(`/${country}/`);
    }

    if (host === "nike.com" || host.endsWith(".nike.com")) {
      const pathCountry = url.pathname.match(NIKE_PREFIX)?.[1]?.toLowerCase();
      if (country === "us") return !pathCountry || pathCountry === "us";
      return pathCountry === country;
    }

    return host.endsWith(countryTld(country));
  } catch {
    return false;
  }
}
