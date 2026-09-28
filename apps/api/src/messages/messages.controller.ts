import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpStatus,
  HttpCode,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateMessageDto, SearchMessagesDto } from './dto';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private messagesService: MessagesService) {}

  /**
   * Get user's inbox with pagination and optional filters
   */
  @Get('inbox')
  async getInbox(
    @Req() req: { user: { userId: string } },
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
    @Query('category') category?: string,
    @Query('isRead') isRead?: string,
  ) {
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const filters: { category?: string; isRead?: boolean } = {};

    if (category) filters.category = category;
    if (isRead !== undefined) filters.isRead = isRead === 'true';

    return this.messagesService.getInbox(
      req.user.userId,
      skip,
      parseInt(pageSize),
      filters,
    );
  }

  /**
   * Get unread message count
   */
  @Get('unread-count')
  async getUnreadCount(@Req() req: { user: { userId: string } }) {
    const count = await this.messagesService.getUnreadCount(req.user.userId);
    return { unreadCount: count };
  }

  /**
   * Send a direct message to another user
   */
  @Post()
  async sendMessage(
    @Body() dto: CreateMessageDto,
    @Req() req: { user: { userId: string } },
  ) {
    return this.messagesService.createMessage(dto, req.user.userId);
  }

  /**
   * Get message detail
   */
  @Get(':id')
  async getMessageDetail(
    @Param('id') messageId: string,
    @Req() req: { user: { userId: string } },
  ) {
    const message = await this.messagesService.getMessageDetail(
      messageId,
      req.user.userId,
    );

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Mark as read if recipient
    if (message.recipientId === req.user.userId && !message.isRead) {
      await this.messagesService.markAsRead(messageId, req.user.userId);
    }

    return message;
  }

  /**
   * Get message thread
   */
  @Get(':id/thread')
  async getMessageThread(
    @Param('id') messageId: string,
    @Req() req: { user: { userId: string } },
  ) {
    const thread = await this.messagesService.getMessageThread(
      messageId,
      req.user.userId,
    );

    if (!thread) {
      throw new NotFoundException('Message thread not found');
    }

    return thread;
  }

  /**
   * Mark a message as read
   */
  @Put(':id/read')
  @HttpCode(HttpStatus.OK)
  async markAsRead(
    @Param('id') messageId: string,
    @Req() req: { user: { userId: string } },
  ) {
    return this.messagesService.markAsRead(messageId, req.user.userId);
  }

  /**
   * Mark multiple messages as read
   */
  @Put('mark-read/bulk')
  @HttpCode(HttpStatus.OK)
  async markMultipleAsRead(
    @Body() body: { messageIds: string[] },
    @Req() req: { user: { userId: string } },
  ) {
    if (!body.messageIds || !Array.isArray(body.messageIds)) {
      throw new BadRequestException('messageIds must be an array');
    }

    return this.messagesService.markMultipleAsRead(
      body.messageIds,
      req.user.userId,
    );
  }

  /**
   * Archive a message (soft delete)
   */
  @Put(':id/archive')
  @HttpCode(HttpStatus.OK)
  async archiveMessage(
    @Param('id') messageId: string,
    @Req() req: { user: { userId: string } },
  ) {
    return this.messagesService.archiveMessage(messageId, req.user.userId);
  }

  /**
   * Delete a message permanently
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteMessage(
    @Param('id') messageId: string,
    @Req() req: { user: { userId: string } },
  ) {
    return this.messagesService.deleteMessage(messageId, req.user.userId);
  }

  /**
   * Search messages
   */
  @Get('search/query')
  async searchMessages(
    @Req() req: { user: { userId: string } },
    @Query() dto: SearchMessagesDto,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
  ) {
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    return this.messagesService.searchMessages(
      req.user.userId,
      dto,
      skip,
      parseInt(pageSize),
    );
  }
}
