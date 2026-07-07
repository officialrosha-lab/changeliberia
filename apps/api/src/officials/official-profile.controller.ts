import { Controller, Get, Param } from '@nestjs/common';
import { OfficialsService } from './officials.service';

@Controller('official')
export class OfficialProfileController {
  constructor(private readonly officialsService: OfficialsService) {}

  @Get(':slug')
  getPublicProfile(@Param('slug') slug: string) {
    return this.officialsService.getPublicProfile(slug);
  }
}
