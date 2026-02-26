import Papa from 'papaparse'
import type { Account, Group, ImportConflictStrategy, ImportConfig } from '../types'
import { generateId } from '../utils/helpers'

// Chrome/Edge CSV 格式
interface ChromeCSVRow {
  name: string
  url: string
  username: string
  password: string
  note?: string
}

/**
 * 解析 CSV 文件
 */
export function parseCSV(content: string): ChromeCSVRow[] {
  const result = Papa.parse<ChromeCSVRow>(content, {
    header: true,
    skipEmptyLines: true,
  })

  return result.data
}

/**
 * 检测是否为 Chrome/Edge 格式
 */
export function isChromeFormat(rows: ChromeCSVRow[]): boolean {
  if (rows.length === 0) return false
  const firstRow = rows[0]
  return (
    'name' in firstRow &&
    'url' in firstRow &&
    'username' in firstRow &&
    'password' in firstRow
  )
}

/**
 * 转换 Chrome 格式到 Account
 */
function convertToAccount(row: ChromeCSVRow, groupId: string, existingIds: Set<string>): Account | null {
  // 跳过空密码的行
  if (!row.password || row.password.trim() === '') {
    return null
  }

  // 生成唯一 ID
  let id = generateId()
  let attempts = 0
  while (existingIds.has(id) && attempts < 10) {
    id = generateId()
    attempts++
  }

  return {
    id,
    groupId,
    name: row.name || '未命名',
    username: row.username || '',
    password: row.password, // 密码原文，调用方负责加密
    website: row.url || undefined,
    remark: row.note || undefined,
    order: Date.now(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

/**
 * 导入配置
 */
export interface ImportResult {
  success: number
  skipped: number
  failed: number
  errors: string[]
}

/**
 * 执行导入
 */
export async function importFromCSV(
  content: string,
  existingAccounts: Account[],
  config: ImportConfig
): Promise<ImportResult> {
  const result: ImportResult = {
    success: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  }

  try {
    // 解析 CSV
    const rows = parseCSV(content)
    
    if (rows.length === 0) {
      result.errors.push('CSV 文件为空或格式错误')
      return result
    }

    // 验证格式
    if (!isChromeFormat(rows)) {
      result.errors.push('文件格式不匹配 Chrome/Edge 导出格式')
      return result
    }

    // 收集现有数据用于冲突检测
    const existingMap = new Map<string, Account>()
    for (const account of existingAccounts) {
      const key = `${account.name.toLowerCase()}-${account.username.toLowerCase()}`
      existingMap.set(key, account)
    }

    const existingIds = new Set(existingAccounts.map(a => a.id))
    const newAccounts: Account[] = []
    const defaultGroupId = config.defaultGroupId || 'default'

    for (const row of rows) {
      try {
        const account = convertToAccount(row, defaultGroupId, existingIds)
        
        if (!account) {
          result.skipped++
          continue
        }

        const key = `${account.name.toLowerCase()}-${account.username.toLowerCase()}`
        const existing = existingMap.get(key)

        if (existing) {
          // 存在冲突，根据策略处理
          switch (config.strategy) {
            case 'overwrite':
              // 覆盖：更新现有条目
              const updated: Account = {
                ...existing,
                ...account,
                id: existing.id, // 保持原有 ID
                groupId: existing.groupId, // 保持原有分组
                updatedAt: Date.now(),
              }
              const index = existingAccounts.findIndex(a => a.id === existing.id)
              if (index !== -1) {
                existingAccounts[index] = updated
              }
              result.success++
              break

            case 'skip':
              // 跳过
              result.skipped++
              break

            case 'merge':
              // 合并：更新密码，但保留其他信息
              const merged: Account = {
                ...existing,
                password: account.password,
                website: account.website || existing.website,
                remark: account.remark || existing.remark,
                updatedAt: Date.now(),
              }
              const mergeIndex = existingAccounts.findIndex(a => a.id === existing.id)
              if (mergeIndex !== -1) {
                existingAccounts[mergeIndex] = merged
              }
              result.success++
              break
          }
        } else {
          // 新条目
          newAccounts.push(account)
          result.success++
        }
      } catch (error) {
        result.failed++
        result.errors.push(`导入 "${row.name}" 失败: ${error}`)
      }
    }

    // 添加新条目
    existingAccounts.push(...newAccounts)

  } catch (error) {
    result.errors.push(`解析 CSV 失败: ${error}`)
  }

  return result
}

/**
 * 导出为 CSV
 */
export function exportToCSV(accounts: Account[], groups: Group[], options?: { includePasswords?: boolean }): string {
  const includePasswords = options?.includePasswords ?? true
  
  const rows = accounts.map(account => {
    const group = groups.find(g => g.id === account.groupId)
    return {
      name: account.name,
      url: account.website || '',
      username: account.username,
      password: includePasswords ? account.password : '********',
      note: account.remark || '',
      group: group?.name || '',
    }
  })

  return Papa.unparse(rows, {
    columns: ['name', 'url', 'username', 'password', 'note', 'group'],
  })
}

/**
 * 导出为 JSON 格式
 */
export function exportToJSON(accounts: Account[], groups: Group[], options?: { includePasswords?: boolean }): string {
  const includePasswords = options?.includePasswords ?? true
  
  const data = {
    exportDate: new Date().toISOString(),
    groups: groups.map(g => ({
      id: g.id,
      name: g.name,
      parentId: g.parentId,
      color: g.color,
    })),
    accounts: accounts.map(a => ({
      id: a.id,
      groupId: a.groupId,
      name: a.name,
      username: a.username,
      password: includePasswords ? a.password : undefined,
      website: a.website,
      remark: a.remark,
      createdAt: new Date(a.createdAt).toISOString(),
      updatedAt: new Date(a.updatedAt).toISOString(),
    })),
  }
  
  return JSON.stringify(data, null, 2)
}

/**
 * 生成导入模板
 */
export function generateImportTemplate(): string {
  const template = [
    {
      name: '示例网站',
      url: 'https://example.com',
      username: 'user@example.com',
      password: 'your_password_here',
      note: '这是一个示例备注',
    },
  ]
  
  return Papa.unparse(template)
}

/**
 * 获取导入模板下载
 */
export function downloadImportTemplate(): void {
  const template = generateImportTemplate()
  const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'password-import-template.csv'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
