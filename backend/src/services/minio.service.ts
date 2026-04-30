import * as Minio from 'minio'
import { Readable } from 'stream'

const client = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'minio',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY!,
  secretKey: process.env.MINIO_SECRET_KEY!,
})

const BUCKET = process.env.MINIO_BUCKET || 'devstand'

export async function ensureBucket() {
  const exists = await client.bucketExists(BUCKET)
  if (!exists) await client.makeBucket(BUCKET)
}

export async function uploadFile(key: string, buffer: Buffer, contentType: string): Promise<string> {
  await client.putObject(BUCKET, key, buffer, buffer.length, { 'Content-Type': contentType })
  return `${process.env.MINIO_PUBLIC_URL}/${BUCKET}/${key}`
}

export async function deleteFile(key: string): Promise<void> {
  await client.removeObject(BUCKET, key)
}

export async function getPresignedUrl(key: string, expiry = 3600): Promise<string> {
  return client.presignedGetObject(BUCKET, key, expiry)
}
