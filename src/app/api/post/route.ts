import { NextRequest, NextResponse } from "next/server";
import { createPost, updatePost, deletePost, getPosts } from "@/lib/post";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteFromCOS } from "@/lib/cos";
import { rewardActionExperience } from "@/lib/experience";
import type { JSONContent } from "@tiptap/core";
import {
  createEmptyRichTextDocument,
  hasRichTextContent,
  parseRichTextDocument,
  serializeRichTextDocument,
} from "@/lib/rich-text/content";
import { renderRichTextHtml } from "@/lib/rich-text/server";
import { linkMarkdownMentions, linkRichTextMentions } from "@/lib/mentions";

/**
 * 甯栧瓙瀛楁鏈€澶ч暱搴﹂檺鍒?
 */
// Maximum field lengths
/** @type {const} 甯栧瓙鏍囬鏈€澶ч暱搴︼紙瀛楃鏁帮級 */
const MAX_TITLE_LENGTH = 200;
const MAX_CONTENT_LENGTH = 10000;
const MAX_IMAGES = 10;
const MAX_ATTACHMENTS = 5;
const MAX_URL_LENGTH = 2048;
const POST_TYPES = ["TEXT", "VIDEO"] as const;
const POST_VISIBILITIES = ["PUBLIC", "UNLISTED"] as const;
type PostVisibility = (typeof POST_VISIBILITIES)[number];
type ContentFormat = "RICH_TEXT" | "PLAIN_TEXT";

type SessionShape = {
  user?: {
    id?: string;
    role?: string;
    name?: string | null;
  };
} | null;

type AttachmentPayload = {
  id?: string | null;
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
};

async function deleteCosFileByUrl(fileUrl: string, label: string) {
  try {
    const url = new URL(fileUrl);
    const filename = url.pathname.slice(1);
    if (!filename) {
      return;
    }
    await deleteFromCOS(filename);
  } catch (error) {
    console.error(`Failed to delete ${label} from COS: ${fileUrl}`, error);
  }
}

/**
 * 鑾峰彇甯栧瓙鍒楄〃
 * 鏍规嵁 URL 鏌ヨ鍙傛暟涓殑 topicId 绛涢€夊笘瀛?
 * @param {NextRequest} request - Next.js 璇锋眰瀵硅薄
 * @returns {Promise<NextResponse>} 鍖呭惈甯栧瓙鍒楄〃鐨?JSON 鍝嶅簲
 * @throws {500} 鏈嶅姟鍣ㄥ唴閮ㄩ敊璇椂杩斿洖
 * @example
 * // 鑾峰彇鎵€鏈夊笘瀛?
 * GET /api/post
 * // 鎸夎瘽棰樼瓫閫?
 * GET /pi/post?topicId=123
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const topicId = searchParams.get('topicId');

    const posts = await getPosts(topicId || undefined);
    return NextResponse.json(posts);
  } catch (error) {
    console.error("Get posts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * 鍒涘缓鏂板笘瀛?
 * 楠岃瘉骞跺垱寤烘柊甯栧瓙锛屾敮鎸佹爣棰樸€佸唴瀹广€佸浘鐗囧拰璇濋鍏宠仈
 *
 * @param {NextRequest} request - Next.js 璇锋眰瀵硅薄
 * @param {Object} request.body - 鍖呭惈甯栧瓙鏁版嵁鐨勮姹備綋
 * @param {string} [request.body.title] - 甯栧瓙鏍囬锛堝彲閫夛級
 * @param {string} request.body.content - 甯栧瓙鍐呭
 * @param {string[]} [request.body.images] - 鍥剧墖 URL 鏁扮粍锛堟渶澶?10 寮狅級
 * @param {Array<{url: string, fileName: string, fileSize: number, mimeType: string}>} [request.body.attachments] - 闄勪欢鏁扮粍锛堟渶澶?5 涓級
 * @param {string} [request.body.topicId] - 鍏宠仈璇濋 ID
 * @returns {Promise<NextResponse>} 201 鍒涘缓鎴愬姛锛屽寘鍚垱寤虹殑甯栧瓙鏁版嵁
 * @throws {401} Unauthorized - 鐢ㄦ埛鏈櫥褰?
 * @throws {400} Bad Request - 璇锋眰鍙傛暟鏃犳晥鎴栭獙璇佸け璐?
 * @throws {500} Internal Server Error - 鏈嶅姟鍣ㄥ唴閮ㄩ敊璇?
 *
 * @example
 * // 鍒涘缓绾枃鏈笘瀛?
 * POST /api/post
 * {
 *   "content": "杩欐槸鎴戠殑绗竴绡囧笘瀛?
 * }
 *
 * // 鍒涘缓甯︽爣棰樺拰鍥剧墖鐨勫笘瀛?
 * POST /api/post
 * {
 *   "title": "鏍囬",
 *   "content": "鍐呭",
 *   "images": ["https://example.com/image1.jpg"],
 *   "topicId": "topic123"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as SessionShape;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      title,
      content,
      contentJson,
      contentFormat,
      images,
      attachments,
      topicId,
      postType,
      visibility,
      isAnnouncement,
      videoAssetId,
      videoCoverUrl,
    } = await request.json() as {
      title?: unknown;
      content?: unknown;
      contentJson?: unknown;
      contentFormat?: unknown;
      images?: unknown;
      attachments?: unknown;
      topicId?: unknown;
      postType?: unknown;
      visibility?: unknown;
      isAnnouncement?: unknown;
      videoAssetId?: unknown;
      videoCoverUrl?: unknown;
    };

    // Validate title (optional)
    if (title !== undefined && title !== null) {
      if (typeof title !== 'string') {
        return NextResponse.json({ error: "Title must be a string" }, { status: 400 });
      }
      if (title.length > MAX_TITLE_LENGTH) {
        return NextResponse.json(
          { error: `Title must be less than ${MAX_TITLE_LENGTH} characters` },
          { status: 400 }
        );
      }
    }

    // Validate content
    if (content !== undefined && content !== null) {
      if (typeof content !== 'string') {
        return NextResponse.json({ error: "Content must be a string" }, { status: 400 });
      }
      if (content.length > MAX_CONTENT_LENGTH && contentFormat !== "RICH_TEXT") {
        return NextResponse.json(
          { error: `Content must be less than ${MAX_CONTENT_LENGTH} characters` },
          { status: 400 }
        );
      }
    }

    // Validate postType (optional)
    if (postType !== undefined && postType !== null && typeof postType !== "string") {
      return NextResponse.json({ error: "postType must be a string" }, { status: 400 });
    }
    const normalizedPostType = typeof postType === "string" ? postType.toUpperCase() : "TEXT";
    if (!POST_TYPES.includes(normalizedPostType as (typeof POST_TYPES)[number])) {
      return NextResponse.json(
        { error: `postType must be one of ${POST_TYPES.join(", ")}` },
        { status: 400 },
      );
    }

    // Validate visibility (optional)
    if (visibility !== undefined && visibility !== null && typeof visibility !== "string") {
      return NextResponse.json({ error: "visibility must be a string" }, { status: 400 });
    }
    const visibilityCandidate = typeof visibility === "string" ? visibility.toUpperCase() : "PUBLIC";
    if (!POST_VISIBILITIES.includes(visibilityCandidate as PostVisibility)) {
      return NextResponse.json(
        { error: `visibility must be one of ${POST_VISIBILITIES.join(", ")}` },
        { status: 400 },
      );
    }
    const normalizedVisibility: PostVisibility = visibilityCandidate as PostVisibility;

    if (isAnnouncement !== undefined && typeof isAnnouncement !== "boolean") {
      return NextResponse.json({ error: "isAnnouncement must be a boolean" }, { status: 400 });
    }
    if (isAnnouncement !== undefined && session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Only administrators can manage forum announcements" },
        { status: 403 },
      );
    }
    if (isAnnouncement === true && normalizedPostType !== "TEXT") {
      return NextResponse.json({ error: "Only text posts can be announcements" }, { status: 400 });
    }
    if (isAnnouncement === true && normalizedVisibility !== "PUBLIC") {
      return NextResponse.json({ error: "Announcements must be public" }, { status: 400 });
    }
    const normalizedAnnouncement = isAnnouncement === true;

    if (videoAssetId !== undefined && videoAssetId !== null && typeof videoAssetId !== "string") {
      return NextResponse.json({ error: "videoAssetId must be a string" }, { status: 400 });
    }

    if (videoCoverUrl !== undefined && videoCoverUrl !== null && typeof videoCoverUrl !== "string") {
      return NextResponse.json({ error: "videoCoverUrl must be a string" }, { status: 400 });
    }
    if (typeof videoCoverUrl === "string" && videoCoverUrl.length > MAX_URL_LENGTH) {
      return NextResponse.json(
        { error: `videoCoverUrl must be less than ${MAX_URL_LENGTH} characters` },
        { status: 400 },
      );
    }

    if (topicId !== undefined && topicId !== null && typeof topicId !== "string") {
      return NextResponse.json({ error: "topicId must be a string" }, { status: 400 });
    }

    // Validate images (optional array of strings)
    if (images !== undefined && images !== null) {
      if (!Array.isArray(images)) {
        return NextResponse.json({ error: "Images must be an array" }, { status: 400 });
      }
      if (images.length > MAX_IMAGES) {
        return NextResponse.json(
          { error: `Maximum ${MAX_IMAGES} images allowed` },
          { status: 400 }
        );
      }
      for (const img of images) {
        if (typeof img !== 'string') {
          return NextResponse.json({ error: "Each image must be a string URL" }, { status: 400 });
        }
      }
    }

    // Validate attachments (optional array of objects)
    if (attachments !== undefined && attachments !== null) {
      if (!Array.isArray(attachments)) {
        return NextResponse.json({ error: "Attachments must be an array" }, { status: 400 });
      }
      if (attachments.length > MAX_ATTACHMENTS) {
        return NextResponse.json(
          { error: `Maximum ${MAX_ATTACHMENTS} attachments allowed` },
          { status: 400 }
        );
      }
      for (const att of attachments) {
        if (typeof att !== 'object' || att === null) {
          return NextResponse.json({ error: "Each attachment must be an object" }, { status: 400 });
        }
        if (typeof att.url !== 'string') {
          return NextResponse.json({ error: "Attachment url must be a string" }, { status: 400 });
        }
        if (typeof att.fileName !== 'string') {
          return NextResponse.json({ error: "Attachment fileName must be a string" }, { status: 400 });
        }
        if (typeof att.fileSize !== 'number') {
          return NextResponse.json({ error: "Attachment fileSize must be a number" }, { status: 400 });
        }
        if (typeof att.mimeType !== 'string') {
          return NextResponse.json({ error: "Attachment mimeType must be a string" }, { status: 400 });
        }
      }
    }
    let normalizedContent = typeof content === "string" ? content : "";
    let normalizedContentJson: JSONContent | null = null;
    let normalizedContentFormat: ContentFormat = normalizedPostType === "TEXT" ? "RICH_TEXT" : "PLAIN_TEXT";

    if (normalizedPostType === "TEXT") {
      if (contentFormat !== undefined && contentFormat !== "RICH_TEXT" && contentFormat !== "PLAIN_TEXT") {
        return NextResponse.json({ error: "contentFormat must be RICH_TEXT or PLAIN_TEXT" }, { status: 400 });
      }

      const document = contentJson === undefined || contentJson === null
        ? createEmptyRichTextDocument()
        : parseRichTextDocument(contentJson);
      if (!document) {
        return NextResponse.json({ error: "Invalid rich text content" }, { status: 400 });
      }
      try {
        serializeRichTextDocument(document);
        normalizedContentJson = await linkRichTextMentions(document);
        normalizedContent = renderRichTextHtml(normalizedContentJson);
      } catch (error) {
        return NextResponse.json(
          { error: error instanceof Error ? error.message : "Invalid rich text content" },
          { status: 400 },
        );
      }
      normalizedContentFormat = "RICH_TEXT";
    }
    const normalizedImages = Array.isArray(images) ? images : [];
    const normalizedAttachments = Array.isArray(attachments) ? attachments : [];

    let post;
    if (normalizedPostType === "VIDEO") {
      if (normalizedImages.length > 0) {
        return NextResponse.json(
          { error: "Video posts only support text + attachments, images are not allowed" },
          { status: 400 },
        );
      }

      const normalizedVideoAssetId = typeof videoAssetId === "string" ? videoAssetId.trim() : "";
      const normalizedVideoCoverUrl = typeof videoCoverUrl === "string" ? videoCoverUrl.trim() : "";
      if (!normalizedVideoAssetId) {
        return NextResponse.json({ error: "videoAssetId is required for VIDEO post" }, { status: 400 });
      }

      const videoAsset = await prisma.videoAsset.findUnique({
        where: { id: normalizedVideoAssetId },
        select: {
          id: true,
          ownerId: true,
          status: true,
          post: {
            select: {
              id: true,
            },
          },
        },
      });

      if (!videoAsset || videoAsset.ownerId !== session.user.id) {
        return NextResponse.json({ error: "Video asset not found" }, { status: 404 });
      }

      if (videoAsset.status !== "READY") {
        return NextResponse.json(
          { error: `Video asset must be READY, current status: ${videoAsset.status}` },
          { status: 400 },
        );
      }

      if (videoAsset.post?.id) {
        return NextResponse.json({ error: "Video asset has already been bound to a post" }, { status: 400 });
      }

      if (normalizedVideoCoverUrl) {
        await prisma.videoAsset.update({
          where: { id: videoAsset.id },
          data: {
            coverUrl: normalizedVideoCoverUrl,
          },
        });
      }

      post = await createPost(
        title,
        await linkMarkdownMentions(normalizedContent),
        session.user.id,
        [],
        topicId || null,
        normalizedAttachments,
        {
          postType: "VIDEO",
          visibility: normalizedVisibility,
          isAnnouncement: normalizedAnnouncement,
          videoId: videoAsset.id,
          contentFormat: "PLAIN_TEXT",
          contentJson: null,
        },
      );
    } else {
      // TEXT 帖子：正文/图片/附件至少一个
      if (
        !hasRichTextContent(normalizedContentJson)
        && normalizedImages.length === 0
        && normalizedAttachments.length === 0
      ) {
        return NextResponse.json(
          { error: "Content, images, or attachments are required" },
          { status: 400 },
        );
      }

      post = await createPost(
        title,
        normalizedContent,
        session.user.id,
        normalizedImages,
        topicId || null,
        normalizedAttachments,
        {
          visibility: normalizedVisibility,
          isAnnouncement: normalizedAnnouncement,
          contentFormat: normalizedContentFormat,
          contentJson: normalizedContentJson,
        },
      );
    }

    try {
      await rewardActionExperience(session.user.id, "post");
    } catch (error) {
      console.error("Failed to reward post experience:", error);
    }

    return NextResponse.json({ message: "Post created successfully", post }, { status: 201 });
  } catch (error) {
    console.error("Create post error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * 鏇存柊甯栧瓙
 * 鍙湁甯栧瓙浣滆€呮垨绠＄悊鍛樺彲浠ョ紪杈戝笘瀛?
 *
 * @param {NextRequest} request - Next.js 璇锋眰瀵硅薄
 * @param {Object} request.body - 璇锋眰浣?
 * @param {string} request.body.id - 甯栧瓙 ID
 * @param {string} request.body.content - 鏇存柊鐨勫笘瀛愬唴瀹?
 * @param {string} [request.body.title] - 鏇存柊鐨勫笘瀛愭爣棰橈紙鍙€夛級
 * @returns {Promise<NextResponse>} 200 鏇存柊鎴愬姛锛屽寘鍚洿鏂板悗鐨勫笘瀛愭暟鎹?
 * @throws {401} Unauthorized - 鐢ㄦ埛鏈櫥褰?
 * @throws {403} Forbidden - 鏃犳潈闄愮紪杈戯紙闈炰綔鑰呬笖闈炵鐞嗗憳锛?
 * @throws {404} Not Found - 甯栧瓙涓嶅瓨鍦?
 * @throws {400} Bad Request - 鍙傛暟鏃犳晥
 * @throws {500} Internal Server Error - 鏈嶅姟鍣ㄥ唴閮ㄩ敊璇?
 *
 * @example
 * PUT /api/post
 * {
 *   "id": "post123",
 *   "title": "鏇存柊鍚庣殑鏍囬",
 *   "content": "鏇存柊鍚庣殑鍐呭"
 * }
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as SessionShape;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      id,
      title,
      content,
      contentJson,
      contentFormat,
      images,
      attachments,
      visibility,
      isAnnouncement,
      topicId,
    } = await request.json() as {
      id?: unknown;
      title?: unknown;
      content?: unknown;
      contentJson?: unknown;
      contentFormat?: unknown;
      images?: unknown;
      attachments?: unknown;
      visibility?: unknown;
      isAnnouncement?: unknown;
      topicId?: unknown;
    };

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
    }

    if (title !== undefined && title !== null) {
      if (typeof title !== "string") {
        return NextResponse.json({ error: "Title must be a string" }, { status: 400 });
      }
      if (title.length > MAX_TITLE_LENGTH) {
        return NextResponse.json(
          { error: `Title must be less than ${MAX_TITLE_LENGTH} characters` },
          { status: 400 },
        );
      }
    }

    if (typeof content !== "string") {
      return NextResponse.json({ error: "Content must be a string" }, { status: 400 });
    }
    if (content.length > MAX_CONTENT_LENGTH && contentFormat !== "RICH_TEXT") {
      return NextResponse.json(
        { error: `Content must be less than ${MAX_CONTENT_LENGTH} characters` },
        { status: 400 },
      );
    }

    if (visibility !== undefined && visibility !== null && typeof visibility !== "string") {
      return NextResponse.json({ error: "visibility must be a string" }, { status: 400 });
    }
    const visibilityCandidate = typeof visibility === "string" ? visibility.toUpperCase() : undefined;
    if (
      visibilityCandidate
      && !POST_VISIBILITIES.includes(visibilityCandidate as PostVisibility)
    ) {
      return NextResponse.json(
        { error: `visibility must be one of ${POST_VISIBILITIES.join(", ")}` },
        { status: 400 },
      );
    }
    const normalizedVisibility = visibilityCandidate
      ? visibilityCandidate as PostVisibility
      : undefined;

    if (topicId !== undefined && topicId !== null && typeof topicId !== "string") {
      return NextResponse.json({ error: "topicId must be a string" }, { status: 400 });
    }

    if (images !== undefined && images !== null && !Array.isArray(images)) {
      return NextResponse.json({ error: "Images must be an array" }, { status: 400 });
    }
    const normalizedImages = Array.isArray(images)
      ? Array.from(new Set(images.map((img) => (typeof img === "string" ? img.trim() : img))))
      : undefined;
    if (normalizedImages && normalizedImages.length > MAX_IMAGES) {
      return NextResponse.json(
        { error: `Maximum ${MAX_IMAGES} images allowed` },
        { status: 400 },
      );
    }
    if (normalizedImages?.some((img) => typeof img !== "string" || img.length === 0)) {
      return NextResponse.json({ error: "Each image must be a string URL" }, { status: 400 });
    }

    if (attachments !== undefined && attachments !== null && !Array.isArray(attachments)) {
      return NextResponse.json({ error: "Attachments must be an array" }, { status: 400 });
    }
    const normalizedAttachments = Array.isArray(attachments)
      ? attachments.map((att) => {
          if (typeof att !== "object" || att === null) {
            return null;
          }

          const candidate = att as Partial<AttachmentPayload>;
          return {
            id: candidate.id ?? null,
            url: candidate.url,
            fileName: candidate.fileName,
            fileSize: candidate.fileSize,
            mimeType: candidate.mimeType,
          };
        })
      : undefined;

    if (normalizedAttachments && normalizedAttachments.length > MAX_ATTACHMENTS) {
      return NextResponse.json(
        { error: `Maximum ${MAX_ATTACHMENTS} attachments allowed` },
        { status: 400 },
      );
    }
    if (normalizedAttachments?.some((att) => att === null)) {
      return NextResponse.json({ error: "Each attachment must be an object" }, { status: 400 });
    }

    const attachmentPayloads = normalizedAttachments as AttachmentPayload[] | undefined;
    if (attachmentPayloads) {
      for (const att of attachmentPayloads) {
        if (att.id !== null && att.id !== undefined && typeof att.id !== "string") {
          return NextResponse.json({ error: "Attachment id must be a string" }, { status: 400 });
        }
        if (typeof att.url !== "string") {
          return NextResponse.json({ error: "Attachment url must be a string" }, { status: 400 });
        }
        if (typeof att.fileName !== "string") {
          return NextResponse.json({ error: "Attachment fileName must be a string" }, { status: 400 });
        }
        if (typeof att.fileSize !== "number") {
          return NextResponse.json({ error: "Attachment fileSize must be a number" }, { status: 400 });
        }
        if (typeof att.mimeType !== "string") {
          return NextResponse.json({ error: "Attachment mimeType must be a string" }, { status: 400 });
        }
      }
    }

    const existingPost = await prisma.post.findUnique({
      where: { id },
      include: {
        attachments: true,
        images: true,
      },
    });

    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // 鍙湁浣滆€呮垨绠＄悊鍛樻墠鑳界紪杈戝笘瀛?
    if (existingPost.authorId !== session.user.id && session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (isAnnouncement !== undefined && typeof isAnnouncement !== "boolean") {
      return NextResponse.json({ error: "isAnnouncement must be a boolean" }, { status: 400 });
    }
    if (isAnnouncement !== undefined && session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Only administrators can manage forum announcements" },
        { status: 403 },
      );
    }

    const finalVisibility = normalizedVisibility ?? existingPost.visibility;
    if (isAnnouncement === true && existingPost.postType !== "TEXT") {
      return NextResponse.json({ error: "Only text posts can be announcements" }, { status: 400 });
    }
    if (isAnnouncement === true && finalVisibility !== "PUBLIC") {
      return NextResponse.json({ error: "Announcements must be public" }, { status: 400 });
    }

    const nextImages = normalizedImages as string[] | undefined;
    const nextAttachments = attachmentPayloads?.map((att) => ({
      id: att.id || null,
      url: att.url.trim(),
      fileName: att.fileName.trim(),
      fileSize: att.fileSize,
      mimeType: att.mimeType.trim(),
    }));

    let nextContent = content;
    let nextContentJson: JSONContent | null = null;
    let nextContentFormat: ContentFormat = existingPost.postType === "TEXT" ? "RICH_TEXT" : "PLAIN_TEXT";

    if (existingPost.postType === "TEXT") {
      if (contentFormat !== undefined && contentFormat !== "RICH_TEXT" && contentFormat !== "PLAIN_TEXT") {
        return NextResponse.json({ error: "contentFormat must be RICH_TEXT or PLAIN_TEXT" }, { status: 400 });
      }

      const richTextValue = contentJson === undefined ? existingPost.contentJson : contentJson;
      const document = richTextValue === null || richTextValue === undefined
        ? createEmptyRichTextDocument()
        : parseRichTextDocument(richTextValue);
      if (!document) {
        return NextResponse.json({ error: "Invalid rich text content" }, { status: 400 });
      }
      try {
        serializeRichTextDocument(document);
        nextContentJson = await linkRichTextMentions(document);
        nextContent = renderRichTextHtml(nextContentJson);
      } catch (error) {
        return NextResponse.json(
          { error: error instanceof Error ? error.message : "Invalid rich text content" },
          { status: 400 },
        );
      }
      nextContentFormat = "RICH_TEXT";
    }

    if (existingPost.postType === "VIDEO" && nextImages && nextImages.length > 0) {
      return NextResponse.json(
        { error: "Video posts do not support images" },
        { status: 400 },
      );
    }

    if (
      existingPost.postType === "TEXT"
      && !hasRichTextContent(nextContentJson)
      && (nextImages ?? existingPost.images.map((image) => image.url)).length === 0
      && (nextAttachments ?? existingPost.attachments).length === 0
    ) {
      return NextResponse.json(
        { error: "Content, images, or attachments are required" },
        { status: 400 },
      );
    }

    const nextImageSet = new Set(nextImages ?? existingPost.images.map((image) => image.url));
    const nextAttachmentIdSet = new Set(
      (nextAttachments ?? existingPost.attachments)
        .map((attachment) => attachment.id)
        .filter(Boolean),
    );
    const removedImageUrls = existingPost.images
      .filter((image) => !nextImageSet.has(image.url))
      .map((image) => image.url);
    const removedAttachmentUrls = existingPost.attachments
      .filter((attachment) => !nextAttachmentIdSet.has(attachment.id))
      .map((attachment) => attachment.url);

    if (existingPost.postType === "VIDEO") {
      nextContent = await linkMarkdownMentions(nextContent);
    }

    const updatedPost = await updatePost(id, {
      title: typeof title === "string" ? title : null,
      content: nextContent,
      contentJson: nextContentJson,
      contentFormat: nextContentFormat,
      visibility: normalizedVisibility,
      images: existingPost.postType === "VIDEO" ? [] : nextImages,
      attachments: nextAttachments,
      topicId: topicId === undefined ? undefined : topicId || null,
      isAnnouncement: isAnnouncement === undefined
        ? (normalizedVisibility === "UNLISTED" ? false : undefined)
        : isAnnouncement,
    }, {
      id: session.user.id,
      name: session.user.name,
    });

    await Promise.all([
      ...removedImageUrls.map((url) => deleteCosFileByUrl(url, "image")),
      ...removedAttachmentUrls.map((url) => deleteCosFileByUrl(url, "attachment")),
    ]);

    return NextResponse.json({ message: "Post updated successfully", post: updatedPost }, { status: 200 });
  } catch (error) {
    console.error("Update post error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * 鍒犻櫎甯栧瓙
 * 鍙湁甯栧瓙浣滆€呮垨绠＄悊鍛樺彲浠ュ垹闄ゅ笘瀛?
 *
 * @param {NextRequest} request - Next.js 璇锋眰瀵硅薄
 * @param {Object} request.body - 璇锋眰浣?
 * @param {string} request.body.id - 瑕佸垹闄ょ殑甯栧瓙 ID
 * @returns {Promise<NextResponse>} 200 鍒犻櫎鎴愬姛
 * @throws {401} Unauthorized - 鐢ㄦ埛鏈櫥褰?
 * @throws {403} Forbidden - 鏃犳潈闄愬垹闄わ紙闈炰綔鑰呬笖闈炵鐞嗗憳锛?
 * @throws {404} Not Found - 甯栧瓙涓嶅瓨鍦?
 * @throws {400} Bad Request - 鍙傛暟鏃犳晥
 * @throws {500} Internal Server Error - 鏈嶅姟鍣ㄥ唴閮ㄩ敊璇?
 *
 * @example
 * DELETE /api/post
 * {
 *   "id": "post123"
 * }
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as SessionShape;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
    }

    const existingPost = await prisma.post.findUnique({
      where: { id: id },
      include: {
        attachments: true,
        images: true,
      },
    });

    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // 鍙湁浣滆€呮垨绠＄悊鍛樻墠鑳藉垹闄ゅ笘瀛?
    if (existingPost.authorId !== session.user.id && session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 鍒犻櫎COS涓殑闄勪欢鏂囦欢
    if (existingPost.attachments.length > 0) {
      for (const attachment of existingPost.attachments) {
        try {
          const url = new URL(attachment.url);
          const filename = url.pathname.slice(1);
          await deleteFromCOS(filename);
        } catch (error) {
          console.error(`Failed to delete attachment from COS: ${attachment.url}`, error);
        }
      }
    }

    // 鍒犻櫎COS涓殑鍥剧墖鏂囦欢
    if (existingPost.images.length > 0) {
      for (const image of existingPost.images) {
        try {
          const url = new URL(image.url);
          const filename = url.pathname.slice(1);
          await deleteFromCOS(filename);
        } catch (error) {
          console.error(`Failed to delete image from COS: ${image.url}`, error);
        }
      }
    }

    await deletePost(id);

    return NextResponse.json({ message: "Post deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Delete post error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
