import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { protect } from "../middleware/authMiddleware.js";
import User from "../models/User.js";

const router = express.Router();

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), "uploads", "profiles");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // e.g., user-12345-1681234567.jpg
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'user-' + req.user.id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter (optional but good practice)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Not an image! Please upload an image."), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Route to upload profile photo
router.post("/profile-photo", protect(["user", "admin"]), upload.single("photo"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    // The file is saved at server/uploads/profiles/...
    // We want to save the accessible URL path to the DB
    const photoPath = `/uploads/profiles/${req.file.filename}`;

    // Update user in database
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profilePhoto: photoPath },
      { new: true }
    ).select("-password");

    res.json({
      success: true,
      message: "Profile photo updated successfully",
      profilePhoto: photoPath,
      user
    });

  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ success: false, message: "Error uploading photo", error: error.message });
  }
});

// Route to upload multiple business photos
router.post("/business-photos", protect(["user", "admin"]), upload.array("photos", 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: "No files uploaded" });
    }

    // Map through the uploaded files and generate the URL paths
    const photoPaths = req.files.map(file => `/uploads/profiles/${file.filename}`);

    res.json({
      success: true,
      message: "Business photos uploaded successfully",
      photos: photoPaths
    });

  } catch (error) {
    console.error("Business photos upload error:", error);
    res.status(500).json({ success: false, message: "Error uploading business photos", error: error.message });
  }
});

export default router;
