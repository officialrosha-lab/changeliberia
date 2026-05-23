import {
  Controller,
  Get,
  UseGuards,
  Roles,
  Query,
  Param,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { ActivityLoggerService } from './activity-logger.service';

/**
 * Admin Activity Log Controller
 * Exposes endpoints to view activity logs and audit trails
 */
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/activity-logs')
export class ActivityLogController {
  constructor(private readonly activityLogger: ActivityLoggerService) {}

  /**
   * Get paginated activity logs with filtering
   * GET /admin/activity-logs?page=1&limit=50&action=LOGIN&entityType=USER&status=SUCCESS&startDate=2026-05-01&endDate=2026-05-22
   */
  @Get()
  async getActivityLogs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('action') action?: string,
    @Query('entityType') entityType?: string,
    @Query('userId') userId?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const pageNum = Math.max(1, parseInt(page || '1', 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit || '50', 10)));

    const filters: any = {};
    if (action) filters.action = action;
    if (entityType) filters.entityType = entityType;
    if (userId) filters.userId = userId;
    if (status) filters.status = status;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    return this.activityLogger.getActivityLogs(pageNum, limitNum, filters);
  }

  /**
   * Get activity logs for a specific user
   * GET /admin/activity-logs/user/:userId?limit=50&action=LOGIN&startDate=2026-05-01&endDate=2026-05-22
   */
  @Get('user/:userId')
  async getUserActivityLogs(
    @Param('userId') userId: string,
    @Query('limit') limit?: string,
    @Query('action') action?: string,
    @Query('entityType') entityType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const limitNum = Math.min(200, Math.max(1, parseInt(limit || '50', 10)));

    const filters: any = {};
    if (action) filters.action = action;
    if (entityType) filters.entityType = entityType;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    return this.activityLogger.getUserActivityLogs(userId, limitNum, filters);
  }

  /**
   * Export activity logs as CSV
   * GET /admin/activity-logs/export?format=csv&action=LOGIN&startDate=2026-05-01&endDate=2026-05-22
   */
  @Get('export')
  async exportActivityLogs(
    @Query('format') format: string = 'csv',
    @Query('action') action?: string,
    @Query('entityType') entityType?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Res() res: Response,
  ) {
    const filters: any = {};
    if (action) filters.action = action;
    if (entityType) filters.entityType = entityType;
    if (status) filters.status = status;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    // Get all matching logs (no pagination for export)
    const result = await this.activityLogger.getActivityLogs(1, 10000, filters);
    const logs = result.data;

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="activity-logs-${new Date().getTime()}.json"`,
      );
      return res.json(logs);
    }

    // CSV format
    const headers = [
      'ID',
      'User ID',
      'Admin ID',
      'Action',
      'Entity Type',
      'Entity ID',
      'Description',
      'Status',
      'IP Address',
      'Created At',
    ];

    const rows = logs.map((log: any) => [
      log.id,
      log.userId || '',
      log.adminId || '',
      log.action,
      log.entityType,
      log.entityId || '',
      log.description || '',
      log.status,
      log.ipAddress || '',
      log.createdAt,
    ]);

    const csv =
      headers.join(',') +
      '\n' +
      rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="activity-logs-${new Date().getTime()}.csv"`,
    );
    return res.send(csv);
  }

  /**
   * Get activity statistics
   * GET /admin/activity-logs/stats?days=30
   */
  @Get('stats')
  async getActivityStats(@Query('days') days?: string) {
    const daysNum = Math.max(1, Math.min(365, parseInt(days || '30', 10)));
    return this.activityLogger.getActivityStats(daysNum);
  }
}
