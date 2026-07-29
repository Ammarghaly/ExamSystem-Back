import multer from "multer";

export const fileUpload = () => {
  const storage = multer.memoryStorage();
  return multer({ storage });
};
