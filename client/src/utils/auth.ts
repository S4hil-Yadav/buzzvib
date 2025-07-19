import type { Tokens } from "@/types";

export function setTokens(tokens: Tokens) {
  Object.entries(tokens).forEach(([key, value]) => localStorage.setItem(key, value));
}

export function clearTokens() {
  ["accessToken", "refreshToken", "sessionId"].forEach(key => localStorage.removeItem(key));
}
