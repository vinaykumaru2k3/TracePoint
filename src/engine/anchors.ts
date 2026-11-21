import type { Lang } from "./types";

export interface ParsedCode {
  /** Source lines with the anchor comments stripped. */
  lines: string[];
  /** Anchor name to 1-based line numbers. */
  anchors: Record<string, number[]>;
}

const TAG = /\s*(?:\/\/|#)\s*@a\s+([\w.]+)\s*$/;

/** Strip `// @a name` (or `# @a name`) tags and record which line each anchor sits on. */
export function parseCode(raw: string): ParsedCode {
  const src = raw.replace(/\r\n?/g, "\n").replace(/\n+$/, "").split("\n");
  const anchors: Record<string, number[]> = {};
  const lines = src.map((line, i) => {
    const m = TAG.exec(line);
    if (!m) return line;
    (anchors[m[1]] ||= []).push(i + 1);
    return line.replace(TAG, "");
  });
  return { lines, anchors };
}

export function parseAll(code: Record<Lang, string>): Record<Lang, ParsedCode> {
  return { java: parseCode(code.java), python: parseCode(code.python), cpp: parseCode(code.cpp) };
}

/** Line numbers a step highlights in one language, in the order the step lists its anchors. */
export function linesFor(parsed: ParsedCode, anchors: string[]): number[] {
  return anchors.flatMap((a) => parsed.anchors[a] ?? []);
}

/** Anchors a step names that the file does not define. */
export function missingAnchors(parsed: ParsedCode, anchors: string[]): string[] {
  return anchors.filter((a) => !parsed.anchors[a]);
}
