import { Router } from "express";
import {
  handleUserSignup,
  handleUserLogin,
  handleGetUserProfile
} from "../controllers/userController";
import { authenticateToken } from "../middleware/authMiddleware";

const router = Router();

router.post("/signup", handleUserSignup);
router.post("/login", handleUserLogin);
router.get("/profile", authenticateToken, handleGetUserProfile);

export default router;