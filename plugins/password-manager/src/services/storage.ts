import type { Group, Account, StoredData, StoredMetadata } from '../types'
import '../types/mulby.d.ts'
import { STORAGE_CONFIG } from '../utils/constants'

// 调试日志开关
const DEBUG = true
function log(...args: any[]) {
  if (DEBUG) {
    console.log('[Storage]', ...args)
  }
}

function logError(...args: any[]) {
  if (DEBUG) {
    console.error('[Storage ERROR]', ...args)
  }
}

// 单例初始化 Promise
let initPromise: Promise<void> | null = null
let storageBasePath: string = '.'  // 默认路径

// 初始化路径（单例模式）
async function initStoragePath(): Promise<void> {
  if (initPromise) return initPromise

  initPromise = (async () => {
    try {
      if (typeof window !== 'undefined' && window.mulby?.system?.getPath) {
        const path = await window.mulby.system.getPath('userData')
        storageBasePath = path
        log('initStoragePath: 成功, basePath =', storageBasePath)
      } else {
        log('initStoragePath: 无 API，使用默认路径')
      }
    } catch (error) {
      logError('initStoragePath: 错误', error)
    }
  })()

  return initPromise
}

// 确保初始化完成
async function ensureReady(): Promise<void> {
  await initStoragePath()
}

// 获取完整文件路径
function getStoragePath(filename: string): string {
  const path = `${storageBasePath}/password-manager/${filename}`
  return path
}

// 存储服务接口
interface StorageService {
  readData: () => Promise<string | null>
  writeData: (data: string) => Promise<void>
  clearData: () => Promise<void>
  exists: () => Promise<boolean>
  readMetadata: () => Promise<StoredMetadata | null>
  writeMetadata: (metadata: StoredMetadata) => Promise<void>
}

// Mulby API 存储实现
class MulbyStorageService implements StorageService {
  private dataFilePath: string = ''
  private metadataFilePath: string = ''

  private async initPaths(): Promise<void> {
    await ensureReady()

    if (!this.dataFilePath) {
      this.dataFilePath = getStoragePath(STORAGE_CONFIG.DATA_FILE)
      this.metadataFilePath = getStoragePath(STORAGE_CONFIG.METADATA_FILE)

      log('MulbyStorageService 初始化完成:')
      log('  dataFilePath =', this.dataFilePath)
      log('  metadataFilePath =', this.metadataFilePath)
    }
  }

  async readData(): Promise<string | null> {
    await this.initPaths()

    try {
      log('readData: 尝试读取', this.dataFilePath)
      const result = await window.mulby?.filesystem?.readFile?.(this.dataFilePath, 'utf-8')
      if (result && typeof result === 'string') {
        log('readData: 成功读取, length:', result.length)
        return result
      }
      log('readData: 返回 null (无数据)')
      return null
    } catch (error) {
      logError('readData: 错误', error)
      return null
    }
  }

  async writeData(data: string): Promise<void> {
    await this.initPaths()

    try {
      log('writeData: 写入数据, length:', data.length, 'to', this.dataFilePath)
      await window.mulby?.filesystem?.writeFile?.(this.dataFilePath, data, 'utf-8')
      log('writeData: 写入成功')
    } catch (error) {
      logError('writeData: 错误', error)
      throw error
    }
  }

  async clearData(): Promise<void> {
    await this.initPaths()

    try {
      const dataExists = await this.exists()
      const metadataExists = await this.hasMetadata()

      log('clearData: dataExists:', dataExists, 'metadataExists:', metadataExists)

      if (dataExists) {
        await window.mulby?.filesystem?.unlink?.(this.dataFilePath)
        log('clearData: 删除数据文件')
      }
      if (metadataExists) {
        await window.mulby?.filesystem?.unlink?.(this.metadataFilePath)
        log('clearData: 删除元数据文件')
      }
    } catch (error) {
      logError('clearData: 错误', error)
      throw error
    }
  }

  async exists(): Promise<boolean> {
    await this.initPaths()

    try {
      const result = await window.mulby?.filesystem?.exists?.(this.dataFilePath) || false
      log('exists:', this.dataFilePath, '->', result)
      return result
    } catch (error) {
      logError('exists: 错误', error)
      return false
    }
  }

  async hasMetadata(): Promise<boolean> {
    await this.initPaths()

    try {
      const result = await window.mulby?.filesystem?.exists?.(this.metadataFilePath) || false
      log('hasMetadata:', this.metadataFilePath, '->', result)
      return result
    } catch (error) {
      logError('hasMetadata: 错误', error)
      return false
    }
  }

  async readMetadata(): Promise<StoredMetadata | null> {
    await this.initPaths()

    try {
      log('readMetadata: 尝试读取', this.metadataFilePath)
      const result = await window.mulby?.filesystem?.readFile?.(this.metadataFilePath, 'utf-8')

      log('readMetadata: result type:', typeof result)
      log('readMetadata: result value:', result)

      if (result && typeof result === 'string') {
        const trimmed = result.trim()
        log('readMetadata: trimmed length:', trimmed.length)

        if (trimmed.length > 0) {
          log('readMetadata: 解析中...')
          const metadata: StoredMetadata = JSON.parse(trimmed)
          log('readMetadata: 解析成功!')
          log('readMetadata: version =', metadata.version)
          log('readMetadata: salt =', metadata.salt?.substring?.(0, 20) || 'empty')
          log('readMetadata: hash =', metadata.hash?.substring?.(0, 20) || 'empty', '(length:', metadata.hash?.length || 0, ')')
          log('readMetadata: iv =', metadata.iv?.substring?.(0, 20) || 'empty')
          return metadata
        } else {
          log('readMetadata: trimmed 为空')
        }
      } else {
        log('readMetadata: result 为空或非字符串')
      }
      log('readMetadata: 返回 null')
      return null
    } catch (error) {
      logError('readMetadata: 错误', error)
      return null
    }
  }

  async writeMetadata(metadata: StoredMetadata): Promise<void> {
    await this.initPaths()

    try {
      const jsonStr = JSON.stringify(metadata)
      log('writeMetadata: 写入, hash length:', metadata.hash?.length || 0, 'to', this.metadataFilePath)
      log('writeMetadata: jsonStr =', jsonStr.substring(0, 100) + '...')
      await window.mulby?.filesystem?.writeFile?.(this.metadataFilePath, jsonStr, 'utf-8')
      log('writeMetadata: 写入成功')
    } catch (error) {
      logError('writeMetadata: 错误', error)
      throw error
    }
  }
}


// 导出存储服务实例
export const storageService = new MulbyStorageService()

// 工具函数：保存数据到存储
export async function saveToStorage(
  groups: Group[],
  accounts: Account[],
  encrypt: (data: string) => Promise<{ ciphertext: string; salt: string; iv: string }>,
  passwordHash?: string
): Promise<void> {
  log('=== saveToStorage START ===')
  log('saveToStorage: groups:', groups.length, ', accounts:', accounts.length)
  log('saveToStorage: passwordHash length:', passwordHash?.length || 0)

  const data = {
    version: 1,
    groups,
    accounts,
    updatedAt: Date.now(),
  }

  const plaintext = JSON.stringify(data)
  log('saveToStorage: plaintext length:', plaintext.length)

  const { ciphertext, salt, iv } = await encrypt(plaintext)
  log('saveToStorage: 加密完成, salt:', salt.substring(0, 20) + '...')

  const storedData: StoredData = {
    version: 1,
    encryptedData: ciphertext,
  }

  await storageService.writeData(JSON.stringify(storedData))

  // 同时保存加密元数据
  const metadata: StoredMetadata = {
    version: 1,
    salt,
    hash: passwordHash || '',
    iv,
    createdAt: Date.now(),
  }
  await storageService.writeMetadata(metadata)
  log('=== saveToStorage END ===')
}

// 工具函数：从存储读取数据
export async function loadFromStorage(
  decrypt: (ciphertext: string, salt: string, iv: string) => Promise<string | null>
): Promise<{ groups: Group[]; accounts: Account[] } | null> {
  log('=== loadFromStorage START ===')

  try {
    const storedJson = await storageService.readData()
    if (!storedJson) {
      log('loadFromStorage: storedJson 为空，返回 null')
      return null
    }

    const storedData: StoredData = JSON.parse(storedJson)
    log('loadFromStorage: 解析 storedData, encryptedData length:', storedData.encryptedData.length)

    const metadata = await storageService.readMetadata()
    log('loadFromStorage: metadata:', metadata ? 'found' : 'null')

    if (!metadata) {
      // 旧版本数据，没有元数据文件
      log('loadFromStorage: 无元数据，返回 null')
      return null
    }

    log('loadFromStorage: 开始解密...')
    const plaintext = await decrypt(storedData.encryptedData, metadata.salt, metadata.iv)
    log('loadFromStorage: 解密结果:', plaintext ? '成功' : '失败/null')

    if (!plaintext) {
      return null
    }

    const data = JSON.parse(plaintext)
    log('loadFromStorage: 解析数据, groups:', data.groups?.length, ', accounts:', data.accounts?.length)

    const result = {
      groups: data.groups || [],
      accounts: data.accounts || [],
    }
    log('=== loadFromStorage END ===')
    return result
  } catch (error) {
    logError('loadFromStorage: 错误', error)
    return null
  }
}

// 导出密码哈希
export async function getStoredHash(): Promise<string | null> {
  log('=== getStoredHash START ===')
  try {
    const metadata = await storageService.readMetadata()
    const hash = metadata?.hash || null
    log('getStoredHash: metadata?.hash:', metadata?.hash ? 'found (' + metadata.hash.length + ')' : 'null')
    log('getStoredHash:', hash ? hash.substring(0, 20) + '...' : 'null')
    log('=== getStoredHash END ===')
    return hash
  } catch (error) {
    logError('getStoredHash: 错误', error)
    return null
  }
}

// 读取元数据
export async function loadMetadata(): Promise<StoredMetadata | null> {
  return storageService.readMetadata()
}

// 检查是否有已存储的数据
export async function hasStoredData(): Promise<boolean> {
  // 确保初始化完成
  await ensureReady()
  return storageService.exists()
}

// 清除所有存储数据
export async function clearAllData(): Promise<void> {
  await storageService.clearData()
}
