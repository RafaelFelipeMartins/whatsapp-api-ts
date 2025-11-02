import express from 'express';
import {
    createImage,
    deleteImage,
    getImage,
    listImages,
    updateImage
} from '../controllers/imagesController';

const router = express.Router();


router.get("/", listImages);
router.get("/:id", getImage);
router.post("/", createImage);
router.put("/:id", updateImage);
router.delete("/:id", deleteImage);

export default router;
