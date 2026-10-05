const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#039;',
};

/**
 * Escapes HTML special characters in user-controlled text before it's
 * interpolated into an HTML email template, preventing a user-supplied
 * name/subject/message from injecting markup into the rendered email.
 */
export function escapeHtml(text: string | number | null | undefined): string {
  if (text === null || text === undefined) return '';
  return String(text).replace(/[&<>"']/g, (char) => HTML_ESCAPE_MAP[char]);
}
