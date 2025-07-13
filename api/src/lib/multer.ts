import multer from "multer";

const storage = multer.diskStorage({
  filename: (_req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 200 * 1024 * 1024,
    files: 100,
  },
});

export default upload;
