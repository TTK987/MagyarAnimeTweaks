/**
 * MATweaks Error System - Main exports
 */

export {
    MATError,
    ERROR_CATALOG,
    getErrorDetails,
    generateFullErrorCode,
    generateErrorReport
} from './MATError';

export type {
    ErrorCategory,
    MATErrorDetails,
    MATErrorContext
} from './MATError';

export {
    showMATError,
    renderErrorDisplay
} from './ErrorDisplay';

export type { ErrorDisplayOptions } from './ErrorDisplay';

