import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { Permission } from '../rbac/decorators/permission.decorator';
import { PermissionResource, PermissionAction } from '@prisma/client';
import { CMSService } from './cms.service';

@Controller('cms')
export class CMSController {
  constructor(private readonly cmsService: CMSService) {}

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
}
