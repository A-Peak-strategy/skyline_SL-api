import { Router } from "express";
import { handleCreateContactMessage } from "../controllers/contactController";

const router = Router();

router.post("/", handleCreateContactMessage);

export default router;
