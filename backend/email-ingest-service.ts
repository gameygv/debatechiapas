/**
 * Express/Next.js API Handler Reference
 * Route: POST /api/ingest/email
 */

import { UploadService } from './upload-service';

interface EmailPayload {
  subject: string;
  text: string;
  html: string;
  from: string; // e.g., "Moy Montes <redaccion@moymontes.com>"
  attachments?: Array<{
    filename: string;
    content: Buffer; // or base64 string
    contentType: string;
  }>;
  secret: string;
}

export class EmailIngestService {
  private allowedEmails = ['redaccion@moymontes.com'];
  private appSecret: string;
  private uploadService: UploadService;

  constructor(appSecret: string, uploadService: UploadService) {
    this.appSecret = appSecret;
    this.uploadService = uploadService;
  }

  async processIncomingEmail(payload: EmailPayload) {
    // 1. Security Check
    if (payload.secret !== this.appSecret) {
      throw new Error('Invalid secret provided.');
    }

    // 2. Sender Validation
    const senderEmail = this.extractEmail(payload.from);
    if (!this.allowedEmails.includes(senderEmail)) {
      throw new Error('Unauthorized sender.');
    }

    // 3. Process Attachments (Images)
    let featuredImage = null;
    const gallery = [];

    if (payload.attachments && payload.attachments.length > 0) {
      for (const att of payload.attachments) {
        if (att.contentType.startsWith('image/')) {
          // Upload to SFTP using our existing service
          const uploaded = await this.uploadService.uploadImage(
            att.content, 
            att.filename, 
            'email-bot'
          );
          
          if (!featuredImage) {
            featuredImage = uploaded.url;
          } else {
            gallery.push(uploaded.url);
          }
        }
      }
    }

    // 4. Create Article Draft Object
    // (In a real app, this would save to Postgres via Prisma)
    const draftArticle = {
      title: payload.subject,
      slug: this.slugify(payload.subject),
      excerpt: payload.text.substring(0, 160) + '...', // First 160 chars
      content: payload.html || `<p>${payload.text}</p>`, // Fallback to text
      featuredImage: featuredImage, // Might be null, needs admin review
      gallery: gallery,
      status: 'draft', // Always safe to draft first
      authorEmail: senderEmail,
      source: 'email-ingest',
      createdAt: new Date()
    };

    console.log('Draft created:', draftArticle.title);
    return draftArticle;
  }

  private extractEmail(fromHeader: string): string {
    const match = fromHeader.match(/<(.+)>/);
    return match ? match[1] : fromHeader;
  }

  private slugify(text: string): string {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')     // Replace spaces with -
      .replace(/[^\w\-]+/g, '') // Remove all non-word chars
      .replace(/\-\-+/g, '-');  // Replace multiple - with single -
  }
}