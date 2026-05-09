import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { Permission } from '../rbac/decorators/permission.decorator';
import { PermissionResource, PermissionAction } from '@prisma/client';
import { CMSService } from './cms.service';
import { FileUploadService } from './file-upload.service';
import { VersionHistoryService } from './version-history.service';
import { ContentSchedulingService } from './content-scheduling.service';
import { CMSAnalyticsService } from './cms-analytics.service';

@Controller('cms')
export class CMSController {
  constructor(
    private readonly cmsService: CMSService,
    private readonly fileUploadService: FileUploadService,
    private readonly versionHistoryService: VersionHistoryService,
    private readonly contentSchedulingService: ContentSchedulingService,
    private readonly analyticsService: CMSAnalyticsService,
  ) {}

  /**
   * Get all CMS pages
   */
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission(PermissionResource.CONTENT, PermissionAction.READ)
  @Get('pages')
  async getPages() {
    return this.cmsService.getPages();
  }

  /**
   * Get single CMS page by ID
   */
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission(PermissionResource.CONTENT, PermissionAction.READ)
  @Get('pages/:id')
  async getPage(@Param('id') id: string) {
    return this.cmsService.getPageById(id);
  }

  /**
   * Create new CMS page
   */
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission(PermissionResource.CONTENT, PermissionAction.CREATE)
  @Post('pages')
  async createPage(
    @CurrentUser() user: { id: string; email: string },
    @Body() data: { title: string; slug: string; content: string },
  ) {
    return this.cmsService.createPage(user.id, {
      title: data.title,
      slug: data.slug,
      content: data.content,
    });
  }

  /**
   * Update CMS page
   */
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission(PermissionResource.CONTENT, PermissionAction.UPDATE)
  @Patch('pages/:id')
  async updatePage(
    @CurrentUser() user: { id: string; email: string },
    @Param('id') id: string,
    @Body()
    data: {
      title?: string;
      slug?: string;
      content?: string;
      metaDescription?: string;
      metaKeywords?: string;
      ogImage?: string;
      ogTitle?: string;
      ogDescription?: string;
      published?: boolean;
    },
  ) {
    return this.cmsService.updatePage(id, data);
  }

  /**
   * Delete CMS page
   */
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission(PermissionResource.CONTENT, PermissionAction.DELETE)
  @Delete('pages/:id')
  async deletePage(
    @CurrentUser() user: { id: string; email: string },
    @Param('id') id: string,
  ) {
    await this.cmsService.deletePage(id);
    return { success: true, message: 'Page deleted' };
  }

  /**
   * Get all CMS templates
   */
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission(PermissionResource.CONTENT, PermissionAction.READ)
  @Get('templates')
  async getTemplates() {
    return this.cmsService.getTemplates();
  }

  /**
   * Get single CMS template by ID
   */
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission(PermissionResource.CONTENT, PermissionAction.READ)
  @Get('templates/:id')
  async getTemplate(@Param('id') id: string) {
    return this.cmsService.getTemplateById(id);
  }

  /**
   * Create new CMS template
   */
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission(PermissionResource.CONTENT, PermissionAction.CREATE)
  @Post('templates')
  async createTemplate(
    @CurrentUser() user: { id: string; email: string },
    @Body()
    data: {
      name: string;
      description?: string;
      category: string;
      titleHint?: string;
      descriptionHint?: string;
      suggestedTags?: string;
      suggestedCategory?: string;
      content?: string;
    },
  ) {
    return this.cmsService.createTemplate(data);
  }

  /**
   * Update CMS template
   */
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission(PermissionResource.CONTENT, PermissionAction.UPDATE)
  @Patch('templates/:id')
  async updateTemplate(
    @CurrentUser() user: { id: string; email: string },
    @Param('id') id: string,
    @Body()
    data: {
      name?: string;
      description?: string;
      category?: string;
      titleHint?: string;
      descriptionHint?: string;
      suggestedTags?: string;
      suggestedCategory?: string;
      content?: string;
      active?: boolean;
    },
  ) {
    return this.cmsService.updateTemplate(id, data);
  }

  /**
   * Delete CMS template
   */
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission(PermissionResource.CONTENT, PermissionAction.DELETE)
  @Delete('templates/:id')
  async deleteTemplate(
    @CurrentUser() user: { id: string; email: string },
    @Param('id') id: string,
  ) {
    await this.cmsService.deleteTemplate(id);
    return { success: true, message: 'Template deleted' };
  }

  /**
   * Get public CMS page by slug (no auth required)
   */
  @Get('public/pages/:slug')
  async getPublicPage(@Param('slug') slug: string) {
    const page = await this.cmsService.getPageBySlug(slug);
    if (!page || !page.published) {
      throw new Error('Page not found');
    }

    await this.cmsService.incrementViewCount(page.id);
    return page;
  }

  /**
   * Get all blocks for a page
   */
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission(PermissionResource.CONTENT, PermissionAction.READ)
  @Get('pages/:pageId/blocks')
  async getPageBlocks(@Param('pageId') pageId: string) {
    return this.cmsService.getPageBlocks(pageId);
  }

  /**
   * Create block for a page
   */
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission(PermissionResource.CONTENT, PermissionAction.CREATE)
  @Post('pages/:pageId/blocks')
  async createBlock(
    @Param('pageId') pageId: string,
    @Body() data: { type: string; order: number; props: Record<string, any> },
  ) {
    return this.cmsService.createBlock(pageId, data);
  }

  /**
   * Update block
   */
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission(PermissionResource.CONTENT, PermissionAction.UPDATE)
  @Patch('blocks/:blockId')
  async updateBlock(
    @Param('blockId') blockId: string,
    @Body() data: { type?: string; order?: number; props?: Record<string, any> },
  ) {
    return this.cmsService.updateBlock(blockId, data);
  }

  /**
   * Delete block
   */
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission(PermissionResource.CONTENT, PermissionAction.DELETE)
  @Delete('blocks/:blockId')
  async deleteBlock(@Param('blockId') blockId: string) {
    await this.cmsService.deleteBlock(blockId);
    return { success: true, message: 'Block deleted' };
  }

  // ==================== PHASE 2: File Upload ====================

  /**
   * Upload a file (image, document)
   */
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission(PermissionResource.CONTENT, PermissionAction.CREATE)
  @Post('files/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: { id: string; email: string },
    @Body('alt') alt?: string,
  ) {
    return this.fileUploadService.uploadFile(file, user.id, alt);
  }

  /**
   * Get user's uploaded files
   */
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission(PermissionResource.CONTENT, PermissionAction.READ)
  @Get('files')
  async getUserFiles(
    @CurrentUser() user: { id: string; email: string },
    @Query('limit') limit: number = 50,
  ) {
    return this.fileUploadService.getUserFiles(user.id, limit);
  }

  /**
   * Update file metadata
   */
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission(PermissionResource.CONTENT, PermissionAction.UPDATE)
  @Patch('files/:fileId')
  async updateFile(
    @Param('fileId') fileId: string,
    @Body() data: { alt?: string; tags?: string[] },
  ) {
    return this.fileUploadService.updateFileMetadata(fileId, data.alt, data.tags);
  }

  /**
   * Delete an uploaded file
   */
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission(PermissionResource.CONTENT, PermissionAction.DELETE)
  @Delete('files/:fileId')
  async deleteFile(@Param('fileId') fileId: string) {
    await this.fileUploadService.deleteFile(fileId);
    return { success: true, message: 'File deleted' };
  }

  // ==================== PHASE 3: Version History ====================

  /**
   * Get page version history
   */
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission(PermissionResource.CONTENT, PermissionAction.READ)
  @Get('pages/:pageId/versions')
  async getPageVersions(
    @Param('pageId') pageId: string,
    @Query('limit') limit: number = 50,
  ) {
    return this.versionHistoryService.getPageVersions(pageId, limit);
  }

  /**
   * Get specific version
   */
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission(PermissionResource.CONTENT, PermissionAction.READ)
  @Get('versions/:versionId')
  async getVersion(@Param('versionId') versionId: string) {
    return this.versionHistoryService.getVersion(versionId);
  }

  /**
   * Restore page to a previous version
   */
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission(PermissionResource.CONTENT, PermissionAction.UPDATE)
  @Post('versions/:versionId/restore')
  async restoreVersion(
    @Param('versionId') versionId: string,
    @CurrentUser() user: { id: string; email: string },
  ) {
    return this.versionHistoryService.restoreVersion(versionId, user.id);
  }

  /**
   * Compare two versions
   */
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission(PermissionResource.CONTENT, PermissionAction.READ)
  @Get('versions/:versionId1/compare/:versionId2')
  async compareVersions(
    @Param('versionId1') versionId1: string,
    @Param('versionId2') versionId2: string,
  ) {
    return this.versionHistoryService.compareVersions(versionId1, versionId2);
  }

  // ==================== PHASE 3: Draft & Publishing ====================

  /**
   * Toggle page draft status
   */
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission(PermissionResource.CONTENT, PermissionAction.UPDATE)
  @Patch('pages/:pageId/draft')
  async toggleDraftStatus(
    @Param('pageId') pageId: string,
    @Body() data: { isDraft: boolean },
  ) {
    return this.cmsService.updatePage(pageId, { isDraft: data.isDraft });
  }

  /**
   * Publish a page immediately
   */
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission(PermissionResource.CONTENT, PermissionAction.UPDATE)
  @Post('pages/:pageId/publish')
  async publishPage(@Param('pageId') pageId: string) {
    return this.cmsService.updatePage(pageId, {
      published: true,
      publishedAt: new Date(),
      isDraft: false,
    });
  }

  /**
   * Unpublish a page
   */
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission(PermissionResource.CONTENT, PermissionAction.UPDATE)
  @Post('pages/:pageId/unpublish')
  async unpublishPage(@Param('pageId') pageId: string) {
    return this.cmsService.updatePage(pageId, {
      published: false,
    });
  }

  // ==================== PHASE 3: Content Scheduling ====================

  /**
   * Schedule a content action (publish/unpublish/update)
   */
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission(PermissionResource.CONTENT, PermissionAction.UPDATE)
  @Post('pages/:pageId/schedule')
  async scheduleAction(
    @Param('pageId') pageId: string,
    @CurrentUser() user: { id: string; email: string },
    @Body() data: { action: 'publish' | 'unpublish' | 'update'; scheduledFor: Date },
  ) {
    return this.contentSchedulingService.scheduleAction(
      pageId,
      data.action,
      new Date(data.scheduledFor),
      user.id,
    );
  }

  /**
   * Get scheduled actions for a page
   */
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission(PermissionResource.CONTENT, PermissionAction.READ)
  @Get('pages/:pageId/schedules')
  async getPageSchedules(@Param('pageId') pageId: string) {
    return this.contentSchedulingService.getPageSchedules(pageId);
  }

  /**
   * Get all upcoming scheduled actions
   */
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission(PermissionResource.CONTENT, PermissionAction.READ)
  @Get('schedules/upcoming')
  async getUpcomingSchedules(@Query('limit') limit: number = 50) {
    return this.contentSchedulingService.getUpcomingSchedules(limit);
  }

  /**
   * Cancel a scheduled action
   */
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission(PermissionResource.CONTENT, PermissionAction.DELETE)
  @Delete('schedules/:scheduleId')
  async cancelSchedule(@Param('scheduleId') scheduleId: string) {
    return this.contentSchedulingService.cancelSchedule(scheduleId);
  }

  // ==================== PHASE 4: Analytics ====================

  /**
   * Track block view
   */
  @Post('blocks/:blockId/track-view')
  async trackBlockView(
    @Param('blockId') blockId: string,
    @Body() data: { pageId: string; blockType: string; variantId?: string },
  ) {
    return this.analyticsService.trackBlockView(
      data.pageId,
      blockId,
      data.blockType,
      data.variantId,
    );
  }

  /**
   * Track block click
   */
  @Post('blocks/:blockId/track-click')
  async trackBlockClick(
    @Param('blockId') blockId: string,
    @Body() data: { pageId: string; blockType: string; variantId?: string },
  ) {
    return this.analyticsService.trackBlockClick(
      data.pageId,
      blockId,
      data.blockType,
      data.variantId,
    );
  }

  /**
   * Get analytics for a block
   */
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission(PermissionResource.CONTENT, PermissionAction.READ)
  @Get('blocks/:blockId/analytics')
  async getBlockAnalytics(
    @Param('blockId') blockId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('includeVariants') includeVariants: boolean = false,
  ) {
    return this.analyticsService.getBlockAnalytics(
      blockId,
      new Date(startDate),
      new Date(endDate),
      includeVariants,
    );
  }

  /**
   * Get page-level analytics
   */
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission(PermissionResource.CONTENT, PermissionAction.READ)
  @Get('pages/:pageId/analytics')
  async getPageAnalytics(
    @Param('pageId') pageId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.analyticsService.getPageAnalytics(
      pageId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  /**
   * Compare A/B test variants
   */
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission(PermissionResource.CONTENT, PermissionAction.READ)
  @Get('blocks/:blockId/compare-variants')
  async compareVariants(
    @Param('blockId') blockId: string,
    @Query('variantIds') variantIds: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.analyticsService.compareVariants(
      blockId,
      variantIds.split(','),
      new Date(startDate),
      new Date(endDate),
    );
  }
}
