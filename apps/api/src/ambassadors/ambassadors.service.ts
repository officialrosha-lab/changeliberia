import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAmbassadorApplicationDto, UpdateAmbassadorApplicationDto } from './ambassadors.dto';
import { ApplicationStatus } from '@prisma/client';

@Injectable()
export class AmbassadorsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAmbassadorApplicationDto) {
    // Check for duplicate email
    const existing = await this.prisma.ambassadorApplication.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new BadRequestException(
        'An application with this email already exists. Please use a different email or contact support.',
      );
    }

    const application = await this.prisma.ambassadorApplication.create({
      data: {
        fullName: dto.fullName,
        email: dto.email,
        phone: dto.phone,
        location: dto.location,
        occupation: dto.occupation,
        motivation: dto.motivation,
        growthPlan: dto.growthPlan,
        socialLinks: dto.socialLinks,
      },
    });

    return application;
  }

  async findAll(status?: ApplicationStatus) {
    const applications = await this.prisma.ambassadorApplication.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
    });

    return applications;
  }

  async findOne(id: string) {
    const application = await this.prisma.ambassadorApplication.findUnique({
      where: { id },
    });

    if (!application) {
      throw new NotFoundException(`Ambassador application with ID ${id} not found`);
    }

    return application;
  }

  async update(id: string, dto: UpdateAmbassadorApplicationDto) {
    const application = await this.prisma.ambassadorApplication.findUnique({
      where: { id },
    });

    if (!application) {
      throw new NotFoundException(`Ambassador application with ID ${id} not found`);
    }

    const updated = await this.prisma.ambassadorApplication.update({
      where: { id },
      data: {
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
    });

    return updated;
  }

  async delete(id: string) {
    const application = await this.prisma.ambassadorApplication.findUnique({
      where: { id },
    });

    if (!application) {
      throw new NotFoundException(`Ambassador application with ID ${id} not found`);
    }

    await this.prisma.ambassadorApplication.delete({
      where: { id },
    });

    return { success: true };
  }
}
