import { cloneElement, createElement, isValidElement, type ComponentPropsWithoutRef, type ReactNode } from "react";
import type { Components } from "react-markdown";
import MarkdownCodeBlock from "@/components/markdown/MarkdownCodeBlock";
import { createHeadingIdGenerator, isInternalUserLink } from "@/lib/markdown";
import { cn } from "@/lib/utils";

type HeadingTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

interface CreateMarkdownComponentsOptions {
  withHeadingIds?: boolean;
  headingClassName?: string;
  headingDataAttributeName?: string;
}

function getTextFromReactNode(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map((child) => getTextFromReactNode(child)).join("");
  }

  if (isValidElement(node)) {
    return getTextFromReactNode((node.props as { children?: ReactNode }).children);
  }

  return "";
}

function createHeadingRenderer(
  tag: HeadingTag,
  generateHeadingId: ReturnType<typeof createHeadingIdGenerator>,
  headingClassName: string,
  headingDataAttributeName?: string,
) {
  const HeadingRenderer = ({
    children,
    className,
    ...props
  }: ComponentPropsWithoutRef<HeadingTag>) => {
    const headingText = getTextFromReactNode(children);
    const headingId = generateHeadingId(headingText);
    const dataAttribute = headingDataAttributeName
      ? { [headingDataAttributeName]: headingId }
      : {};

    return createElement(
      tag,
      {
        id: headingId,
        className: cn(headingClassName, className),
        ...dataAttribute,
        ...props,
      },
      children,
    );
  };

  HeadingRenderer.displayName = `Markdown${tag.toUpperCase()}`;
  return HeadingRenderer;
}

export function createMarkdownComponents({
  withHeadingIds = false,
  headingClassName = "scroll-mt-24",
  headingDataAttributeName,
}: CreateMarkdownComponentsOptions = {}): Components {
  const components: Components = {
    a: ({ href, children, ...props }) => {
      const isAnchorLink = typeof href === "string" && href.startsWith("#");

      if (isAnchorLink) {
        return (
          <a href={href} {...props}>
            {children}
          </a>
        );
      }

      if (isInternalUserLink(href)) {
        return (
          <a href={href} {...props}>
            {children}
          </a>
        );
      }

      return (
        <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
          {children}
        </a>
      );
    },
    pre: ({ children }) => {
      if (isValidElement<{ "data-block-code"?: boolean }>(children)) {
        return cloneElement(children, { "data-block-code": true });
      }

      return <>{children}</>;
    },
    code: ({ className, children, ...props }) => {
      const codeProps = props as typeof props & { "data-block-code"?: boolean };
      const isBlockCode = Boolean(codeProps["data-block-code"]);
      const code = getTextFromReactNode(children).replace(/\n+$/, "");
      const languageMatch = className?.match(/language-([a-z0-9_-]+)/i);

      if (isBlockCode) {
        return (
          <MarkdownCodeBlock
            code={code}
            language={languageMatch?.[1] ?? null}
          />
        );
      }

      const inlineProps = { ...codeProps };
      delete inlineProps["data-block-code"];

      return (
        <code
          className={cn(
            "codespan rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[0.92em] text-slate-800",
            className,
          )}
          {...inlineProps}
        >
          {children}
        </code>
      );
    },
  };

  if (!withHeadingIds) {
    return components;
  }

  const generateHeadingId = createHeadingIdGenerator();

  return {
    ...components,
    h1: createHeadingRenderer("h1", generateHeadingId, headingClassName, headingDataAttributeName),
    h2: createHeadingRenderer("h2", generateHeadingId, headingClassName, headingDataAttributeName),
    h3: createHeadingRenderer("h3", generateHeadingId, headingClassName, headingDataAttributeName),
    h4: createHeadingRenderer("h4", generateHeadingId, headingClassName, headingDataAttributeName),
    h5: createHeadingRenderer("h5", generateHeadingId, headingClassName, headingDataAttributeName),
    h6: createHeadingRenderer("h6", generateHeadingId, headingClassName, headingDataAttributeName),
  };
}
