const ZALANDO_HOST: Record<string, string> = {
  no: "www.zalando.no",
  se: "www.zalando.se",
  dk: "www.zalando.dk",
  fi: "www.zalando.fi",
  de: "www.zalando.de",
  nl: "www.zalando.nl",
  fr: "www.zalando.fr",
  it: "www.zalando.it",
  es: "www.zalando.es",
  be: "www.zalando.be",
  at: "www.zalando.at",
  ch: "www.zalando.ch",
  pl: "www.zalando.pl",
  ie: "www.zalando.ie",
  gb: "www.zalando.co.uk",
};

const ZARA_LANG: Record<string, string> = {
  no: "no",
  se: "sv",
  dk: "da",
  fi: "fi",
  de: "de",
  fr: "fr",
  nl: "nl",
  it: "it",
  es: "es",
  be: "nl",
  at: "de",
  ch: "de",
  pl: "pl",
  ie: "en",
  gb: "en",
  us: "en",
};

const COUNTRY_HL: Record<string, string> = {
  no: "no",
  se: "sv",
  dk: "da",
  fi: "fi",
  de: "de",
  fr: "fr",
  nl: "nl",
  it: "it",
  es: "es",
  pl: "pl",
  ie: "en",
  gb: "en",
  us: "en",
  at: "de",
  be: "nl",
  ch: "de",
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

export function normalizeCountry(value: unknown): string {
  if (typeof value !== "string") return "no";
  const code = value.trim().toLowerCase();
  if (!/^[a-z]{2}$/.test(code)) return "no";
  return code === "uk" ? "gb" : code;
}

export function languageForCountry(country: string): string {
  return COUNTRY_HL[country] ?? "en";
}

export function currencyForCountry(country: string): string {
  return COUNTRY_CURRENCY[country] ?? "NOK";
}

export function countryTld(country: string): string {
  if (country === "gb") return ".co.uk";
  return `.${country}`;
}

export function localizeUrl(raw: string, country: string): string {
  try {
    const url = new URL(raw);
    localizeZalando(url, country);
    localizeZara(url, country);
    localizeNike(url, country);
    return url.toString();
  } catch {
    return raw;
  }
}

export function isLocalMarketUrl(raw: string, country: string): boolean {
  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");

    const zalandoHost = ZALANDO_HOST[country];
    if (zalandoHost && /(?:^|\.)zalando\./i.test(host)) {
      return host === zalandoHost.replace(/^www\./i, "").toLowerCase();
    }

    if (/(?:^|\.)zara\.com$/i.test(host)) {
      return url.pathname.toLowerCase().startsWith(`/${country}/`);
    }

    if (/(?:^|\.)nike\.com$/i.test(host)) {
      const pathCountry = url.pathname.match(NIKE_PREFIX)?.[1]?.toLowerCase();
      if (country === "us") return !pathCountry || pathCountry === "us";
      return pathCountry === country;
    }

    return host.endsWith(countryTld(country));
  } catch {
    return false;
  }
}

export function formatOfferPrice(
  value: number | undefined,
  currency: string | undefined,
  country: string,
  fallback?: string,
): string | undefined {
  if (typeof value === "number" && currency) {
    const locale = COUNTRY_LOCALE[country] ?? "nb-NO";
    try {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        maximumFractionDigits: value % 1 === 0 ? 0 : 2,
      }).format(value);
    } catch {
      return fallback;
    }
  }
  return fallback;
}

const KNOWN_ISO = /\b(USD|EUR|GBP|NOK|SEK|DKK|CHF|PLN|CAD|AUD|JPY)\b/;

export function inferCurrency(raw: string | undefined): string | undefined {
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

const NIKE_PREFIX =
  /^\/(us|gb|no|se|dk|de|fr|it|es|nl|ie|pl|fi|at|be|ch)(?=\/|$)/i;

function localizeZalando(url: URL, country: string): void {
  if (!/(?:^|\.)zalando\./i.test(url.hostname)) return;
  const host = ZALANDO_HOST[country];
  if (!host) return;
  const current = url.hostname.replace(/^www\./i, "").toLowerCase();
  const target = host.replace(/^www\./i, "").toLowerCase();
  if (current !== target) return;
  url.hostname = host;
}

function localizeZara(url: URL, country: string): void {
  if (!/(?:^|\.)zara\.com$/i.test(url.hostname)) return;
  const match = url.pathname.match(/^\/([a-z]{2})\/([a-z]{2})(\/.*)?$/i);
  if (!match || match[1].toLowerCase() !== country) return;
  const lang = ZARA_LANG[country] ?? "en";
  url.pathname = `/${country}/${lang}${match[3] ?? ""}`;
}

function localizeNike(url: URL, country: string): void {
  if (!/(?:^|\.)nike\.com$/i.test(url.hostname)) return;
  const pathCountry = url.pathname.match(NIKE_PREFIX)?.[1]?.toLowerCase();
  if (country === "us") {
    if (pathCountry && pathCountry !== "us") return;
    let path = url.pathname.replace(NIKE_PREFIX, "");
    if (!path.startsWith("/")) path = `/${path}`;
    url.pathname = path || "/";
    return;
  }
  if (pathCountry !== country) return;
  let path = url.pathname.replace(NIKE_PREFIX, "");
  if (!path.startsWith("/")) path = `/${path}`;
  url.pathname = `/${country}${path === "/" ? "" : path}`;
}
