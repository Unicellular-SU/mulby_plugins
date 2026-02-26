import type { Group, Account } from '../types'

/**
 * 生成唯一ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 格式化时间显示
 */
export function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * 截取文本并添加省略号
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

/**
 * 获取网站图标（使用 favicon 服务）
 */
export function getFaviconUrl(website: string): string {
  if (!website) return ''
  
  try {
    // 确保 URL 有协议前缀
    const urlWithProtocol = website.startsWith('http') ? website : `https://${website}`
    const url = new URL(urlWithProtocol)
    return `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=32`
  } catch {
    return ''
  }
}

/**
 * 复制文本到剪贴板
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // 降级方案
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.opacity = '0'
    document.body.appendChild(textArea)
    textArea.select()
    try {
      document.execCommand('copy')
      return true
    } catch {
      return false
    } finally {
      document.body.removeChild(textArea)
    }
  }
}

/**
 * 移除 URL 协议头
 */
export function cleanWebsiteUrl(url: string): string {
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '')
}

/**
 * 判断是否是有效的 URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * 获取分组的层级路径
 */
export function getGroupPath(
  groupId: string,
  groups: Group[]
): Group[] {
  const path: Group[] = []
  let currentId: string | null = groupId

  while (currentId) {
    const group = groups.find(g => g.id === currentId)
    if (!group) break
    path.unshift(group)
    currentId = group.parentId
  }

  return path
}

/**
 * 构建分组树
 */
export function buildGroupTree(groups: Group[]): Group[] {
  const rootGroups = groups.filter(g => !g.parentId)
  
  function addChildren(group: Group): Group {
    const children = groups
      .filter(g => g.parentId === group.id)
      .sort((a, b) => a.order - b.order)
      .map(addChildren)
    
    return { ...group, children }
  }

  return rootGroups
    .sort((a, b) => a.order - b.order)
    .map(addChildren)
}

/**
 * 扁平化分组树
 */
export function flattenGroups(groups: Group[]): Group[] {
  const result: Group[] = []
  
  function traverse(groupList: Group[]) {
    for (const group of groupList) {
      result.push(group)
      if (group.children && group.children.length > 0) {
        traverse(group.children)
      }
    }
  }
  
  traverse(groups)
  return result
}

/**
 * 按分组统计密码数量
 */
export function countAccountsByGroup(
  accounts: Account[],
  groupId: string
): number {
  return accounts.filter(a => a.groupId === groupId).length
}
