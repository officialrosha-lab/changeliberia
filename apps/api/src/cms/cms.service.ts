import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CMSService {
  constructor(private readonly prisma: PrismaService) {}

  async getPages(published?: boolean) {
    const where = typeof published === 'boolean' ? { published } : {};
    return this.prisma.cMSPage.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        published: true,
        publishedAt: true,
        viewCount: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async getPageById(id: string) {
    return this.prisma.cMSPage.findUnique({
      where: { id },
    });
  }

  async getPageBySlug(slug: string) {
    return this.prisma.cMSPage.findUnique({
      where: { slug },
    });
  }

  async createPage(authorId: string, data: { title: string; slug: string; content?: string }) {
    return this.prisma.cMSPage.create({
      data: {
        title: data.title,
        slug: data.slug,
        content: data.content ?? '',
        authorId,
      },
    });
  }

  async updatePage(
    id: string,
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
    const updateData: any = { ...data };
    if (data.published === true) {
      updateData.publishedAt = new Date();
    }
    if (data.published === false) {
      updateData.publishedAt = null;
    }

    return this.prisma.cMSPage.update({
      where: { id },
      data: updateData,
    });
  }

  async deletePage(id: string) {
    return this.prisma.cMSPage.delete({
      where: { id },
    });
  }

  async incrementViewCount(id: string) {
    return this.prisma.cMSPage.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
  }

  async getTemplates() {
    return this.prisma.cMSTemplate.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTemplateById(id: string) {
    return this.prisma.cMSTemplate.findUnique({
      where: { id },
    });
  }

  async createTemplate(data: {
    name: string;
    description?: string;
    category: string;
    titleHint?: string;
    descriptionHint?: string;
    suggestedTags?: string;
    suggestedCategory?: string;
    content?: string;
  }) {
    return this.prisma.cMSTemplate.create({
      data: {
        name: data.name,
        description: data.description,
        category: data.category,
        titleHint: data.titleHint,
        descriptionHint: data.descriptionHint,
        suggestedTags: data.suggestedTags ?? '[]',
        suggestedCategory: data.suggestedCategory,
        content: data.content ?? '{}',
      },
    });
  }

  async updateTemplate(
    id: string,
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
    return this.prisma.cMSTemplate.update({
      where: { id },
      data,
    });
  }

  async deleteTemplate(id: string) {
    return this.prisma.cMSTemplate.delete({
      where: { id },
    });
  }
}
