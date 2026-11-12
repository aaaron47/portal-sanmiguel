'use client';

import React from 'react';
import { ExternalLink } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  textColor?: string;
}

/**
 * Parsea texto plano con formato inline:
 * - Negrita: **texto** o __texto__
 * - Cursiva: *texto* o _texto_
 * - Código inline: `código`
 * - Enlaces markdown: [texto](url)
 * - URLs sueltas: https://... o http://...
 */
function renderInlineFormatting(text: string, keyPrefix: string): React.ReactNode[] {
  // Tokeniza buscando negrita, código inline, enlaces markdown, URLs directas
  const tokenRegex =
    /(\*\*[\s\S]+?\*\*|__[\s\S]+?__|`[^`]+`|\[[^\]]+\]\((?:https?:\/\/[^\s)]+)\)|https?:\/\/[^\s<>)"]+)/g;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let subIndex = 0;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    const itemKey = `${keyPrefix}-${subIndex++}`;

    if ((token.startsWith('**') && token.endsWith('**')) || (token.startsWith('__') && token.endsWith('__'))) {
      const inner = token.slice(2, -2);
      parts.push(
        <strong key={itemKey} style={{ fontWeight: 700, color: 'var(--text-main, inherit)' }}>
          {renderInlineFormatting(inner, `${itemKey}-b`)}
        </strong>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      const inner = token.slice(1, -1);
      parts.push(
        <code
          key={itemKey}
          style={{
            background: 'var(--bg-card, rgba(0,0,0,0.06))',
            border: '1px solid var(--border-color, rgba(0,0,0,0.1))',
            borderRadius: '4px',
            padding: '0.1rem 0.35rem',
            fontSize: '0.74rem',
            fontFamily: 'var(--font-mono, monospace)',
            color: 'var(--sky-700, #0284c7)',
          }}
        >
          {inner}
        </code>
      );
    } else if (token.startsWith('[') && token.includes('](')) {
      const closeBracket = token.indexOf('](');
      const label = token.slice(1, closeBracket);
      const url = token.slice(closeBracket + 2, -1);
      parts.push(
        <a
          key={itemKey}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: 'var(--sky-600, #0284c7)',
            textDecoration: 'underline',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.2rem',
            wordBreak: 'break-all',
          }}
        >
          <span>{label}</span>
          <ExternalLink size={11} style={{ flexShrink: 0 }} />
        </a>
      );
    } else if (token.startsWith('http://') || token.startsWith('https://')) {
      // Limpia puntuación final típica si la URL está pegada al final de una oración
      let cleanUrl = token;
      let trailingPunct = '';
      const trailingMatch = /[.,;:)]+$/.exec(token);
      if (trailingMatch) {
        trailingPunct = trailingMatch[0];
        cleanUrl = token.slice(0, token.length - trailingPunct.length);
      }

      parts.push(
        <a
          key={itemKey}
          href={cleanUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: 'var(--sky-600, #0284c7)',
            textDecoration: 'underline',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.2rem',
            wordBreak: 'break-all',
          }}
        >
          <span>{cleanUrl}</span>
          <ExternalLink size={11} style={{ flexShrink: 0 }} />
        </a>
      );
      if (trailingPunct) {
        parts.push(trailingPunct);
      }
    } else {
      parts.push(token);
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className,
  textColor,
}) => {
  if (!content) return null;

  // 1. Extrae bloques de código ```lang ... ``` para protegerlos de partición
  const rawBlocks: Array<
    | { type: 'code'; lang?: string; code: string }
    | { type: 'text'; text: string }
  > = [];

  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  let lastPos = 0;
  let codeMatch: RegExpExecArray | null;

  while ((codeMatch = codeBlockRegex.exec(content)) !== null) {
    if (codeMatch.index > lastPos) {
      rawBlocks.push({ type: 'text', text: content.slice(lastPos, codeMatch.index) });
    }
    rawBlocks.push({
      type: 'code',
      lang: codeMatch[1]?.trim() || undefined,
      code: codeMatch[2]?.replace(/\n$/, '') || '',
    });
    lastPos = codeMatch.index + codeMatch[0].length;
  }
  if (lastPos < content.length) {
    rawBlocks.push({ type: 'text', text: content.slice(lastPos) });
  }

  // 2. Procesa cada bloque estructurado
  const elements: React.ReactNode[] = [];
  let blockKeyCounter = 0;

  for (const block of rawBlocks) {
    if (block.type === 'code') {
      const codeKey = `code-block-${blockKeyCounter++}`;
      elements.push(
        <div
          key={codeKey}
          style={{
            margin: '0.5rem 0',
            borderRadius: '8px',
            overflow: 'hidden',
            border: '1px solid var(--border-color, rgba(0,0,0,0.1))',
            background: 'var(--bg-card, #1e293b)',
          }}
        >
          {block.lang && (
            <div
              style={{
                fontSize: '0.65rem',
                padding: '0.2rem 0.6rem',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                background: 'rgba(0,0,0,0.08)',
                color: 'var(--text-muted, #94a3b8)',
                borderBottom: '1px solid var(--border-color, rgba(0,0,0,0.08))',
                fontFamily: 'monospace',
                fontWeight: 700,
              }}
            >
              {block.lang}
            </div>
          )}
          <pre
            style={{
              margin: 0,
              padding: '0.6rem 0.8rem',
              fontSize: '0.74rem',
              fontFamily: 'var(--font-mono, monospace)',
              overflowX: 'auto',
              lineHeight: 1.45,
              color: 'var(--text-main, #f8fafc)',
            }}
          >
            <code>{block.code}</code>
          </pre>
        </div>
      );
      continue;
    }

    // Procesa texto línea por línea para listas, encabezados, citas y párrafos
    const lines = block.text.split(/\r?\n/);
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      // Línea vacía: separador
      if (!trimmed) {
        i++;
        continue;
      }

      // Encabezados (#, ##, ###, ####)
      const headingMatch = /^(#{1,4})\s+(.+)$/.exec(line);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const headingText = headingMatch[2];
        const hKey = `h-${blockKeyCounter++}`;
        const fontSize = level === 1 ? '0.95rem' : level === 2 ? '0.88rem' : '0.82rem';
        elements.push(
          <div
            key={hKey}
            style={{
              fontWeight: 800,
              fontSize,
              margin: '0.65rem 0 0.35rem 0',
              color: 'var(--text-main, inherit)',
            }}
          >
            {renderInlineFormatting(headingText, hKey)}
          </div>
        );
        i++;
        continue;
      }

      // Regla horizontal (--- o ***)
      if (/^(\*\*\*|---|___)$/.test(trimmed)) {
        elements.push(
          <hr
            key={`hr-${blockKeyCounter++}`}
            style={{
              border: 'none',
              borderTop: '1px solid var(--border-color, rgba(0,0,0,0.1))',
              margin: '0.6rem 0',
            }}
          />
        );
        i++;
        continue;
      }

      // Cita en bloque (> ...)
      if (trimmed.startsWith('>')) {
        const quoteLines: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith('>')) {
          quoteLines.push(lines[i].trim().replace(/^>\s?/, ''));
          i++;
        }
        const qKey = `quote-${blockKeyCounter++}`;
        elements.push(
          <blockquote
            key={qKey}
            style={{
              margin: '0.45rem 0',
              padding: '0.35rem 0.65rem',
              borderLeft: '3px solid var(--sky-500, #0284c7)',
              background: 'var(--bg-card-subtle, rgba(2,132,199,0.05))',
              borderRadius: '0 6px 6px 0',
              fontSize: '0.76rem',
              color: 'var(--text-muted, inherit)',
              fontStyle: 'italic',
            }}
          >
            {quoteLines.map((ql, qIdx) => (
              <div key={qIdx}>{renderInlineFormatting(ql, `${qKey}-${qIdx}`)}</div>
            ))}
          </blockquote>
        );
        continue;
      }

      // Listas no ordenadas (- o * al inicio)
      if (/^[-*]\s+/.test(trimmed)) {
        const listItems: string[] = [];
        while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
          listItems.push(lines[i].trim().replace(/^[-*]\s+/, ''));
          i++;
        }
        const ulKey = `ul-${blockKeyCounter++}`;
        elements.push(
          <ul
            key={ulKey}
            style={{
              margin: '0.35rem 0 0.45rem 0',
              paddingLeft: '1.25rem',
              listStyleType: 'disc',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem',
            }}
          >
            {listItems.map((item, itemIdx) => (
              <li
                key={itemIdx}
                style={{
                  lineHeight: 1.45,
                  fontSize: '0.78rem',
                  color: textColor || 'var(--text-main, inherit)',
                }}
              >
                {renderInlineFormatting(item, `${ulKey}-${itemIdx}`)}
              </li>
            ))}
          </ul>
        );
        continue;
      }

      // Listas ordenadas (1., 2. al inicio)
      if (/^\d+\.\s+/.test(trimmed)) {
        const listItems: string[] = [];
        while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
          listItems.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
          i++;
        }
        const olKey = `ol-${blockKeyCounter++}`;
        elements.push(
          <ol
            key={olKey}
            style={{
              margin: '0.35rem 0 0.45rem 0',
              paddingLeft: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem',
            }}
          >
            {listItems.map((item, itemIdx) => (
              <li
                key={itemIdx}
                style={{
                  lineHeight: 1.45,
                  fontSize: '0.78rem',
                  color: textColor || 'var(--text-main, inherit)',
                }}
              >
                {renderInlineFormatting(item, `${olKey}-${itemIdx}`)}
              </li>
            ))}
          </ol>
        );
        continue;
      }

      // Párrafo normal: agrupa líneas consecutivas de texto
      const paragraphLines: string[] = [];
      while (
        i < lines.length &&
        lines[i].trim() &&
        !/^(#{1,4}\s+|[-*]\s+|\d+\.\s+|>|(\*\*\*|---|___)$)/.test(lines[i].trim())
      ) {
        paragraphLines.push(lines[i]);
        i++;
      }

      const pKey = `p-${blockKeyCounter++}`;
      elements.push(
        <div
          key={pKey}
          style={{
            margin: '0.35rem 0',
            lineHeight: 1.5,
            fontSize: '0.78rem',
            color: textColor || 'var(--text-main, inherit)',
          }}
        >
          {paragraphLines.map((pl, plIdx) => (
            <React.Fragment key={plIdx}>
              {renderInlineFormatting(pl, `${pKey}-${plIdx}`)}
              {plIdx < paragraphLines.length - 1 && <br />}
            </React.Fragment>
          ))}
        </div>
      );
    }
  }

  return (
    <div className={className} style={{ wordBreak: 'break-word' }}>
      {elements}
    </div>
  );
};

