/**
 * Content Provider Interface
 * Abstraction for content operations to support multiple implementations
 */
export interface IContentProvider {
  create(data: any): Promise<any>;
  read(id: string): Promise<any>;
  update(id: string, data: any): Promise<any>;
  delete(id: string): Promise<void>;
  query(filter: any): Promise<any[]>;
  publish(id: string): Promise<any>;
  archive(id: string): Promise<any>;
}

/**
 * Notification Provider Interface
 * Abstraction for notification delivery channels
 */
export interface INotificationProvider {
  send(userId: string, notification: any): Promise<void>;
  sendBatch(userIds: string[], notification: any): Promise<void>;
  sendToEmail(email: string, notification: any): Promise<void>;
  sendPush(userId: string, notification: any): Promise<void>;
}

/**
 * Storage Provider Interface
 * Abstraction for file/blob storage
 */
export interface IStorageProvider {
  upload(key: string, file: Buffer, contentType?: string): Promise<string>;
  download(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  getUrl(key: string): Promise<string>;
}

/**
 * Cache Provider Interface
 * Abstraction for caching layer
 */
export interface ICacheProvider {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

/**
 * Payment Provider Interface
 * Abstraction for payment processing
 */
export interface IPaymentProvider {
  createPaymentIntent(amount: number, currency: string, metadata?: any): Promise<string>;
  confirmPayment(paymentIntentId: string): Promise<boolean>;
  refund(paymentIntentId: string, amount?: number): Promise<boolean>;
  getPaymentStatus(paymentIntentId: string): Promise<string>;
}
