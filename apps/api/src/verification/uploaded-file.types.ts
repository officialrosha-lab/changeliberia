/** Shape of a file from multer memory storage (no dependency on Express.Multer typings). */
export type MemoryUploadedFile = {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
};
