import { NextFunction, Response } from "express";
import {
  signupUser,
  loginUser,
  getUserProfile,
  hasRegisteredUsers,
  SignupData,
  LoginData
} from "../services/userService";
import { AuthRequest } from "../middleware/authMiddleware";

export async function handleUserSignup(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (process.env.ALLOW_ADMIN_SIGNUP !== "true" && await hasRegisteredUsers()) {
      return res.status(403).json({ message: "Administrator registration is disabled" });
    }
    const userData: SignupData = req.body;

    // Validation
    if (!userData.firstName || !userData.firstName.trim()) {
      return res.status(400).json({ message: "First name is required" });
    }

    if (!userData.lastName || !userData.lastName.trim()) {
      return res.status(400).json({ message: "Last name is required" });
    }

    if (!userData.email || !userData.email.trim()) {
      return res.status(400).json({ message: "Email is required" });
    }

    if (!userData.password || userData.password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    const result = await signupUser(userData);
    res.status(201).json({
      message: "User registered successfully",
      user: result.user,
      token: result.token
    });
  } catch (error: any) {
    if (error.message.includes("already exists")) {
      return res.status(409).json({ message: error.message });
    }
    next(error);
  }
}

export async function handleUserLogin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const loginData: LoginData = req.body;

    // Validation
    if (!loginData.email || !loginData.email.trim()) {
      return res.status(400).json({ message: "Email is required" });
    }

    if (!loginData.password) {
      return res.status(400).json({ message: "Password is required" });
    }

    const result = await loginUser(loginData);
    res.json({
      message: "Login successful",
      user: result.user,
      token: result.token
    });
  } catch (error: any) {
    if (error.message.includes("Invalid credentials") || error.message.includes("User not found")) {
      return res.status(401).json({ message: error.message });
    }
    next(error);
  }
}

export async function handleGetUserProfile(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const user = await getUserProfile(req.user.userId);
    res.json({
      message: "Profile retrieved successfully",
      user
    });
  } catch (error: any) {
    if (error.message.includes("not found")) {
      return res.status(404).json({ message: error.message });
    }
    next(error);
  }
}
