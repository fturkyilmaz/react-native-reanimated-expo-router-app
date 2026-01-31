import {
    ForgotPasswordFormData,
    forgotPasswordSchema,
    LoginFormData,
    loginSchema,
    RegisterFormData,
    registerSchema,
} from "@/schemas/auth";

describe("Auth Schemas", () => {
  describe("loginSchema", () => {
    it("validates correct login data", () => {
      const validData = {
        email: "test@example.com",
        password: "password123",
      };

      expect(() => loginSchema.parse(validData)).not.toThrow();
    });

    it("throws error for empty email", () => {
      const invalidData = {
        email: "",
        password: "password123",
      };

      expect(() => loginSchema.parse(invalidData)).toThrow(
        "E-posta adresi gerekli",
      );
    });

    it("throws error for invalid email format", () => {
      const invalidData = {
        email: "invalid-email",
        password: "password123",
      };

      expect(() => loginSchema.parse(invalidData)).toThrow(
        "Geçerli bir e-posta adresi giriniz",
      );
    });

    it("throws error for short password", () => {
      const invalidData = {
        email: "test@example.com",
        password: "12345",
      };

      expect(() => loginSchema.parse(invalidData)).toThrow(
        "Şifre en az 6 karakter olmalı",
      );
    });

    it("throws error for too long password", () => {
      const invalidData = {
        email: "test@example.com",
        password: "a".repeat(51),
      };

      expect(() => loginSchema.parse(invalidData)).toThrow("Şifre çok uzun");
    });

    it("validates minimum length password", () => {
      const validData = {
        email: "test@example.com",
        password: "123456",
      };

      expect(() => loginSchema.parse(validData)).not.toThrow();
    });
  });

  describe("registerSchema", () => {
    it("validates correct registration data", () => {
      const validData = {
        name: "John Doe",
        email: "john@example.com",
        password: "Password1",
        confirmPassword: "Password1",
      };

      expect(() => registerSchema.parse(validData)).not.toThrow();
    });

    it("throws error for short name", () => {
      const invalidData = {
        name: "A",
        email: "john@example.com",
        password: "Password1",
        confirmPassword: "Password1",
      };

      expect(() => registerSchema.parse(invalidData)).toThrow(
        "İsim en az 2 karakter olmalı",
      );
    });

    it("throws error for too long name", () => {
      const invalidData = {
        name: "A".repeat(51),
        email: "john@example.com",
        password: "Password1",
        confirmPassword: "Password1",
      };

      expect(() => registerSchema.parse(invalidData)).toThrow("İsim çok uzun");
    });

    it("throws error for password without uppercase", () => {
      const invalidData = {
        name: "John Doe",
        email: "john@example.com",
        password: "password1",
        confirmPassword: "password1",
      };

      expect(() => registerSchema.parse(invalidData)).toThrow(
        "Şifrede en az bir büyük harf olmalı",
      );
    });

    it("throws error for password without number", () => {
      const invalidData = {
        name: "John Doe",
        email: "john@example.com",
        password: "Password",
        confirmPassword: "Password",
      };

      expect(() => registerSchema.parse(invalidData)).toThrow(
        "Şifrede en az bir rakam olmalı",
      );
    });

    it("throws error when passwords do not match", () => {
      const invalidData = {
        name: "John Doe",
        email: "john@example.com",
        password: "Password1",
        confirmPassword: "Password2",
      };

      expect(() => registerSchema.parse(invalidData)).toThrow(
        "Şifreler eşleşmiyor",
      );
    });

    it("validates with minimum length name", () => {
      const validData = {
        name: "Jo",
        email: "john@example.com",
        password: "Password1",
        confirmPassword: "Password1",
      };

      expect(() => registerSchema.parse(validData)).not.toThrow();
    });

    it("validates with exactly 50 character name", () => {
      const validData = {
        name: "A".repeat(50),
        email: "john@example.com",
        password: "Password1",
        confirmPassword: "Password1",
      };

      expect(() => registerSchema.parse(validData)).not.toThrow();
    });
  });

  describe("forgotPasswordSchema", () => {
    it("validates correct email", () => {
      const validData = {
        email: "test@example.com",
      };

      expect(() => forgotPasswordSchema.parse(validData)).not.toThrow();
    });

    it("throws error for empty email", () => {
      const invalidData = {
        email: "",
      };

      expect(() => forgotPasswordSchema.parse(invalidData)).toThrow(
        "E-posta adresi gerekli",
      );
    });

    it("throws error for invalid email format", () => {
      const invalidData = {
        email: "not-an-email",
      };

      expect(() => forgotPasswordSchema.parse(invalidData)).toThrow(
        "Geçerli bir e-posta adresi giriniz",
      );
    });

    it("throws error for email without @", () => {
      const invalidData = {
        email: "testexample.com",
      };

      expect(() => forgotPasswordSchema.parse(invalidData)).toThrow(
        "Geçerli bir e-posta adresi giriniz",
      );
    });

    it("throws error for email without domain", () => {
      const invalidData = {
        email: "test@",
      };

      expect(() => forgotPasswordSchema.parse(invalidData)).toThrow(
        "Geçerli bir e-posta adresi giriniz",
      );
    });
  });

  describe("Type inference", () => {
    it("LoginFormData type matches schema", () => {
      const data: LoginFormData = {
        email: "test@example.com",
        password: "password123",
      };

      const parsed = loginSchema.parse(data);
      expect(parsed).toEqual(data);
    });

    it("RegisterFormData type matches schema", () => {
      const data: RegisterFormData = {
        name: "John Doe",
        email: "john@example.com",
        password: "Password1",
        confirmPassword: "Password1",
      };

      const parsed = registerSchema.parse(data);
      expect(parsed).toEqual(data);
    });

    it("ForgotPasswordFormData type matches schema", () => {
      const data: ForgotPasswordFormData = {
        email: "test@example.com",
      };

      const parsed = forgotPasswordSchema.parse(data);
      expect(parsed).toEqual(data);
    });
  });
});
