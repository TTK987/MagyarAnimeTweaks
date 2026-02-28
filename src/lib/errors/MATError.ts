/**
 * Error Code Format: MAT-{CATEGORY}{CODE}
 * Example: MAT-V001 (Video - No sources found)
 *
 * Categories:
 * - C: CSRF related errors
 * - S: Server/Network errors
 * - V: Video/Player errors
 * - P: Player initialization errors
 * - I: Internal/Extension errors
 */

export type ErrorCategory = 'C' | 'S' | 'V' | 'P' | 'I';

export interface MATErrorDetails {
    /** Short error code (e.g., MAT-V001) */
    code: string;
    /** Category of the error */
    category: ErrorCategory;
    /** Numeric code within category */
    numericCode: number;
    /** User-friendly error message in Hungarian */
    message: string;
    /** Possible solutions/suggestions */
    suggestions: string[];
    /** Whether auto-reload might fix the issue */
    canAutoReload: boolean;
    /** Whether user should report this error */
    shouldReport: boolean;
}

export interface MATErrorContext {
    /** Episode ID if available */
    episodeId?: number;
    /** Current server (s1, s2, etc.) */
    server?: string;
    /** Additional context data */
    data?: Record<string, unknown>;
    /** Stack trace */
    stack?: string;
    /** Original error if any */
    originalError?: Error | unknown;
    /** Location identifier (for finding in code) */
    location?: string;
}

/**
 * Error Catalog - All possible errors with their details
 *
 * Code ranges per category:
 * - C001-C099: CSRF errors
 * - S001-S099: Server/Network errors
 * - V001-V099: Video/Player errors
 * - P001-P099: Player initialization errors
 * - I001-I099: Internal/Extension errors
 */
export const ERROR_CATALOG: Record<string, MATErrorDetails> = {
    // ═══════════════════════════════════════════════════════════════
    // CSRF Errors (C001-C099)
    // ═══════════════════════════════════════════════════════════════
    'C001': {
        code: 'MAT-C001',
        category: 'C',
        numericCode: 1,
        message: 'A CSRF-token nem található.',
        suggestions: [
            'Töltsd újra az oldalt',
        ],
        canAutoReload: true,
        shouldReport: false
    },
    'C002': {
        code: 'MAT-C002',
        category: 'C',
        numericCode: 2,
        message: 'A CSRF-token lejárt.',
        suggestions: [
            'Az oldal automatikusan újratöltődik',
            'Ha nem, töltsd újra manuálisan'
        ],
        canAutoReload: true,
        shouldReport: false
    },

    // ═══════════════════════════════════════════════════════════════
    // Server/Network Errors (S001-S099)
    // ═══════════════════════════════════════════════════════════════
    'S001': {
        code: 'MAT-S001',
        category: 'S',
        numericCode: 1,
        message: 'A szerver nem található.',
        suggestions: [
            'Próbálj meg másik szervert választani',
        ],
        canAutoReload: true,
        shouldReport: true
    },
    'S002': {
        code: 'MAT-S002',
        category: 'S',
        numericCode: 2,
        message: 'Érvénytelen szerver.',
        suggestions: [
            'Válassz egy másik szervert a listából',
            'Töltsd újra az oldalt'
        ],
        canAutoReload: true,
        shouldReport: true
    },
    'S003': {
        code: 'MAT-S003',
        category: 'S',
        numericCode: 3,
        message: 'A szerver adatai nem találhatók.',
        suggestions: [
            'Próbálj meg másik szervert választani',
            'Töltsd újra az oldalt'
        ],
        canAutoReload: true,
        shouldReport: true
    },
    'S004': {
        code: 'MAT-S004',
        category: 'S',
        numericCode: 4,
        message: 'Hiba történt a szerver válaszában.',
        suggestions: [
            'Próbáld újra néhány másodperc múlva',
            'Válassz másik szervert'
        ],
        canAutoReload: true,
        shouldReport: true
    },
    'S005': {
        code: 'MAT-S005',
        category: 'S',
        numericCode: 5,
        message: 'Hálózati hiba történt.',
        suggestions: [
            'Ellenőrizd az internetkapcsolatodat',
            'Próbáld újra néhány másodperc múlva',
            'Ha VPN-t használsz, próbáld kikapcsolni'
        ],
        canAutoReload: true,
        shouldReport: false
    },
    'S007': {
        code: 'MAT-S007',
        category: 'S',
        numericCode: 7,
        message: 'Érvénytelen paraméterek.',
        suggestions: [
            'Töltsd újra az oldalt',
            'Ha a probléma fennáll, jelezd a hibát'
        ],
        canAutoReload: true,
        shouldReport: true
    },

    // ═══════════════════════════════════════════════════════════════
    // Video/Player Errors (V001-V099)
    // ═══════════════════════════════════════════════════════════════
    'V001': {
        code: 'MAT-V001',
        category: 'V',
        numericCode: 1,
        message: 'A videólejátszó nem található.',
        suggestions: [
            'Töltsd újra az oldalt',
        ],
        canAutoReload: true,
        shouldReport: true
    },
    'V002': {
        code: 'MAT-V002',
        category: 'V',
        numericCode: 2,
        message: 'Nem találhatók videóforrások.',
        suggestions: [
            'Válassz másik szervert',
            'Jelents be a hibát a MagyarAnime-nek'
        ],
        canAutoReload: false,
        shouldReport: true
    },
    'V003': {
        code: 'MAT-V003',
        category: 'V',
        numericCode: 3,
        message: 'Az iframe nem található.',
        suggestions: [
            'Válassz másik szervert',
            'Töltsd újra az oldalt'
        ],
        canAutoReload: true,
        shouldReport: true
    },
    'V004': {
        code: 'MAT-V004',
        category: 'V',
        numericCode: 4,
        message: 'Hiba történt a videóadatok betöltése közben.',
        suggestions: [
            'Válassz másik szervert',
            'Töltsd újra az oldalt'
        ],
        canAutoReload: true,
        shouldReport: true
    },
    'V005': {
        code: 'MAT-V005',
        category: 'V',
        numericCode: 5,
        message: 'Nem támogatott lejátszótípus.',
        suggestions: [
            'Válassz másik szervert',
        ],
        canAutoReload: false,
        shouldReport: true
    },
    'V006': {
        code: 'MAT-V006',
        category: 'V',
        numericCode: 6,
        message: 'Hiba történt a videó letöltése közben.',
        suggestions: [
            'Próbáld újra',
        ],
        canAutoReload: false,
        shouldReport: false
    },
    'V008': {
        code: 'MAT-V008',
        category: 'V',
        numericCode: 8,
        message: 'A videó törölve lett.',
        suggestions: [
            'Válassz másik szervert',
            'Jelents be a hibát a MagyarAnime-nak'
        ],
        canAutoReload: false,
        shouldReport: true
    },

    // ═══════════════════════════════════════════════════════════════
    // Player Initialization Errors (P001-P099)
    // ═══════════════════════════════════════════════════════════════
    'P001': {
        code: 'MAT-P001',
        category: 'P',
        numericCode: 1,
        message: 'Hiba történt a lejátszó inicializálásakor.',
        suggestions: [
            'Töltsd újra az oldalt',
            'Ellenőrizd, hogy nincs-e ütköző bővítmény'
        ],
        canAutoReload: true,
        shouldReport: true
    },
    'P002': {
        code: 'MAT-P002',
        category: 'P',
        numericCode: 2,
        message: 'Hiba történt a videó betöltése közben.',
        suggestions: [
            'Válassz másik szervert',
            'Töltsd újra az oldalt'
        ],
        canAutoReload: true,
        shouldReport: true
    },

    // ═══════════════════════════════════════════════════════════════
    // Internal/Extension Errors (I001-I099)
    // ═══════════════════════════════════════════════════════════════
    'I001': {
        code: 'MAT-I001',
        category: 'I',
        numericCode: 1,
        message: 'Hiba történt a bővítmény inicializálásakor.',
        suggestions: [
            'Töltsd újra az oldalt',
            'Próbáld meg kikapcsolni majd visszakapcsolni a bővítményt',
            'Ha a probléma fennáll, telepítsd újra a bővítményt'
        ],
        canAutoReload: true,
        shouldReport: true
    },
    'I003': {
        code: 'MAT-I003',
        category: 'I',
        numericCode: 3,
        message: 'Ismeretlen hiba történt.',
        suggestions: [
            'Töltsd újra az oldalt',
            'Ha a probléma fennáll, jelezd a hibát a hibakóddal együtt'
        ],
        canAutoReload: true,
        shouldReport: true
    }
};

export type MATErrorKey = keyof typeof ERROR_CATALOG;

export const ERROR_CODE_MAP = {
    CSRF: {
        NOT_FOUND: 'C001',
        EXPIRED: 'C002',
    },
    SERVER: {
        NOT_FOUND: 'S001',
        INVALID: 'S002',
        DATA_MISSING: 'S003',
        RESPONSE_ERROR: 'S004',
        FETCH_ERROR: 'S005',
        INVALID_ARGS: 'S007',
    },
    VIDEO: {
        PLAYER_NOT_FOUND: 'V001',
        NO_SOURCES: 'V002',
        IFRAME_MISSING: 'V003',
        DATA_ERROR: 'V004',
        INVALID_TYPE: 'V005',
        DOWNLOAD_ERROR: 'V006',
        REMOVED: 'V008',
    },
    PLAYER: {
        INIT_ERROR: 'P001',
        LOAD_ERROR: 'P002',
    },
    INTERNAL: {
        INIT_ERROR: 'I001',
        UNKNOWN_ERROR: 'I003',
    },
} as const satisfies Record<string, Record<string, MATErrorKey>>;

export type ErrorArea = keyof typeof ERROR_CODE_MAP;
export type ErrorTypeByArea<A extends ErrorArea> = keyof (typeof ERROR_CODE_MAP)[A];

/**
 * Get error details by error key
 */
export function getErrorDetails(errorKey: string): MATErrorDetails {
    return ERROR_CATALOG[errorKey] || ERROR_CATALOG['I003'];
}

/**
 * Generate full error code with context
 * Format: MAT-{CAT}{NUM} | EP{episodeId}-{SERVER}
 */
export function generateFullErrorCode(errorKey: string, context?: MATErrorContext): string {
    const details = getErrorDetails(errorKey);
    let fullCode = details.code;

    if (context?.episodeId || context?.server) {
        const epPart = context.episodeId ? `EP${context.episodeId}` : 'EP?';
        const serverPart = context.server ? context.server.toUpperCase() : '?';
        fullCode += ` | ${epPart}-${serverPart}`;
    }

    if (context?.location) {
        fullCode += ` @ ${context.location}`;
    }

    return fullCode;
}

/**
 * Create a detailed error report
 */
export function generateErrorReport(errorKey: string, context?: MATErrorContext): string {
    const details = getErrorDetails(errorKey);
    const fullCode = generateFullErrorCode(errorKey, context);

    let report = `═══════════════════════════════════════════════════════════════\n`;
    report += `MATweaks Hiba Jelentés\n`;
    report += `═══════════════════════════════════════════════════════════════\n\n`;
    report += `Hibakód: ${fullCode}\n`;
    report += `Kategória: ${getCategoryName(details.category)}\n`;
    report += `Üzenet: ${details.message}\n\n`;

    if (context?.location) {
        report += `Hiba helye: ${context.location}\n`;
    }

    if (context?.episodeId) {
        report += `Epizód ID: ${context.episodeId}\n`;
    }

    if (context?.server) {
        report += `Szerver: ${context.server}\n`;
    }

    if (context?.data) {
        report += `\nKontextus adatok:\n${JSON.stringify(context.data, null, 2)}\n`;
    }

    if (context?.stack) {
        report += `\nStack trace:\n${context.stack}\n`;
    }

    if (context?.originalError) {
        const errMsg = context.originalError instanceof Error
            ? context.originalError.message
            : String(context.originalError);
        report += `\nEredeti hiba: ${errMsg}\n`;
    }

    report += `\n═══════════════════════════════════════════════════════════════\n`;
    report += `Böngésző: ${navigator.userAgent}\n`;
    report += `URL: ${window.location.href}\n`;
    report += `Bővítmény verzió: ${chrome.runtime.getManifest?.()?.version || 'N/A'}\n`;
    report += `═══════════════════════════════════════════════════════════════\n`;

    return report;
}

/**
 * Get human-readable category name
 */
function getCategoryName(category: ErrorCategory): string {
    const names: Record<ErrorCategory, string> = {
        'C': 'CSRF / Biztonság',
        'S': 'Szerver / Hálózat',
        'V': 'Videó / Forrás',
        'P': 'Lejátszó',
        'I': 'Belső / Bővítmény'
    };
    return names[category] || 'Ismeretlen';
}

/**
 * MATError class for throwing typed errors
 */
export class MATError extends Error {
    public readonly errorKey: string;
    public readonly details: MATErrorDetails;
    public readonly context: MATErrorContext;
    public readonly fullCode: string;

    constructor(errorKey: string, context?: MATErrorContext) {
        const details = getErrorDetails(errorKey);
        const fullCode = generateFullErrorCode(errorKey, context);

        super(`[${fullCode}] ${details.message}`);

        this.name = 'MATError';
        this.errorKey = errorKey;
        this.details = details;
        this.context = {
            ...context,
            stack: new Error().stack
        };
        this.fullCode = fullCode;

        // Maintain proper stack trace in V8 engines
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, MATError);
        }
    }

    /**
     * Get the full error report
     */
    getReport(): string {
        return generateErrorReport(this.errorKey, this.context);
    }
}
