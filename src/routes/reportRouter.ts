import { Router } from "express";
import {
    createReport,
    listReports,
    getReport,
    updateReport,
    deleteReport,
} from "../controllers/reportController";

const router = Router();

router.get("/", listReports);
router.get("/:id", getReport);
router.post("/", createReport);
router.put("/:id", updateReport);
router.delete("/:id", deleteReport);

export default router;
