import express from 'express';
import {deleteImage, getImages, postImages} from '../controllers/imagesController';

const router = express.Router();

router.get("/:id", getImages);
router.post("", postImages);
router.delete("/:id", deleteImage);
export default router;
