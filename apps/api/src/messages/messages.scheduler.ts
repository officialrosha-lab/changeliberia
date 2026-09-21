import { Injectable, Logger } from '@nestjs/common';
import { MessagesService } from './messages.service';

@Injectable()
export class MessagesScheduler {
  private readonly logger = new Logger(MessagesScheduler.name);

  constructor(private messagesService: MessagesService) {}

  /**
   * Archive old messages. Read messages: after 180 days. Unread: after 260 days.
   * Invoked daily at midnight UTC by Vercel Cron via CronController — see apps/api/src/cron.
   */
  async handleMessageArchival() {
    this.logger.debug(
      'Starting daily message archival job at',
      new Date().toISOString(),
    );

    try {
      const result = await this.messagesService.archiveOldMessages();

      this.logger.log(
        `Message archival completed: ${result.archivedCount} messages archived`,
      );

      return result;
    } catch (error) {
      this.logger.error('Error during message archival:', error);
      throw error;
    }
  }
}
