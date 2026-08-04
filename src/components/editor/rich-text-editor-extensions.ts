import { ReactNodeViewRenderer } from "@tiptap/react";
import { RichTextImage } from "@/lib/rich-text/extensions";
import RichTextImageView from "@/components/editor/RichTextImageView";

export const EditableRichTextImage = RichTextImage.extend({
  addNodeView() {
    return ReactNodeViewRenderer(RichTextImageView);
  },
});
