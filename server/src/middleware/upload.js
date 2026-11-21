import multer from 'multer';

export const evidenceUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: (Number(process.env.MAX_UPLOAD_MB) || 10) * 1024 * 1024, files: 1 },
  fileFilter(_req, file, callback) {
    const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'text/plain', 'text/csv'];
    if (!allowed.includes(file.mimetype)) {
      const error = new Error('EVIDENCE_TYPE_NOT_ALLOWED');
      error.status = 415;
      error.code = 'EVIDENCE_TYPE_NOT_ALLOWED';
      return callback(error);
    }
    callback(null, true);
  },
});
