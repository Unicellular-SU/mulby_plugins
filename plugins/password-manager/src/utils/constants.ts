// 加密配置
export const CRYPTO_CONFIG = {
  // PBKDF2 迭代次数
  ITERATIONS: 100000,
  // AES-256-CBC IV 长度
  IV_LENGTH: 16,
  // 密钥长度
  KEY_LENGTH: 32,
  // salt 长度
  SALT_LENGTH: 32,
} as const

// 存储配置
export const STORAGE_CONFIG = {
  // 数据文件名
  DATA_FILE: 'passwords.dat',
  // 配置文件名
  METADATA_FILE: 'metadata.dat',
} as const

// UI 配置
export const UI_CONFIG = {
  // 搜索防抖延迟 (毫秒)
  SEARCH_DEBOUNCE: 300,
  // 密码强度阈值
  STRENGTH_THRESHOLDS: {
    weak: 40,
    medium: 70,
    strong: 100,
  },
  // 默认密码长度
  DEFAULT_PASSWORD_LENGTH: 16,
  // 密码生成器预设长度选项
  PASSWORD_LENGTH_OPTIONS: [8, 12, 16, 20, 24, 32],
} as const

// 默认分组
export const DEFAULT_GROUPS: Array<Omit<import('../types').Group, 'id' | 'createdAt' | 'updatedAt'>> = [
  {
    name: '未分类',
    parentId: null,
    order: 0,
  },
]

// 密码生成器字符集
export const CHAR_SETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  similar: 'Il1Oo0',  // 相似字符
} as const
