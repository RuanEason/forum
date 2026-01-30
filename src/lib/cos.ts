import COS from 'cos-nodejs-sdk-v5';

/**
 * 腾讯云 COS 客户端
 * 封装对象存储的上传、删除等操作
 */
const cos = new COS({
  SecretId: process.env.TENCENT_COS_SECRET_ID,
  SecretKey: process.env.TENCENT_COS_SECRET_KEY,
});

/**
 * 上传文件到腾讯云 COS
 * @param fileBuffer - 文件的 Buffer 数据
 * @param filename - COS 中的文件路径（如 images/xxx.webp）
 * @returns Promise<string> - CDN 访问 URL
 * @throws 当上传失败时抛出错误
 *
 * @example
 * ```typescript
 * const buffer = fs.readFileSync('./test.jpg');
 * const url = await uploadToCOS(buffer, 'images/test.webp');
 * console.log(url); // https://cdn.example.com/images/test.webp
 * ```
 */
export async function uploadToCOS(fileBuffer: Buffer, filename: string): Promise<string> {
  const bucket = process.env.TENCENT_COS_BUCKET;
  const region = process.env.TENCENT_COS_REGION;
  const cdnDomain = process.env.NEXT_PUBLIC_CDN_DOMAIN;

  if (!bucket || !region || !cdnDomain) {
    throw new Error('Missing COS configuration: TENCENT_COS_BUCKET, TENCENT_COS_REGION, or NEXT_PUBLIC_CDN_DOMAIN is not set');
  }

  // 根据文件名扩展名设置正确的 ContentType
  let contentType = 'application/octet-stream';
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'jpg' || ext === 'jpeg') {
    contentType = 'image/jpeg';
  } else if (ext === 'png') {
    contentType = 'image/png';
  } else if (ext === 'webp') {
    contentType = 'image/webp';
  } else if (ext === 'gif') {
    contentType = 'image/gif';
  }

  return new Promise((resolve, reject) => {
    cos.putObject({
      Bucket: bucket,
      Region: region,
      Key: filename,
      Body: fileBuffer,
      ContentType: contentType,
    }, (err, data) => {
      if (err) {
        console.error('COS upload error:', err);
        reject(new Error(`Failed to upload to COS: ${err.message}`));
      } else {
        // 返回 CDN URL
        const cdnUrl = `${cdnDomain}/${filename}`;
        console.log('File uploaded to COS successfully:', cdnUrl);
        resolve(cdnUrl);
      }
    });
  });
}

/**
 * 从腾讯云 COS 删除文件
 * @param filename - COS 中的文件路径（如 images/xxx.webp）
 * @returns Promise<void>
 * @throws 当删除失败时抛出错误
 *
 * @example
 * ```typescript
 * await deleteFromCOS('images/test.webp');
 * ```
 */
export async function deleteFromCOS(filename: string): Promise<void> {
  const bucket = process.env.TENCENT_COS_BUCKET;
  const region = process.env.TENCENT_COS_REGION;

  if (!bucket || !region) {
    throw new Error('Missing COS configuration: TENCENT_COS_BUCKET or TENCENT_COS_REGION is not set');
  }

  return new Promise((resolve, reject) => {
    cos.deleteObject({
      Bucket: bucket,
      Region: region,
      Key: filename,
    }, (err, data) => {
      if (err) {
        console.error('COS delete error:', err);
        reject(new Error(`Failed to delete from COS: ${err.message}`));
      } else {
        console.log('File deleted from COS successfully:', filename);
        resolve();
      }
    });
  });
}

export { cos };
