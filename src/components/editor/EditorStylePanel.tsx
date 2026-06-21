"use client";

import { Code2, Palette, Quote, Type } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PostStyleConfig } from "@/types/post-style";

interface EditorStylePanelProps {
  styleConfig: PostStyleConfig | null;
  onChange: (nextConfig: PostStyleConfig) => void;
  onOpenStyleEditor: () => void;
}

type OptionItem<T extends string> = {
  label: string;
  value: T;
  description?: string;
};

const TITLE_ALIGN_OPTIONS: OptionItem<"left" | "center">[] = [
  { label: "左对齐", value: "left" },
  { label: "居中", value: "center" },
];

const BODY_SIZE_OPTIONS: OptionItem<"sm" | "base" | "lg">[] = [
  { label: "小", value: "sm" },
  { label: "标准", value: "base" },
  { label: "大", value: "lg" },
];

const HEADING_SCALE_OPTIONS: OptionItem<"default" | "strong">[] = [
  { label: "默认", value: "default" },
  { label: "强调", value: "strong" },
];

const BLOCKQUOTE_OPTIONS: OptionItem<"default" | "band" | "glass">[] = [
  { label: "默认", value: "default" },
  { label: "色带", value: "band" },
  { label: "玻璃", value: "glass" },
];

const CODE_THEME_OPTIONS: OptionItem<"default" | "slate" | "night">[] = [
  { label: "默认", value: "default" },
  { label: "石板", value: "slate" },
  { label: "夜色", value: "night" },
];

function updateNestedConfig<T extends keyof PostStyleConfig>(
  current: PostStyleConfig | null,
  key: T,
  nextValue: NonNullable<PostStyleConfig[T]>,
): PostStyleConfig {
  return {
    ...(current ?? {}),
    [key]: {
      ...(current?.[key] ?? {}),
      ...nextValue,
    },
  };
}

export default function EditorStylePanel({
  styleConfig,
  onChange,
  onOpenStyleEditor,
}: EditorStylePanelProps) {
  const current = styleConfig ?? {};

  return (
    <div className="min-h-0 flex flex-1 flex-col bg-[#f7f7f5]">
      <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        <Palette className="h-4 w-4" />
        样式面板
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-4">
          <StyleSection icon={<Type className="h-4 w-4 text-slate-500" />} title="排版">
            <OptionGrid
              label="标题对齐"
              value={current.typography?.titleAlign ?? "left"}
              options={TITLE_ALIGN_OPTIONS}
              onChange={(value) => onChange(updateNestedConfig(current, "typography", { titleAlign: value }))}
            />
            <OptionGrid
              label="正文字号"
              value={current.typography?.bodySize ?? "base"}
              options={BODY_SIZE_OPTIONS}
              onChange={(value) => onChange(updateNestedConfig(current, "typography", { bodySize: value }))}
            />
            <OptionGrid
              label="标题强度"
              value={current.typography?.headingScale ?? "default"}
              options={HEADING_SCALE_OPTIONS}
              onChange={(value) => onChange(updateNestedConfig(current, "typography", { headingScale: value }))}
            />
          </StyleSection>

          <StyleSection icon={<Quote className="h-4 w-4 text-slate-500" />} title="内容块">
            <OptionGrid
              label="引用块"
              value={current.blocks?.blockquoteStyle ?? "default"}
              options={BLOCKQUOTE_OPTIONS}
              onChange={(value) => onChange(updateNestedConfig(current, "blocks", { blockquoteStyle: value }))}
            />
            <OptionGrid
              label="代码块主题"
              value={current.blocks?.codeTheme ?? "default"}
              options={CODE_THEME_OPTIONS}
              onChange={(value) => onChange(updateNestedConfig(current, "blocks", { codeTheme: value }))}
            />
          </StyleSection>

          <StyleSection icon={<Palette className="h-4 w-4 text-slate-500" />} title="配色">
            <StyleColorInput
              label="强调色"
              value={current.palette?.accent ?? "#2563eb"}
              onChange={(value) => onChange(updateNestedConfig(current, "palette", { accent: value }))}
            />
            <StyleColorInput
              label="表面色"
              value={current.palette?.surface ?? "#ffffff"}
              onChange={(value) => onChange(updateNestedConfig(current, "palette", { surface: value }))}
            />
            <StyleColorInput
              label="文字色"
              value={current.palette?.text ?? "#0f172a"}
              onChange={(value) => onChange(updateNestedConfig(current, "palette", { text: value }))}
            />
          </StyleSection>
        </div>
      </div>

      <div className="border-t border-slate-200 px-4 py-4">
        <button
          type="button"
          onClick={onOpenStyleEditor}
          className="inline-flex w-full items-center justify-center gap-2 border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          <Code2 className="h-4 w-4" />
          打开 CSS 编辑器
        </button>
      </div>
    </div>
  );
}

function StyleSection({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 border border-slate-200 bg-white p-4 shadow-[0_4px_14px_rgba(15,23,42,0.03)]">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
        {icon}
        {title}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function OptionGrid<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: OptionItem<T>[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
        {label}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => {
          const active = option.value === value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={cn(
                "border px-3 py-3 text-left transition-colors",
                active
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-[#fafaf8] text-slate-700 hover:bg-white",
              )}
            >
              <div className="text-sm font-medium">{option.label}</div>
              {option.description ? (
                <div className={cn("mt-1 text-xs leading-5", active ? "text-slate-200" : "text-slate-500")}>
                  {option.description}
                </div>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StyleColorInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <div className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
        {label}
      </div>
      <div className="flex items-center gap-3 border border-slate-200 bg-[#fafaf8] px-3 py-2.5">
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-9 w-9 border-0 bg-transparent p-0"
        />
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none"
        />
      </div>
    </label>
  );
}
