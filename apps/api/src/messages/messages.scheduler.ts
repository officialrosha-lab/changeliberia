import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { MessagesService } from './messages.service';

@Injectable()
export class MessagesScheduler {
  private readonly logger = new Logger(MessagesScheduler.name);

  constructor(private messagesService: MessagesService) {}

  /**
   * Archive old messages daily at midnight (00:00 UTC)
   * Read messages: Archive after 180 days
   * Unread messages: Archive after 260 days
   */
  @Cron('0 0 * * *') // Every day at midnight
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
