import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type CreateSponsorDto = {
  name: string;
  logoUrl: string;
  websiteUrl?: string;
  type?: string;
  displayOrder?: number;
  isActive?: boolean;
};

type UpdateSponsorDto = Partial<CreateSponsorDto>;

@Injectable()
export class SponsorsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.sponsor.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
    });
  }

  findAllAdmin() {
    return this.prisma.sponsor.findMany({
      orderBy: { displayOrder: 'asc' },
    });
  }

  create(dto: CreateSponsorDto) {
    return this.prisma.sponsor.create({ data: dto });
  }

  update(id: string, dto: UpdateSponsorDto) {
    return this.prisma.sponsor.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.sponsor.delete({ where: { id } });
  }
}
