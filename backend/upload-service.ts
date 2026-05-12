/**
 * REFERENCE IMPLEMENTATION - NODE.JS SERVICE
 * 
 * Required packages:
 * npm install ssh2-sftp-client sharp uuid mime-types
 */

import Client from 'ssh2-sftp-client';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import mime from 'mime-types';

// Configuration interface
interface StorageConfig {
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKey?: string;
  remotePath: string; // e.g., /home/user/public_html/uploads
  publicUrlBase: string; // e.g., https://cdn.example.com/uploads
}

// Image sizes to generate
const SIZES = {
  thumbnail: 480,
  medium: 768,
  large: 1200,
  xlarge: 1600
};

export class UploadService {
  private sftp: Client;
  private config: StorageConfig;

  constructor(config: StorageConfig) {
    this.sftp = new Client();
    this.config = config;
  }

  async connect() {
    try {
      await this.sftp.connect({
        host: this.config.host,
        port: this.config.port,
        username: this.config.username,
        password: this.config.password,
        privateKey: this.config.privateKey,
      });
      console.log("SFTP Connected");
    } catch (err) {
      console.error("SFTP Connection Error:", err);
      throw err;
    }
  }

  async disconnect() {
    await this.sftp.end();
  }

  /**
   * Process and upload an image file
   * @param fileBuffer - The raw file buffer
   * @param originalFilename - Original name of the file
   * @param authorId - ID of the user uploading
   */
  async uploadImage(fileBuffer: Buffer, originalFilename: string, authorId: string) {
    const fileId = uuidv4();
    const dateFolder = new Date().toISOString().slice(0, 7); // YYYY-MM
    const remoteDir = `${this.config.remotePath}/${dateFolder}`;
    
    // Ensure remote directory exists
    try {
      await this.sftp.mkdir(remoteDir, true);
    } catch (e) {
      // Ignore if exists
    }

    const results = [];
    const meta = await sharp(fileBuffer).metadata();

    // 1. Process and upload WebP versions
    const tasks = Object.entries(SIZES).map(async ([sizeName, width]) => {
      if (meta.width && meta.width < width) return; // Skip if original is smaller

      const processedBuffer = await sharp(fileBuffer)
        .resize(width)
        .webp({ quality: 80 })
        .toBuffer();

      const fileName = `${fileId}-${sizeName}.webp`;
      const remotePath = `${remoteDir}/${fileName}`;

      await this.sftp.put(processedBuffer, remotePath);
      
      results.push({
        size: sizeName,
        url: `${this.config.publicUrlBase}/${dateFolder}/${fileName}`,
        width,
        format: 'webp'
      });
    });

    // 2. Upload Original (optimized)
    const originalOptimized = await sharp(fileBuffer)
      .webp({ quality: 90 })
      .toBuffer();
    
    const originalName = `${fileId}-original.webp`;
    await this.sftp.put(originalOptimized, `${remoteDir}/${originalName}`);
    
    await Promise.all(tasks);

    // Return the MediaAsset object structure for DB
    return {
      id: fileId,
      url: `${this.config.publicUrlBase}/${dateFolder}/${originalName}`,
      filename: originalName,
      mimeType: 'image/webp',
      size: originalOptimized.length,
      width: meta.width,
      height: meta.height,
      variants: results,
      createdBy: authorId,
      createdAt: new Date().toISOString()
    };
  }
}