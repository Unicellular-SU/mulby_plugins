import { useState, useCallback, useMemo } from 'react'
import {
  Folder,
  FolderOpen,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  ChevronRight,
  GripVertical,
} from 'lucide-react'
import { usePasswords } from '../context/PasswordContext'
import type { Group } from '../types'

interface SidebarProps {
  dropTargetId: string | null
  onDragOver: (groupId: string | null) => void
  onDrop: (accountId: string, targetGroupId: string) => void
}

export default function Sidebar({ dropTargetId, onDragOver, onDrop }: SidebarProps) {
  const {
    state,
    selectGroup,
    addGroup,
    updateGroup,
    deleteGroup,
    reorderGroups,
    getAccountCount,
  } = usePasswords()

  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [isAddingGroup, setIsAddingGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupParentId, setNewGroupParentId] = useState<string | null>(null)

  // 构建分组树
  const groupTree = useMemo(() => {
    const rootGroups = state.groups.filter(g => !g.parentId)
    
    const buildChildren = (parentId: string | null): Group[] => {
      return state.groups
        .filter(g => g.parentId === parentId)
        .sort((a, b) => a.order - b.order)
        .map(group => ({
          ...group,
          children: buildChildren(group.id)
        }))
    }

    return rootGroups
      .sort((a, b) => a.order - b.order)
      .map(group => ({
        ...group,
        children: buildChildren(group.id)
      }))
  }, [state.groups])

  // 展开状态
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  const toggleExpand = (groupId: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId)
    } else {
      newExpanded.add(groupId)
    }
    setExpandedGroups(newExpanded)
  }

  const handleAddGroup = useCallback(async () => {
    if (!newGroupName.trim()) return

    await addGroup(newGroupName.trim(), newGroupParentId || undefined)
    setNewGroupName('')
    setNewGroupParentId(null)
    setIsAddingGroup(false)
  }, [newGroupName, newGroupParentId, addGroup])

  const startEdit = (group: Group) => {
    setEditingGroupId(group.id)
    setEditingName(group.name)
    setMenuOpenId(null)
  }

  const saveEdit = async (groupId: string) => {
    if (editingName.trim()) {
      await updateGroup(groupId, { name: editingName.trim() })
    }
    setEditingGroupId(null)
    setEditingName('')
  }

  const handleDelete = async (groupId: string) => {
    if (window.confirm('确定要删除这个分组吗？分组下的密码将被移到"默认分组"')) {
      await deleteGroup(groupId)
    }
    setMenuOpenId(null)
  }

  const handleDragOver = (e: React.DragEvent, groupId: string) => {
    e.preventDefault()
    e.stopPropagation()
    onDragOver(groupId)
  }

  const handleDragLeave = () => {
    onDragOver(null)
  }

  const handleDrop = (e: React.DragEvent, groupId: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    const accountId = e.dataTransfer.getData('accountId')
    if (accountId) {
      onDrop(accountId, groupId)
    }
    onDragOver(null)
  }

  // 渲染分组项
  const renderGroupItem = (group: Group, depth: number = 0) => {
    const isSelected = state.selectedGroupId === group.id
    const isDropTarget = dropTargetId === group.id
    const hasChildren = group.children && group.children.length > 0
    const isExpanded = expandedGroups.has(group.id)
    const accountCount = getAccountCount(group.id)

    return (
      <div key={group.id} className="select-none">
        <div
          className={`
            group flex items-center gap-1 px-3 py-2 rounded-lg cursor-pointer transition-colors
            ${isSelected
              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
            }
            ${isDropTarget ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/30' : ''}
          `}
          style={{ paddingLeft: `${depth * 16 + 12}px` }}
          onClick={() => selectGroup(group.id)}
          onDragOver={(e) => handleDragOver(e, group.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, group.id)}
        >
          {/* 拖拽手柄 */}
          <div className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100">
            <GripVertical size={14} className="text-gray-400" />
          </div>

          {/* 展开/收起按钮 */}
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleExpand(group.id)
              }}
              className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-transform"
            >
              <ChevronRight
                size={16}
                className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              />
            </button>
          ) : (
            <span className="w-6" />
          )}

          {/* 图标 */}
          <span className="shrink-0">
            {isExpanded ? <FolderOpen size={18} /> : <Folder size={18} />}
          </span>

          {/* 名称 */}
          {editingGroupId === group.id ? (
            <input
              type="text"
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onBlur={() => saveEdit(group.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveEdit(group.id)
                if (e.key === 'Escape') {
                  setEditingGroupId(null)
                  setEditingName('')
                }
              }}
              className="flex-1 px-2 py-1 text-sm bg-white dark:bg-gray-600 border border-blue-500 rounded outline-none"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="flex-1 truncate text-sm font-medium">
              {group.name}
            </span>
          )}

          {/* 数量 */}
          <span className="text-xs text-gray-400 shrink-0">
            {accountCount}
          </span>

          {/* 操作菜单 */}
          <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setMenuOpenId(menuOpenId === group.id ? null : group.id)
              }}
              className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
            >
              <MoreVertical size={14} />
            </button>

            {menuOpenId === group.id && (
              <div
                className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-20 py-1"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => startEdit(group)}
                  className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  <Edit size={14} />
                  重命名
                </button>
                <button
                  onClick={() => {
                    setNewGroupParentId(group.id)
                    setIsAddingGroup(true)
                  }}
                  className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  <Plus size={14} />
                  添加子分组
                </button>
                {group.id !== 'default' && (
                  <button
                    onClick={() => handleDelete(group.id)}
                    className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 text-red-500 hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    <Trash2 size={14} />
                    删除
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 子分组 */}
        {hasChildren && isExpanded && (
          <div className="mt-0.5">
            {group.children!.map(child => renderGroupItem(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="sidebar-inner">
      {/* 标题 */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 shrink-0 bg-gray-50 dark:bg-gray-800">
        <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          分组
        </h2>
      </div>

      {/* 分组列表 - 可滚动 */}
      <div className="flex-1 overflow-y-auto p-2 scroll-smooth">
        {/* 全部 */}
        <div
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer mb-1 transition-colors
            ${!state.selectedGroupId
              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
            }
          `}
          onClick={() => selectGroup(null)}
        >
          <Folder size={18} />
          <span className="flex-1 text-sm font-medium">全部</span>
          <span className="text-xs text-gray-400">{state.accounts.length}</span>
        </div>

        {/* 分组树 */}
        {groupTree.map(group => renderGroupItem(group))}

        {/* 新建分组 */}
        {isAddingGroup ? (
          <div
            className="flex items-center gap-1 px-2 py-1.5 mt-2"
            style={{ paddingLeft: `${(newGroupParentId ? 1 : 0) * 16 + 12}px` }}
          >
            <span className="w-6" />
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="分组名称"
              className="flex-1 px-2 py-1.5 text-sm bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded outline-none"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddGroup()
                if (e.key === 'Escape') {
                  setIsAddingGroup(false)
                  setNewGroupName('')
                }
              }}
            />
            <button
              onClick={handleAddGroup}
              className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              确定
            </button>
            <button
              onClick={() => {
                setIsAddingGroup(false)
                setNewGroupName('')
                setNewGroupParentId(null)
              }}
              className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700"
            >
              取消
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              setIsAddingGroup(true)
              setNewGroupParentId(null)
            }}
            className="w-full flex items-center gap-2 px-3 py-2 mt-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Plus size={18} />
            新建分组
          </button>
        )}
      </div>
    </div>
  )
}
