const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "booknest_images",
    allowed_formats: ["jpg", "jpeg", "png", "webp", "avif"], 
  },
});


const parser = multer({ storage });

module.exports = parser;
