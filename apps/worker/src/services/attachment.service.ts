import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import { EmailAttachment } from '@mailer/shared';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const DOWNLOAD_TIMEOUT = 60000; // 60 seconds

export interface DownloadedAttachment {
  filename: string;
  path: string;
  contentType: string;
}

export async function downloadAttachments(attachments: EmailAttachment[]): Promise<DownloadedAttachment[]> {
  const downloaded: DownloadedAttachment[] = [];

  for (const attachment of attachments) {
    if (!attachment.url) continue;

    try {
      // Validate SSRF/Domain if necessary (omitted complex logic for brevity, assuming internal/trusted initially, but must be careful)
      const parsedUrl = new URL(attachment.url);
      if (['localhost', '127.0.0.1', '169.254.169.254'].includes(parsedUrl.hostname)) {
        throw new Error('Blocked local domain download');
      }

      const response = await axios.get(attachment.url, {
        responseType: 'arraybuffer',
        timeout: DOWNLOAD_TIMEOUT,
        maxContentLength: MAX_FILE_SIZE,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });

      const contentTypeHeader = response.headers['content-type'];
      const contentType = (typeof contentTypeHeader === 'string' ? contentTypeHeader : Array.isArray(contentTypeHeader) ? contentTypeHeader[0] : attachment.contentType) || 'application/octet-stream';
      const tmpPath = path.join(os.tmpdir(), `mailer_att_${uuidv4()}_${attachment.filename}`);

      await fs.writeFile(tmpPath, response.data);

      downloaded.push({
        filename: attachment.filename,
        path: tmpPath,
        contentType,
      });
    } catch (error: any) {
      // Clean up already downloaded ones before throwing
      await cleanupAttachments(downloaded);
      throw new Error(`Failed to download attachment ${attachment.filename}: ${error.message}`);
    }
  }

  return downloaded;
}

export async function cleanupAttachments(attachments: DownloadedAttachment[]) {
  for (const att of attachments) {
    try {
      await fs.unlink(att.path);
    } catch (error) {
      console.warn(`Failed to cleanup temp file: ${att.path}`, error);
    }
  }
}

export async function startupTempCleanupScan() {
  try {
    const tmpDir = os.tmpdir();
    const files = await fs.readdir(tmpDir);
    let deletedCount = 0;
    
    for (const file of files) {
      if (file.startsWith('mailer_att_')) {
        const filePath = path.join(tmpDir, file);
        const stats = await fs.stat(filePath);
        const now = Date.now();
        // Delete if older than 24 hours
        if (now - stats.mtimeMs > 24 * 60 * 60 * 1000) {
          await fs.unlink(filePath);
          deletedCount++;
        }
      }
    }
    if (deletedCount > 0) {
      console.log(`[Worker] Startup cleanup removed ${deletedCount} stale attachment files.`);
    }
  } catch (error) {
    console.warn('[Worker] Failed to run startup temp cleanup scan', error);
  }
}

