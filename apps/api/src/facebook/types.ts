/**
 * Facebook Real Pixel Integration Types
 * Complete TypeScript interfaces and types for Facebook SDK, Share Dialog, and Pixel Tracking
 */

/* ============================================
   Facebook SDK Types
   ============================================ */

export interface FacebookSDKConfig {
  appId: string;
  pixelId: string;
  apiVersion: string;
  accessToken: string;
  businessAccountId?: string;
  debugMode?: boolean;
}

export interface FacebookInitConfig {
  appId: string;
  version: string;
  cookie?: boolean;
  status?: boolean;
  xfbml?: boolean;
}

export interface FacebookPixelConfig {
  pixelId: string;
  appId: string;
  apiVersion: string;
  configured: boolean;
}

export interface OpenGraphMeta {
  title: string;
  description: string;
  image: string;
  url: string;
  type?: string;
  locale?: string;
  siteName?: string;
  video?: string;
  videoType?: string;
}

export interface ConversionEvent {
  eventId?: string;
  eventType: 'ViewContent' | 'Lead' | 'Share' | 'Purchase' | 'CustomEvent' | string;
  eventName?: string;
  eventTime?: number;
  contentType?: string;
  contentCategory?: string;
  contentIds?: string[];
  contentName?: string;
  value?: number;
  currency?: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  externalId?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
  customData?: Record<string, any>;
}

export interface ConversionApiResponse {
  success: boolean;
  eventId?: string;
  error?: string;
  details?: any;
}

export interface ShareCountResponse {
  shareCount: number;
  commentCount?: number;
  likeCount?: number;
}

export interface UrlValidationResponse {
  valid: boolean;
  scrapedUrl?: string;
  error?: string;
  metadata?: OpenGraphMeta;
}

export interface HealthCheckResponse {
  appConnected: boolean;
  pixelConnected: boolean;
  apiVersion: string;
  lastChecked?: Date;
  error?: string;
}

/* ============================================
   Share Dialog Types
   ============================================ */

export interface ShareDialogConfig {
  appId: string;
  dialogConfig: FacebookShareDialogOptions;
  pixelId: string;
  deepLink?: string;
}

export interface FacebookShareDialogOptions {
  method: 'share' | 'share_open_graph';
  href: string;
  hashtag?: string;
  quote?: string;
  picture?: string;
  redirect_uri?: string;
  display?: 'popup' | 'page' | 'iframe' | 'touch';
}

export interface ShareButtonConfig {
  petitionId: string;
  html: string;
  css?: string;
  script?: string;
}

export interface ShareCompletion {
  id: string;
  petitionId: string;
  userId?: string;
  method: ShareMethod;
  postId?: string;
  success: boolean;
  completedAt: Date;
  metadata?: Record<string, any>;
}

export interface ShareDialogResponse {
  success: boolean;
  postId?: string;
  error?: string;
}

export interface ShareAnalytics {
  totalShares: number;
  completionRate: number;
  sharesByMethod: Record<ShareMethod, number>;
  mostSharedContent?: string;
  lastShareAt?: Date;
  avgSharesPerDay?: number;
}

export interface RecordShareDto {
  petitionId: string;
  method: ShareMethod;
  postId?: string;
  metadata?: Record<string, any>;
}

/* ============================================
   Pixel Tracking Types
   ============================================ */

export interface UserMetadata {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  dateOfBirth?: string;
  gender?: 'M' | 'F';
  externalId?: string;
}

export interface ViewContentMetadata extends UserMetadata {
  contentType?: string;
  contentCategory?: string;
}

export interface LeadMetadata extends UserMetadata {
  leadType?: string;
  leadValue?: number;
}

export interface ShareEventMetadata extends UserMetadata {
  shareMethod?: ShareMethod;
  shareChannelType?: string;
}

export interface PurchaseMetadata extends UserMetadata {
  couponCode?: string;
  discountValue?: number;
  numItems?: number;
  itemCategory?: string;
}

export interface TrackingResponse {
  success: boolean;
  eventId?: string;
  error?: string;
  timestamp?: Date;
}

export interface PixelStats {
  totalEvents: number;
  eventsByType: Record<string, number>;
  conversionRate: number;
  lastEventAt?: Date;
  firstEventAt?: Date;
  eventTrend?: EventTrendData[];
}

export interface EventTrendData {
  date: Date;
  eventType: string;
  count: number;
}

export interface CustomAudience {
  id: string;
  name: string;
  audienceType: string;
  size: number;
  facebookId?: string;
  userIds?: string[];
  createdAt: Date;
  lastSyncedAt?: Date;
}

export interface CreateAudienceResponse {
  success: boolean;
  audienceId?: string;
  size?: number;
  error?: string;
}

export interface CustomAudienceCreateDto {
  name: string;
  petitionId: string;
  eventType: 'ViewContent' | 'Lead' | 'Share' | 'Purchase' | string;
  maxSize?: number;
}

/* ============================================
   Request/Response DTOs
   ============================================ */

export interface TrackViewContentDto {
  petitionId: string;
  userId?: string;
  metadata?: ViewContentMetadata;
}

export interface TrackLeadDto {
  petitionId: string;
  userId?: string;
  metadata?: LeadMetadata;
}

export interface TrackShareDto {
  petitionId: string;
  userId?: string;
  method: ShareMethod;
  metadata?: ShareEventMetadata;
}

export interface TrackPurchaseDto {
  petitionId: string;
  userId?: string;
  amount: number;
  currency: string;
  metadata?: PurchaseMetadata;
}

export interface TrackCustomEventDto {
  eventName: string;
  petitionId?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface GetShareDialogConfigDto {
  petitionId: string;
  quote?: string;
  hashtag?: string;
}

export interface ValidateUrlDto {
  url: string;
  scrape?: boolean;
}

/* ============================================
   Database Models (Prisma Schema Reference)
   ============================================ */

export interface FacebookPixelEventRecord {
  id: string;
  petitionId: string;
  userId?: string;
  eventType: string;
  eventData: Record<string, any>;
  eventId?: string;
  success: boolean;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomAudienceRecord {
  id: string;
  name: string;
  audienceType: string;
  size: number;
  facebookId?: string;
  lastSyncedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/* ============================================
   Service Interfaces
   ============================================ */

export interface IFacebookSDKService {
  getSdkInitCode(): string;
  getPixelInitCode(): string;
  generateOpenGraphMeta(meta: OpenGraphMeta): string;
  trackConversion(
    eventType: string,
    data: ConversionEvent,
    userId?: string
  ): Promise<ConversionApiResponse>;
  validateShareUrl(url: string): Promise<UrlValidationResponse>;
  getShareCount(url: string): Promise<ShareCountResponse>;
  getPixelId(): string;
  getAppId(): string;
  getPixelConfig(): FacebookPixelConfig;
  healthCheck(): Promise<HealthCheckResponse>;
}

export interface IShareDialogService {
  getShareDialogConfig(
    petitionId: string,
    options?: Partial<ShareDialogConfig>
  ): Promise<ShareDialogConfig>;
  getShareButtonSnippet(
    petitionId: string,
    text?: string
  ): Promise<ShareButtonConfig>;
  recordShareCompletion(
    petitionId: string,
    userId: string,
    method: ShareMethod,
    metadata?: Record<string, any>
  ): Promise<ShareCompletion>;
  getShareAnalytics(petitionId: string): Promise<ShareAnalytics>;
  trackShareDialogImpression(petitionId: string, userId?: string): Promise<void>;
  validateShareCallback(
    petitionId: string,
    postId: string
  ): Promise<boolean>;
  getShareDialogScripts(): string;
}

export interface IRealPixelTrackingService {
  trackViewContent(
    petitionId: string,
    userId?: string,
    metadata?: ViewContentMetadata
  ): Promise<TrackingResponse>;
  
  trackShare(
    petitionId: string,
    userId?: string,
    method?: ShareMethod,
    metadata?: ShareEventMetadata
  ): Promise<TrackingResponse>;
  
  trackLead(
    petitionId: string,
    userId?: string,
    metadata?: LeadMetadata
  ): Promise<TrackingResponse>;
  
  trackPurchase(
    petitionId: string,
    userId?: string,
    amount?: number,
    currency?: string,
    metadata?: PurchaseMetadata
  ): Promise<TrackingResponse>;
  
  trackCustomEvent(
    eventName: string,
    petitionId?: string,
    userId?: string,
    metadata?: Record<string, any>
  ): Promise<TrackingResponse>;
  
  getPixelStats(petitionId: string): Promise<PixelStats>;
  
  createCustomAudience(
    name: string,
    petitionId: string,
    eventType: string,
    maxSize?: number
  ): Promise<CreateAudienceResponse>;
  
  getPixelConfig(): FacebookPixelConfig;
}

/* ============================================
   Error Types
   ============================================ */

export class FacebookSDKError extends Error {
  constructor(
    public readonly code: string,
    public readonly details?: any,
    message?: string
  ) {
    super(message || `Facebook SDK Error: ${code}`);
    this.name = 'FacebookSDKError';
  }
}

export class PixelTrackingError extends Error {
  constructor(
    public readonly eventType: string,
    public readonly userId?: string,
    message?: string
  ) {
    super(message || `Pixel Tracking Error for ${eventType}`);
    this.name = 'PixelTrackingError';
  }
}

export class ShareDialogError extends Error {
  constructor(
    public readonly petitionId: string,
    message?: string
  ) {
    super(message || `Share Dialog Error for petition ${petitionId}`);
    this.name = 'ShareDialogError';
  }
}

/* ============================================
   Utility Types
   ============================================ */

export type EventType = 'ViewContent' | 'Lead' | 'Share' | 'Purchase' | string;

export type CurrencyCode =
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'JPY'
  | 'AUD'
  | 'CAD'
  | 'CHF'
  | 'CNY'
  | 'SEK'
  | 'NZD'
  | string;

export type GenderType = 'M' | 'F' | 'U';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

/* ============================================
   Configuration Interfaces
   ============================================ */

export interface FacebookModuleOptions {
  appId: string;
  pixelId: string;
  accessToken: string;
  apiVersion?: string;
  businessAccountId?: string;
  debugMode?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
}

export interface PixelTrackingConfig {
  enabled: boolean;
  batchSize?: number;
  flushInterval?: number;
  debugMode?: boolean;
  onError?: (error: PixelTrackingError) => void;
}

export interface ShareDialogConfig {
  displayMode?: 'popup' | 'page' | 'iframe' | 'touch';
  trackAnalytics?: boolean;
  deepLinkingEnabled?: boolean;
}

/* ============================================
   Enum Types
   ============================================ */

export enum FacebookEventType {
  ViewContent = 'ViewContent',
  Lead = 'Lead',
  Share = 'Share',
  Purchase = 'Purchase',
  AddPaymentInfo = 'AddPaymentInfo',
  Contact = 'Contact',
  CompleteRegistration = 'CompleteRegistration',
  CustomEvent = 'CustomEvent',
}

export enum AudienceType {
  PixelViewContent = 'PIXEL_ViewContent',
  PixelLead = 'PIXEL_Lead',
  PixelShare = 'PIXEL_Share',
  PixelPurchase = 'PIXEL_Purchase',
  CustomAudience = 'CUSTOM_AUDIENCE',
  LookalikeAudience = 'LOOKALIKE_AUDIENCE',
}

export enum ShareMethod {
  Dialog = 'dialog',
  Native = 'native',
  Other = 'other',
}

/* ============================================
   Helper Type Utilities
   ============================================ */

// Make all properties of T optional
export type Partial<T> = {
  [P in keyof T]?: T[P];
};

// Extract keys of type T where the value is of type V
export type KeysOfType<T, V> = {
  [K in keyof T]: T[K] extends V ? K : never;
}[keyof T];

// Readonly version of T
export type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};
