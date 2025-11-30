import multer from "multer";

export const uploadMultipleFilesInMemory = (arrayOfFields) => {
  const storage = multer.memoryStorage();

  function fileFilter(req, file, cb) {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new AppError("Not supporting this mimetype", 401));
  }

  return multer({ storage, fileFilter }).fields(arrayOfFields);
};
