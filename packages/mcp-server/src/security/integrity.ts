import crypto from 'node:crypto';
import { SecurityValidationError } from './guard.js';

// Canonical allowed repository base
const ALLOWED_REMOTE_HOST = 'raw.githubusercontent.com';
const ALLOWED_REPO_PATH_PREFIX = '/AMillionDriver/RAG-MUNGIL/';

export function computeSha256(content: string | Buffer): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

export function verifyUrlAllowed(urlString: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(urlString);
  } catch {
    throw new SecurityValidationError(`Malformed remote dataset URL: ${urlString}`);
  }

  // Enforce HTTPS
  if (parsed.protocol !== 'https:') {
    throw new SecurityValidationError(`Insecure protocol rejected: ${parsed.protocol}. Only HTTPS is permitted.`);
  }

  // Strict domain and path whitelist
  if (parsed.hostname !== ALLOWED_REMOTE_HOST) {
    throw new SecurityValidationError(
      `SSRF Violation: Unauthorized host "${parsed.hostname}". Dataset requests are restricted to ${ALLOWED_REMOTE_HOST}.`
    );
  }

  if (!parsed.pathname.startsWith(ALLOWED_REPO_PATH_PREFIX)) {
    throw new SecurityValidationError(
      `SSRF Violation: Unauthorized path "${parsed.pathname}". Must target ${ALLOWED_REPO_PATH_PREFIX}.`
    );
  }

  return parsed;
}

export function verifyCorpusChecksum(content: string, expectedSha256?: string): boolean {
  if (!content) return false;
  if (!expectedSha256) return true; // Optional pin

  const actual = computeSha256(content);
  if (actual.toLowerCase() !== expectedSha256.toLowerCase()) {
    throw new SecurityValidationError(
      `Integrity violation: SHA-256 mismatch! Expected ${expectedSha256}, got ${actual}. Content may have been tampered with.`
    );
  }

  return true;
}
