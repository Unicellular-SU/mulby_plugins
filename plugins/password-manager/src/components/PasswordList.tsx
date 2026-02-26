import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import {
  Search,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { usePasswords } from '../context/PasswordContext'
import type { Account } from '../types'

interface PasswordListProps {
  onAddAccount: () => void
}

// 安全获取域名
function getDomainFromUrl(url: string): string {
  try {
    const urlWithProtocol = url.startsWith('http') ? url : `https://${url}`
    return new URL(urlWithProtocol).hostname
  } catch {
    return ''
  }
}

// 安全格式化网站显示
function formatWebsiteDisplay(url: string): string {
  try {
    const urlWithProtocol = url.startsWith('http') ? url : `https://${url}`
    return new URL(urlWithProtocol).hostname
  } catch {
    return url
  }
}

// 打开系统浏览器
function openInSystemBrowser(url: string) {
  const fullUrl = url.startsWith('http') ? url : `https://${url}`
  window.mulby?.shell?.openExternal?.(fullUrl)
}

// 密码卡片组件
function PasswordCard({
  account,
  isSelected,
  onClick,
  onDelete,
}: {
  account: Account
  isSelected: boolean
  onClick: () => void
  onDelete: (e: React.MouseEvent) => void
}) {
  const domain = account.website ? getDomainFromUrl(account.website) : ''
  const websiteDisplay = account.website ? formatWebsiteDisplay(account.website) : ''

  const strength = account.password.length < 8 ? '弱' :
                   account.password.length < 12 ? '中' : '强'
  const strengthColor = account.password.length < 8 ? 'text-red-500 bg-red-500' :
                        account.password.length < 12 ? 'text-yellow-500 bg-yellow-500' :
                        'text-green-500 bg-green-500'
  const strengthWidth = Math.min(100, (account.password.length / 16) * 100)

  // 处理网站点击
  const handleWebsiteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (account.website) {
      openInSystemBrowser(account.website)
    }
  }

  return (
    <div
      onClick={onClick}
      className={`
        group relative bg-white dark:bg-gray-800 rounded-xl border-2 transition-all cursor-pointer hover:shadow-lg
        ${isSelected
          ? 'border-blue-500 shadow-lg'
          : 'border-transparent hover:border-gray-200 dark:hover:border-gray-600'
        }
      `}
    >
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div 
            className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0 overflow-hidden cursor-pointer"
            onClick={handleWebsiteClick}
          >
            {domain ? (
              <img
                src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
                alt=""
                className="w-6 h-6"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                }}
                loading="lazy"
              />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 dark:text-white truncate">
              {account.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {account.username}
            </p>
          </div>

          <button
            onClick={onDelete}
            className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-all"
            title="删除"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>

        {account.website && (
          <button
            onClick={handleWebsiteClick}
            className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 mb-3 truncate"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="2" y1="12" x2="22" y2="12"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
            {websiteDisplay}
          </button>
        )}

        <div className="flex items-center gap-2 mb-2">
          <span className={`text-xs font-medium ${strengthColor.split(' ')[0]}`}>
            {strength}
          </span>
          <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${strengthColor.split(' ')[1]}`}
              style={{ width: `${strengthWidth}%` }}
            />
          </div>
        </div>

        <p className="text-xs text-gray-400">
          更新于 {new Date(account.updatedAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  )
}

export default function PasswordList({ onAddAccount }: PasswordListProps) {
  const {
    state,
    selectAccount,
    deleteAccount,
    getPaginatedAccounts,
    loadMoreAccounts,
    hasMoreAccounts,
  } = usePasswords()

  const currentGroupName = state.selectedGroupId
    ? state.groups.find(g => g.id === state.selectedGroupId)?.name
    : '全部'

  const isSearching = state.searchQuery.trim().length > 0
  const displayCount = state.pagination.filteredCount
  const paginatedAccounts = getPaginatedAccounts()

  // 加载状态管理
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadingLockRef = useRef(false)

  // 计算是否还能加载更多
  const canLoadMore = useMemo(() => {
    return hasMoreAccounts()
  }, [hasMoreAccounts])

  // 加载更多函数
  const handleLoadMore = useCallback(() => {
    if (loadingLockRef.current || !canLoadMore) return

    loadingLockRef.current = true
    setIsLoadingMore(true)

    setTimeout(() => {
      loadMoreAccounts()
      setTimeout(() => {
        setIsLoadingMore(false)
        loadingLockRef.current = false
      }, 100)
    }, 300)
  }, [canLoadMore, loadMoreAccounts])

  // 设置 Intersection Observer
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect()
      observerRef.current = null
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting && canLoadMore && !loadingLockRef.current) {
          handleLoadMore()
        }
      },
      {
        root: null,
        rootMargin: '100px',
        threshold: 0,
      }
    )

    observerRef.current = observer

    const element = loadMoreRef.current
    if (element) {
      observer.observe(element)
    }

    return () => {
      if (element) {
        observer.unobserve(element)
      }
      observer.disconnect()
    }
  }, [canLoadMore, handleLoadMore])

  // 当切换分组/搜索时，重置加载状态
  useEffect(() => {
    setIsLoadingMore(false)
    loadingLockRef.current = false
  }, [state.selectedGroupId, state.searchQuery])

  // 删除密码
  const handleDelete = useCallback((account: Account, e: React.MouseEvent) => {
    e.stopPropagation()
    if (window.confirm(`确定要删除 "${account.name}" 吗？`)) {
      deleteAccount(account.id)
    }
  }, [deleteAccount])

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* 头部 - 固定 */}
      <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shrink-0">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isSearching ? '搜索结果' : currentGroupName}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {isSearching
              ? `找到 ${displayCount} 条相关记录`
              : `共 ${displayCount} 个密码`
            }
          </p>
        </div>
      </div>

      {/* 空状态 */}
      {displayCount === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 shrink-0">
          {isSearching ? (
            <>
              <Search size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                未找到匹配的结果
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm">
                尝试使用其他关键词搜索，或清除搜索条件查看所有密码
              </p>
            </>
          ) : state.selectedGroupId ? (
            <>
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
                <AlertCircle size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                该分组还没有密码
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm mb-4">
                点击右上角「新增密码」按钮添加您的第一个密码
              </p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
                <AlertCircle size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                还没有任何密码
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm mb-4">
                点击右上角「新增密码」按钮添加您的第一个密码
              </p>
            </>
          )}
        </div>
      ) : (
        // 密码列表 - 独立滚动
        <div className="flex-1 overflow-y-auto p-4 scroll-smooth">
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {paginatedAccounts.map(account => (
              <PasswordCard
                key={account.id}
                account={account}
                isSelected={state.selectedAccountId === account.id}
                onClick={() => selectAccount(account.id)}
                onDelete={(e) => handleDelete(account, e)}
              />
            ))}
          </div>

          {/* 加载更多触发器 */}
          {canLoadMore && (
            <div
              ref={loadMoreRef}
              className="flex items-center justify-center py-4 mt-2"
            >
              {isLoadingMore ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <Loader2 size={20} className="animate-spin" />
                  <span className="text-sm">加载中...</span>
                </div>
              ) : (
                <div className="h-8" />
              )}
            </div>
          )}

          {/* 底部提示 */}
          {!canLoadMore && paginatedAccounts.length > 0 && (
            <p className="text-center text-sm text-gray-400 py-2">
              已显示全部 {displayCount} 个密码
            </p>
          )}
        </div>
      )}
    </div>
  )
}
