import { loadEnvConfig } from "@next/env";
import type { Prisma } from "../src/generated";

type PrismaInstance = typeof import("../src/lib/prisma")["prisma"];
type MentionModule = typeof import("../src/lib/mentions");
type RichTextContentModule = typeof import("../src/lib/rich-text/content");
type RichTextServerModule = typeof import("../src/lib/rich-text/server");

type PostRow = {
  id: string;
  content: string;
  contentJson: unknown;
  contentFormat: "RICH_TEXT" | "PLAIN_TEXT";
};

type CommentRow = {
  id: string;
  content: string;
};

function stableJson(value: unknown): string {
  return JSON.stringify(value);
}

function isDryRun(): boolean {
  return process.argv.slice(2).includes("--dry-run");
}

async function main(
  prisma: PrismaInstance,
  mentionModule: MentionModule,
  richTextContentModule: RichTextContentModule,
  richTextServerModule: RichTextServerModule,
) {
  const {
    collectMentionNamesFromMarkdown,
    collectMentionNamesFromRichText,
    resolveMentionTargets,
    transformMarkdownMentions,
    transformRichTextMentions,
  } = mentionModule;
  const { parseRichTextDocument } = richTextContentModule;
  const { renderRichTextHtml } = richTextServerModule;
  const dryRun = isDryRun();
  const [posts, comments] = await Promise.all([
    prisma.post.findMany({
      select: {
        id: true,
        content: true,
        contentJson: true,
        contentFormat: true,
      },
    }),
    prisma.comment.findMany({
      select: {
        id: true,
        content: true,
      },
    }),
  ]) as [PostRow[], CommentRow[]];

  const names = new Set<string>();
  for (const post of posts) {
    const document = post.contentFormat === "RICH_TEXT"
      ? parseRichTextDocument(post.contentJson)
      : null;

    if (document) {
      for (const name of collectMentionNamesFromRichText(document)) {
        names.add(name);
      }
    } else {
      for (const name of collectMentionNamesFromMarkdown(post.content)) {
        names.add(name);
      }
    }
  }
  for (const comment of comments) {
    for (const name of collectMentionNamesFromMarkdown(comment.content)) {
      names.add(name);
    }
  }

  const targets = await resolveMentionTargets(names);
  let changedPosts = 0;
  let changedComments = 0;

  for (const post of posts) {
    const document = post.contentFormat === "RICH_TEXT"
      ? parseRichTextDocument(post.contentJson)
      : null;

    if (document) {
      const nextDocument = transformRichTextMentions(document, targets);
      const nextContent = renderRichTextHtml(nextDocument);
      const changed = (
        stableJson(nextDocument) !== stableJson(document)
        || nextContent !== post.content
      );

      if (!changed) {
        continue;
      }

      changedPosts += 1;
      if (!dryRun) {
        await prisma.post.update({
          where: { id: post.id },
          data: {
            content: nextContent,
            contentJson: nextDocument as Prisma.InputJsonValue,
          },
        });
      }
      continue;
    }

    const nextContent = transformMarkdownMentions(post.content, targets);
    if (nextContent === post.content) {
      continue;
    }

    changedPosts += 1;
    if (!dryRun) {
      await prisma.post.update({
        where: { id: post.id },
        data: { content: nextContent },
      });
    }
  }

  for (const comment of comments) {
    const nextContent = transformMarkdownMentions(comment.content, targets);
    if (nextContent === comment.content) {
      continue;
    }

    changedComments += 1;
    if (!dryRun) {
      await prisma.comment.update({
        where: { id: comment.id },
        data: { content: nextContent },
      });
    }
  }

  console.log(JSON.stringify({
    dryRun,
    postsScanned: posts.length,
    commentsScanned: comments.length,
    mentionNames: names.size,
    uniquelyResolvedNames: targets.size,
    skippedNames: Math.max(0, names.size - targets.size),
    changedPosts,
    changedComments,
  }, null, 2));
}

async function run() {
  loadEnvConfig(process.cwd());

  const { prisma } = await import("../src/lib/prisma");
  const mentionModule = await import("../src/lib/mentions");
  const richTextContentModule = await import("../src/lib/rich-text/content");
  const richTextServerModule = await import("../src/lib/rich-text/server");

  try {
    await main(prisma, mentionModule, richTextContentModule, richTextServerModule);
  } finally {
    await prisma.$disconnect();
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
