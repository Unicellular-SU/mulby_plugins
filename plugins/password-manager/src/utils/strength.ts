import type { PasswordAnalysis, PasswordStrength } from '../types'
import { UI_CONFIG } from './constants'

/**
 * 分析密码强度
 */
export function analyzePassword(password: string): PasswordAnalysis {
  const length = password.length
  const hasLowercase = /[a-z]/.test(password)
  const hasUppercase = /[A-Z]/.test(password)
  const hasNumbers = /[0-9]/.test(password)
  const hasSymbols = /[^a-zA-Z0-9]/.test(password)

  // 计算分数 (0-100)
  let score = 0

  // 长度基础分
  if (length >= 8) score += 20
  if (length >= 12) score += 10
  if (length >= 16) score += 10
  if (length >= 20) score += 10

  // 字符类型加分
  if (hasLowercase) score += 10
  if (hasUppercase) score += 15
  if (hasNumbers) score += 15
  if (hasSymbols) score += 20

  // 额外加分（密码越长加分越多）
  if (length > 24) score += 5
  if (length > 32) score += 5

  // 限制分数范围
  score = Math.min(100, Math.max(0, score))

  // 确定强度等级
  let strength: PasswordStrength
  if (score < UI_CONFIG.STRENGTH_THRESHOLDS.weak) {
    strength = 'weak'
  } else if (score < UI_CONFIG.STRENGTH_THRESHOLDS.medium) {
    strength = 'medium'
  } else {
    strength = 'strong'
  }

  return {
    score,
    strength,
    hasLowercase,
    hasUppercase,
    hasNumbers,
    hasSymbols,
    length,
  }
}

/**
 * 获取强度等级对应的颜色
 */
export function getStrengthColor(strength: PasswordStrength): string {
  switch (strength) {
    case 'weak':
      return 'text-red-500'
    case 'medium':
      return 'text-yellow-500'
    case 'strong':
      return 'text-green-500'
  }
}

/**
 * 获取强度等级对应的背景色
 */
export function getStrengthBgColor(strength: PasswordStrength): string {
  switch (strength) {
    case 'weak':
      return 'bg-red-500'
    case 'medium':
      return 'bg-yellow-500'
    case 'strong':
      return 'bg-green-500'
  }
}

/**
 * 获取强度描述文本
 */
export function getStrengthLabel(strength: PasswordStrength): string {
  switch (strength) {
    case 'weak':
      return '弱'
    case 'medium':
      return '中'
    case 'strong':
      return '强'
  }
}

/**
 * 生成密码强度进度条样式
 */
export function getStrengthBarStyle(analysis: PasswordAnalysis): string {
  const { score, strength } = analysis
  const width = `${score}%`
  const color = getStrengthBgColor(strength)

  return `transition-all duration-300 ${color}`
}
