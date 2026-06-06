export type PostType = "TEXT" | "VIDEO";
export type PersistMode = "EPHEMERAL" | "SAVED";
export type DraftStatus = "EDITING" | "UPLOADING" | "PROCESSING" | "FAILED" | "READY" | "PUBLISHED";
export type SaveState = "idle" | "saving" | "saved" | "error";
export type PostVisibility = "PUBLIC" | "UNLISTED";

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
