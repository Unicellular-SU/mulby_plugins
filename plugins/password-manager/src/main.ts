// 插件主入口文件
// 这里是 Mulby 插件的后端逻辑
// 负责处理插件命令和数据同步

export function onLoad() {
  console.log('[Password Manager] 插件后端已加载')
}

export function onUnload() {
  console.log('[Password Manager] 插件后端已卸载')
}

export default { onLoad, onUnload }
