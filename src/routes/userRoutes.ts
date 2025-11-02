import express from "express";
import { createUser, deleteUser, updateUser } from "../controllers/userController";

const router = express.Router();

router.post("", createUser);    
router.put("/:id", updateUser);  
router.delete("/:id", deleteUser)

export default router;
