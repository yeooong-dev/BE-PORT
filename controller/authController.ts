import { Request, Response } from "express";
import bcrypt from "bcrypt";
import User, { UserAttributes } from "../models/user";
import { validateRegistrationForm } from "../validation/userValidation";
import sequelize from "../config/database";
import { ValidationError } from "sequelize";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

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

// 기업 회원가입 처리
export const registerCompany = async (req: Request, res: Response) => {
  const { email, company_name, password, passwordConfirm } = req.body as {
    email: string;
    company_name: string;
    password: string;
    passwordConfirm: string;
  };

  // 폼 유효성 검사
  const isFormValid = validateRegistrationForm(email, company_name, password);
  if (!isFormValid) {
    console.log("유효하지 않은 폼");
    return res
      .status(400)
      .json({ message: "유효하지 않은 입력값이 있습니다." });
  }

  if (password !== passwordConfirm) {
    return res
      .status(400)
      .json({ message: "비밀번호와 비밀번호 확인이 일치하지 않습니다." });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const fullUuid = uuidv4();
    const companyCode = fullUuid.split("-")[0];

    const newCompanyUser: UserAttributes = {
      email,
      company_name,
      password: hashedPassword,
      company_code: companyCode,
      isCompany: true,
    };
    const createdUser = await UserModel.create(newCompanyUser);
    console.log("Created Company User: ", createdUser.get());
    res.status(200).json({ message: "기업 회원가입에 성공했습니다." });
  } catch (error) {
    console.error("기업 회원가입 중 에러 발생", error);
    if (error instanceof ValidationError) {
      // Sequelize 유효성 검사 에러 처리
      console.error("Sequelize 유효성 검사 에러:", error);
      res.status(400).json({ message: error.errors[0].message });
    } else {
      console.error("기업 회원가입 실패", error);
      res.status(500).json({ message: "기업 회원가입에 실패했습니다." });
    }
  }
};

// 회원가입 처리
export const register = async (req: Request, res: Response) => {
  const { email, name, password, passwordConfirm } = req.body as {
    email: string;
    name: string;
    password: string;
    passwordConfirm: string;
  };

  // 폼 유효성 검사
  const isFormValid = validateRegistrationForm(email, name, password);
  if (!isFormValid) {
    console.log("유효하지 않은 폼");
    return res
      .status(400)
      .json({ message: "유효하지 않은 입력값이 있습니다." });
  }

  if (password !== passwordConfirm) {
    return res
      .status(400)
      .json({ message: "비밀번호와 비밀번호 확인이 일치하지 않습니다." });
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
      return res
        .status(400)
        .json({ message: "등록되어 있지 않은 사용자입니다." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "비밀번호가 맞지 않습니다." });
    }

    // JWT 토큰 생성
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || "your_jwt_secret",
      { expiresIn: "24h" }
    );
    res
      .status(200)
      .json({ message: "로그인에 성공했습니다.", user: user.get(), token });
  } catch (error) {
    console.error("로그인 처리 중 에러 발생:", error);
    res.status(500).json({ message: "로그인 처리 중 에러 발생" });
  }
};

// 회원 정보
export const getUserInfo = async (req: Request, res: Response) => {
  try {
    // 이메일을 query parameter에서 가져옴
    const { email } = req.query;

    if (!email || typeof email !== "string") {
      return res.status(400).send("잘못된 이메일 파라미터");
    }

    // 데이터베이스에서 사용자를 찾음
    const userInstance = await UserModel.findOne({ where: { email } });
    if (!userInstance) {
      return res.status(404).send("사용자를 찾을 수 없습니다.");
    }

    res.status(200).send(userInstance);
  } catch (error) {
    console.error(error);
    res.status(500).send("서버 내부 오류");
  }
};
