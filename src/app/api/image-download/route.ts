import { NextRequest } from "next/server";

const DEFAULT_ALLOWED_HOSTS = ["cdn.zyg2024.top"];

const getHostnameFromEnvUrl = (value?: string) => {
  if (!value) return null;

  try {
    const url = new URL(value.startsWith("http") ? value : `https://${value}`);
    return url.hostname.toLowerCase();
  } catch {
    return null;
  }
};

const getAllowedHosts = (request: NextRequest) => {
  return new Set(
    [
      request.nextUrl.hostname.toLowerCase(),
      ...DEFAULT_ALLOWED_HOSTS,
      getHostnameFromEnvUrl(process.env.NEXT_PUBLIC_CDN_DOMAIN),
    ].filter((host): host is string => Boolean(host)),
  );
};

const isAllowedProtocol = (url: URL, request: NextRequest) => {
  if (url.protocol === "https:") return true;

  return (
    url.protocol === "http:" &&
    url.hostname.toLowerCase() === request.nextUrl.hostname.toLowerCase()
  );
};

const sanitizeFilename = (filename: string) => {
  return filename
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim();
};

const getFilenameFromUrl = (url: URL, fallback = "image") => {
  const pathnameName = decodeURIComponent(
    url.pathname.split("/").filter(Boolean).pop() || "",
  );
  const sanitized = sanitizeFilename(pathnameName || fallback);

  if (/\.[a-z0-9]{2,8}$/i.test(sanitized)) {
    return sanitized;
  }

  return `${sanitized || fallback}.jpg`;
};

const getAttachmentDisposition = (filename: string) => {
  const asciiFilename = filename.replace(/[^\x20-\x7e]/g, "_");
  const encodedFilename = encodeURIComponent(filename);

  return `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodedFilename}`;
};

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get("url");

  if (!rawUrl) {
    return Response.json({ error: "Missing image url" }, { status: 400 });
  }

  let imageUrl: URL;

  try {
    imageUrl = new URL(rawUrl, request.nextUrl.origin);
  } catch {
    return Response.json({ error: "Invalid image url" }, { status: 400 });
  }

  const allowedHosts = getAllowedHosts(request);
  const hostname = imageUrl.hostname.toLowerCase();

  if (!isAllowedProtocol(imageUrl, request) || !allowedHosts.has(hostname)) {
    return Response.json({ error: "Image host is not allowed" }, { status: 400 });
  }

  if (imageUrl.pathname === request.nextUrl.pathname) {
    return Response.json({ error: "Invalid image url" }, { status: 400 });
  }

  const upstreamResponse = await fetch(imageUrl, {
    headers: {
      Accept: "image/avif,image/webp,image/png,image/jpeg,image/gif,image/*,*/*;q=0.8",
    },
  });

  if (!upstreamResponse.ok || !upstreamResponse.body) {
    return Response.json(
      { error: "Failed to fetch image" },
      { status: upstreamResponse.status || 502 },
    );
  }

  const contentType =
    upstreamResponse.headers.get("content-type") || "application/octet-stream";

  if (!contentType.toLowerCase().startsWith("image/")) {
    return Response.json({ error: "URL is not an image" }, { status: 415 });
  }

  const filenameParam = request.nextUrl.searchParams.get("filename");
  const filename = sanitizeFilename(filenameParam || getFilenameFromUrl(imageUrl));
  const headers = new Headers({
    "Content-Type": contentType,
    "Content-Disposition": getAttachmentDisposition(filename || "image.jpg"),
    "Cache-Control": "private, max-age=300",
    "X-Content-Type-Options": "nosniff",
  });

  const contentLength = upstreamResponse.headers.get("content-length");
  if (contentLength) {
    headers.set("Content-Length", contentLength);
  }

  return new Response(upstreamResponse.body, {
    status: 200,
    headers,
  });
}
