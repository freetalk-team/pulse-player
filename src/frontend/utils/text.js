// src/renderer/src/utils/text.js
export function highlightMatch(text, query) {
  if (!query) return text;
  const regex = new RegExp(`(${query})`, 'gi');
  // We wrap the match in a span with a Tailwind class
  return text.replace(regex, '<span class="text-pulse-accent font-bold">$1</span>');
}
