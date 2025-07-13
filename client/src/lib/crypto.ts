import CryptoJS from "crypto-js";

const SECRET_KEY = "your-super-secret-key"; // Ideally, generate/store per user session

/**
 * Encrypts a message using AES.
 * @param text - The plain text to encrypt.
 * @returns The AES-encrypted ciphertext (base64 string).
 */
export function encryptMessage(text: string) {
  if (!text) return "";
  return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
}

/**
 * Decrypts an AES-encrypted message.
 * @param cipherText - The encrypted text.
 * @returns The original plain text.
 */
export function decryptMessage(cipherText: string) {
  if (!cipherText) return null;
  const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}
