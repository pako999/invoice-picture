ALTER TABLE "invoiceUploadChunks"
  ALTER COLUMN "data" TYPE bytea
  USING decode("data", 'base64');
