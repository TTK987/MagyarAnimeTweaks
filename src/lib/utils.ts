import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: (string | boolean | undefined)[]) {
    return twMerge(clsx(inputs))
}

/**
 * Converts a file size in bytes to a human-readable format.
 * @param {number} size - The file size in bytes.
 * @returns {string} The formatted file size.
 */
export function prettyFileSize(size: number): string {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
    if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(2)} MB`;
    return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

