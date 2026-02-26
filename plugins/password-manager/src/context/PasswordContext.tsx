import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react'
import type { Group, Account, ThemeMode, LockState, PasswordGeneratorConfig, ImportResult } from '../types'
import { encryptionService } from '../services/encryption'
import { storageService, saveToStorage, loadFromStorage, hasStoredData, clearAllData, loadMetadata, getStoredHash } from '../services/storage'
import { importFromCSV as importCSVService, exportToCSV as exportCSVService, generateImportTemplate } from '../services/importer'
import { generateId, buildGroupTree, flattenGroups, countAccountsByGroup } from '../utils/helpers'
import { DEFAULT_GROUPS } from '../utils/constants'

// 调试日志开关
const DEBUG = true
function log(...args: any[]) {
  if (DEBUG) {
    console.log('[PasswordContext]', ...args)
  }
}

function logError(...args: any[]) {
  if (DEBUG) {
    console.error('[PasswordContext ERROR]', ...args)
  }
}

// 状态类型
interface PasswordState {
  // 锁状态
  lockState: LockState
  isInitialized: boolean

  // 数据
  groups: Group[]
  accounts: Account[]

  // 视图状态
  selectedGroupId: string | null
  selectedAccountId: string | null
  searchQuery: string

  // UI 状态
  sidebarOpen: boolean
  theme: ThemeMode

  // 加密状态
  salt: string
  passwordHash: string

  // 密码生成器
  generatorOpen: boolean
  generatorConfig: PasswordGeneratorConfig

  // 导入导出
  importOpen: boolean
  exportOpen: boolean

  // 错误状态
  error: string | null

  // 分页状态 - 使用 loadedCount 实现无限滚动追加
  pagination: {
    initialPageSize: number  // 初始加载数量
    pageSize: number         // 每次追加的数量
    loadedCount: number      // 已加载显示的数量
    totalCount: number       // 总数
    filteredCount: number    // 过滤后数量
  }
}

// 动作类型
type PasswordAction =
  | { type: 'SET_LOCK_STATE'; payload: LockState }
  | { type: 'SET_INITIALIZED'; payload: boolean }
  | { type: 'SET_GROUPS'; payload: Group[] }
  | { type: 'ADD_GROUP'; payload: Group }
  | { type: 'UPDATE_GROUP'; payload: Group }
  | { type: 'DELETE_GROUP'; payload: string }
  | { type: 'SET_ACCOUNTS'; payload: Account[] }
  | { type: 'ADD_ACCOUNT'; payload: Account }
  | { type: 'UPDATE_ACCOUNT'; payload: Account }
  | { type: 'DELETE_ACCOUNT'; payload: string }
  | { type: 'MOVE_ACCOUNT'; payload: { accountId: string; newGroupId: string } }
  | { type: 'SET_SELECTED_GROUP'; payload: string | null }
  | { type: 'SET_SELECTED_ACCOUNT'; payload: string | null }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_THEME'; payload: ThemeMode }
  | { type: 'SET_SALT'; payload: string }
  | { type: 'SET_PASSWORD_HASH'; payload: string }
  | { type: 'OPEN_GENERATOR' }
  | { type: 'CLOSE_GENERATOR' }
  | { type: 'SET_GENERATOR_CONFIG'; payload: PasswordGeneratorConfig }
  | { type: 'OPEN_IMPORT' }
  | { type: 'CLOSE_IMPORT' }
  | { type: 'OPEN_EXPORT' }
  | { type: 'CLOSE_EXPORT' }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PAGINATION'; payload: { totalCount: number; filteredCount: number } }
  | { type: 'LOAD_MORE' }
  | { type: 'RESET_PAGINATION' }

// 初始状态
const initialState: PasswordState = {
  lockState: 'locked',
  isInitialized: false,
  groups: [],
  accounts: [],
  selectedGroupId: null,
  selectedAccountId: null,
  searchQuery: '',
  sidebarOpen: true,
  theme: 'light',
  salt: '',
  passwordHash: '',
  generatorOpen: false,
  generatorConfig: {
    length: 16,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
    excludeSimilar: false,
  },
  importOpen: false,
  exportOpen: false,
  error: null,
  pagination: {
    initialPageSize: 24,   // 初始加载 24 条
    pageSize: 24,          // 每次追加 24 条
    loadedCount: 24,       // 已加载数量
    totalCount: 0,
    filteredCount: 0,
  },
}

// Reducer
function passwordReducer(state: PasswordState, action: PasswordAction): PasswordState {
  switch (action.type) {
    case 'SET_LOCK_STATE':
      return { ...state, lockState: action.payload }
    case 'SET_INITIALIZED':
      return { ...state, isInitialized: action.payload }
    case 'SET_GROUPS':
      return { ...state, groups: action.payload }
    case 'ADD_GROUP':
      return { ...state, groups: [...state.groups, action.payload] }
    case 'UPDATE_GROUP':
      return {
        ...state,
        groups: state.groups.map(g => g.id === action.payload.id ? action.payload : g),
      }
    case 'DELETE_GROUP':
      return {
        ...state,
        groups: state.groups.filter(g => g.id !== action.payload),
        accounts: state.accounts.map(a =>
          a.groupId === action.payload ? { ...a, groupId: 'default' } : a
        ),
        selectedGroupId: state.selectedGroupId === action.payload ? null : state.selectedGroupId,
      }
    case 'SET_ACCOUNTS':
      return { ...state, accounts: action.payload }
    case 'ADD_ACCOUNT':
      return { ...state, accounts: [...state.accounts, action.payload] }
    case 'UPDATE_ACCOUNT':
      return {
        ...state,
        accounts: state.accounts.map(a => a.id === action.payload.id ? action.payload : a),
      }
    case 'DELETE_ACCOUNT':
      return {
        ...state,
        accounts: state.accounts.filter(a => a.id !== action.payload),
        selectedAccountId: state.selectedAccountId === action.payload ? null : state.selectedAccountId,
      }
    case 'MOVE_ACCOUNT':
      return {
        ...state,
        accounts: state.accounts.map(a =>
          a.id === action.payload.accountId
            ? { ...a, groupId: action.payload.newGroupId, updatedAt: Date.now() }
            : a
        ),
      }
    case 'SET_SELECTED_GROUP':
      return { ...state, selectedGroupId: action.payload, selectedAccountId: null }
    case 'SET_SELECTED_ACCOUNT':
      return { ...state, selectedAccountId: action.payload }
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload }
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen }
    case 'SET_THEME':
      return { ...state, theme: action.payload }
    case 'SET_SALT':
      return { ...state, salt: action.payload }
    case 'SET_PASSWORD_HASH':
      return { ...state, passwordHash: action.payload }
    case 'OPEN_GENERATOR':
      return { ...state, generatorOpen: true }
    case 'CLOSE_GENERATOR':
      return { ...state, generatorOpen: false }
    case 'SET_GENERATOR_CONFIG':
      return { ...state, generatorConfig: action.payload }
    case 'OPEN_IMPORT':
      return { ...state, importOpen: true }
    case 'CLOSE_IMPORT':
      return { ...state, importOpen: false }
    case 'OPEN_EXPORT':
      return { ...state, exportOpen: true }
    case 'CLOSE_EXPORT':
      return { ...state, exportOpen: false }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    case 'SET_PAGINATION':
      return {
        ...state,
        pagination: {
          ...state.pagination,
          totalCount: action.payload.totalCount,
          filteredCount: action.payload.filteredCount,
        },
      }
    case 'LOAD_MORE':
      return {
        ...state,
        pagination: {
          ...state.pagination,
          loadedCount: state.pagination.loadedCount + state.pagination.pageSize,
        },
      }
    case 'RESET_PAGINATION':
      return {
        ...state,
        pagination: {
          ...state.pagination,
          loadedCount: state.pagination.initialPageSize,
        },
      }
    default:
      return state
  }
}

// Context
interface PasswordContextType {
  state: PasswordState

  // 锁操作
  setupPassword: (password: string) => Promise<boolean>
  unlock: (password: string) => Promise<boolean>
  changePassword: (oldPassword: string, newPassword: string) => Promise<boolean>
  lock: () => void
  resetAllData: () => Promise<void>

  // 分组操作
  addGroup: (name: string, parentId?: string) => Promise<void>
  updateGroup: (id: string, updates: Partial<Group>) => Promise<void>
  deleteGroup: (id: string) => Promise<void>
  reorderGroups: (groups: Group[]) => Promise<void>

  // 密码操作
  addAccount: (data: Omit<Account, 'id' | 'createdAt' | 'updatedAt' | 'order'>) => Promise<void>
  updateAccount: (id: string, updates: Partial<Account>) => Promise<void>
  deleteAccount: (id: string) => Promise<void>
  moveAccount: (accountId: string, newGroupId: string) => Promise<void>

  // 视图操作
  selectGroup: (id: string | null) => void
  selectAccount: (id: string | null) => void
  setSearchQuery: (query: string) => void
  toggleSidebar: () => void
  setTheme: (theme: ThemeMode) => void

  // 生成器操作
  openGenerator: () => void
  closeGenerator: () => void
  setGeneratorConfig: (config: PasswordGeneratorConfig) => void

  // 导入导出
  openImport: () => void
  closeImport: () => void
  openExport: () => void
  closeExport: () => void
  importFromCSV: (content: string, strategy: 'overwrite' | 'skip' | 'merge') => Promise<ImportResult>
  exportToCSV: (options?: { includePasswords?: boolean }) => string

  // 工具
  getFilteredAccounts: () => Account[]
  getGroupTree: () => Group[]
  getAccountCount: (groupId: string) => number

  // 分页查询 - 无限滚动追加模式
  getPaginatedAccounts: () => Account[]
  loadMoreAccounts: () => void
  hasMoreAccounts: () => boolean

  // 持久化
  persistData: () => Promise<void>
}

const PasswordContext = createContext<PasswordContextType | null>(null)

// Provider
export function PasswordProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(passwordReducer, initialState)
  const persistDataRef = useRef<(() => Promise<void>) | null>(null)
  const initializedRef = useRef(false)

  // 初始化
  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    const init = async () => {
      log('=== INIT START ===')
      try {
        log('init: 等待存储初始化...')
        const hasData = await hasStoredData()
        log('init: hasStoredData =', hasData)

        if (hasData) {
          log('init: 有数据，设置 lockState = locked')
          dispatch({ type: 'SET_LOCK_STATE', payload: 'locked' })
        } else {
          log('init: 无数据，设置 lockState = setup')
          dispatch({ type: 'SET_LOCK_STATE', payload: 'setup' })
        }

        dispatch({ type: 'SET_INITIALIZED', payload: true })
        log('=== INIT END ===')
      } catch (error) {
        logError('init: 错误', error)
        dispatch({ type: 'SET_ERROR', payload: '初始化失败' })
      }
    }

    setTimeout(() => {
      init()
    }, 100)
  }, [])

  // 持久化函数
  const persistData = useCallback(async () => {
    log('=== persistData START ===')
    log('persistData: isUnlocked =', encryptionService.isUnlocked())
    log('persistData: groups =', state.groups.length, ', accounts =', state.accounts.length)

    if (!encryptionService.isUnlocked()) {
      log('persistData: 未解锁，跳过')
      return
    }

    try {
      await saveToStorage(
        state.groups,
        state.accounts,
        async (data: string) => {
          return await encryptionService.encrypt(data)
        },
        state.passwordHash
      )
      log('persistData: 完成')
    } catch (error) {
      logError('持久化失败:', error)
      dispatch({ type: 'SET_ERROR', payload: '保存数据失败' })
    }
    log('=== persistData END ===')
  }, [state.groups, state.accounts, state.passwordHash])

  persistDataRef.current = persistData

  // 自动持久化
  useEffect(() => {
    if (!state.isInitialized || !encryptionService.isUnlocked()) {
      log('auto-persist: 跳过')
      return
    }

    log('auto-persist: 安排 1 秒后执行')
    const timer = setTimeout(() => {
      persistData()
    }, 1000)

    return () => clearTimeout(timer)
  }, [state.groups, state.accounts, state.isInitialized, persistData])

  // 设置密码
  const setupPassword = useCallback(async (password: string): Promise<boolean> => {
    log('=== setupPassword START ===')
    try {
      const { salt, hash } = await encryptionService.initialize(password)
      log('setupPassword: 初始化加密服务完成')

      const defaultGroup: Group = {
        id: 'default',
        parentId: null,
        name: '默认分组',
        order: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      dispatch({ type: 'SET_SALT', payload: salt })
      dispatch({ type: 'SET_PASSWORD_HASH', payload: hash })
      dispatch({ type: 'SET_GROUPS', payload: [defaultGroup] })
      dispatch({ type: 'SET_ACCOUNTS', payload: [] })
      dispatch({ type: 'SET_LOCK_STATE', payload: 'unlocked' })

      await saveToStorage(
        [defaultGroup],
        [],
        async (data: string) => {
          return await encryptionService.encrypt(data)
        },
        hash
      )

      log('setupPassword: 完成')
      log('=== setupPassword END (SUCCESS) ===')
      return true
    } catch (error) {
      logError('setupPassword: 错误', error)
      dispatch({ type: 'SET_ERROR', payload: '设置密码失败' })
      log('=== setupPassword END (ERROR) ===')
      return false
    }
  }, [])

  // 解锁
  const unlock = useCallback(async (password: string): Promise<boolean> => {
    log('=== unlock START ===')
    try {
      const storedHash = await getStoredHash()
      const metadata = await loadMetadata()

      log('unlock: metadata =', metadata ? 'found' : 'null')

      if (!metadata) {
        const hasData = await hasStoredData()
        if (!hasData) {
          dispatch({ type: 'SET_LOCK_STATE', payload: 'setup' })
        }
        log('=== unlock END (NO METADATA) ===')
        return false
      }

      const isValid = await encryptionService.unlock(password, metadata.salt, storedHash || '')
      log('unlock: 验证结果 =', isValid)

      if (!isValid) {
        dispatch({ type: 'SET_ERROR', payload: '密码错误' })
        log('=== unlock END (INVALID PASSWORD) ===')
        return false
      }

      const storedData = await loadFromStorage(async (ciphertext, salt, iv) => {
        return await encryptionService.decrypt(ciphertext, salt, iv)
      })

      log('unlock: 解密结果 =', storedData ? '成功' : '失败/null')

      if (storedData) {
        dispatch({ type: 'SET_GROUPS', payload: storedData.groups })
        dispatch({ type: 'SET_ACCOUNTS', payload: storedData.accounts })
      } else {
        const defaultGroup: Group = {
          id: 'default',
          parentId: null,
          name: '默认分组',
          order: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
        dispatch({ type: 'SET_GROUPS', payload: [defaultGroup] })
        dispatch({ type: 'SET_ACCOUNTS', payload: [] })
      }

      dispatch({ type: 'SET_SALT', payload: metadata.salt })
      dispatch({ type: 'SET_PASSWORD_HASH', payload: storedHash || '' })
      dispatch({ type: 'SET_LOCK_STATE', payload: 'unlocked' })
      dispatch({ type: 'SET_ERROR', payload: null })

      log('unlock: 解锁成功')
      log('=== unlock END (SUCCESS) ===')
      return true
    } catch (error) {
      logError('unlock: 错误', error)
      dispatch({ type: 'SET_ERROR', payload: '解锁失败' })
      log('=== unlock END (ERROR) ===')
      return false
    }
  }, [])

  // 修改密码
  const changePassword = useCallback(async (
    oldPassword: string,
    newPassword: string
  ): Promise<boolean> => {
    log('=== changePassword START ===')
    try {
      const isValid = await encryptionService.unlock(oldPassword, state.salt, state.passwordHash)
      if (!isValid) {
        dispatch({ type: 'SET_ERROR', payload: '旧密码不正确' })
        log('changePassword: 旧密码错误')
        return false
      }

      const { salt, hash } = await encryptionService.changePassword(newPassword)

      dispatch({ type: 'SET_SALT', payload: salt })
      dispatch({ type: 'SET_PASSWORD_HASH', payload: hash })

      await persistData()

      log('changePassword: 完成')
      log('=== changePassword END (SUCCESS) ===')
      return true
    } catch (error) {
      logError('修改密码失败:', error)
      dispatch({ type: 'SET_ERROR', payload: '修改密码失败' })
      log('=== changePassword END (ERROR) ===')
      return false
    }
  }, [state.salt, state.passwordHash, persistData])

  // 锁定
  const lock = useCallback(() => {
    log('=== lock START ===')
    encryptionService.lock()
    dispatch({ type: 'SET_LOCK_STATE', payload: 'locked' })
    dispatch({ type: 'SET_SELECTED_ACCOUNT', payload: null })
    log('=== lock END ===')
  }, [])

  // 重置所有数据
  const resetAllData = useCallback(async () => {
    log('=== resetAllData START ===')
    try {
      await clearAllData()
      encryptionService.lock()

      dispatch({ type: 'SET_GROUPS', payload: [] })
      dispatch({ type: 'SET_ACCOUNTS', payload: [] })
      dispatch({ type: 'SET_SALT', payload: '' })
      dispatch({ type: 'SET_PASSWORD_HASH', payload: '' })
      dispatch({ type: 'SET_LOCK_STATE', payload: 'setup' })
      dispatch({ type: 'SET_ERROR', payload: null })
      log('resetAllData: 完成')
      log('=== resetAllData END ===')
    } catch (error) {
      logError('重置数据失败:', error)
      dispatch({ type: 'SET_ERROR', payload: '重置数据失败' })
    }
  }, [])

  // 添加分组
  const addGroup = useCallback(async (name: string, parentId?: string) => {
    log('addGroup:', name)
    const group: Group = {
      id: generateId(),
      parentId: parentId || null,
      name,
      order: state.groups.filter(g => g.parentId === parentId).length,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    dispatch({ type: 'ADD_GROUP', payload: group })
    await persistData()
  }, [state.groups, persistData])

  // 更新分组
  const updateGroup = useCallback(async (id: string, updates: Partial<Group>) => {
    const group = state.groups.find(g => g.id === id)
    if (!group) return

    const updated: Group = {
      ...group,
      ...updates,
      updatedAt: Date.now(),
    }

    dispatch({ type: 'UPDATE_GROUP', payload: updated })
    await persistData()
  }, [state.groups, persistData])

  // 删除分组
  const deleteGroup = useCallback(async (id: string) => {
    const hasChildren = state.groups.some(g => g.parentId === id)
    if (hasChildren) {
      dispatch({ type: 'SET_ERROR', payload: '请先删除子分组' })
      return
    }

    const hasAccounts = state.accounts.some(a => a.groupId === id)
    if (hasAccounts) {
      dispatch({ type: 'SET_ERROR', payload: '该分组下有密码，请先移动或删除' })
      return
    }

    dispatch({ type: 'DELETE_GROUP', payload: id })
    await persistData()
  }, [state.groups, state.accounts, persistData])

  // 重新排序分组
  const reorderGroups = useCallback(async (groups: Group[]) => {
    const updated = groups.map((g, index) => ({
      ...g,
      order: index,
      updatedAt: Date.now(),
    }))

    dispatch({ type: 'SET_GROUPS', payload: updated })
    await persistData()
  }, [persistData])

  // 添加密码
  const addAccount = useCallback(async (
    data: Omit<Account, 'id' | 'createdAt' | 'updatedAt' | 'order'>
  ) => {
    const groupAccounts = state.accounts.filter(a => a.groupId === data.groupId)

    const account: Account = {
      ...data,
      id: generateId(),
      order: groupAccounts.length,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    dispatch({ type: 'ADD_ACCOUNT', payload: account })
    await persistData()
  }, [state.accounts, persistData])

  // 更新密码
  const updateAccount = useCallback(async (id: string, updates: Partial<Account>) => {
    const account = state.accounts.find(a => a.id === id)
    if (!account) return

    const updated: Account = {
      ...account,
      ...updates,
      updatedAt: Date.now(),
    }

    dispatch({ type: 'UPDATE_ACCOUNT', payload: updated })
    await persistData()
  }, [state.accounts, persistData])

  // 删除密码
  const deleteAccount = useCallback(async (id: string) => {
    dispatch({ type: 'DELETE_ACCOUNT', payload: id })
    await persistData()
  }, [persistData])

  // 移动密码到其他分组
  const moveAccount = useCallback(async (accountId: string, newGroupId: string) => {
    dispatch({ type: 'MOVE_ACCOUNT', payload: { accountId, newGroupId } })
    await persistData()
  }, [persistData])

  // 选择分组
  const selectGroup = useCallback((id: string | null) => {
    dispatch({ type: 'SET_SELECTED_GROUP', payload: id })
    dispatch({ type: 'RESET_PAGINATION' })
  }, [])

  // 选择密码
  const selectAccount = useCallback((id: string | null) => {
    dispatch({ type: 'SET_SELECTED_ACCOUNT', payload: id })
  }, [])

  // 搜索
  const setSearchQuery = useCallback((query: string) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: query })
    dispatch({ type: 'RESET_PAGINATION' })
  }, [])

  // 侧边栏
  const toggleSidebar = useCallback(() => {
    dispatch({ type: 'TOGGLE_SIDEBAR' })
  }, [])

  // 主题
  const setTheme = useCallback((theme: ThemeMode) => {
    dispatch({ type: 'SET_THEME', payload: theme })
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [])

  // 生成器
  const openGenerator = useCallback(() => {
    dispatch({ type: 'OPEN_GENERATOR' })
  }, [])

  const closeGenerator = useCallback(() => {
    dispatch({ type: 'CLOSE_GENERATOR' })
  }, [])

  const setGeneratorConfig = useCallback((config: PasswordGeneratorConfig) => {
    dispatch({ type: 'SET_GENERATOR_CONFIG', payload: config })
  }, [])

  // 导入导出
  const openImport = useCallback(() => {
    dispatch({ type: 'OPEN_IMPORT' })
  }, [])

  const closeImport = useCallback(() => {
    dispatch({ type: 'CLOSE_IMPORT' })
  }, [])

  const openExport = useCallback(() => {
    dispatch({ type: 'OPEN_EXPORT' })
  }, [])

  const closeExport = useCallback(() => {
    dispatch({ type: 'CLOSE_EXPORT' })
  }, [])

  const importFromCSV = useCallback(async (
    content: string,
    strategy: 'overwrite' | 'skip' | 'merge'
  ): Promise<ImportResult> => {
    try {
      const result = await importCSVService(content, state.accounts, {
        strategy,
        defaultGroupId: state.selectedGroupId || 'default',
      })

      if (result.success > 0 || result.skipped > 0) {
        dispatch({ type: 'SET_ACCOUNTS', payload: [...state.accounts] })
        await persistData()
      }

      dispatch({ type: 'CLOSE_IMPORT' })
      return result
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: '导入失败' })
      return {
        success: 0,
        skipped: 0,
        failed: 1,
        errors: [String(error)],
      }
    }
  }, [state.accounts, state.selectedGroupId, persistData])

  const exportToCSV = useCallback((options?: { includePasswords?: boolean }): string => {
    return exportCSVService(state.accounts, state.groups, options)
  }, [state.accounts, state.groups])

  // 获取过滤后的密码列表
  const getFilteredAccounts = useCallback((): Account[] => {
    let filtered = [...state.accounts]

    // 按分组过滤
    if (state.selectedGroupId) {
      filtered = filtered.filter(a => a.groupId === state.selectedGroupId)
    }

    // 按搜索过滤
    if (state.searchQuery.trim()) {
      const query = state.searchQuery.toLowerCase()
      filtered = filtered.filter(a => {
        const group = state.groups.find(g => g.id === a.groupId)
        return (
          a.name.toLowerCase().includes(query) ||
          a.username.toLowerCase().includes(query) ||
          (a.website && a.website.toLowerCase().includes(query)) ||
          (group && group.name.toLowerCase().includes(query))
        )
      })
    }

    // 排序
    filtered.sort((a, b) => a.order - b.order)

    return filtered
  }, [state.accounts, state.selectedGroupId, state.searchQuery, state.groups])

  // 获取分组树
  const getGroupTree = useCallback((): Group[] => {
    return buildGroupTree(state.groups)
  }, [state.groups])

  // 获取分组密码数量
  const getAccountCount = useCallback((groupId: string): number => {
    return countAccountsByGroup(state.accounts, groupId)
  }, [state.accounts])

  // 获取分页后的密码列表 - 追加模式
  const getPaginatedAccounts = useCallback((): Account[] => {
    const filtered = getFilteredAccounts()
    // 返回从 0 到 loadedCount 的数据，实现追加效果
    return filtered.slice(0, state.pagination.loadedCount)
  }, [state.accounts, state.selectedGroupId, state.searchQuery, state.groups, state.pagination.loadedCount, getFilteredAccounts])

  // 加载更多密码 - 增加 loadedCount
  const loadMoreAccounts = useCallback(() => {
    dispatch({ type: 'LOAD_MORE' })
  }, [])

  // 是否有更多密码
  const hasMoreAccounts = useCallback((): boolean => {
    return state.pagination.loadedCount < state.pagination.filteredCount
  }, [state.pagination.loadedCount, state.pagination.filteredCount])

  // 更新过滤后的数量
  useEffect(() => {
    const filtered = getFilteredAccounts()
    dispatch({
      type: 'SET_PAGINATION',
      payload: {
        totalCount: state.accounts.length,
        filteredCount: filtered.length,
      },
    })
  }, [state.accounts, state.selectedGroupId, state.searchQuery, state.groups, getFilteredAccounts])

  const value: PasswordContextType = {
    state,
    setupPassword,
    unlock,
    changePassword,
    lock,
    resetAllData,
    addGroup,
    updateGroup,
    deleteGroup,
    reorderGroups,
    addAccount,
    updateAccount,
    deleteAccount,
    moveAccount,
    selectGroup,
    selectAccount,
    setSearchQuery,
    toggleSidebar,
    setTheme,
    openGenerator,
    closeGenerator,
    setGeneratorConfig,
    openImport,
    closeImport,
    openExport,
    closeExport,
    importFromCSV,
    exportToCSV,
    getFilteredAccounts,
    getGroupTree,
    getAccountCount,
    getPaginatedAccounts,
    loadMoreAccounts,
    hasMoreAccounts,
    persistData,
  }

  return (
    <PasswordContext.Provider value={value}>
      {children}
    </PasswordContext.Provider>
  )
}

export function usePasswords() {
  const context = useContext(PasswordContext)
  if (!context) {
    throw new Error('usePasswords 必须在 PasswordProvider 内使用')
  }
  return context
}
