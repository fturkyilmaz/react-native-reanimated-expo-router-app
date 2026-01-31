import { by, element, expect, waitFor } from "detox";

describe("Settings Flow", () => {
  beforeAll(async () => {
    // Login first
    await device.reloadReactNative();
    await element(by.id("email-input")).typeText("test@test.com");
    await element(by.id("password-input")).typeText("123456");
    await element(by.text("Giriş Yap")).tap();

    await waitFor(element(by.text("Popüler")))
      .toBeVisible()
      .withTimeout(5000);
  });

  beforeEach(async () => {
    await element(by.id("tab-settings")).tap();
  });

  it("should display settings screen", async () => {
    await expect(element(by.text("Ayarlar"))).toBeVisible();
    await expect(element(by.text("HESAP"))).toBeVisible();
    await expect(element(by.text("TERCİHLER"))).toBeVisible();
  });

  it("should display user information", async () => {
    await expect(element(by.text("test@test.com"))).toBeVisible();
  });

  it("should toggle dark mode", async () => {
    await element(by.id("dark-mode-switch")).tap();

    // Toggle back
    await element(by.id("dark-mode-switch")).tap();

    await expect(element(by.text("Ayarlar"))).toBeVisible();
  });

  it("should toggle notifications", async () => {
    await element(by.id("notifications-switch")).tap();

    // Toggle back
    await element(by.id("notifications-switch")).tap();

    await expect(element(by.text("Ayarlar"))).toBeVisible();
  });

  it("should toggle email updates", async () => {
    await element(by.id("email-updates-switch")).tap();

    // Toggle back
    await element(by.id("email-updates-switch")).tap();

    await expect(element(by.text("Ayarlar"))).toBeVisible();
  });

  it("should toggle auto play", async () => {
    await element(by.id("auto-play-switch")).tap();

    // Toggle back
    await element(by.id("auto-play-switch")).tap();

    await expect(element(by.text("Ayarlar"))).toBeVisible();
  });

  it("should show logout confirmation", async () => {
    await element(by.text("Çıkış Yap")).tap();

    await expect(element(by.text("Çıkış Yap"))).toBeVisible();
    await expect(
      element(by.text("Hesabınızdan çıkış yapmak istediğinize emin misiniz?")),
    ).toBeVisible();

    // Cancel logout
    await element(by.text("İptal")).tap();

    await expect(element(by.text("Ayarlar"))).toBeVisible();
  });

  it("should logout successfully", async () => {
    await element(by.text("Çıkış Yap")).tap();
    await element(by.text("Çıkış Yap")).tap(); // Confirm logout

    // Should navigate to login screen
    await waitFor(element(by.text("Tekrar Hoşgeldiniz")))
      .toBeVisible()
      .withTimeout(5000);
  });

  it("should show clear cache confirmation", async () => {
    await element(by.text("Önbelleği Temizle")).tap();

    await expect(element(by.text("Önbelleği Temizle"))).toBeVisible();
    await expect(
      element(by.text("Önbelleği temizlemek istediğinize emin misiniz?")),
    ).toBeVisible();

    // Cancel
    await element(by.text("İptal")).tap();

    await expect(element(by.text("Ayarlar"))).toBeVisible();
  });

  it("should clear cache successfully", async () => {
    await element(by.text("Önbelleği Temizle")).tap();
    await element(by.text("Temizle")).tap();

    await expect(element(by.text("Önbellek temizlendi"))).toBeVisible();
  });

  it("should display app version", async () => {
    await expect(element(by.text(/Sürüm/))).toBeVisible();
  });

  it("should scroll settings screen", async () => {
    await element(by.id("settings-scroll-view")).scroll(500, "down");
    await element(by.id("settings-scroll-view")).scroll(500, "up");

    await expect(element(by.text("Ayarlar"))).toBeVisible();
  });
});
