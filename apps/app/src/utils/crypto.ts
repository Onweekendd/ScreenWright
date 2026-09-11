import CryptoJS from "crypto-js";

export class crypto {
  // 使用AesUtil.genAesKey()生成,需和后端配置保持一致
  static aesKey = "screenwrightAES0";
  static aesIv = "screenwrightIV00";

  // 使用DesUtil.genDesKey()生成,需和后端配置保持一致
  static desKey = "jMVCBsFGDQr1USHo";

  /**
   * aes 加密方法
   * @param data
   * @returns {*}
   */
  static encrypt(data: string): string {
    return this.encryptAES(data, this.aesKey, this.aesIv);
  }

  /**
   * aes 解密方法
   * @param data
   * @returns {*}
   */
  static decrypt(data: string): string {
    return this.decryptAES(data, this.aesKey, this.aesIv);
  }

  /**
   * aes 加密方法，同java：AesUtil.encryptToBase64(text, aesKey);
   */
  static encryptAES(data: string, key: string, iv: string) {
    const dataBytes = CryptoJS.enc.Utf8.parse(data);
    const keyBytes = CryptoJS.enc.Utf8.parse(key);
    const ivBytes = CryptoJS.enc.Utf8.parse(iv);
    const encrypted = CryptoJS.AES.encrypt(dataBytes, keyBytes, {
      iv: ivBytes,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    return CryptoJS.enc.Base64.stringify(encrypted.ciphertext);
  }

  /**
   * aes 解密方法，同java：AesUtil.decryptFormBase64ToString(encrypt, aesKey);
   */
  static decryptAES(data: string, key: string, iv: string) {
    const keyBytes = CryptoJS.enc.Utf8.parse(key);
    const ivBytes = CryptoJS.enc.Utf8.parse(iv);
    const decrypted = CryptoJS.AES.decrypt(data, keyBytes, {
      iv: ivBytes,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    return CryptoJS.enc.Utf8.stringify(decrypted);
  }

  /**
   * des 加密方法，同java：DesUtil.encryptToBase64(text, desKey)
   */
  static encryptDES(data: string, key: string) {
    const keyHex = CryptoJS.enc.Utf8.parse(key);
    const encrypted = CryptoJS.DES.encrypt(data, keyHex, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7
    });
    return encrypted.toString();
  }

  /**
   * des 解密方法，同java：DesUtil.decryptFormBase64(encryptBase64, desKey);
   */
  static decryptDES(data: string, key: string) {
    const keyHex = CryptoJS.enc.Utf8.parse(key);
    const decrypted = CryptoJS.DES.decrypt(
      CryptoJS.lib.CipherParams.create({
        ciphertext: CryptoJS.enc.Base64.parse(data)
      }),
      keyHex,
      {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
      }
    );
    return decrypted.toString(CryptoJS.enc.Utf8);
  }
}

export const encryptWithCryptoJS = (text: string, secretKey: string) => {
  const key = CryptoJS.enc.Utf8.parse(secretKey.substr(0, 32));
  const iv = CryptoJS.lib.WordArray.random(16);

  const encrypted = CryptoJS.AES.encrypt(text, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
    format: CryptoJS.format.OpenSSL
  });

  return { iv: iv.toString(CryptoJS.enc.Hex), encryptedData: encrypted.toString(), secretKey };
};

export const decryptWithCryptoJS = (ivHex: string, encryptedData: string, secretKey: string) => {
  const key = CryptoJS.enc.Utf8.parse(secretKey.substr(0, 32)); // 确保密钥长度正确
  const iv = CryptoJS.enc.Hex.parse(ivHex); // 将IV从十六进制字符串转换为WordArray

  const bytes = CryptoJS.enc.Base64.parse(encryptedData); // 因为encryptedData是OpenSSL格式的，首先需要解析为Base64
  const decrypted = CryptoJS.AES.decrypt(
    CryptoJS.lib.CipherParams.create({
      ciphertext: bytes
    }),
    key,
    {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    }
  );

  return decrypted.toString(CryptoJS.enc.Utf8); // 将解密后的WordArray转换为UTF-8字符串
};

export const getDecryptStatus = (a: string, b: string, s: string) => {
  try {
    const abs = JSON.parse(decryptWithCryptoJS(a, b, s));
    const expirationDate = new Date(abs.v);
    const gap = new Date(abs.i);
    const now = new Date();
    console.log(expirationDate, "expirationDate");
    console.log(gap, "gap");
    console.log(now, "now");
    return expirationDate >= now && gap <= now;
  } catch (err) {
    return false;
  }
};
