/**
 * Shared clean-output helpers for demo Magnus replies.
 * UI prefers plain prose — no markdown emphasis, headings, or fences.
 */

/** True if text still contains markdown markers we ban in user-visible replies. */
export function hasMarkdownMarkers(text: string): boolean {
  if (!text) return false;
  if (/\*\*[^*]+\*\*/.test(text)) return true;
  if (/__[^_]+__/.test(text)) return true;
  if (/(^|\n)\s{0,3}#{1,6}\s/.test(text)) return true;
  if (/```/.test(text)) return true;
  if (/`[^`]+`/.test(text)) return true;
  // lone emphasis pairs common in AI slop
  if (/(?<!\*)\*[^*\n]+\*(?!\*)/.test(text)) return true;
  return false;
}

/**
 * Strip common markdown so mock / post-process paths stay plain-language.
 * Keeps bullet lines that already use "• ".
 */
export function cleanReplyText(text: string): string {
  let s = text ?? "";
  // fenced code blocks → plain inner text
  s = s.replace(/```[\w]*\n?([\s\S]*?)```/g, "$1");
  // bold / italic
  s = s.replace(/\*\*([^*]+)\*\*/g, "$1");
  s = s.replace(/__([^_]+)__/g, "$1");
  s = s.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, "$1");
  s = s.replace(/(?<!_)_([^_\n]+)_(?!_)/g, "$1");
  // headings (line-start or leftover ## tokens)
  s = s.replace(/(^|\n)\s{0,3}#{1,6}\s+/g, "$1");
  s = s.replace(/#{1,6}\s+/g, "");
  // inline code
  s = s.replace(/`([^`]+)`/g, "$1");
  // markdown list markers → bullet
  s = s.replace(/(^|\n)\s*[-*+]\s+/g, "$1• ");
  s = s.replace(/(^|\n)\s*\d+\.\s+/g, "$1• ");
  // collapse excess blank lines
  s = s.replace(/\n{3,}/g, "\n\n");
  return s.trim();
}
