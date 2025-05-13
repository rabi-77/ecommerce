import multer from "multer";

const storage = multer.memoryStorage();
export const uploadCategory = multer({
    
    
  storage,
  limits:{},
  fileFilter: (req, file, cb) => {
    console.log(file,'lol file isnt coming');
    
    const validImageTypes = ["image/jpeg", "image/png", "image/gif"]; // Allowed image MIME types
    if (validImageTypes.includes(file.mimetype)) {
      cb(null, true); // Accept the file
    } else {
        
        
      cb(new Error("Only image files are allowed (JPEG, PNG, GIF)"), false); // Reject the file
    }
  },
}).single("image");
