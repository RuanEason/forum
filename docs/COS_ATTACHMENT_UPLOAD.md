# COS Attachment Direct Upload

The editor attachment flow uses `cos-js-sdk-v5.sliceUploadFile` with a short-lived STS credential. The Next.js server only creates and validates the draft asset; the file bytes go directly from the browser to COS.

## Required COS CORS settings

For the COS bucket used by `TENCENT_COS_BUCKET`, allow the forum origin and these methods:

- Origins: the production forum origin and local development origin when needed
- Methods: `GET`, `HEAD`, `POST`, `PUT`, `OPTIONS`
- Allowed headers: `*`
- Expose headers: `ETag`, `Content-Length`, `Content-Type`, `x-cos-request-id`
- Max age: at least `600`

The browser must be able to reach the COS bucket endpoint directly. The CDN domain is used for the final public attachment URL, not for the upload API calls.

## Cleanup job

Call `POST /api/attachments/cleanup` once per day with:

```text
x-cron-secret: <CRON_SECRET>
```

The endpoint removes attachment draft assets that have remained `UPLOADING` for more than 24 hours and aborts their unfinished multipart uploads.
