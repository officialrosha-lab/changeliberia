import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CMSPage } from '@prisma/client';

@Injectable()
export class VersionHistoryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a version snapshot of the current page
   */
  async createVersion(
    pageId: string,
    page: CMSPage & { blocks: any[] },
    authorId: string,
    description?: string,
  ) {
    return this.prisma.cMSPageVersion.create({
      data: {
        pageId,
        title: page.title,
        slug: page.slug,
        blocks: JSON.stringify(page.blocks),
        authorId: authorId || null,
        description: description || 'Page updated',
      },
    });
  }

  /**
   * Get all versions of a page
   */
  async getPageVersions(pageId: string, limit = 50) {
    return this.prisma.cMSPageVersion.findMany({
      where: { pageId },
      include: { author: { select: { id: true, fullName: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get a specific version
   */
  async getVersion(versionId: string) {
    return this.prisma.cMSPageVersion.findUnique({
      where: { id: versionId },
      include: { author: { select: { id: true, fullName: true } } },
    });
  }

  /**
   * Restore page to a previous version
   */
  async restoreVersion(versionId: string, authorId: string) {
    const version = await this.getVersion(versionId);

    if (!version) {
      throw new Error('Version not found');
    }

    const blocks = JSON.parse(version.blocks);

    // Update all blocks with new data
    await this.prisma.cMSPage.update({
      where: { id: version.pageId },
      data: {
        title: version.title,
        slug: version.slug,
        updatedAt: new Date(),
      },
    });

    // Delete existing blocks and create new ones from version
    await this.prisma.cMSBlock.deleteMany({
      where: { pageId: version.pageId },
    });

    // Create blocks from version
    for (const block of blocks) {
      await this.prisma.cMSBlock.create({
        data: {
          pageId: version.pageId,
          type: block.type,
          order: block.order,
          props: typeof block.props === 'string' ? block.props : JSON.stringify(block.props),
        },
      });
    }

    // Create a new version recording this restoration
    await this.createVersion(
      version.pageId,
      {
        ...version,
        blocks,
      } as any,
      authorId,
      `Restored from version ${versionId.slice(0, 8)}`,
    );

    return version;
  }

  /**
   * Compare two versions
   */
  async compareVersions(versionId1: string, versionId2: string) {
    const v1 = await this.getVersion(versionId1);
    const v2 = await this.getVersion(versionId2);

    if (!v1 || !v2) {
      throw new Error('One or both versions not found');
    }

    return {
      v1: {
        id: v1.id,
        createdAt: v1.createdAt,
        blocks: JSON.parse(v1.blocks),
      },
      v2: {
        id: v2.id,
        createdAt: v2.createdAt,
        blocks: JSON.parse(v2.blocks),
      },
    };
  }

  /**
   * Auto-create version before major updates (if not done recently)
   */
  async autoCreateVersionIfNeeded(pageId: string, authorId: string) {
    // Check if version was created in last 5 minutes
    const recentVersion = await this.prisma.cMSPageVersion.findFirst({
      where: {
        pageId,
        createdAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
        },
      },
    });

    if (recentVersion) {
      return recentVersion;
    }

    const page = await this.prisma.cMSPage.findUnique({
      where: { id: pageId },
      include: { blocks: true },
    });

    if (!page) {
      throw new Error('Page not found');
    }

    const pageWithBlocks = {
      ...page,
      blocks: page.blocks,
    } as any;

    return this.createVersion(pageWithBlocks, page.blocks as any, authorId, 'Auto-save');
  }
}
