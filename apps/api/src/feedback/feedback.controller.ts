import { Controller, Post, Body, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('feedback')
export class FeedbackController {
  private readonly logger = new Logger(FeedbackController.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Submit feedback from visitors
   */
  @Post()
  async submitFeedback(
    @Body('name') name: string,
    @Body('email') email?: string,
    @Body('message') message?: string,
    @Body('source') source?: string,
    @Body('timestamp') timestamp?: string,
  ) {
    try {
      // Validate required fields
      if (!name?.trim()) {
        throw new Error('Name is required');
      }

      if (!message?.trim()) {
        throw new Error('Message is required');
      }

      // Log feedback (you could save to database here)
      this.logger.log(
        `Feedback received from ${name} (${email || 'no-email'}): ${message.substring(0, 100)}...`,
      );

      // TODO: Save to database when schema is updated
      // const feedback = await this.prisma.feedback.create({
      //   data: {
      //     name: name.trim(),
      //     email: email?.trim() || null,
      //     message: message.trim(),
      //     source: source || 'floating-widget',
      //     submittedAt: new Date(timestamp || Date.now()),
      //   },
      // });

      // TODO: Send email notification to admin
      // await this.emailService.sendFeedbackNotification({
      //   from: email || 'anonymous',
      //   name,
      //   message,
      //   source,
      // });

      return {
        success: true,
        message: 'Thank you for your feedback! We appreciate your input and will review it shortly.',
      };
    } catch (error) {
      this.logger.error('Feedback submission error:', error);
      throw error;
    }
  }
}
