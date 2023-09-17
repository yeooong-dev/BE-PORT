import { Request, Response } from "express";
import User from "../models/user";
import sequelize from "../config/database";

interface MulterS3File extends Express.Multer.File {
  location: string;
}

const UserModel = User(sequelize);

// 프로필 사진 추가
export const imgAdd = async (req: Request, res: Response) => {
  try {
    const file = req.file as MulterS3File;
    if (!file) {
      throw new Error("File not found");
    }

    const userId = req.body.userId;
    const user = await UserModel.findByPk(userId);

    if (!user) {
      throw new Error("User not found");
    }

    user.profile_image = file.location;
    await user.save();

    res.json({ message: "Profile image uploaded successfully", file });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

// 프로필 사진 조회
export const imgGet = async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    const user = await UserModel.findByPk(userId);

    if (!user || !user.profile_image) {
      throw new Error("Profile image not found");
    }

    res.json({
      message: "Profile image retrieved successfully",
      imageUrl: user.profile_image,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

// 프로필 사진 수정
export const imgUpdate = async (req: Request, res: Response) => {
  try {
    const userId = req.body.userId;
    const file = req.file as MulterS3File;

    if (!file) {
      throw new Error("File not found");
    }

    const user = await UserModel.findByPk(userId);
    if (!user) {
      throw new Error("User not found");
    }

    user.profile_image = file.location;
    await user.save();

    res.json({ message: "Profile image updated successfully", file });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

// 프로필 사진 삭제
export const imgDelete = async (req: Request, res: Response) => {
  try {
    const userId = req.body.userId;

    const user = await UserModel.findByPk(userId);
    if (!user) {
      throw new Error("User not found");
    }

    user.profile_image = null;
    await user.save();

    res.json({ message: "Profile image deleted successfully" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

// 성함 변경
export const updateName = async (req: Request, res: Response) => {
  try {
    const userId = req.body.userId;
    const newName = req.body.newName;

    const user = await UserModel.findByPk(userId);
    if (!user) {
      throw new Error("User not found");
    }

    user.name = newName;
    await user.save();

    res.json({ message: "Name updated successfully" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

// 비밀번호 변경
export const updatePassword = async (req: Request, res: Response) => {
  try {
    const userId = req.body.userId;
    const newPassword = req.body.newPassword;

    const user = await UserModel.findByPk(userId);
    if (!user) {
      throw new Error("User not found");
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

// 회원 탈퇴
export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const userId = req.body.userId;

    const user = await UserModel.findByPk(userId);
    if (!user) {
      throw new Error("User not found");
    }

    await user.destroy();

    res.json({ message: "Account deleted successfully" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
