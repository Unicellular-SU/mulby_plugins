// 密码强度等级
export type PasswordStrength = 'weak' | 'medium' | 'strong'

// 分组结构
export interface Group {
  id: string
  parentId: string | null  // 支持多级嵌套
  name: string
  order: number
  color?: string
  createdAt: number
  updatedAt: number
}

// 密码条目结构
export interface Account {
  id: string
  groupId: string
  name: string          // 站点/服务名称
  username: string      // 登录账号
  password: string      // 加密存储
  website?: string      // 网址
  remark?: string       // 备注
  order: number         // 同组内排序
  createdAt: number
  updatedAt: number
}

// 密码强度分析结果
export interface PasswordAnalysis {
  score: number         // 0-100
  strength: PasswordStrength
  hasLowercase: boolean
  hasUppercase: boolean
  hasNumbers: boolean
  hasSymbols: boolean
  length: number
}

// 导入冲突处理选项
export type ImportConflictStrategy = 'overwrite' | 'skip' | 'merge'

// 导入配置
export interface ImportConfig {
  strategy: ImportConflictStrategy
  defaultGroupId?: string
}

// 密码生成配置
export interface PasswordGeneratorConfig {
  length: number
  includeUppercase: boolean
  includeLowercase: boolean
  includeNumbers: boolean
  includeSymbols: boolean
  excludeSimilar: boolean  // 排除相似字符如 l, 1, I, O, 0
}

// 门锁状态
export type LockState = 'locked' | 'unlocked' | 'setup' | 'change'

// 主题模式
export type ThemeMode = 'light' | 'dark' | 'system'

// 搜索结果
export interface SearchResult {
  type: 'group' | 'account'
  item: Group | Account
  matches: string[]  // 匹配的字段
}

// 导入结果
export interface ImportResult {
  success: number
  skipped: number
  failed: number
  errors: string[]
}

// 存储数据格式（数据文件）
export interface StoredData {
  version: number
  encryptedData: string
}

// 存储元数据格式（配置文件）
export interface StoredMetadata {
  version: number
  salt: string       // 主盐值
  hash: string       // 密码哈希（用于验证）
  iv: string         // AES IV
  createdAt: number  // 创建时间
}
