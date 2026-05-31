export function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function validatePassword(password: string) {
  const errors: string[] = [];

  if (password.length < 8) errors.push("비밀번호는 8자 이상이어야 합니다.");
  if (!/[A-Za-z]/.test(password)) errors.push("영문을 1자 이상 포함해야 합니다.");
  if (!/[0-9]/.test(password)) errors.push("숫자를 1자 이상 포함해야 합니다.");

  return errors;
}

export function normalizeAuthError(message?: string) {
  const value = (message ?? "").toLowerCase();

  if (value.includes("already") || value.includes("registered")) return "이미 가입된 이메일일 수 있습니다. 로그인 또는 비밀번호 재설정을 이용해 주세요.";
  if (value.includes("invalid login") || value.includes("invalid credentials")) return "이메일 또는 비밀번호가 올바르지 않습니다.";
  if (value.includes("password")) return "비밀번호 조건을 확인해 주세요.";
  if (value.includes("email")) return "이메일 주소를 확인해 주세요.";
  if (message) return message;
  return "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.";
}
