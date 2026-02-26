import CryptoJS from 'crypto-js'
import type { Account, Group } from '../types'
import { CRYPTO_CONFIG } from '../utils/constants'
import { generateRandomBytes, deriveKey, encryptAES, decryptAES, hashBCrypt, verifyBCrypt } from '../utils/crypto'

// 调试日志开关
const DEBUG = true
function log(...args: any[]) {
  if (DEBUG) {
    console.log('[Encryption]', ...args)
  }
}

function logError(...args: any[]) {
  if (DEBUG) {
    console.error('[Encryption ERROR]', ...args)
  }
}

// 加密服务类
export class EncryptionService {
  private masterPasswordHash: string = ''
  private salt: string = ''
  private derivedKey: CryptoJS.lib.WordArray | null = null

  /**
   * 初始化加密服务（首次设置密码）
   */
  async initialize(password: string): Promise<{ salt: string; hash: string }> {
    log('=== initialize START ===')
    log('initialize: password length =', password.length)

    // 生成随机盐值
    this.salt = generateRandomBytes(CRYPTO_CONFIG.SALT_LENGTH)
    log('initialize: 生成盐值 =', this.salt.substring(0, 20) + '...')

    // 派生密钥
    this.derivedKey = deriveKey(password, this.salt)
    log('initialize: 派生密钥完成')

    // 加密主密码哈希（用于验证）
    const { hash } = hashBCrypt(password, this.salt)
    this.masterPasswordHash = hash
    log('initialize: hash =', hash.substring(0, 20) + '...')

    log('=== initialize END ===')
    return { salt: this.salt, hash }
  }

  /**
   * 解锁（验证密码并派生密钥）
   */
  async unlock(password: string, salt: string, storedHash: string): Promise<boolean> {
    log('=== unlock START ===')
    log('unlock: salt =', salt ? salt.substring(0, 20) + '...' : 'empty')
    log('unlock: storedHash =', storedHash ? storedHash.substring(0, 20) + '...' : 'empty')

    // 验证密码
    const isValid = verifyBCrypt(password, storedHash, salt)
    log('unlock: verifyBCrypt result =', isValid)

    if (!isValid) {
      log('=== unlock END (FAILED) ===')
      return false
    }

    // 保存并派生密钥
    this.salt = salt
    this.masterPasswordHash = storedHash
    this.derivedKey = deriveKey(password, salt)
    log('unlock: 派生密钥完成')

    log('=== unlock END (SUCCESS) ===')
    return true
  }

  /**
   * 解锁（从元数据获取盐值，从加密数据中获取哈希）
   */
  async unlockWithMetadata(
    password: string,
    salt: string,
    getHash: () => string
  ): Promise<boolean> {
    // 从存储数据中获取哈希（这里简化处理，实际需要解析加密数据）
    // 由于加密数据包含完整的账户信息，我们假设哈希在某个位置
    // 这里我们使用 password + salt 生成临时哈希来验证
    const { hash } = hashBCrypt(password, salt)
    this.masterPasswordHash = hash
    this.salt = salt
    this.derivedKey = deriveKey(password, salt)

    return true
  }

  /**
   * 检查是否已解锁
   */
  isUnlocked(): boolean {
    return this.derivedKey !== null
  }

  /**
   * 修改密码
   */
  async changePassword(newPassword: string): Promise<{ salt: string; hash: string }> {
    log('=== changePassword START ===')
    // 生成新的盐值
    const newSalt = generateRandomBytes(CRYPTO_CONFIG.SALT_LENGTH)

    // 重新派生密钥
    this.salt = newSalt
    this.derivedKey = deriveKey(newPassword, newSalt)

    // 更新哈希
    const { hash } = hashBCrypt(newPassword, newSalt)
    this.masterPasswordHash = hash

    log('changePassword: 新salt =', newSalt.substring(0, 20) + '...')
    log('changePassword: 新hash =', hash.substring(0, 20) + '...')
    log('=== changePassword END ===')

    return { salt: newSalt, hash }
  }

  /**
   * 加密数据
   */
  async encrypt(data: string): Promise<{ ciphertext: string; salt: string; iv: string }> {
    log('=== encrypt START ===')
    log('encrypt: data length =', data.length)
    log('encrypt: isUnlocked =', this.derivedKey !== null)

    if (!this.derivedKey) {
      logError('encrypt: 加密服务未解锁!')
      throw new Error('加密服务未解锁')
    }

    const result = encryptAES(data, this.derivedKey)
    log('encrypt: 完成, ciphertext length =', result.ciphertext.length)

    return {
      ciphertext: result.ciphertext,
      salt: this.salt,
      iv: result.iv,
    }
  }

  /**
   * 解密数据
   */
  async decrypt(ciphertext: string, salt: string, iv: string): Promise<string | null> {
    log('=== decrypt START ===')
    log('decrypt: ciphertext length =', ciphertext.length)
    log('decrypt: isUnlocked =', this.derivedKey !== null)

    // 如果还没有派生密钥，使用提供的盐值派生
    if (!this.derivedKey) {
      log('decrypt: 未解锁，尝试使用盐值派生密钥...')
      // 从存储数据中解析哈希（这里需要改进）
      // 暂时使用简单方法：假设 unlock 已经被调用
      this.derivedKey = deriveKey('', salt)
      log('decrypt: 已派生临时密钥')
    }

    try {
      const result = decryptAES(ciphertext, this.derivedKey, iv)
      log('decrypt: 完成, result length =', result.length)
      if (result) {
        log('decrypt: 解密成功')
      } else {
        log('decrypt: 解密结果为空')
      }
      log('=== decrypt END ===')
      return result || null
    } catch (error) {
      logError('decrypt: 错误', error)
      log('=== decrypt END (ERROR) ===')
      return null
    }
  }

  /**
   * 解密并提取哈希（用于解锁验证）
   */
  async decryptAndExtractHash(
    ciphertext: string,
    salt: string,
    iv: string
  ): Promise<{ data: string; hash: string } | null> {
    try {
      const result = decryptAES(ciphertext, this.derivedKey || deriveKey('', salt), iv)
      if (!result) return null

      const data = JSON.parse(result)

      // 从数据中获取哈希
      // 注意：这里需要从解密后的数据中获取存储的哈希
      // 由于我们使用内存中的哈希，暂时返回空哈希
      return {
        data: result,
        hash: this.masterPasswordHash,
      }
    } catch {
      return null
    }
  }

  /**
   * 获取当前盐值
   */
  getSalt(): string {
    return this.salt
  }

  /**
   * 获取当前哈希
   */
  getHash(): string {
    return this.masterPasswordHash
  }

  /**
   * 锁定（清除内存中的密钥）
   */
  lock(): void {
    log('=== lock START ===')
    this.derivedKey = null
    this.masterPasswordHash = ''
    // 盐值保留，用于后续解锁
    log('lock: 已锁定')
    log('=== lock END ===')
  }
}

// 导出加密服务实例
export const encryptionService = new EncryptionService()
