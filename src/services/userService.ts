import { Prisma } from "@prisma/client";
import { prisma } from "../prismaClient";
import bcrypt from "bcryptjs";
import { generateToken } from "../middleware/authMiddleware";

// Define UserRole locally if not exported from Prisma
enum UserRole {
  USER = "USER",
  ADMIN = "ADMIN"
}

export interface SignupData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface FrontendUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResponse {
  user: FrontendUser;
  token: string;
}

export async function signupUser(data: SignupData): Promise<AuthResponse> {
  try {
    const { firstName, lastName, email, password } = data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user - FIXED: Use the correct Prisma client syntax
    const user = await prisma.user.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: UserRole.ADMIN,
      },
    });

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    console.log(`User registered successfully: ${user.id}`);
    return {
      user: mapDbUserToFrontend(user),
      token
    };

  } catch (error) {
    console.error('Error signing up user:', error);
    throw error;
  }
}

export async function loginUser(data: LoginData): Promise<AuthResponse> {
  try {
    const { email, password } = data;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      throw new Error("Invalid credentials");
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error("Invalid credentials");
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role as UserRole
    });

    console.log(`User logged in successfully: ${user.id}`);
    return {
      user: mapDbUserToFrontend(user),
      token
    };

  } catch (error) {
    console.error('Error logging in user:', error);
    throw error;
  }
}

export async function getUserProfile(userId: number): Promise<FrontendUser> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error("User not found");
    }

    return mapDbUserToFrontend(user);
  } catch (error) {
    console.error(`Error fetching user profile ${userId}:`, error);
    throw error;
  }
}

function mapDbUserToFrontend(user: any): FrontendUser {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role as UserRole,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}