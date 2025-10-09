// lib/validations.ts
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export const validateLogin = (email: string, password: string): ValidationResult => {
  const errors: Record<string, string> = {};

  if (!email || !email.trim()) {
    errors.email = 'Email là bắt buộc';
  } else if (!isValidEmail(email)) {
    errors.email = 'Email không hợp lệ';
  }

  if (!password || !password.trim()) {
    errors.password = 'Mật khẩu là bắt buộc';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateRegister = (data: {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  phone?: string;
  provinceCode: string;
  communeCode: string;
}): ValidationResult => {
  const errors: Record<string, string> = {};

  // Email validation
  if (!data.email || !data.email.trim()) {
    errors.email = 'Email là bắt buộc';
  } else if (!isValidEmail(data.email)) {
    errors.email = 'Email không hợp lệ';
  }

  // Password validation
  if (!data.password || !data.password.trim()) {
    errors.password = 'Mật khẩu là bắt buộc';
  } else if (data.password.length < 6) {
    errors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
  }

  // Confirm password validation
  if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Mật khẩu xác nhận không khớp';
  }

  // Full name validation
  if (!data.fullName || !data.fullName.trim()) {
    errors.fullName = 'Họ tên là bắt buộc';
  } else if (data.fullName.trim().length < 2) {
    errors.fullName = 'Họ tên phải có ít nhất 2 ký tự';
  }

  // Phone validation (optional)
  if (data.phone && data.phone.trim() && !isValidPhone(data.phone)) {
    errors.phone = 'Số điện thoại không hợp lệ';
  }

  // Province validation
  if (!data.provinceCode || data.provinceCode === '') {
    errors.provinceCode = 'Vui lòng chọn tỉnh/thành phố';
  }

  // Commune validation
  if (!data.communeCode || data.communeCode === '') {
    errors.communeCode = 'Vui lòng chọn xã/phường';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone: string): boolean => {
  // Regex để validate số điện thoại Việt Nam
  const phoneRegex = /^(0\d{9}|(\+84)\d{9})$/;
  return phoneRegex.test(phone);
};