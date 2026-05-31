import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StakeholderGroupType } from '@prisma/client';

@Injectable()
export class StakeholderGroupService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create all 7 stakeholder groups for a petition (called when petition is published)
   */
  async createGroupsForPetition(petitionId: string) {
    const petition = await this.prisma.petition.findUnique({
      where: { id: petitionId },
      include: {
        creator: true,
        signatures: { include: { user: true } },
      },
    });

    if (!petition) {
      throw new Error('Petition not found');
    }

    const groupTypes = Object.values(StakeholderGroupType) as string[];
    const groups: any[] = [];

    // Create empty group records first
    for (const groupType of groupTypes) {
      const group = await this.prisma.petitionStakeholderGroup.create({
        data: {
          petitionId,
          groupType: groupType as StakeholderGroupType,
        },
      });
      groups.push(group);
    }

    // Populate memberships for each group
    const creatorGroup = groups.find((g) => g.groupType === 'CREATOR');
    const signersGroup = groups.find((g) => g.groupType === 'SIGNERS');

    // CREATOR group: just the petition creator
    if (creatorGroup && petition.creator) {
      await this.prisma.groupMembership.create({
        data: {
          groupId: creatorGroup.id,
          userId: petition.creator.id,
        },
      });
    }

    // SIGNERS group: all users who signed the petition
    if (signersGroup && petition.signatures.length > 0) {
      const membershipData = petition.signatures
        .filter((sig) => sig.userId)
        .map((sig) => ({
          groupId: signersGroup.id,
          userId: sig.userId!,
        }));

      if (membershipData.length > 0) {
        await this.prisma.groupMembership.createMany({
          data: membershipData,
          skipDuplicates: true,
        });
      }
    }

    // FOLLOWERS, INSTITUTIONS, NGOS, AMBASSADORS, MEDIA: Will be populated by subsequent phases
    // For Phase 1, these are empty but ready for Phase 2 implementation

    return groups;
  }

  /**
   * Get a specific stakeholder group with its members
   */
  async getGroupWithMembers(petitionId: string, groupType: StakeholderGroupType) {
    const group = await this.prisma.petitionStakeholderGroup.findUnique({
      where: {
        petitionId_groupType: { petitionId, groupType },
      },
      include: {
        memberships: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
                county: true,
              },
            },
          },
        },
      },
    });

    return group;
  }

  /**
   * Add a member to a stakeholder group
   */
  async addMember(groupId: string, userId: string) {
    return this.prisma.groupMembership.upsert({
      where: {
        groupId_userId: { groupId, userId },
      },
      update: {},
      create: { groupId, userId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Remove a member from a stakeholder group
   */
  async removeMember(groupId: string, userId: string) {
    return this.prisma.groupMembership.delete({
      where: {
        groupId_userId: { groupId, userId },
      },
    });
  }

  /**
   * List all members of a group
   */
  async listGroupMembers(groupId: string, skip: number = 0, take: number = 50) {
    const [memberships, total] = await Promise.all([
      this.prisma.groupMembership.findMany({
        where: { groupId },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
              county: true,
              role: true,
            },
          },
        },
        skip,
        take,
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.groupMembership.count({ where: { groupId } }),
    ]);

    return {
      members: memberships.map((m) => m.user),
      total,
      page: Math.floor(skip / take) + 1,
      pageSize: take,
    };
  }

  /**
   * Get all groups for a petition
   */
  async getPetitionGroups(petitionId: string) {
    return this.prisma.petitionStakeholderGroup.findMany({
      where: { petitionId },
      include: {
        memberships: {
          select: { userId: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Get member count for each group type in a petition
   */
  async getGroupMemberCounts(petitionId: string) {
    const groups = await this.prisma.petitionStakeholderGroup.findMany({
      where: { petitionId },
      include: {
        memberships: { select: { id: true } },
      },
    });

    return groups.reduce(
      (acc, group) => {
        acc[group.groupType] = group.memberships.length;
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  /**
   * Add multiple members to a group (for bulk operations)
   */
  async addMultipleMembers(groupId: string, userIds: string[]) {
    const uniqueUserIds = [...new Set(userIds)];

    const result = await this.prisma.groupMembership.createMany({
      data: uniqueUserIds.map((userId) => ({
        groupId,
        userId,
      })),
      skipDuplicates: true,
    });

    return {
      addedCount: result.count,
      totalUserIds: uniqueUserIds.length,
    };
  }

  /**
   * Check if user is member of a group
   */
  async isMember(groupId: string, userId: string): Promise<boolean> {
    const membership = await this.prisma.groupMembership.findUnique({
      where: {
        groupId_userId: { groupId, userId },
      },
    });

    return !!membership;
  }
}
