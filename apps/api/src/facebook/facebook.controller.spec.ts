import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, INestApplication, NotFoundException } from '@nestjs/common';
import { FacebookController } from './facebook.controller';
import { FacebookService } from './facebook.service';
import { FacebookPixelService } from './facebook-pixel.service';

describe('FacebookController', () => {
  let app: INestApplication;
  let controller: FacebookController;
  let facebookService: jest.Mocked<FacebookService>;
  let pixelService: jest.Mocked<FacebookPixelService>;

  const mockOgMeta = {
    title: 'Test Petition - 20% of 500 signatures',
    description: 'This is a test petition',
    image: 'https://example.com/image.jpg',
    url: 'https://changelib.org/petitions/petition-1',
    type: 'website',
  };

  const mockShareLink = {
    shareUrl: 'https://changelib.org/r/abc12345',
    shortCode: 'abc12345',
    reachEstimate: 250,
    prefilledMessage: 'Join this petition!',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FacebookController],
      providers: [
        {
          provide: FacebookService,
          useValue: {
            generateOpenGraphMeta: jest.fn().mockResolvedValue({}),
            createFacebookShareLink: jest.fn().mockResolvedValue({}),
            buildFacebookShareDialog: jest.fn().mockReturnValue({}),
            trackFacebookClick: jest.fn().mockResolvedValue(''),
            recordFacebookShare: jest.fn().mockResolvedValue(undefined),
            calculateNetworkReach: jest.fn().mockReturnValue({
              estimatedReach: 250,
              multiplier: 1,
              influencer: false,
            }),
          },
        },
        {
          provide: FacebookPixelService,
          useValue: {
            getPixelId: jest.fn().mockReturnValue('placeholder_pixel_id'),
            getPixelInitCode: jest.fn().mockReturnValue('<!-- Pixel code -->'),
            getPixelReport: jest.fn().mockResolvedValue({
              totalEvents: 0,
              eventsByType: {},
              totalConversions: 0,
              totalConversionValue: 0,
              conversionRate: 0,
            }),
          },
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    controller = module.get<FacebookController>(FacebookController);
    facebookService = module.get(FacebookService) as jest.Mocked<FacebookService>;
    pixelService = module.get(FacebookPixelService) as jest.Mocked<FacebookPixelService>;
  });

  afterEach(async () => {
    await app.close();
  });

  describe('getOpenGraphMeta', () => {
    it('should return OG metadata for a petition', async () => {
      facebookService.generateOpenGraphMeta.mockResolvedValue(mockOgMeta);

      const result = await controller.getOpenGraphMeta('petition-1');

      expect(result).toEqual({
        success: true,
        data: mockOgMeta,
      });
      expect(facebookService.generateOpenGraphMeta).toHaveBeenCalledWith('petition-1');
    });

    it('should throw NotFoundException when petition not found', async () => {
      facebookService.generateOpenGraphMeta.mockRejectedValue(new NotFoundException('Not found'));

      await expect(controller.getOpenGraphMeta('invalid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createShare', () => {
    it('should create a Facebook share link', async () => {
      facebookService.createFacebookShareLink.mockResolvedValue(mockShareLink);

      const result = await controller.createShare({ petitionId: 'petition-1' }, { sub: 'user-1' } as any);

      expect(result).toEqual({
        success: true,
        data: {
          shareUrl: mockShareLink.shareUrl,
          shortCode: mockShareLink.shortCode,
          reachEstimate: mockShareLink.reachEstimate,
        },
      });
      expect(facebookService.createFacebookShareLink).toHaveBeenCalledWith('petition-1', 'user-1');
    });

    it('should throw BadRequestException when petitionId missing', async () => {
      await expect(controller.createShare({ petitionId: '' }, { sub: 'user-1' } as any)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when petition not found', async () => {
      facebookService.createFacebookShareLink.mockRejectedValue(new NotFoundException('Petition not found'));

      await expect(controller.createShare({ petitionId: 'invalid' }, { sub: 'user-1' } as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getShareDialog', () => {
    it('should return share dialog configuration', async () => {
      const dialogConfig = {
        quote: 'Join this petition!',
        hashtag: '#ChangeLiberia',
        link: 'https://changelib.org/petitions/petition-1',
        dialogTitle: 'Share This Petition',
      };
      facebookService.buildFacebookShareDialog.mockReturnValue(dialogConfig);

      const result = await controller.getShareDialog('petition-1');

      expect(result).toEqual({
        success: true,
        data: dialogConfig,
      });
      expect(facebookService.buildFacebookShareDialog).toHaveBeenCalledWith('petition-1', 250);
    });

    it('should use custom network size when provided', async () => {
      const dialogConfig = {
        quote: 'Join this petition!',
        hashtag: '#ChangeLiberia',
        link: 'https://changelib.org/petitions/petition-1',
        dialogTitle: 'Share This Petition',
      };
      facebookService.buildFacebookShareDialog.mockReturnValue(dialogConfig);

      await controller.getShareDialog('petition-1', '500');

      expect(facebookService.buildFacebookShareDialog).toHaveBeenCalledWith('petition-1', 500);
    });
  });

  describe('trackShortCode', () => {
    it('should track a share short code click', async () => {
      facebookService.trackFacebookClick.mockResolvedValue('https://changelib.org/petitions/petition-1');

      const result = await controller.trackShortCode('abc12345');

      expect(result).toEqual({
        success: true,
        data: { redirectUrl: 'https://changelib.org/petitions/petition-1' },
      });
      expect(facebookService.trackFacebookClick).toHaveBeenCalledWith('abc12345');
    });

    it('should throw NotFoundException when short code not found', async () => {
      facebookService.trackFacebookClick.mockRejectedValue(new NotFoundException('Not found'));

      await expect(controller.trackShortCode('invalid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('recordShareEvent', () => {
    it('should record a share event correctly', async () => {
      facebookService.recordFacebookShare.mockResolvedValue(undefined);

      const result = await controller.recordShareEvent({ petitionId: 'petition-1', shortCode: 'abc12345' }, { sub: 'user-1' } as any);

      expect(result).toEqual({ success: true, message: 'Share event recorded' });
      expect(facebookService.recordFacebookShare).toHaveBeenCalledWith('petition-1', 'user-1', 'abc12345');
    });

    it('should throw BadRequestException when required fields are missing', async () => {
      await expect(controller.recordShareEvent({ petitionId: '', shortCode: 'abc12345' }, { sub: 'user-1' } as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getPixelCode', () => {
    it('should return pixel code and id', () => {
      pixelService.getPixelId.mockReturnValue('placeholder_pixel_id');
      pixelService.getPixelInitCode.mockReturnValue('<!-- Pixel code -->');

      const result = controller.getPixelCode();

      expect(result).toEqual({
        success: true,
        data: { pixelId: 'placeholder_pixel_id', initCode: '<!-- Pixel code -->' },
      });
    });

    it('should return an error when pixel code generation fails', () => {
      pixelService.getPixelId.mockImplementation(() => { throw new Error('Error'); });

      const result = controller.getPixelCode();

      expect(result).toEqual({
        success: false,
        error: expect.stringContaining('Failed to get pixel code'),
      });
    });
  });

  describe('getPixelReport', () => {
    it('should return pixel report data', async () => {
      const report = {
        totalEvents: 150,
        eventsByType: { ViewContent: 85, Purchase: 12 },
        totalConversions: 65,
        totalConversionValue: 1250,
        conversionRate: 43.33,
      };
      pixelService.getPixelReport.mockResolvedValue(report);

      const result = await controller.getPixelReport();

      expect(result).toEqual({ success: true, data: report });
      expect(pixelService.getPixelReport).toHaveBeenCalledWith(undefined);
    });

    it('should return failure response when pixel report fails', async () => {
      pixelService.getPixelReport.mockRejectedValue(new Error('Error'));

      const result = await controller.getPixelReport();

      expect(result).toEqual({ success: false });
    });
  });

  describe('validateUrl', () => {
    it('should throw BadRequestException when Facebook SDK is unavailable', async () => {
      await expect(controller.validateUrl({ url: 'https://example.com' })).rejects.toThrow(BadRequestException);
    });
  });

  describe('health', () => {
    it('should return false when the Facebook SDK is unavailable', async () => {
      const result = await controller.health();

      expect(result).toEqual({ success: false });
    });
  });
});
