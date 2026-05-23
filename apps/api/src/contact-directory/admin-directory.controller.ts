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
import {
  ActivityLoggerService,
  ActivityLogInput,
} from '../activity/activity-logger.service';
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
    private readonly activityLogger: ActivityLoggerService,
  ) {}

  // ==================== INSTITUTION ENDPOINTS ====================

  @Post('institutions')
  @Permission(PermissionResource.INSTITUTION, PermissionAction.CREATE)
  async createInstitution(
    @Body() dto: CreateInstitutionDto,
    @CurrentUser() user: AuthUser,
  ) {
    const institution = await this.contactDirectoryService.createInstitution(dto);

    this.logActivity(user, {
      action: 'CREATE_INSTITUTION',
      entityType: 'INSTITUTION',
      entityId: institution.id,
      description: `Created institution ${institution.name ?? institution.id}`,
      changes: dto,
    });

    return institution;
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
    @CurrentUser() user: AuthUser,
  ) {
    const institution = await this.contactDirectoryService.updateInstitution(id, dto);

    this.logActivity(user, {
      action: 'UPDATE_INSTITUTION',
      entityType: 'INSTITUTION',
      entityId: id,
      description: `Updated institution ${id}`,
      changes: dto,
    });

    return institution;
  }

  @Post('institutions/:id/verify')
  @Permission(PermissionResource.INSTITUTION, PermissionAction.UPDATE)
  async verifyInstitution(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    const institution = await this.contactDirectoryService.verifyInstitution(id);

    this.logActivity(user, {
      action: 'VERIFY_INSTITUTION',
      entityType: 'INSTITUTION',
      entityId: id,
      description: `Verified institution ${id}`,
    });

    return institution;
  }

  @Delete('institutions/:id')
  @Permission(PermissionResource.INSTITUTION, PermissionAction.DELETE)
  async deleteInstitution(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    await this.contactDirectoryService.deleteInstitution(id);

    this.logActivity(user, {
      action: 'DELETE_INSTITUTION',
      entityType: 'INSTITUTION',
      entityId: id,
      description: `Deleted institution ${id}`,
    });

    return { success: true };
  }

  // ==================== DEPARTMENT ENDPOINTS ====================

  @Post('institutions/:institutionId/departments')
  @Permission(PermissionResource.INSTITUTION, PermissionAction.UPDATE)
  async createDepartment(
    @Param('institutionId') institutionId: string,
    @Body() dto: CreateDepartmentDto,
    @CurrentUser() user: AuthUser,
  ) {
    const department = await this.contactDirectoryService.createDepartment(
      institutionId,
      dto,
    );

    this.logActivity(user, {
      action: 'CREATE_DEPARTMENT',
      entityType: 'DEPARTMENT',
      entityId: department.id,
      description: `Created department ${department.name ?? department.id} for institution ${institutionId}`,
      changes: { institutionId, department: dto },
    });

    return department;
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
    @CurrentUser() user: AuthUser,
  ) {
    const department = await this.contactDirectoryService.updateDepartment(id, dto);

    this.logActivity(user, {
      action: 'UPDATE_DEPARTMENT',
      entityType: 'DEPARTMENT',
      entityId: id,
      description: `Updated department ${id}`,
      changes: dto,
    });

    return department;
  }

  @Delete('departments/:id')
  @Permission(PermissionResource.INSTITUTION, PermissionAction.DELETE)
  async deleteDepartment(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    await this.contactDirectoryService.deleteDepartment(id);

    this.logActivity(user, {
      action: 'DELETE_DEPARTMENT',
      entityType: 'DEPARTMENT',
      entityId: id,
      description: `Deleted department ${id}`,
    });

    return { success: true };
  }

  // ==================== CONTACT DIRECTORY ENDPOINTS ====================

  @Post('institutions/:institutionId/contacts')
  @Permission(PermissionResource.DIRECTORY, PermissionAction.CREATE)
  async createContact(
    @Param('institutionId') institutionId: string,
    @Body() dto: CreateContactDirectoryDto,
    @CurrentUser() user: AuthUser,
  ) {
    const contact = await this.contactDirectoryService.createContact(institutionId, dto);

    this.logActivity(user, {
      action: 'CREATE_CONTACT',
      entityType: 'CONTACT',
      entityId: contact.id,
      description: `Created contact for institution ${institutionId}`,
      changes: { institutionId, contact: dto },
    });

    return contact;
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
    @CurrentUser() user: AuthUser,
  ) {
    const contact = await this.contactDirectoryService.updateContact(id, dto);

    this.logActivity(user, {
      action: 'UPDATE_CONTACT',
      entityType: 'CONTACT',
      entityId: id,
      description: `Updated contact ${id}`,
      changes: dto,
    });

    return contact;
  }

  @Delete('contacts/:id')
  @Permission(PermissionResource.DIRECTORY, PermissionAction.DELETE)
  async deleteContact(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    await this.contactDirectoryService.deleteContact(id);

    this.logActivity(user, {
      action: 'DELETE_CONTACT',
      entityType: 'CONTACT',
      entityId: id,
      description: `Deleted contact ${id}`,
    });

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

    this.logActivity(user, {
      action: 'IMPORT_CONTACT_DIRECTORY_CSV',
      entityType: 'DIRECTORY_IMPORT',
      description: `Imported contact directory CSV file`,
      changes: result,
    });

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

    this.logActivity(user, {
      action: 'OVERRIDE_ROUTING',
      entityType: 'ROUTING_OVERRIDE',
      entityId: petitionId,
      description: `Overrode routing for petition ${petitionId}`,
      changes: {
        institutionId: body.institutionId,
        departmentId: body.departmentId,
        notes: body.notes,
      },
    });

    return {
      success: true,
      routingLog,
    };
  }

  private logActivity(
    user: AuthUser,
    input: Omit<ActivityLogInput, 'adminId'>,
  ) {
    this.activityLogger.logAsync({
      adminId: user.userId,
      ...input,
    });
  }
}
