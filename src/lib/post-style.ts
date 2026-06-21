import type { PostStyleConfig } from "@/types/post-style";

const MAX_POST_STYLE_CSS_LENGTH = 12000;

const ALLOWED_SELECTOR_CLASSES = new Set([
  ".editor-style-card",
  ".editor-style-title",
  ".editor-style-body",
  ".codespan",
  ".code__pre",
  ".hljs",
  ".hr-dash",
  ".hr-star",
  ".hr-underscore",
  ".katex-inline",
  ".katex-block",
]);

const ALLOWED_SELECTOR_TAGS = new Set([
  "a",
  "blockquote",
  "code",
  "em",
  "figure",
  "figcaption",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "img",
  "li",
  "ol",
  "p",
  "pre",
  "strong",
  "table",
  "tbody",
  "td",
  "th",
  "thead",
  "tr",
  "ul",
]);

const ALLOWED_DECLARATIONS = new Set([
  "background",
  "background-color",
  "background-image",
  "border",
  "border-bottom",
  "border-color",
  "border-left",
  "border-radius",
  "border-right",
  "border-style",
  "border-top",
  "border-width",
  "box-shadow",
  "color",
  "font-family",
  "font-size",
  "font-style",
  "font-weight",
  "letter-spacing",
  "line-height",
  "margin",
  "margin-bottom",
  "margin-left",
  "margin-right",
  "margin-top",
  "max-width",
  "min-height",
  "padding",
  "padding-bottom",
  "padding-left",
  "padding-right",
  "padding-top",
  "text-align",
  "text-decoration",
  "text-transform",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeHexColor(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(trimmed) ? trimmed.toLowerCase() : undefined;
}

function toRgba(hex: string, alpha: number): string {
  const normalized = hex.length === 4
    ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
    : hex;
  const red = Number.parseInt(normalized.slice(1, 3), 16);
  const green = Number.parseInt(normalized.slice(3, 5), 16);
  const blue = Number.parseInt(normalized.slice(5, 7), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function serializeDeclarations(entries: Array<[string, string | undefined]>): string {
  return entries
    .filter((entry): entry is [string, string] => Boolean(entry[1]))
    .map(([property, value]) => `${property}: ${value};`)
    .join(" ");
}

function pickEnumValue<T extends string>(
  value: unknown,
  allowed: readonly T[],
): T | undefined {
  return typeof value === "string" && allowed.includes(value as T)
    ? (value as T)
    : undefined;
}

function escapeScopeId(scopeId: string): string {
  return scopeId.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function createScopedRule(
  rootSelector: string,
  selectors: string[],
  declarations: string,
): string {
  if (!declarations.trim()) {
    return "";
  }

  const scopedSelectors = selectors
    .map((selector) => selector.trim())
    .filter(Boolean)
    .map((selector) => `${rootSelector} ${selector.trim()}`)
    .join(", ");

  return scopedSelectors ? `${scopedSelectors} { ${declarations} }` : "";
}

function isSafeCssValue(value: string): boolean {
  return !(
    /url\s*\(/i.test(value)
    || /expression\s*\(/i.test(value)
    || /javascript:/i.test(value)
    || /vbscript:/i.test(value)
    || /@import/i.test(value)
    || /behavior\s*:/i.test(value)
    || /[<>]/.test(value)
  );
}

function isAllowedSelector(selector: string): boolean {
  const normalized = selector.trim().replace(/\s*>\s*/g, " > ");
  if (!normalized) {
    return false;
  }

  if (
    normalized.includes("#")
    || normalized.includes("[")
    || normalized.includes("*")
    || normalized.includes(":")
  ) {
    return false;
  }

  const parts = normalized.split(/\s+/).filter(Boolean);
  for (const part of parts) {
    if (part === ">") {
      continue;
    }

    const classMatches = part.match(/\.[a-zA-Z0-9_-]+/g) ?? [];
    const tagPart = part.replace(/\.[a-zA-Z0-9_-]+/g, "");

    if (tagPart) {
      if (!ALLOWED_SELECTOR_TAGS.has(tagPart)) {
        return false;
      }
    }

    if (classMatches.length > 0) {
      if (classMatches.some((className) => !ALLOWED_SELECTOR_CLASSES.has(className))) {
        return false;
      }
      continue;
    }

    if (!tagPart) {
      return false;
    }
  }

  return true;
}

function sanitizeCustomCss(rootSelector: string, css: string | null | undefined): string {
  if (!css) {
    return "";
  }

  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const rules: string[] = [];
  const rulePattern = /([^{}]+)\{([^{}]*)\}/g;

  for (const match of stripped.matchAll(rulePattern)) {
    const selectorGroup = match[1]?.trim();
    const body = match[2]?.trim();

    if (!selectorGroup || !body || selectorGroup.startsWith("@")) {
      continue;
    }

    const selectors = selectorGroup
      .split(",")
      .map((selector) => selector.trim())
      .filter(Boolean);

    if (selectors.length === 0 || selectors.some((selector) => !isAllowedSelector(selector))) {
      continue;
    }

    const declarations = body
      .split(";")
      .map((declaration) => declaration.trim())
      .filter(Boolean)
      .map((declaration) => {
        const colonIndex = declaration.indexOf(":");
        if (colonIndex <= 0) {
          return null;
        }

        const property = declaration.slice(0, colonIndex).trim().toLowerCase();
        const value = declaration.slice(colonIndex + 1).trim();

        if (!ALLOWED_DECLARATIONS.has(property) || !value || !isSafeCssValue(value)) {
          return null;
        }

        return `${property}: ${value};`;
      })
      .filter((declaration): declaration is string => Boolean(declaration));

    if (declarations.length === 0) {
      continue;
    }

    const rule = createScopedRule(rootSelector, selectors, declarations.join(" "));
    if (rule) {
      rules.push(rule);
    }
  }

  return rules.join("\n");
}

function compileConfigRules(rootSelector: string, styleConfig: PostStyleConfig | null): string {
  if (!styleConfig) {
    return "";
  }

  const accent = normalizeHexColor(styleConfig.palette?.accent) ?? "#2563eb";
  const surface = normalizeHexColor(styleConfig.palette?.surface) ?? "#ffffff";
  const text = normalizeHexColor(styleConfig.palette?.text) ?? "#0f172a";
  const titleAlign = styleConfig.typography?.titleAlign ?? "left";
  const bodySize = styleConfig.typography?.bodySize ?? "base";
  const headingScale = styleConfig.typography?.headingScale ?? "default";
  const blockquoteStyle = styleConfig.blocks?.blockquoteStyle ?? "default";
  const codeTheme = styleConfig.blocks?.codeTheme ?? "default";

  const radiusValue = "1rem";
  const bodyFontSize = bodySize === "sm" ? "0.96rem" : bodySize === "lg" ? "1.08rem" : "1rem";
  const bodyLineHeight = bodySize === "sm" ? "1.78" : bodySize === "lg" ? "1.92" : "1.85";
  const h1Size = headingScale === "strong" ? "2.45rem" : "2.15rem";
  const h2Size = headingScale === "strong" ? "1.75rem" : "1.5rem";
  const h3Size = headingScale === "strong" ? "1.4rem" : "1.25rem";

  const blockquoteBackground = blockquoteStyle === "glass"
    ? `linear-gradient(135deg, ${toRgba(accent, 0.10)}, ${toRgba(surface, 0.96)})`
    : blockquoteStyle === "band"
      ? toRgba(accent, 0.09)
      : toRgba(accent, 0.065);
  const blockquoteBorderRadius = blockquoteStyle === "default" ? "0.95rem" : radiusValue;
  const blockquoteBorder = blockquoteStyle === "band"
    ? `6px solid ${accent}`
    : `4px solid ${accent}`;
  const blockquotePadding = blockquoteStyle === "glass" ? "1rem 1.1rem" : "0.9rem 1rem";

  const preBackground = codeTheme === "night"
    ? "#0b1220"
    : codeTheme === "slate"
      ? "#1e293b"
      : "#111827";
  const preColor = "#f8fafc";
  const preBoxShadow = codeTheme === "night"
    ? `inset 0 0 0 1px ${toRgba(accent, 0.22)}`
    : `inset 0 0 0 1px ${toRgba(accent, 0.16)}`;
  const inlineCodeBackground = codeTheme === "night"
    ? "rgba(15, 23, 42, 0.08)"
    : codeTheme === "slate"
      ? "rgba(30, 41, 59, 0.10)"
      : toRgba(accent, 0.10);

  const cardDeclarations = serializeDeclarations([
    ["border-radius", radiusValue],
    ["background", surface],
    ["color", text],
    ["border", `1px solid ${toRgba(accent, 0.14)}`],
    ["box-shadow", "0 14px 40px rgba(148, 163, 184, 0.16)"],
  ]);

  const bodyDeclarations = serializeDeclarations([
    ["color", text],
    ["font-size", bodyFontSize],
    ["line-height", bodyLineHeight],
  ]);

  const titleDeclarations = serializeDeclarations([
    ["text-align", titleAlign],
    ["color", text],
    ["letter-spacing", "-0.02em"],
    ["font-size", h1Size],
  ]);

  const h2Declarations = serializeDeclarations([
    ["color", text],
    ["font-size", h2Size],
    ["letter-spacing", headingScale === "strong" ? "-0.03em" : "-0.02em"],
  ]);

  const h3Declarations = serializeDeclarations([
    ["color", text],
    ["font-size", h3Size],
  ]);

  const linkDeclarations = serializeDeclarations([
    ["color", accent],
    ["text-decoration", "underline"],
  ]);

  const blockquoteDeclarations = serializeDeclarations([
    ["border-left", blockquoteBorder],
    ["border-radius", blockquoteBorderRadius],
    ["padding", blockquotePadding],
    ["background", blockquoteBackground],
  ]);

  const preDeclarations = serializeDeclarations([
    ["border-radius", radiusValue],
    ["background", preBackground],
    ["color", preColor],
    ["box-shadow", preBoxShadow],
  ]);

  const inlineCodeDeclarations = serializeDeclarations([
    ["background-color", inlineCodeBackground],
    ["border-radius", "0.45rem"],
    ["padding", "0.15rem 0.4rem"],
    ["color", text],
  ]);

  const hrDeclarations = serializeDeclarations([
    ["border-color", toRgba(accent, 0.18)],
  ]);

  return [
    createScopedRule(rootSelector, [".editor-style-card"], cardDeclarations),
    createScopedRule(rootSelector, [".editor-style-title"], titleDeclarations),
    createScopedRule(rootSelector, [".editor-style-body"], bodyDeclarations),
    createScopedRule(rootSelector, [".editor-style-body h2"], h2Declarations),
    createScopedRule(rootSelector, [".editor-style-body h3"], h3Declarations),
    createScopedRule(rootSelector, [".editor-style-body a"], linkDeclarations),
    createScopedRule(rootSelector, [".editor-style-body blockquote"], blockquoteDeclarations),
    createScopedRule(rootSelector, [".editor-style-body pre"], preDeclarations),
    createScopedRule(rootSelector, [".editor-style-body code:not(pre code)"], inlineCodeDeclarations),
    createScopedRule(rootSelector, [".editor-style-body hr"], hrDeclarations),
  ]
    .filter(Boolean)
    .join("\n");
}

export function normalizePostStyleConfig(value: unknown): PostStyleConfig | null {
  if (!isRecord(value)) {
    return null;
  }

  const typography = isRecord(value.typography)
    ? {
        titleAlign: pickEnumValue(value.typography.titleAlign, ["left", "center"] as const),
        bodySize: pickEnumValue(value.typography.bodySize, ["sm", "base", "lg"] as const),
        headingScale: pickEnumValue(value.typography.headingScale, ["default", "strong"] as const),
      }
    : undefined;

  const palette = isRecord(value.palette)
    ? {
        accent: normalizeHexColor(value.palette.accent),
        surface: normalizeHexColor(value.palette.surface),
        text: normalizeHexColor(value.palette.text),
      }
    : undefined;

  const blocks = isRecord(value.blocks)
    ? {
        blockquoteStyle: pickEnumValue(value.blocks.blockquoteStyle, ["default", "band", "glass"] as const),
        codeTheme: pickEnumValue(value.blocks.codeTheme, ["default", "slate", "night"] as const),
      }
    : undefined;

  const nextConfig: PostStyleConfig = {};

  if (typography && Object.values(typography).some(Boolean)) {
    nextConfig.typography = typography;
  }

  if (palette && Object.values(palette).some(Boolean)) {
    nextConfig.palette = palette;
  }

  if (blocks && Object.values(blocks).some(Boolean)) {
    nextConfig.blocks = blocks;
  }

  return Object.keys(nextConfig).length > 0 ? nextConfig : null;
}

export function normalizePostStyleCss(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  return value.slice(0, MAX_POST_STYLE_CSS_LENGTH);
}

export function buildBasePostStyleSheet(styleConfig?: PostStyleConfig | null): string {
  const normalizedConfig = normalizePostStyleConfig(styleConfig ?? null);

  return compileConfigRules(":scope", normalizedConfig)
    .replace(/:scope\s+/g, "")
    .trim();
}

export function buildScopedPostStyleSheet({
  scopeId,
  rootSelector,
  styleConfig,
  styleCss,
}: {
  scopeId: string;
  rootSelector?: string;
  styleConfig?: PostStyleConfig | null;
  styleCss?: string | null;
}): string {
  const normalizedConfig = normalizePostStyleConfig(styleConfig ?? null);
  const normalizedCss = normalizePostStyleCss(styleCss);
  const selectorRoot = rootSelector ?? `[data-style-scope="${escapeScopeId(scopeId)}"]`;

  return [compileConfigRules(selectorRoot, normalizedConfig), sanitizeCustomCss(selectorRoot, normalizedCss)]
    .filter(Boolean)
    .join("\n");
}
