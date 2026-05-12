import crypto from 'crypto';
import axios from 'axios';

interface ArticlePayload {
  id: string;
  title: string;
  slug: string;
  url: string;
  excerpt: string;
  featuredImageUrl: string;
  categories: string[];
  tags: string[];
  publishedAt: string;
  author: string;
  ogImage?: string;
  shortText?: string; // For tweet body
  html?: string;
}

export class WebhookService {
  private webhookUrl: string;
  private secret: string;

  constructor(webhookUrl: string, secret: string) {
    this.webhookUrl = webhookUrl;
    this.secret = secret;
  }

  /**
   * Generates HMAC-SHA256 signature
   */
  private generateSignature(payload: string): string {
    return crypto
      .createHmac('sha256', this.secret)
      .update(payload)
      .digest('hex');
  }

  /**
   * Triggers the webhook to Make.com or Zapier
   */
  async notifyPublication(article: ArticlePayload) {
    try {
      const payloadString = JSON.stringify(article);
      const signature = this.generateSignature(payloadString);

      const response = await axios.post(this.webhookUrl, article, {
        headers: {
          'Content-Type': 'application/json',
          'X-Signature': signature,
          'User-Agent': 'ElDivoCMS/1.0'
        },
        timeout: 5000
      });

      console.log(`[Webhook] Success: ${response.status}`);
      return true;
    } catch (error) {
      console.error('[Webhook] Failed to notify', error);
      // Implement retry logic here (e.g., using a queue like BullMQ)
      return false;
    }
  }
}