import CryptoJS from 'crypto-js'
import { CRYPTO_CONFIG } from './constants'

/**
 * 生成随机字符串
 */
export function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * 生成随机字节数组
 */
export function generateRandomBytes(length: number): string {
  return CryptoJS.lib.WordArray.random(length).toString()
}

/**
 * 使用 PBKDF2 派生密钥
 */
export function deriveKey(password: string, salt: string): CryptoJS.lib.WordArray {
  return CryptoJS.PBKDF2(password, salt, {
    keySize: CRYPTO_CONFIG.KEY_LENGTH / 4,
    iterations: CRYPTO_CONFIG.ITERATIONS,
    hasher: CryptoJS.algo.SHA256,
  })
}

/**
 * AES 加密
 */
export function encryptAES(plaintext: string, key: CryptoJS.lib.WordArray): { ciphertext: string; iv: string } {
  const iv = CryptoJS.lib.WordArray.random(CRYPTO_CONFIG.IV_LENGTH)
  const encrypted = CryptoJS.AES.encrypt(plaintext, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  })

  return {
    ciphertext: encrypted.ciphertext.toString(CryptoJS.enc.Base64),
    iv: iv.toString(),
  }
}

/**
 * AES 解密
 */
export function decryptAES(
  ciphertext: string,
  key: CryptoJS.lib.WordArray,
  ivString: string
): string {
  const iv = CryptoJS.enc.Hex.parse(ivString)
  const ciphertextWordArray = CryptoJS.enc.Base64.parse(ciphertext)

  const decrypted = CryptoJS.AES.decrypt(
    { ciphertext: ciphertextWordArray } as CryptoJS.lib.CipherParams,
    key,
    {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    }
  )

  return decrypted.toString(CryptoJS.enc.Utf8)
}

/**
 * BCrypt 哈希（模拟，实际使用 bcryptjs）
 */
export function hashBCrypt(password: string, salt?: string): { hash: string; salt: string } {
  // 使用 CryptoJS 模拟 BCrypt（实际项目中建议使用 bcryptjs）
  const useSalt = salt || generateRandomString(16)
  const hash = CryptoJS.SHA512(password + useSalt).toString()
  return { hash, salt: useSalt }
}

/**
 * 验证 BCrypt 哈希
 */
export function verifyBCrypt(password: string, hash: string, salt: string): boolean {
  const newHash = CryptoJS.SHA512(password + salt).toString()
  return newHash === hash
}
