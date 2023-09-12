import { Request, Response } from "express";
import bcrypt from "bcrypt";
import User from "../models/user";
import UserAttributes from "../models/userAttributes";
import { validateRegistrationForm } from "../validation/userValidation";
import sequelize from "../config/database";
import { ValidationError } from "sequelize";

const UserModel = User(sequelize);
const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS || "10");

// 이메일 중복 확인
export const checkEmail = async (req: Request, res: Response) => {
  const { email } = req.body;
  try {
    const user = await UserModel.findOne({ where: { email: email } });
    if (user) {
      console.log("이메일 중복 확인: 이미 사용 중인 이메일입니다.");
      res.status(409).json({ message: "이미 사용 중인 이메일입니다." });
    } else {
      console.log("이메일 중복 확인: 사용 가능한 이메일입니다.");
      res.status(200).json({ message: "사용 가능한 이메일입니다." });
    }
  } catch (error) {
    console.error("이메일 중복 확인 실패:", error);
    res.status(400).json({ message: "아이디 중복 확인에 실패했습니다." });
  }
};

// 회원가입 처리
export const register = async (req: Request, res: Response) => {
  console.log(req.body);
  const { email, name, password } = req.body;

  // 폼 유효성 검사
  const isFormValid = validateRegistrationForm(email, name, password);
  if (!isFormValid) {
    console.log("유효하지 않은 폼");
    return res
      .status(400)
      .json({ message: "유효하지 않은 입력값이 있습니다." });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const newUser: UserAttributes = {
      email,
      name,
      password: hashedPassword,
    };
    const createdUser = await UserModel.create(newUser);
    console.log("Created User: ", createdUser.get());
    res.status(200).json({ message: "회원가입에 성공했습니다." });
  } catch (error) {
    console.log("회원가입 중 에러 발생", error);
    if (error instanceof ValidationError) {
      // Sequelize 유효성 검사 에러 처리
      console.error("Sequelize 유효성 검사 에러:", error);
      res.status(400).json({ message: error.errors[0].message });
    } else {
      console.error("회원가입 실패", error);
      res.status(500).json({ message: "회원가입에 실패했습니다." });
    }
  }
};

// 로그인
export const login = async (req: Request, res: Response) => {
  console.log(req.body);
  try {
    const { email, password } = req.body;

    const user = await UserModel.findOne({ where: { email } });
    console.log("User found: ", user ? user.get() : null);
    if (!user) {
      console.log("로그인 실패: 등록되어 있지 않은 사용자입니다.");
      return res
        .status(400)
        .json({ message: "등록되어 있지 않은 사용자입니다." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log("로그인 실패: 비밀번호가 맞지 않습니다.");
      return res.status(400).json({ message: "비밀번호가 맞지 않습니다." });
    }

    console.log("로그인 성공");
    res
      .status(200)
      .json({ message: "로그인에 성공했습니다.", user: user.get() });
  } catch (error) {
    console.error("로그인 처리 중 에러 발생:", error);
    res.status(500).json({ message: "로그인 처리 중 에러 발생" });
  }
};
