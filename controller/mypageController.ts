import { Request, Response } from "express";
import User from "../models/user";
import sequelize from "../config/database";
import bcrypt from "bcrypt";
import { getSignedUrl } from "../middleware/upload";
import Todo from "../models/todo";
import FamilyEvents from "../models/familyEvents";
import Calendar from "../models/calendar";
import { Chat } from "../models/chat/chat";
import { RoomParticipant } from "../models/chat/roomParticipant";

interface MulterS3File extends Express.Multer.File {
  location: string;
  key: string;
}

const UserModel = User(sequelize);
const TodoModel = Todo(sequelize);
const FamilyEventsModel = FamilyEvents(sequelize);
const CalendarModel = Calendar(sequelize);

const DEFAULT_IMAGE_URL =
  "https://yeong-port.s3.ap-northeast-2.amazonaws.com/person.png";

// 프로필 사진 추가
export const imgAdd = async (req: Request, res: Response) => {
  try {
    const file = req.file as MulterS3File;
    if (!file) {
      throw new Error("File not found");
    }

    const userId = req.body.userId;
    if (!userId) {
      throw new Error("User ID not provided");
    }

    const user = await UserModel.findByPk(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const key = file.key;
    user.profile_image = key;
    await user.save();

    res.json({ message: "Profile image uploaded successfully", file });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// 프로필 사진 조회
export const imgGet = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    const user = await UserModel.findByPk(userId);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (!user.profile_image) {
      res.json({
        message: "Profile image retrieved successfully",
        imageUrl: DEFAULT_IMAGE_URL,
      });
      return;
    }

    const signedUrl = await getSignedUrl(user.profile_image);
    res.json({
      message: "Profile image retrieved successfully",
      imageUrl: signedUrl,
    });
  } catch (error: any) {
    console.error("Error:", error);
    res.status(400).json({ error: error.message });
  }
};

// 프로필 사진 수정
export const imgUpdate = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;

    const file = req.file as MulterS3File;
    if (!file) {
      throw new Error("File not found");
    }

    const user = await UserModel.findByPk(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const key = file.key;
    user.profile_image = key;
    await user.save();

    res.json({ message: "Profile image updated successfully", file });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

// 프로필 사진 삭제
export const imgDelete = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;

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

// 이름 변경
export const updateName = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const newName = req.body.newName;
    const email = req.body.email;
    const password = req.body.password;

    const user = await UserModel.findByPk(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // 이메일 검증 추가
    if (user.email !== email) {
      throw new Error("Email does not match");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error("Password does not match");
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
    const userId = req.params.userId;
    const email = req.body.email;
    const newPassword = req.body.newPassword;
    const confirmPassword = req.body.currentPassword;

    const user = await UserModel.findByPk(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // 이메일 검증 추가
    if (user.email !== email) {
      throw new Error("Email does not match");
    }

    if (newPassword !== confirmPassword) {
      throw new Error("비밀번호가 맞지 않음");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword; // 해시화된 비밀번호를 저장
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

// 회원 탈퇴
export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const password = req.body.password;

    const user = await UserModel.findByPk(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error("Password does not match");
    }

    // 관련된 데이터 삭제
    await TodoModel.destroy({ where: { user_id: userId } });
    await FamilyEventsModel.destroy({ where: { user_id: userId } });
    await CalendarModel.destroy({ where: { user_id: userId } });
    await Chat.destroy({ where: { userId: userId } });
    await RoomParticipant.destroy({ where: { userId: userId } });

    // 사용자 데이터 삭제
    await user.destroy();

    res.json({ message: "Account deleted successfully" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
