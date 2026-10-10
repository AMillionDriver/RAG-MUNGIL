export class SecurityValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SecurityValidationError';
  }
}

const SAFE_IDENTIFIER_REGEX = /^[a-zA-Z0-9_-]+$/;
const MAX_QUERY_LENGTH = 500;

export function validateQuery(query: string, maxLength = MAX_QUERY_LENGTH): string {
  if (typeof query !== 'string') {
    throw new SecurityValidationError('Query must be a string.');
  }

  const trimmed = query.trim();
  if (trimmed.length === 0) {
    throw new SecurityValidationError('Query cannot be empty.');
  }

  if (trimmed.length > maxLength) {
    throw new SecurityValidationError(
      `Query exceeds maximum allowed length of ${maxLength} characters (received ${trimmed.length} chars).`
    );
  }

  // Remove dangerous non-printable ASCII control characters (keep standard \n, \r, \t)
  // eslint-disable-next-line no-control-regex
  return trimmed.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

export function validateSafeIdentifier(id: string, fieldName = 'Identifier'): string {
  if (typeof id !== 'string') {
    throw new SecurityValidationError(`${fieldName} must be a string.`);
  }

  const trimmed = id.trim();
  if (!SAFE_IDENTIFIER_REGEX.test(trimmed)) {
    throw new SecurityValidationError(
      `Security violation: ${fieldName} contains invalid or illegal path traversal characters: "${id}". Only alphanumeric characters, dashes, and underscores are allowed.`
    );
  }

  if (trimmed.includes('..') || trimmed.includes('/') || trimmed.includes('\\')) {
    throw new SecurityValidationError(`Path traversal attempt detected in ${fieldName}.`);
  }

  return trimmed;
}

export function clampLimit(limit?: number, min = 1, max = 20): number {
  if (typeof limit !== 'number' || isNaN(limit)) return 5;
  return Math.min(Math.max(Math.floor(limit), min), max);
}
