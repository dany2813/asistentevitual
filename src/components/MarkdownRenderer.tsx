import { useState, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";

interface MarkdownRendererProps {
  content: string;
}

function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <div className="my-3 rounded-lg border border-[#DBDBDB] overflow-hidden bg-[#F8FAFC]">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#DBDBDB] bg-[#F3F5F8]">
        <span className="text-[11px] font-mono text-[#6B6B6B]">
          {lang || "código"}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-[#6B6B6B] hover:text-[#1A1D24] transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-[#3778AE]" />
              Copiado
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              Copiar
            </>
          )}
        </button>
      </div>
      <pre className="p-3 overflow-x-auto text-xs font-mono leading-relaxed text-[#1A1D24]">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function renderInline(text: string): ReactNode[] {
  const tokens: ReactNode[] = [];
  const pattern =
    /(`[^`\n]+`|\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|__[^_]+__|\*[^*\n]+\*|_[^_\n]+_|~~[^~]+~~|\[[^\]]+\]\(https?:\/\/[^\s)]+\))/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let keyIdx = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    const k = `inl-${keyIdx++}`;
    if (token.startsWith("`")) {
      tokens.push(
        <code key={k} className="inline-code">
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("***")) {
      tokens.push(
        <strong key={k}>
          <em>{token.slice(3, -3)}</em>
        </strong>
      );
    } else if (token.startsWith("**") || token.startsWith("__")) {
      tokens.push(<strong key={k}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("*") || token.startsWith("_")) {
      tokens.push(<em key={k}>{token.slice(1, -1)}</em>);
    } else if (token.startsWith("~~")) {
      tokens.push(<del key={k}>{token.slice(2, -2)}</del>);
    } else if (token.startsWith("[")) {
      const linkMatch = token.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
      if (linkMatch) {
        tokens.push(
          <a
            key={k}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
          >
            {linkMatch[1]}
          </a>
        );
      } else {
        tokens.push(token);
      }
    }
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    tokens.push(text.slice(lastIndex));
  }
  return tokens;
}

function renderTextSegment(segment: string, keyPrefix: string): ReactNode[] {
  const lines = segment.split("\n");
  const elements: ReactNode[] = [];
  let ulItems: string[] = [];
  let olItems: string[] = [];
  let paraLines: string[] = [];

  const flushParagraph = (idx: number) => {
    if (paraLines.length === 0) return;
    const joined = paraLines.join("\n");
    elements.push(
      <p key={`${keyPrefix}-p-${idx}`}>
        {joined.split("\n").map((line, lIdx) => (
          <span key={lIdx}>
            {lIdx > 0 && <br />}
            {renderInline(line)}
          </span>
        ))}
      </p>
    );
    paraLines = [];
  };

  const flushLists = (idx: number) => {
    if (ulItems.length > 0) {
      elements.push(
        <ul key={`${keyPrefix}-ul-${idx}`}>
          {ulItems.map((item, i) => (
            <li key={i}>{renderInline(item)}</li>
          ))}
        </ul>
      );
      ulItems = [];
    }
    if (olItems.length > 0) {
      elements.push(
        <ol key={`${keyPrefix}-ol-${idx}`}>
          {olItems.map((item, i) => (
            <li key={i}>{renderInline(item)}</li>
          ))}
        </ol>
      );
      olItems = [];
    }
  };

  lines.forEach((rawLine, idx) => {
    const trimmed = rawLine.trim();

    if (!trimmed) {
      flushParagraph(idx);
      flushLists(idx);
      return;
    }

    if (trimmed.startsWith("### ")) {
      flushParagraph(idx);
      flushLists(idx);
      elements.push(<h4 key={`${keyPrefix}-h4-${idx}`}>{renderInline(trimmed.slice(4))}</h4>);
      return;
    }
    if (trimmed.startsWith("## ")) {
      flushParagraph(idx);
      flushLists(idx);
      elements.push(<h3 key={`${keyPrefix}-h3-${idx}`}>{renderInline(trimmed.slice(3))}</h3>);
      return;
    }
    if (trimmed.startsWith("# ")) {
      flushParagraph(idx);
      flushLists(idx);
      elements.push(<h2 key={`${keyPrefix}-h2-${idx}`}>{renderInline(trimmed.slice(2))}</h2>);
      return;
    }
    if (trimmed.startsWith("> ")) {
      flushParagraph(idx);
      flushLists(idx);
      elements.push(
        <blockquote key={`${keyPrefix}-bq-${idx}`}>
          {renderInline(trimmed.slice(2))}
        </blockquote>
      );
      return;
    }
    if (/^---+$/.test(trimmed)) {
      flushParagraph(idx);
      flushLists(idx);
      elements.push(<hr key={`${keyPrefix}-hr-${idx}`} />);
      return;
    }

    const ulMatch = trimmed.match(/^[-*+•]\s+(.*)$/);
    if (ulMatch) {
      flushParagraph(idx);
      if (olItems.length > 0) flushLists(idx);
      ulItems.push(ulMatch[1]);
      return;
    }

    const olMatch = trimmed.match(/^\d+\.\s+(.*)$/);
    if (olMatch) {
      flushParagraph(idx);
      if (ulItems.length > 0) flushLists(idx);
      olItems.push(olMatch[1]);
      return;
    }

    flushLists(idx);
    paraLines.push(rawLine);
  });

  flushParagraph(lines.length);
  flushLists(lines.length);
  return elements;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  if (!content) return null;

  const parts: Array<{ type: "text" | "code"; lang?: string; body: string }> = [];
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", body: content.slice(lastIndex, match.index) });
    }
    parts.push({
      type: "code",
      lang: match[1] || "",
      body: match[2].replace(/\n$/, ""),
    });
    lastIndex = codeBlockRegex.lastIndex;
  }

  if (lastIndex < content.length) {
    parts.push({ type: "text", body: content.slice(lastIndex) });
  }

  return (
    <div className="prose-chat">
      {parts.map((part, i) =>
        part.type === "code" ? (
          <CodeBlock key={`cb-${i}`} lang={part.lang || ""} code={part.body} />
        ) : (
          <div key={`txt-${i}`}>{renderTextSegment(part.body, `seg-${i}`)}</div>
        )
      )}
    </div>
  );
}
