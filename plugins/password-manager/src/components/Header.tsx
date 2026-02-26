import { useState, useCallback } from 'react'
import {
  Search,
  Moon,
  Sun,
  RefreshCw,
  Download,
  Upload,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { usePasswords } from '../context/PasswordContext'
import { useDebounce } from '../hooks/useDebounce'

interface HeaderProps {
  onAddAccount?: () => void
}

export default function Header({ onAddAccount }: HeaderProps) {
  const {
    state,
    setSearchQuery,
    toggleSidebar,
    setTheme,
    openGenerator,
    openImport,
    openExport,
    selectGroup,
    getGroupTree,
  } = usePasswords()

  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebounce(searchInput, 300)

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value)
    setSearchQuery(e.target.value)
  }, [setSearchQuery])

  const handleSelectAll = useCallback(() => {
    selectGroup(null)
  }, [selectGroup])

  const handleAddAccount = useCallback(() => {
    if (state.groups.length === 0) {
      return
    }
    onAddAccount?.()
  }, [state.groups.length, onAddAccount])

  const groupTree = getGroupTree()

  return (
    <header className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0">
      {/* 左侧：侧边栏开关 + 标题 */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={toggleSidebar}
          className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="切换侧边栏"
        >
          <ChevronLeft
            size={20}
            className={`transition-transform ${state.sidebarOpen ? '' : 'rotate-180'}`}
          />
        </button>
        <h1 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white whitespace-nowrap">
          密码保险箱
        </h1>
      </div>

      {/* 搜索框 */}
      <div className="flex-1 max-w-xs sm:max-w-md order-last sm:order-none">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={searchInput}
            onChange={handleSearchChange}
            placeholder="搜索密码..."
            className="w-full pl-9 pr-3 py-1.5 sm:py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* 右侧：操作按钮 */}
      <div className="flex items-center gap-1 flex-wrap shrink-0">
        {/* 主题切换 */}
        <button
          onClick={() => setTheme(state.theme === 'dark' ? 'light' : 'dark')}
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title={state.theme === 'dark' ? '浅色模式' : '深色模式'}
        >
          {state.theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* 全部 */}
        <button
          onClick={handleSelectAll}
          className="hidden md:inline-flex items-center gap-1 px-2 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <RefreshCw size={16} />
          <span>全部</span>
        </button>

        {/* 分组快捷选择 */}
        {groupTree.slice(0, 2).map((group) => (
          <button
            key={group.id}
            onClick={() => selectGroup(group.id)}
            className={`hidden lg:inline-flex items-center gap-1.5 px-2 py-1.5 text-sm rounded-lg transition-colors ${
              state.selectedGroupId === group.id
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: group.color || '#6366f1' }} />
            <span className="truncate max-w-[60px]">{group.name}</span>
          </button>
        ))}

        {/* 分隔线 */}
        <div className="w-px h-6 bg-gray-200 dark:bg-gray-600 mx-0.5 hidden sm:block" />

        {/* 导入 */}
        <button
          onClick={openImport}
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="导入密码"
        >
          <Upload size={18} />
        </button>

        {/* 导出 */}
        <button
          onClick={openExport}
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="导出密码"
        >
          <Download size={18} />
        </button>

        {/* 生成密码 */}
        <button
          onClick={openGenerator}
          className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <RefreshCw size={16} />
          <span>生成</span>
        </button>

        {/* 新增密码 */}
        <button
          onClick={handleAddAccount}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          <span>新增密码</span>
        </button>
      </div>
    </header>
  )
}
