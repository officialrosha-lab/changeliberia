import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, NotFoundException } from '@nestjs/common';
import { FacebookController } from './facebook.controller';
import { FacebookService } from './facebook.service';
import { FacebookPixelService } from './facebook-pixel.service';

describe('FacebookController', () => {
  let app: INestApplication;
  let controller: FacebookController;
  let facebookService: jest.Mocked<FacebookService>;
  let pixelService: jest.Mocked<FacebookPixelService>;

  const mockUser = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
  };

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
            generateOpenGraphMeta: jest.fn(),
            createFacebookShareLink: jest.fn(),
            buildFacebookShareDialog: jest.fn(),
            trackFacebookClick: jest.fn(),
            recordFacebookShare: jest.fn(),
            calculateNetworkReach: jest.fn(),
            getFacebookAnalytics: jest.fn(),
          },
        },
        {
          provide: FacebookPixelService,
          useValue: {
            getPixelId: jest.fn(),
            getPixelInitCode: jest.fn(),
            getPixelReport: jest.fn(),
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
      expect(facebookService.generateOpenGraphMeta).toHaveBeenCalledWith(
        'petition-1',
      );
    });

    it('should throw NotFoundException when petition not found', async () => {
      facebookService.generateOpenGraphMeta.mockRejectedValue(
        new NotFoundException('Not found'),
      );

      await expect(controller.getOpenGraphMeta('invalid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createShareLink', () => {
    it('should create a Facebook share link', async () => {
      facebookService.createFacebookShareLink.mockResolvedValue(mockShareLink);

      const result = await controller.createShareLink(
        { petitionId: 'petition-1' },
        mockUser,
      );

      expect(result).toEqual({
        success: true,
        data: mockShareLink,
      });
      expect(facebookService.createFacebookShareLink).toHaveBeenCalledWith(
        'petition-1',
        mockUser.id,
      );
    });

    it('should throw BadRequestException when petitionId missing', async () => {
      const { BadRequestException } = require('@nestjs/common');

      await expect(
        controller.createShareLink({ petitionId: '' }, mockUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when petition not found', async () => {
      facebookService.createFacebookShareLink.mockRejectedValue(
        new NotFoundException('Petition not found'),
      );

      await expect(
        controller.createShareLink({ petitionId: 'invalid' }, mockUser),
      ).rejects.toThrow(NotFoundException);
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
      facebookService.buildFacebookShareDialog.mockResolvedValue(dialogConfig);

      const result = await controller.getShareDialog('petition-1');

      expect(result).toEqual({
        success: true,
        data: dialogConfig,
      });
      expect(facebookService.buildFacebookShareDialog).toHaveBeenCalledWith(
        'petition-1',
        250,
      );
    });

    it('should use custom network size when provided', async () => {
      const dialogConfig = {
        quote: 'Join this petition!',
        hashtag: '#ChangeLiberia',
        link: 'https://changelib.org/petitions/petition-1',
        dialogTitle: 'Share This Petition',
      };
      facebookService.buildFacebookShareDialog.mockResolvedValue(dialogConfig);

      await controller.getShareDialog('petition-1', '500');

      expect(facebookService.buildFacebookShareDialog).toHaveBeenCalledWith(
        'petition-1',
        500,
      );
    });
  });

  describe('trackShareClick', () => {
    it('should track share click and return redirect URL', async () => {
      facebookService.trackFacebookClick.mockResolvedValue(
        'https://changelib.org/petitions/petition-1',
      );

      const result = await controller.trackShareClick('abc12345');

      expect(result).toEqual({
        success: true,
        data: {
          redirectUrl: 'https://changelib.org/petitions/petition-1',
        },
      });
      expect(facebookService.trackFacebookClick).toHaveBeenCalledWith(
        'abc12345',
      );
    });

    it('should throw NotFoundException when short code not found', async () => {
      facebookService.trackFacebookClick.mockRejectedValue(
        new NotFoundException('Not found'),
      );

      await expect(controller.trackShareClick('invalid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('recordShareEvent', () => {
    it('should record a share event', async () => {
      facebookService.recordFacebookShare.mockResolvedValue(undefined);

      const result = await controller.recordShareEvent(
        {
          petitionId: 'petition-1',
          shortCode: 'abc12345',
        },
        mockUser,
      );

      expect(result).toEqual({
        success: true,
        message: 'Share event recorded',
      });
      expect(facebookService.recordFacebookShare).toHaveBeenCalledWith(
        'petition-1',
        mockUser.id,
        'abc12345',
      );
    });

    it('should throw BadRequestException when required fields missing', async () => {
      const { BadRequestException } = require('@nestjs/common');

      await expect(
        controller.recordShareEvent(
          {
            petitionId: '',
            shortCode: 'abc12345',
          },
          mockUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when petition not found', async () => {
      facebookService.recordFacebookShare.mockRejectedValue(
        new NotFoundException('Not found'),
      );

      await expect(
        controller.recordShareEvent(
          {
            petitionId: 'invalid',
            shortCode: 'abc12345',
          },
          mockUser,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getReachEstimate', () => {
    it('should return reach estimate for authenticated user', async () => {
      const estimate = {
        estimatedReach: 350,
        multiplier: 1.4,
        influencer: false,
      };
      facebookService.calculateNetworkReach.mockResolvedValue(estimate);

      const result = await controller.getReachEstimate('petition-1', mockUser);

      expect(result).toEqual({
        success: true,
        data: estimate,
      });
      expect(facebookService.calculateNetworkReach).toHaveBeenCalledWith(
        mockUser,
      );
    });

    it('should return default estimate for anonymous user', async () => {
      const result = await controller.getReachEstimate('petition-1');

      expect(result).toEqual({
        success: true,
        data: {
          estimatedReach: 250,
          multiplier: 1,
          influencer: false,
        },
      });
      expect(facebookService.calculateNetworkReach).not.toHaveBeenCalled();
    });
  });

  describe('getFacebookAnalytics', () => {
    it('should return Facebook analytics for a petition', async () => {
      const analytics = {
        totalShares: 25,
        totalClicks: 85,
        conversions: 12,
        conversionRate: 14.12,
        reachEstimate: 6250,
        topSharers: [],
      };
      facebookService.getFacebookAnalytics.mockResolvedValue(analytics);

      const result = await controller.getFacebookAnalytics('petition-1');

      expect(result).toEqual({
        success: true,
        data: analytics,
      });
      expect(facebookService.getFacebookAnalytics).toHaveBeenCalledWith(
        'petition-1',
      );
    });

    it('should throw NotFoundException when petition not found', async () => {
      facebookService.getFacebookAnalytics.mockRejectedValue(
        new NotFoundException('Not found'),
      );

      await expect(
        controller.getFacebookAnalytics('invalid'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getShareLeaderboard', () => {
    it('should return share leaderboard with default limit', async () => {
      const result = await controller.getShareLeaderboard();

      expect(result).toEqual({
        success: true,
        data: {
          topSharers: [],
          period: 'all-time',
          limit: 10,
        },
      });
    });

    it('should respect custom limit parameter', async () => {
      const result = await controller.getShareLeaderboard('25');

      expect(result.data.limit).toBe(25);
    });
  });

  describe('getPixelCode', () => {
    it('should return pixel ID and init code', () => {
      pixelService.getPixelId.mockReturnValue('placeholder_pixel_id');
      pixelService.getPixelInitCode.mockReturnValue('<!-- Pixel code -->');

      const result = controller.getPixelCode();

      expect(result).toEqual({
        success: true,
        data: {
          pixelId: 'placeholder_pixel_id',
          initCode: '<!-- Pixel code -->',
        },
      });
      expect(pixelService.getPixelId).toHaveBeenCalled();
      expect(pixelService.getPixelInitCode).toHaveBeenCalled();
    });

    it('should return placeholder on error', () => {
      pixelService.getPixelId.mockImplementation(() => {
        throw new Error('Error');
      });

      const result = controller.getPixelCode();

      expect(result).toEqual({
        success: true,
        data: {
          pixelId: 'placeholder',
          initCode: '<!-- Pixel initialization failed -->',
        },
      });
    });
  });

  describe('getPixelReport', () => {
    it('should return pixel analytics report', async () => {
      const report = {
        totalEvents: 150,
        eventsByType: {
          ViewContent: 85,
          Purchase: 12,
          Lead: 53,
        },
        totalConversions: 65,
        totalConversionValue: 1250,
        conversionRate: 43.33,
      };
      pixelService.getPixelReport.mockResolvedValue(report);

      const result = await controller.getPixelReport();

      expect(result).toEqual({
        success: true,
        data: report,
      });
      expect(pixelService.getPixelReport).toHaveBeenCalledWith(undefined);
    });

    it('should filter by petitionId if provided', async () => {
      const report = {
        totalEvents: 50,
        eventsByType: {},
        totalConversions: 10,
        totalConversionValue: 500,
        conversionRate: 20,
      };
      pixelService.getPixelReport.mockResolvedValue(report);

      await controller.getPixelReport('petition-1');

      expect(pixelService.getPixelReport).toHaveBeenCalledWith('petition-1');
    });

    it('should return empty report on error', async () => {
      pixelService.getPixelReport.mockRejectedValue(new Error('Error'));

      const result = await controller.getPixelReport();

      expect(result.data).toEqual({
        totalEvents: 0,
        eventsByType: {},
        totalConversions: 0,
        totalConversionValue: 0,
        conversionRate: 0,
      });
    });
  });
});
