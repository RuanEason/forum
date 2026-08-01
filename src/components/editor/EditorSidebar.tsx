"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import {
  Code2,
  EyeOff,
  FileImage,
  Images,
  Image as ImageIcon,
  Paperclip,
  Settings2,
  Tag,
  X,
} from "lucide-react";
import TopicSelector from "@/components/TopicSelector";
import EditorImagePool from "@/components/editor/EditorImagePool";
import { cn } from "@/lib/utils";
import type {
  EditorImageAsset,
  PostVisibility,
  UploadedAttachment,
} from "@/components/editor/types";

export type SidebarTab = "properties" | "assets";

interface EditorSidebarProps {
  style?: CSSProperties;
  activeTab: SidebarTab;
  visibility: PostVisibility;
  selectedTopicId: string | null;
  selectedImages: string[];
  selectedAttachments: UploadedAttachment[];
  uploadError: string;
  isUploadingAssets: boolean;
  uploadStatus: string;
  uploadProgress: number;
  imagePoolAssets: EditorImageAsset[];
  imagePoolUsedBytes: number;
  imagePoolMaxBytes: number;
  imagePoolLoading: boolean;
  imagePoolUploading: boolean;
  imagePoolError: string;
  imagePoolHasMore: boolean;
  onTabChange: (tab: SidebarTab) => void;
  onVisibilityChange: (value: PostVisibility) => void;
  onTopicChange: (topicId: string | null) => void;
  onImageUpload: () => void;
  onAttachmentUpload: () => void;
  onRemoveImage: (index: number) => void;
  onRemoveAttachment: (index: number) => void;
  onCancelUpload: () => void;
  onOpenStyleEditor: () => void;
  onImagePoolUpload: (files: File[]) => void;
  onImagePoolLoadMore: () => void;
  onImagePoolInsert: (asset: EditorImageAsset) => void;
  onImagePoolDelete: (asset: EditorImageAsset) => Promise<void>;
}

export default function EditorSidebar({
  style,
  activeTab,
  visibility,
  selectedTopicId,
  selectedImages,
  selectedAttachments,
  uploadError,
  isUploadingAssets,
  uploadStatus,
  uploadProgress,
  imagePoolAssets,
  imagePoolUsedBytes,
  imagePoolMaxBytes,
  imagePoolLoading,
  imagePoolUploading,
  imagePoolError,
  imagePoolHasMore,
  onTabChange,
  onVisibilityChange,
  onTopicChange,
  onImageUpload,
  onAttachmentUpload,
  onRemoveImage,
  onRemoveAttachment,
  onCancelUpload,
  onOpenStyleEditor,
  onImagePoolUpload,
  onImagePoolLoadMore,
  onImagePoolInsert,
  onImagePoolDelete,
}: EditorSidebarProps) {
  return (
    <aside style={style} className="flex h-full shrink-0 border-r border-slate-200 bg-[#f7f7f5]">
      <div className="flex w-14 flex-shrink-0 flex-col items-center border-r border-slate-200 bg-[#f1f1ee]">
        <SidebarRailButton
          icon={<Images className="h-5 w-5" />}
          label="图片池"
          active={activeTab === "assets"}
          onClick={() => onTabChange("assets")}
        />
        <SidebarRailButton
          icon={<Settings2 className="h-5 w-5" />}
          label="属性"
          active={activeTab === "properties"}
          onClick={() => onTabChange("properties")}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        {activeTab === "assets" ? (
          <EditorImagePool
            assets={imagePoolAssets}
            usedBytes={imagePoolUsedBytes}
            maxBytes={imagePoolMaxBytes}
            loading={imagePoolLoading}
            uploading={imagePoolUploading}
            error={imagePoolError}
            hasMore={imagePoolHasMore}
            onUpload={onImagePoolUpload}
            onLoadMore={onImagePoolLoadMore}
            onInsert={onImagePoolInsert}
            onDelete={onImagePoolDelete}
          />
        ) : (
          <div className="min-h-0 flex flex-1 flex-col">
            <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              <Settings2 className="h-4 w-4" />
              帖子属性
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto py-4">
              <div className="space-y-5">
                <section className="space-y-3 border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
                    <EyeOff className="h-4 w-4 text-slate-500" />
                    可见性
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      type="button"
                      onClick={() => onVisibilityChange("PUBLIC")}
                      className={cn(
                        "rounded-xl border px-3 py-3 text-left transition-colors",
                        visibility === "PUBLIC"
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                      )}
                    >
                      <div className="text-sm font-medium">公开</div>
                      <div className="mt-1 text-xs text-slate-500">
                        会出现在首页和搜索结果中
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => onVisibilityChange("UNLISTED")}
                      className={cn(
                        "rounded-xl border px-3 py-3 text-left transition-colors",
                        visibility === "UNLISTED"
                          ? "border-amber-500 bg-amber-50 text-amber-700"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                      )}
                    >
                      <div className="text-sm font-medium">仅链接可见</div>
                      <div className="mt-1 text-xs text-slate-500">
                        不在首页和搜索展示，仅能通过链接访问
                      </div>
                    </button>
                  </div>
                </section>

                <section className="space-y-3 border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
                    <Tag className="h-4 w-4 text-slate-500" />
                    话题
                  </div>
                  <TopicSelector selectedTopicId={selectedTopicId} onSelect={onTopicChange} />
                </section>

                <section className="space-y-3 border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
                    <ImageIcon className="h-4 w-4 text-slate-500" />
                    图片
                    <span className="text-xs text-slate-400">{selectedImages.length}/10</span>
                  </div>
                  <button
                    type="button"
                    onClick={onImageUpload}
                    disabled={isUploadingAssets || selectedImages.length >= 10}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 px-3 py-3 text-sm font-medium text-slate-600 transition-colors hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <FileImage className="h-4 w-4" />
                    上传图片
                  </button>
                  {selectedImages.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {selectedImages.map((url, index) => (
                        <div
                          key={`${url}-${index}`}
                          className="relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
                        >
                          <Image
                            src={url}
                            alt={`图片 ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => onRemoveImage(index)}
                            className="absolute right-1 top-1 rounded-full bg-black/55 p-1 text-white transition-colors hover:bg-black/75"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-500">
                      还没有添加图片
                    </div>
                  )}
                </section>

                <section className="space-y-3 border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
                    <Paperclip className="h-4 w-4 text-slate-500" />
                    附件
                    <span className="text-xs text-slate-400">{selectedAttachments.length}/5</span>
                  </div>
                  <button
                    type="button"
                    onClick={onAttachmentUpload}
                    disabled={isUploadingAssets || selectedAttachments.length >= 5}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 px-3 py-3 text-sm font-medium text-slate-600 transition-colors hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Paperclip className="h-4 w-4" />
                    上传附件
                  </button>
                  {selectedAttachments.length > 0 ? (
                    <div className="space-y-2">
                      {selectedAttachments.map((attachment, index) => (
                        <div
                          key={`${attachment.url}-${index}`}
                          className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3"
                        >
                          <Paperclip className="h-4 w-4 flex-shrink-0 text-slate-500" />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium text-slate-800">
                              {attachment.fileName}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              {(attachment.fileSize / 1024 / 1024).toFixed(2)} MB
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => onRemoveAttachment(index)}
                            className="rounded-full p-1 text-slate-400 transition-colors hover:bg-white hover:text-red-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-500">
                      还没有添加附件
                    </div>
                  )}
                </section>

                <section className="space-y-3 border border-dashed border-slate-300 bg-white p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
                    <Code2 className="h-4 w-4 text-slate-500" />
                    高级样式
                  </div>
                  <p className="text-sm leading-6 text-slate-500">
                    默认发帖不需要写 CSS。只有想精细控制展示时，再打开样式文件去手写规则。
                  </p>
                  <button
                    type="button"
                    onClick={onOpenStyleEditor}
                    className="inline-flex items-center justify-center gap-2 border border-slate-200 bg-slate-950 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800"
                  >
                    <Code2 className="h-4 w-4" />
                    打开样式.css
                  </button>
                </section>

                {(isUploadingAssets || uploadError || uploadStatus) ? (
                  <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between text-sm font-medium text-slate-800">
                      <span>上传状态</span>
                    {isUploadingAssets ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-blue-600">{uploadProgress}%</span>
                        <button
                          type="button"
                          onClick={onCancelUpload}
                          className="text-xs text-red-600 hover:text-red-700"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : null}
                    </div>
                    {uploadStatus ? (
                      <div className="text-sm text-slate-600">{uploadStatus}</div>
                    ) : null}
                    {isUploadingAssets ? (
                      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-blue-500 transition-all"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    ) : null}
                    {uploadError ? (
                      <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-700">
                        {uploadError}
                      </div>
                    ) : null}
                  </section>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

interface SidebarRailButtonProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

function SidebarRailButton({
  icon,
  label,
  active,
  onClick,
}: SidebarRailButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group mt-2 inline-flex w-full flex-col items-center gap-1 px-2 py-3 text-[11px] font-medium transition-colors",
        active
          ? "text-slate-900"
          : "text-slate-500 hover:text-slate-800",
      )}
    >
      <span
        className={cn(
          "rounded-xl p-2 transition-colors",
          active ? "bg-white text-slate-900 shadow-sm" : "bg-transparent group-hover:bg-white/70",
        )}
      >
        {icon}
      </span>
      <span>{label}</span>
    </button>
  );
}
