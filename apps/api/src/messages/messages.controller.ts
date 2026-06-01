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
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
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
    @Req() req: any,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
    @Query('category') category?: string,
    @Query('isRead') isRead?: string,
  ) {
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const filters: any = {};

    if (category) filters.category = category;
    if (isRead !== undefined) filters.isRead = isRead === 'true';

    return this.messagesService.getInbox(
      req.user.id,
      skip,
      parseInt(pageSize),
      filters,
    );
  }

  /**
   * Get unread message count
   */
  @Get('unread-count')
  async getUnreadCount(@Req() req: any) {
    const count = await this.messagesService.getUnreadCount(req.user.id);
    return { unreadCount: count };
  }

  /**
   * Send a direct message to another user
   */
  @Post()
  async sendMessage(@Body() dto: CreateMessageDto, @Req() req: any) {
    return this.messagesService.createMessage(dto, req.user.id);
  }

  /**
   * Get message detail
   */
  @Get(':id')
  async getMessageDetail(@Param('id') messageId: string, @Req() req: any) {
    const message = await this.messagesService.getMessageDetail(
      messageId,
      req.user.id,
    );

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Mark as read if recipient
    if (message.recipientId === req.user.id && !message.isRead) {
      await this.messagesService.markAsRead(messageId, req.user.id);
    }

    return message;
  }

  /**
   * Get message thread
   */
  @Get(':id/thread')
  async getMessageThread(@Param('id') messageId: string, @Req() req: any) {
    const thread = await this.messagesService.getMessageThread(
      messageId,
      req.user.id,
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
  async markAsRead(@Param('id') messageId: string, @Req() req: any) {
    return this.messagesService.markAsRead(messageId, req.user.id);
  }

  /**
   * Mark multiple messages as read
   */
  @Put('mark-read/bulk')
  @HttpCode(HttpStatus.OK)
  async markMultipleAsRead(
    @Body() body: { messageIds: string[] },
    @Req() req: any,
  ) {
    if (!body.messageIds || !Array.isArray(body.messageIds)) {
      throw new BadRequestException('messageIds must be an array');
    }

    return this.messagesService.markMultipleAsRead(
      body.messageIds,
      req.user.id,
    );
  }

  /**
   * Archive a message (soft delete)
   */
  @Put(':id/archive')
  @HttpCode(HttpStatus.OK)
  async archiveMessage(@Param('id') messageId: string, @Req() req: any) {
    return this.messagesService.archiveMessage(messageId, req.user.id);
  }

  /**
   * Delete a message permanently
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteMessage(@Param('id') messageId: string, @Req() req: any) {
    return this.messagesService.deleteMessage(messageId, req.user.id);
  }

  /**
   * Search messages
   */
  @Get('search/query')
  async searchMessages(
    @Req() req: any,
    @Query() dto: SearchMessagesDto,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
  ) {
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    return this.messagesService.searchMessages(
      req.user.id,
      dto,
      skip,
      parseInt(pageSize),
    );
  }
}
