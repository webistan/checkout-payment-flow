import CryptoJS from "crypto-js";

const SECRET_KEY = "WEB_CHECK_1751868414060";

// 🔒 Encrypt with salt (timestamp + random)
export const encryptData = (data) => {
  const salt = Date.now().toString(); // Simple salt (timestamp)
  const dataWithSalt = { ...data, salt }; // Include salt in the data
  const ciphertext = CryptoJS.AES.encrypt(JSON.stringify(dataWithSalt), SECRET_KEY).toString();
  return ciphertext;
};

// 🔓 Decrypt data and remove salt
export const decryptData = (encryptedData) => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
    const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
    const decryptedData = JSON.parse(decryptedString);

    // Remove the salt from the decrypted data
    const { salt, ...originalData } = decryptedData;

    return originalData;
  } catch (error) {
    console.error("Decryption failed:", error);
    throw new Error("Failed to decrypt data");
  }
};
