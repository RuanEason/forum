export type PostStyleContentWidth = "prose" | "wide";
export type PostStyleCardStyle = "soft" | "solid";
export type PostStyleRadius = "md" | "xl" | "2xl";
export type PostStyleTitleAlign = "left" | "center";
export type PostStyleBodySize = "sm" | "base" | "lg";
export type PostStyleHeadingScale = "default" | "strong";
export type PostStyleBlockquoteStyle = "default" | "band" | "glass";
export type PostStyleCodeTheme = "default" | "slate" | "night";

export interface PostStyleConfig {
  layout?: {
    contentWidth?: PostStyleContentWidth;
    cardStyle?: PostStyleCardStyle;
    radius?: PostStyleRadius;
  };
  typography?: {
    titleAlign?: PostStyleTitleAlign;
    bodySize?: PostStyleBodySize;
    headingScale?: PostStyleHeadingScale;
  };
  palette?: {
    accent?: string;
    surface?: string;
    text?: string;
  };
  blocks?: {
    blockquoteStyle?: PostStyleBlockquoteStyle;
    codeTheme?: PostStyleCodeTheme;
  };
}
