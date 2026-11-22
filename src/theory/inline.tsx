import { Fragment } from "react";
import { Link } from "react-router-dom";
import { sectionOf } from "../curriculum";
import { LESSON_BY_ID } from "../lessons";
import type { Inline } from "./types";

export type Token =
  | { t: "text" | "code" | "bold"; v: string }
  /** A wrong form, struck through. Its body may hold `code`. */
  | { t: "strike"; v: string }
  | { t: "link"; target: string; label: string };

/** Single left-to-right scan. An unclosed marker is plain text. */
export function parseInline(s: Inline): Token[] {
  const out: Token[] = [];
  let text = "";
  const flush = () => {
    if (text) out.push({ t: "text", v: text });
    text = "";
  };
  let i = 0;
  while (i < s.length) {
    if (s[i] === "`") {
      const end = s.indexOf("`", i + 1);
      if (end > i) {
        flush();
        out.push({ t: "code", v: s.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    } else if (s.startsWith("**", i)) {
      const end = s.indexOf("**", i + 2);
      if (end > i + 2) {
        flush();
        out.push({ t: "bold", v: s.slice(i + 2, end) });
        i = end + 2;
        continue;
      }
    } else if (s.startsWith("~~", i)) {
      const end = s.indexOf("~~", i + 2);
      if (end > i + 2) {
        flush();
        out.push({ t: "strike", v: s.slice(i + 2, end) });
        i = end + 2;
        continue;
      }
    } else if (s.startsWith("[[", i)) {
      const end = s.indexOf("]]", i + 2);
      if (end > i + 2) {
        flush();
        const body = s.slice(i + 2, end);
        const bar = body.indexOf("|");
        out.push(bar < 0 ? { t: "link", target: body, label: "" }
          : { t: "link", target: body.slice(0, bar), label: body.slice(bar + 1) });
        i = end + 2;
        continue;
      }
    }
    text += s[i];
    i++;
  }
  flush();
  return out;
}

/** Splits text after its first sentence (a ". " outside `code`), for a headline and its explanation.
 *  Text with one sentence comes back whole, with an empty rest. */
export function leadSplit(s: Inline): [head: Inline, rest: Inline] {
  let code = false;
  for (let i = 0; i < s.length - 1; i++) {
    if (s[i] === "`") code = !code;
    else if (!code && s[i] === "." && s[i + 1] === " ") return [s.slice(0, i + 1), s.slice(i + 2)];
  }
  return [s, ""];
}

export function linkTargets(s: Inline): string[] {
  return parseInline(s).flatMap((k) => (k.t === "link" ? [k.target] : []));
}

export function Rich({ text }: { text: Inline }) {
  return (
    <>
      {parseInline(text).map((k, i) => {
        if (k.t === "code") return <code key={i}>{k.v}</code>;
        if (k.t === "bold") return <strong key={i}>{k.v}</strong>;
        if (k.t === "strike") return <s key={i} className="wrong"><Rich text={k.v} /></s>;
        if (k.t === "link") {
          if (k.target.startsWith("guide:")) {
            const id = k.target.slice(6);
            const label = k.label || `${sectionOf(id)?.name ?? id} guide`;
            return <Link key={i} to={`/guide/${id}`}>{label}</Link>;
          }
          const label = k.label || LESSON_BY_ID[k.target]?.title || k.target;
          return <Link key={i} to={`/${k.target}/learn`}>{label}</Link>;
        }
        return <Fragment key={i}>{k.v}</Fragment>;
      })}
    </>
  );
}

