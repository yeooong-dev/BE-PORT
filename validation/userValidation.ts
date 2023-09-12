// 이메일 유효성 검사
export const validateEmail = (email: string): boolean => {
  const emailRegex =
    /^[0-9a-zA-Z]([-_\.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_\.]?[0-9a-zA-Z])*\.[a-zA-Z]{2,3}$/i;
  return emailRegex.test(email);
};

// 이름 유효성 검사
// 한글 가능, 영어 가능 [2~6]
export const validateName = (name: string): boolean => {
  const nameRegex = /^[a-zA-Zㄱ-ㅎㅏ-ㅣ가-힣]{2,6}$/;
  return nameRegex.test(name);
};

// 비밀번호 유효성 검사
// 영문 + 숫자 + 특수문자 [8~]
export const validatePassword = (password: string): boolean => {
  const passwordRegex = /^(?=.*[a-zA-Z])(?=.*[!@#$%^*+=-])(?=.*[0-9]).{8,}$/;
  return passwordRegex.test(password);
};

// 회원가입 폼 전체 유효성 검사
export const validateRegistrationForm = (
  email: string,
  name: string,
  password: string
): boolean => {
  const isEmailValid = validateEmail(email);
  const isNameValid = validateName(name);
  const isPasswordValid = validatePassword(password);

  return isEmailValid && isNameValid && isPasswordValid;
};
