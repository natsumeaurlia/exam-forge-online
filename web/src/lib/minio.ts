import * as Minio from 'minio';

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
});

const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || 'exam-forge';

// Initialize bucket if it doesn't exist
export async function initializeBucket() {
  try {
    const exists = await minioClient.bucketExists(BUCKET_NAME);
    if (!exists) {
      await minioClient.makeBucket(BUCKET_NAME, 'us-east-1');

      // Set bucket policy to allow public read access for images
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`],
          },
        ],
      };

      await minioClient.setBucketPolicy(BUCKET_NAME, JSON.stringify(policy));
    }
  } catch (error) {
    console.error('Error initializing MinIO bucket:', error);
  }
}

export async function uploadFile(
  file: Buffer,
  fileName: string,
  contentType: string
): Promise<string> {
  await initializeBucket();

  const objectName = `questions/${Date.now()}-${fileName}`;

  await minioClient.putObject(BUCKET_NAME, objectName, file, file.length, {
    'Content-Type': contentType,
  });

  // Return the public URL
  const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http';
  const host = process.env.MINIO_ENDPOINT || 'localhost';
  const port = process.env.MINIO_PORT || '9000';

  return `${protocol}://${host}:${port}/${BUCKET_NAME}/${objectName}`;
}

export async function deleteFile(fileName: string): Promise<void> {
  try {
    await minioClient.removeObject(BUCKET_NAME, fileName);
  } catch (error) {
    console.error('Error deleting file from MinIO:', error);
  }
}

export async function getSignedUrl(
  fileName: string,
  expiry = 3600
): Promise<string> {
  try {
    return await minioClient.presignedGetObject(BUCKET_NAME, fileName, expiry);
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw error;
  }
}
