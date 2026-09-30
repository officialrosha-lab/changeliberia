import { Controller, Get, Param } from '@nestjs/common';
import { GeographyService } from './geography.service';

/**
 * Public, read-only canonical geography catalog. No guard — this is
 * reference data (Liberia's 15 counties + admin-verified electoral
 * districts), used to back county/district <select> pickers on petition
 * creation, profile forms, and official applications.
 */
@Controller('geography')
export class GeographyController {
  constructor(private readonly geographyService: GeographyService) {}

  @Get('counties')
  listCounties() {
    return this.geographyService.listCounties();
  }

  @Get('counties/:id/districts')
  listDistricts(@Param('id') id: string) {
    return this.geographyService.listDistrictsForCounty(id);
  }
}
