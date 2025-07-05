import multer from "multer";

const storage = multer.memoryStorage();
export const uploadProduct = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const validImageTypes = ["image/jpeg", "image/png", "image/gif"]; 
    if (validImageTypes.includes(file.mimetype)) {
      cb(null, true); 
    } else {
      cb(new Error("Only image files are allowed (JPEG, PNG, GIF)"), false); 
    }
  },
}).array("images", 5);

// storage,
// fileFilter: (req, file, cb) => {
//   const validImageTypes = ["image/jpeg", "image/png", "image/gif"]; // Allowed image MIME types
//   if (validImageTypes.includes(file.mimetype)) {
//     cb(null, true); // Accept the file
//   } else {
//     cb(new Error("Only image files are allowed (JPEG, PNG, GIF)"), false); // Reject the file
//   }
// },
// }).single("image");