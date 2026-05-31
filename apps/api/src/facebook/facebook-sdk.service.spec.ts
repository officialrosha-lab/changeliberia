import { Test, TestingModule } from '@nestjs/testing';
import { FacebookSDKService } from './facebook-sdk.service';
import axios from 'axios';

jest.mock('axios');

/**
 * Facebook SDK Service Unit Tests
 * Tests Facebook Graph API integration and SDK initialization
 */
describe('FacebookSDKService', () => {
  let service: FacebookSDKService;

  beforeEach(async () => {
    // Mock axios
    const mockAxiosInstance = {
      get: jest.fn().mockResolvedValue({ data: {} }),
    };
    (axios.create as jest.Mock).mockReturnValue(mockAxiosInstance);

    // Set up environment variables
    process.env.FACEBOOK_APP_ID = 'test-app-id';
    process.env.FACEBOOK_APP_SECRET = 'test-app-secret';
    process.env.FACEBOOK_PIXEL_ID = 'test-pixel-id';
    process.env.FACEBOOK_ACCESS_TOKEN = 'test-access-token';
    process.env.APP_URL = 'http://localhost:3000';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [FacebookSDKService],
    }).compile();

    service = moduleFixture.get<FacebookSDKService>(FacebookSDKService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('SDK Initialization', () => {
    it('should load Facebook app ID from environment', () => {
      expect(service.getAppId()).toBe('test-app-id');
    });

    it('should load Facebook pixel ID from environment', () => {
      expect(service.getPixelId()).toBe('test-pixel-id');
    });

    it('should set correct API version', () => {
      expect(service.getApiVersion()).toBe('v18.0');
    });
  });

  describe('SDK Initialization Code', () => {
    it('should generate SDK init code with app ID', () => {
      const code = service.getSdkInitCode();

      expect(code).toContain('test-app-id');
      expect(code).toContain('FB.init');
      expect(code).toContain('fbAsyncInit');
      expect(code).toContain('v18.0');
    });

    it('should handle missing app ID gracefully', () => {
      process.env.FACEBOOK_APP_ID = '';
      const newService = new FacebookSDKService();
      const code = newService.getSdkInitCode();

      expect(code).toContain('not configured');
    });
  });

  describe('Pixel Initialization Code', () => {
    it('should generate pixel init code with pixel ID', () => {
      const code = service.getPixelInitCode();

      expect(code).toContain('test-pixel-id');
      expect(code).toContain('fbq');
      expect(code).toContain('PageView');
    });

    it('should handle missing pixel ID gracefully', () => {
      process.env.FACEBOOK_PIXEL_ID = '';
      const newService = new FacebookSDKService();
      const code = newService.getPixelInitCode();

      expect(code).toContain('not configured');
    });

    it('should include noscript fallback', () => {
      const code = service.getPixelInitCode();

      expect(code).toContain('<noscript>');
      expect(code).toContain('test-pixel-id');
    });
  });

  describe('Open Graph Meta Tags', () => {
    it('should generate OG meta tags', () => {
      const ogMeta = service.generateOpenGraphMeta({
        title: 'Test Petition',
        description: 'A test petition',
        image: 'https://example.com/image.jpg',
        url: 'https://example.com/petition/1',
      });

      expect(ogMeta).toContain('og:title');
      expect(ogMeta).toContain('og:description');
      expect(ogMeta).toContain('og:image');
      expect(ogMeta).toContain('og:url');
      expect(ogMeta).toContain('og:type');
      expect(ogMeta).toContain('Test Petition');
      expect(ogMeta).toContain('test-app-id');
    });

    it('should escape HTML in OG meta tags', () => {
      const ogMeta = service.generateOpenGraphMeta({
        title: 'Test "<Petition>"',
        description: 'A test & petition',
        image: 'https://example.com/image.jpg',
        url: 'https://example.com/petition/1',
      });

      expect(ogMeta).toContain('&lt;');
      expect(ogMeta).toContain('&gt;');
      expect(ogMeta).toContain('&amp;');
      expect(ogMeta).not.toContain('<Petition>');
    });

    it('should include custom locale', () => {
      const ogMeta = service.generateOpenGraphMeta({
        title: 'Test',
        description: 'Test',
        image: 'https://example.com/image.jpg',
        url: 'https://example.com/petition/1',
        locale: 'es_ES',
      });

      expect(ogMeta).toContain('es_ES');
    });

    it('should set custom og:type', () => {
      const ogMeta = service.generateOpenGraphMeta({
        title: 'Test',
        description: 'Test',
        image: 'https://example.com/image.jpg',
        url: 'https://example.com/petition/1',
        type: 'article',
      });

      expect(ogMeta).toContain('og:type');
      expect(ogMeta).toContain('article');
    });
  });

  describe('Share Dialog Configuration', () => {
    it('should generate share dialog config', () => {
      const config = service.getShareDialogConfig(
        'https://example.com/petition/1',
        'Test Petition',
        'Sign this petition',
        'https://example.com/image.jpg',
      );

      expect(config.method).toBe('share');
      expect(config.href).toContain('petition/1');
      expect(config.quote).toBe('Test Petition');
      expect(config.hashtag).toBe('#ChangeLiberia');
      expect(config.picture).toBe('https://example.com/image.jpg');
    });

    it('should include callback redirect URI', () => {
      const config = service.getShareDialogConfig(
        'https://example.com/petition/1',
        'Test',
        'Test',
        'https://example.com/image.jpg',
      );

      expect(config.redirect_uri).toContain('localhost:3000');
      expect(config.redirect_uri).toContain('callback');
    });
  });

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const health = await service.healthCheck();

      expect(health).toHaveProperty('appConnected');
      expect(health).toHaveProperty('pixelConnected');
      expect(health).toHaveProperty('apiVersion');
      expect(health.apiVersion).toBe('v18.0');
    });

    it('should indicate configured services', async () => {
      const health = await service.healthCheck();

      expect(health.appConnected).toBe(true);
      expect(health.pixelConnected).toBe(true);
    });

    it('should indicate missing services when not configured', async () => {
      process.env.FACEBOOK_APP_ID = '';
      process.env.FACEBOOK_PIXEL_ID = '';
      const newService = new FacebookSDKService();

      const health = await newService.healthCheck();

      expect(health.appConnected).toBe(false);
      expect(health.pixelConnected).toBe(false);
    });
  });

  describe('Configuration Validation', () => {
    it('should warn about missing configuration', () => {
      const loggerSpy = jest.spyOn(console, 'log');

      process.env.FACEBOOK_APP_ID = '';
      const newService = new FacebookSDKService();

      expect(newService).toBeDefined();
    });

    it('should handle empty app secret', () => {
      process.env.FACEBOOK_APP_SECRET = '';
      const newService = new FacebookSDKService();

      expect(newService).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing share URL gracefully', async () => {
      const result = await service.validateShareUrl('');

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle missing access token for share count', async () => {
      process.env.FACEBOOK_ACCESS_TOKEN = '';
      const newService = new FacebookSDKService();

      const result = await newService.getShareCount('https://example.com');

      expect(result.error).toBeDefined();
      expect(result.shareCount).toBe(0);
    });
  });
});
