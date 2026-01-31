import { by, element, expect, waitFor } from "detox";

describe("Authentication Flow", () => {
  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it("should display login screen on app launch", async () => {
    await expect(element(by.text("Tekrar Hoşgeldiniz"))).toBeVisible();
    await expect(element(by.text("Giriş Yap"))).toBeVisible();
  });

  it("should show validation error for invalid email", async () => {
    await element(by.id("email-input")).typeText("invalid-email");
    await element(by.id("password-input")).typeText("123456");
    await element(by.text("Giriş Yap")).tap();

    await expect(
      element(by.text("Geçerli bir e-posta adresi giriniz")),
    ).toBeVisible();
  });

  it("should show validation error for short password", async () => {
    await element(by.id("email-input")).clearText();
    await element(by.id("email-input")).typeText("test@test.com");
    await element(by.id("password-input")).typeText("123");
    await element(by.text("Giriş Yap")).tap();

    await expect(
      element(by.text("Şifre en az 6 karakter olmalı")),
    ).toBeVisible();
  });

  it("should login successfully with valid credentials", async () => {
    await element(by.id("email-input")).clearText();
    await element(by.id("email-input")).typeText("test@test.com");
    await element(by.id("password-input")).clearText();
    await element(by.id("password-input")).typeText("123456");
    await element(by.text("Giriş Yap")).tap();

    // Wait for navigation to home screen
    await waitFor(element(by.text("Popüler")))
      .toBeVisible()
      .withTimeout(5000);
  });

  it("should show error for invalid credentials", async () => {
    await element(by.id("email-input")).clearText();
    await element(by.id("email-input")).typeText("wrong@email.com");
    await element(by.id("password-input")).clearText();
    await element(by.id("password-input")).typeText("wrongpassword");
    await element(by.text("Giriş Yap")).tap();

    await expect(element(by.text("Geçersiz e-posta veya şifre"))).toBeVisible();
  });

  it("should navigate to register screen", async () => {
    await element(by.text("Kayıt Ol")).tap();

    await expect(element(by.text("Hesap Oluştur"))).toBeVisible();
    await expect(element(by.id("name-input"))).toBeVisible();
  });
});

describe("Registration Flow", () => {
  beforeEach(async () => {
    await device.reloadReactNative();
    // Navigate to register screen
    await element(by.text("Kayıt Ol")).tap();
  });

  it("should display registration form", async () => {
    await expect(element(by.text("Hesap Oluştur"))).toBeVisible();
    await expect(element(by.id("name-input"))).toBeVisible();
    await expect(element(by.id("email-input"))).toBeVisible();
    await expect(element(by.id("password-input"))).toBeVisible();
    await expect(element(by.id("confirm-password-input"))).toBeVisible();
  });

  it("should show validation error for short name", async () => {
    await element(by.id("name-input")).typeText("A");
    await element(by.id("email-input")).typeText("test@test.com");
    await element(by.id("password-input")).typeText("Password1");
    await element(by.id("confirm-password-input")).typeText("Password1");
    await element(by.text("Kayıt Ol")).tap();

    await expect(
      element(by.text("İsim en az 2 karakter olmalı")),
    ).toBeVisible();
  });

  it("should show validation error when passwords do not match", async () => {
    await element(by.id("name-input")).typeText("John Doe");
    await element(by.id("email-input")).typeText("john@test.com");
    await element(by.id("password-input")).typeText("Password1");
    await element(by.id("confirm-password-input")).typeText("Password2");
    await element(by.text("Kayıt Ol")).tap();

    await expect(element(by.text("Şifreler eşleşmiyor"))).toBeVisible();
  });

  it("should register successfully with valid data", async () => {
    await element(by.id("name-input")).typeText("John Doe");
    await element(by.id("email-input")).typeText("john@test.com");
    await element(by.id("password-input")).typeText("Password1");
    await element(by.id("confirm-password-input")).typeText("Password1");
    await element(by.text("Kayıt Ol")).tap();

    // Wait for navigation to home screen
    await waitFor(element(by.text("Popüler")))
      .toBeVisible()
      .withTimeout(5000);
  });
});
