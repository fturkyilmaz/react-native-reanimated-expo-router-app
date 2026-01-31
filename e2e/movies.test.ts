import { by, element, expect, waitFor } from "detox";

describe("Movies Flow", () => {
  beforeAll(async () => {
    // Login first
    await device.reloadReactNative();
    await element(by.id("email-input")).typeText("test@test.com");
    await element(by.id("password-input")).typeText("123456");
    await element(by.text("Giriş Yap")).tap();

    // Wait for home screen
    await waitFor(element(by.text("Popüler")))
      .toBeVisible()
      .withTimeout(5000);
  });

  beforeEach(async () => {
    // Navigate back to home if needed
    try {
      await element(by.id("tab-home")).tap();
    } catch (e) {
      // Already on home
    }
  });

  it("should display movie list", async () => {
    await expect(element(by.id("movies-flatlist"))).toBeVisible();
    await expect(element(by.id("movie-card-0"))).toBeVisible();
  });

  it("should scroll through movie list", async () => {
    await element(by.id("movies-flatlist")).scroll(500, "down");
    await element(by.id("movies-flatlist")).scroll(500, "up");
  });

  it("should pull to refresh", async () => {
    await element(by.id("movies-flatlist")).swipe("down", "slow");
    await expect(element(by.id("movies-flatlist"))).toBeVisible();
  });

  it("should navigate to movie detail", async () => {
    await element(by.id("movie-card-0")).tap();

    await expect(element(by.id("movie-detail-screen"))).toBeVisible();
    await expect(element(by.id("favorite-button"))).toBeVisible();
  });

  it("should toggle favorite from movie detail", async () => {
    await element(by.id("movie-card-0")).tap();
    await element(by.id("favorite-button")).tap();

    // Button should still be visible after toggle
    await expect(element(by.id("favorite-button"))).toBeVisible();
  });

  it("should play video in movie detail", async () => {
    await element(by.id("movie-card-0")).tap();

    await expect(element(by.id("video-player"))).toBeVisible();
  });

  it("should scroll movie detail screen", async () => {
    await element(by.id("movie-card-0")).tap();

    await element(by.id("movie-scroll-view")).scroll(500, "down");
    await element(by.id("movie-scroll-view")).scroll(500, "up");
  });
});

describe("Favorites Flow", () => {
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

  it("should display empty favorites initially", async () => {
    await element(by.id("tab-favorites")).tap();

    await expect(element(by.text("Henüz Favori Yok"))).toBeVisible();
    await expect(element(by.text("Keşfetmeye Başla"))).toBeVisible();
  });

  it("should navigate to explore from empty favorites", async () => {
    await element(by.id("tab-favorites")).tap();
    await element(by.text("Keşfetmeye Başla")).tap();

    await expect(element(by.id("movies-flatlist"))).toBeVisible();
  });

  it("should add movie to favorites", async () => {
    // Add a movie to favorites
    await element(by.id("movie-card-0")).tap();
    await element(by.id("favorite-button")).tap();

    // Go to favorites tab
    await element(by.id("tab-favorites")).tap();

    // Should now show the movie
    await expect(element(by.id("favorite-movie-0"))).toBeVisible();
  });

  it("should remove movie from favorites", async () => {
    // First add a movie
    await element(by.id("movie-card-0")).tap();
    await element(by.id("favorite-button")).tap();

    // Go to favorites and remove it
    await element(by.id("tab-favorites")).tap();
    await element(by.id("remove-favorite-0")).tap();

    // Should show empty state
    await expect(element(by.text("Henüz Favori Yok"))).toBeVisible();
  });

  it("should navigate to movie detail from favorites", async () => {
    // Add a movie first
    await element(by.id("movie-card-0")).tap();
    await element(by.id("favorite-button")).tap();

    // Go to favorites and tap on movie
    await element(by.id("tab-favorites")).tap();
    await element(by.id("favorite-movie-0")).tap();

    await expect(element(by.id("movie-detail-screen"))).toBeVisible();
  });
});
