import React from 'react';

/**
 * Parse WhatsApp formatting markers ke React fragments:
 *   *bold*     → <strong>bold</strong>
 *   _italic_   → <em>italic</em>
 *   ~strike~   → <s>strike</s>
 *   ```mono``` → <code>mono</code>
 *   \n         → <br />
 *
 * Escape HTML otomatis (untuk safety) — input pure text dari customer/AI.
 */
export function renderWhatsappText(text: string | null | undefined): React.ReactNode {
  if (!text) return null;
  const lines = text.split('\n');
  return lines.map((line, i) => (
    <React.Fragment key={i}>
      {parseInline(line)}
      {i < lines.length - 1 && <br />}
    </React.Fragment>
  ));
}

function parseInline(text: string): React.ReactNode[] {
  const tokens: React.ReactNode[] = [];
  // Regex matches: *bold* | _italic_ | ~strike~ | `mono`
  // Greedy on inner, non-greedy boundaries — match shortest valid pair.
  const regex = /(\*[^*\n]+\*|_[^_\n]+_|~[^~\n]+~|`[^`\n]+`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push(text.slice(lastIndex, match.index));
    }
    const m = match[0];
    const inner = m.slice(1, -1);
    if (m.startsWith('*')) {
      tokens.push(React.createElement('strong', { key: key++ }, inner));
    } else if (m.startsWith('_')) {
      tokens.push(React.createElement('em', { key: key++ }, inner));
    } else if (m.startsWith('~')) {
      tokens.push(React.createElement('s', { key: key++ }, inner));
    } else if (m.startsWith('`')) {
      tokens.push(
        React.createElement(
          'code',
          { key: key++, className: 'rounded bg-gray-100 px-1 text-xs' },
          inner,
        ),
      );
    }
    lastIndex = match.index + m.length;
  }
  if (lastIndex < text.length) {
    tokens.push(text.slice(lastIndex));
  }
  return tokens;
}
