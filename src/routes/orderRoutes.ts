import { Router } from "express";
import { handleCreateOrder } from "../controllers/orderController";

const router = Router();

router.post("/", handleCreateOrder);

export default router;
