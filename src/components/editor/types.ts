export type PostType = "TEXT" | "VIDEO";
export type PersistMode = "EPHEMERAL" | "SAVED";
export type DraftStatus = "EDITING" | "UPLOADING" | "PROCESSING" | "FAILED" | "READY" | "PUBLISHED";
export type SaveState = "idle" | "saving" | "saved" | "error";
export type PostVisibility = "PUBLIC" | "UNLISTED";
export type EditorDocumentTab = "content" | "style";

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

export interface DraftUploadSummary {
  total: number;
  uploading: number;
  processing: number;
  failed: number;
  ready: number;
}

export interface EditorDraftSummary {
  id: string;
  postType: PostType;
  title: string | null;
  content: string;
  status: DraftStatus;
  persistMode: PersistMode;
  updatedAt: string;
  createdAt?: string;
  canPublish?: boolean;
  uploadSummary?: DraftUploadSummary;
}

export interface EditorDraftDetail extends EditorDraftSummary {
  visibility?: PostVisibility;
  topicId?: string | null;
  assets?: EditorDraftAsset[];
  styleConfig?: import("@/types/post-style").PostStyleConfig | null;
  styleCss?: string | null;
}

export interface UploadedAttachment {
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export interface EditorDraftAsset {
  id: string;
  type: "IMAGE" | "ATTACHMENT" | "VIDEO" | "COVER";
  status: "PENDING" | "UPLOADING" | "PROCESSING" | "READY" | "FAILED";
  progress: number;
  url: string | null;
  fileName: string | null;
  fileSize: number | null;
  mimeType: string | null;
  videoAssetId: string | null;
  errorMessage?: string | null;
  sortOrder: number;
}

export interface DraftHistoryGroup {
  label: string;
  items: EditorDraftSummary[];
}

export interface EditorOutlineItem {
  id: string;
  depth: number;
  text: string;
  lineNumber: number;
}
