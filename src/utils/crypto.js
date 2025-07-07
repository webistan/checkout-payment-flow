import CryptoJS from "crypto-js";

const SECRET_KEY = "WEB_CHECK_1751868414060";

// 🔓 Decrypt data and remove salt
export const decryptData = (encryptedData) => {
  try {
    // Always decode URI component in case the ciphertext was URL-encoded
    let decoded = encryptedData;

    const bytes = CryptoJS.AES.decrypt(decoded, SECRET_KEY);
    const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
    if (!decryptedString) {
      throw new Error("Decryption resulted in empty string");
    }
    const decryptedData = JSON.parse(decryptedString);
    const { salt, ...originalData } = decryptedData;
    return originalData;
  } catch (error) {
    console.error("Decryption failed:", error);
    console.error("Encrypted data received:", encryptedData);
    throw new Error("Failed to decrypt data");
  }
};
