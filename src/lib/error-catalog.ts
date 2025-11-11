// Centralized error codes and messages used across the content script.
// Keeping these here reduces the size of content.ts and makes errors reusable.

export const ERROR_CODES = {
  CSRF: {
    NOT_FOUND: "001",
    EXPIRED: "002",
  },
  SERVER: {
    NOT_FOUND: "001",
    INVALID: "002",
    DATA_MISSING: "003",
    RESPONSE_ERROR: "004",
  },
  VIDEO: {
    PLAYER_NOT_FOUND: "001",
    NO_SOURCES: "002",
    IFRAME_MISSING: "003",
    DATA_ERROR: "004",
    INVALID_TYPE: "005",
    DOWNLOAD_ERROR: "006",
    TOKEN_EXPIRED: "007",
  },
  REQUEST: {
    INVALID_ARGS: "001",
    FETCH_ERROR: "002",
    RESPONSE_ERROR: "003",
    TIMEOUT: "004",
  },
  PLAYER: {
    INIT_ERROR: "001",
    LOAD_ERROR: "002",
    TYPE_ERROR: "003",
  },
} as const;

export const ERROR_MESSAGES = {
  CSRF: {
    NOT_FOUND: "A CSRF-token nem található.",
    EXPIRED: "A CSRF-token lejárt, az oldal újratöltése szükséges...",
  },
  SERVER: {
    NOT_FOUND: "A szerver nem található.",
    INVALID: "Érvénytelen szerver.",
    DATA_MISSING: "A szerver adatai nem találhatók.",
    RESPONSE_ERROR: "Hiba történt a szerver válaszában.",
  },
  VIDEO: {
    PLAYER_NOT_FOUND: "A videólejátszó nem található.",
    NO_SOURCES: "Nem találhatók videóforrások.",
    IFRAME_MISSING: "Az iframe nem található.",
    DATA_ERROR: "Hiba történt a videóadatok betöltése közben.",
    INVALID_TYPE: "Nem támogatott lejátszótípus.",
    DOWNLOAD_ERROR: "Hiba történt a videó letöltése közben.",
    TOKEN_EXPIRED: "A videó token lejárt, az oldal újratöltése szükséges.",
  },
  REQUEST: {
    INVALID_ARGS: "Érvénytelen argumentumok.",
    FETCH_ERROR: "Hálózati hiba történt.",
    RESPONSE_ERROR: "Hiba a szerverrel való kommunikáció során.",
    TIMEOUT: "A kérés időtúllépés miatt megszakadt.",
  },
  PLAYER: {
    INIT_ERROR: "Hiba történt a lejátszó inicializálásakor.",
    LOAD_ERROR: "Hiba történt a videó betöltése közben.",
    TYPE_ERROR: "Érvénytelen lejátszótípus.",
  },
} as const;

export type ErrorAreas = keyof typeof ERROR_CODES;
