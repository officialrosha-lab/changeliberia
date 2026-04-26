import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { Roles } from '../auth/roles.decorator';
import { Permission } from '../rbac/decorators/permission.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { ContactDirectoryService } from './contact-directory.service';
import { SmartRoutingService } from './routing/smart-routing.service';
import { BulkImportService } from '../bulk-import/bulk-import.service';
import {
  CreateInstitutionDto,
  UpdateInstitutionDto,
  CreateDepartmentDto,
  UpdateDepartmentDto,
  CreateContactDirectoryDto,
  UpdateContactDirectoryDto,
} from './contact-directory.service';
import { UserRole, PermissionResource, PermissionAction } from '@prisma/client';

interface AuthUser {
  userId: string;
  email: string;
  role: UserRole;
}

@Controller('admin/directory')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminDirectoryController {
  constructor(
    private contactDirectoryService: ContactDirectoryService,
    private smartRoutingService: SmartRoutingService,
    private bulkImportService: BulkImportService,
  ) {}

  // ==================== INSTITUTION ENDPOINTS ====================

  @Post('institutions')
  @Permission(PermissionResource.INSTITUTION, PermissionAction.CREATE)
  async createInstitution(@Body() dto: CreateInstitutionDto) {
    return this.contactDirectoryService.createInstitution(dto);
  }

  @Get('institutions')
  @Permission(PermissionResource.INSTITUTION, PermissionAction.READ)
  async listInstitutions(
    @Query('type') type?: string,
    @Query('category') category?: string,
    @Query('verified') verified?: string,
    @Query('search') search?: string,
  ) {
    const filters: any = {};

    if (type) filters.type = type;
    if (category) filters.category = category;
    if (verified !== undefined) filters.verified = verified === 'true';
    if (search) filters.search = search;

    return this.contactDirectoryService.listInstitutions(filters);
  }

  @Get('institutions/:id')
  @Permission(PermissionResource.INSTITUTION, PermissionAction.READ)
  async getInstitution(@Param('id') id: string) {
    return this.contactDirectoryService.getInstitution(id);
  }

  @Patch('institutions/:id')
  @Permission(PermissionResource.INSTITUTION, PermissionAction.UPDATE)
  async updateInstitution(
    @Param('id') id: string,
    @Body() dto: UpdateInstitutionDto,
  ) {
    return this.contactDirectoryService.updateInstitution(id, dto);
  }

  @Post('institutions/:id/verify')
  @Permission(PermissionResource.INSTITUTION, PermissionAction.UPDATE)
  async verifyInstitution(@Param('id') id: string) {
    return this.contactDirectoryService.verifyInstitution(id);
  }

  @Delete('institutions/:id')
  @Permission(PermissionResource.INSTITUTION, PermissionAction.DELETE)
  async deleteInstitution(@Param('id') id: string) {
    await this.contactDirectoryService.deleteInstitution(id);
    return { success: true };
  }

  // ==================== DEPARTMENT ENDPOINTS ====================

  @Post('institutions/:institutionId/departments')
  @Permission(PermissionResource.INSTITUTION, PermissionAction.UPDATE)
  async createDepartment(
    @Param('institutionId') institutionId: string,
    @Body() dto: CreateDepartmentDto,
  ) {
    return this.contactDirectoryService.createDepartment(institutionId, dto);
  }

  @Get('institutions/:institutionId/departments')
  @Permission(PermissionResource.INSTITUTION, PermissionAction.READ)
  async listDepartments(@Param('institutionId') institutionId: string) {
    return this.contactDirectoryService.listDepartments(institutionId);
  }

  @Get('departments/:id')
  @Permission(PermissionResource.INSTITUTION, PermissionAction.READ)
  async getDepartment(@Param('id') id: string) {
    return this.contactDirectoryService.getDepartment(id);
  }

  @Patch('departments/:id')
  @Permission(PermissionResource.INSTITUTION, PermissionAction.UPDATE)
  async updateDepartment(
    @Param('id') id: string,
    @Body() dto: UpdateDepartmentDto,
  ) {
    return this.contactDirectoryService.updateDepartment(id, dto);
  }

  @Delete('departments/:id')
  @Permission(PermissionResource.INSTITUTION, PermissionAction.DELETE)
  async deleteDepartment(@Param('id') id: string) {
    await this.contactDirectoryService.deleteDepartment(id);
    return { success: true };
  }

  // ==================== CONTACT DIRECTORY ENDPOINTS ====================

  @Post('institutions/:institutionId/contacts')
  @Permission(PermissionResource.DIRECTORY, PermissionAction.CREATE)
  async createContact(
    @Param('institutionId') institutionId: string,
    @Body() dto: CreateContactDirectoryDto,
  ) {
    return this.contactDirectoryService.createContact(institutionId, dto);
  }

  @Get('institutions/:institutionId/contacts')
  @Permission(PermissionResource.DIRECTORY, PermissionAction.READ)
  async listContacts(@Param('institutionId') institutionId: string) {
    return this.contactDirectoryService.listContacts(institutionId);
  }

  @Get('contacts/:id')
  @Permission(PermissionResource.DIRECTORY, PermissionAction.READ)
  async getContact(@Param('id') id: string) {
    return this.contactDirectoryService.getContact(id);
  }

  @Patch('contacts/:id')
  @Permission(PermissionResource.DIRECTORY, PermissionAction.UPDATE)
  async updateContact(
    @Param('id') id: string,
    @Body() dto: UpdateContactDirectoryDto,
  ) {
    return this.contactDirectoryService.updateContact(id, dto);
  }

  @Delete('contacts/:id')
  @Permission(PermissionResource.DIRECTORY, PermissionAction.DELETE)
  async deleteContact(@Param('id') id: string) {
    await this.contactDirectoryService.deleteContact(id);
    return { success: true };
  }

  // ==================== SEARCH & ROUTING ====================

  @Get('search/by-tags')
  @Permission(PermissionResource.DIRECTORY, PermissionAction.READ)
  async searchByTags(@Query('tags') tags: string) {
    if (!tags) {
      throw new BadRequestException('tags query parameter required');
    }

    const tagArray = tags.split(',').map(t => t.trim());
    return this.contactDirectoryService.searchByTags(tagArray);
  }

  @Get('routing/stats')
  @Permission(PermissionResource.ROUTING, PermissionAction.READ)
  async getRoutingStats(@Query('days') days?: string) {
    const daysNum = days ? parseInt(days, 10) : 30;
    return this.smartRoutingService.getRoutingStats(daysNum);
  }

  // ==================== BULK IMPORT ====================

  @Post('import/upload')
  @Permission(PermissionResource.DIRECTORY, PermissionAction.CREATE)
  @UseInterceptors(FileInterceptor('file'))
  async importFromCSV(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: AuthUser,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (
      !file.mimetype.includes('csv') &&
      !file.mimetype.includes('spreadsheet')
    ) {
      throw new BadRequestException('File must be CSV format');
    }

    const result = await this.bulkImportService.importFromCSV(file.buffer);

    return {
      ...result,
      importedBy: user.userId,
      importedAt: new Date(),
    };
  }

  @Get('import/template')
  @Permission(PermissionResource.DIRECTORY, PermissionAction.READ)
  async downloadTemplate() {
    const csvContent = this.bulkImportService.generateTemplateCSV();

    return {
      filename: 'contact-directory-template.csv',
      content: csvContent,
      contentType: 'text/csv',
    };
  }

  @Get('import/stats')
  @Permission(PermissionResource.DIRECTORY, PermissionAction.READ)
  async getImportStats() {
    return this.bulkImportService.getImportStats();
  }

  // ==================== ROUTING OVERRIDE ====================

  @Post('petitions/:petitionId/routing/override')
  @Permission(PermissionResource.ROUTING, PermissionAction.OVERRIDE)
  async overrideRouting(
    @Param('petitionId') petitionId: string,
    @Body()
    body: {
      institutionId: string;
      departmentId?: string;
      notes?: string;
    },
    @CurrentUser() user: AuthUser,
  ) {
    const routingLog = await this.smartRoutingService.overrideRouting(
      petitionId,
      body.institutionId,
      body.departmentId,
      user.userId,
      body.notes,
    );

    return {
      success: true,
      routingLog,
    };
  }
}
