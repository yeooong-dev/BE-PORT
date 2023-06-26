import { Request, Response } from "express";
import { Sequelize } from "sequelize";
import User from "../models/users";
import bcrypt from "bcrypt";
import UserAttributes from "../models/userAttributes";

const sequelize = new Sequelize();
const UserModel = User(sequelize);

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
        res.status(500).json({ message: "아이디 중복 확인에 실패했습니다." });
    }
};

// 닉네임 중복 확인
export const checkNickname = async (req: Request, res: Response) => {
    const { nickname } = req.body;
    try {
        const user = await UserModel.findOne({ where: { nickname: nickname } });
        if (user) {
            console.log("닉네임 중복 확인: 이미 사용 중인 닉네임입니다.");
            res.status(409).json({ message: "이미 사용 중인 닉네임입니다." });
        } else {
            console.log("닉네임 중복 확인: 사용 가능한 닉네임입니다.");
            res.status(200).json({ message: "사용 가능한 닉네임입니다." });
        }
    } catch (error) {
        console.error("닉네임 중복 확인 실패:", error);
        res.status(500).json({ message: "닉네임 중복 확인에 실패했습니다." });
    }
};

// 회원가입 처리
export const register = async (req: Request, res: Response) => {
    const { email, nickname, name, password } = req.body;

    // 비밀번호 암호화
    const hashedPassword = bcrypt.hashSync(password, 10).substring(0, 255);

    const newUser: UserAttributes = {
        id: 0,
        email,
        nickname,
        name,
        password: hashedPassword,
    };

    UserModel.create(newUser)
        .then((user) => {
            console.log("회원가입 성공");
            res.status(200).json({ message: "회원가입에 성공했습니다." });
        })
        .catch((error) => {
            console.error("회원가입 실패", error);
            res.status(500).json({ message: "회원가입에 실패했습니다." });
        });
};
