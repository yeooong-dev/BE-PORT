// 이메일 유효성 검사
export const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// 닉네임 유효성 검사
// 영어 가능, 한글 가능, 숫자 가능 [3~6]
export const validateNickname = (nickname: string): boolean => {
    const nicknameRegex = /^[a-zA-Z0-9ㄱ-ㅎㅏ-ㅣ가-힣]{3,6}$/;
    return nicknameRegex.test(nickname);
};

// 이름 유효성 검사
// 한글 가능, 영어 가능 [2~9]
export const validateName = (name: string): boolean => {
    const nameRegex = /^[a-zA-Zㄱ-ㅎㅏ-ㅣ가-힣]{2,10}$/;
    return nameRegex.test(name);
};

// 비밀번호 유효성 검사
// 영문 + 숫자 + 특수문자 [7~]
export const validatePassword = (password: string): boolean => {
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{7,}$/;
    return passwordRegex.test(password);
};

// 회원가입 폼 전체 유효성 검사
export const validateRegistrationForm = (email: string, nickname: string, name: string, password: string): boolean => {
    const isEmailValid = validateEmail(email);
    const isNicknameValid = validateNickname(nickname);
    const isNameValid = validateName(name);
    const isPasswordValid = validatePassword(password);

    return isEmailValid && isNicknameValid && isNameValid && isPasswordValid;
};
