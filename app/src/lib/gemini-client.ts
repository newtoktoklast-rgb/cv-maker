"use client";

const KEY_STORAGE = "cv_studio_gemini_api_key";

export function getStoredApiKey(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(KEY_STORAGE) || "";
}

export function setStoredApiKey(key: string): void {
  if (typeof window === "undefined") return;
  if (key.trim()) {
    localStorage.setItem(KEY_STORAGE, key.trim());
  } else {
    localStorage.removeItem(KEY_STORAGE);
  }
}
