# Password Manager - Mulby Plugin

一个安全、本地存储的个人密码管理插件。

## 🔐 安全特性

- **双重加密体系**：
  - 门锁密码：使用 BCrypt 加密存储
  - 数据加密：AES-256-CBC 加密
  - 密钥派生：PBKDF2（100,000 次迭代）

- **本地存储**：所有数据存储在本地，不上传云端

- **忘记密码**：数据无法恢复，只能格式化密码本

## ✨ 功能特性

### 密码管理
- ✅ 添加/编辑/删除密码
- ✅ 密码强度分析（弱/中/强）
- ✅ 一键复制账号和密码
- ✅ 支持备注

### 分组管理
- ✅ 多级分组嵌套
- ✅ 拖拽排序
- ✅ 拖拽转移密码到其他分组
- ✅ 分组颜色标记

### 搜索功能
- ✅ 实时搜索（300ms 防抖）
- ✅ 搜索范围：分组名、帐号名、网址
- ✅ 不区分大小写

### 导入导出
- ✅ 导出为 CSV 格式
- ✅ 导入 Chrome/Edge 导出文件
- ✅ 冲突处理策略：跳过/覆盖/合并

### 密码生成器
- ✅ 自定义长度（8-64位）
- ✅ 可选字符类型：大写、小写、数字、特殊符号
- ✅ 排除相似字符
- ✅ 一键复制

### 自动填充
- ✅ 调用 Mulby API 模拟输入
- ✅ 一键填充密码框

### 主题
- ✅ 深色/浅色模式
- ✅ 响应式布局

## 🚀 快速开始

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev
```

### 构建
```bash
npm run build
```

### 打包
```bash
npm run pack
```

## 📁 项目结构

```
password-manager/
├── src/
│   ├── components/        # React 组件
│   │   ├── LockScreen.tsx      # 门锁界面
│   │   ├── Header.tsx          # 顶部栏
│   │   ├── Sidebar.tsx         # 左侧分组抽屉
│   │   ├── PasswordList.tsx    # 密码列表
│   │   ├── PasswordCard.tsx    # 密码卡片
│   │   ├── DetailPanel.tsx     # 右侧详情面板
│   │   ├── PasswordGenerator.tsx # 密码生成器
│   │   ├── ImportDialog.tsx    # 导入对话框
│   │   ├── ExportDialog.tsx    # 导出对话框
│   │   └── Toast.tsx           # 提示消息
│   ├── context/           # 状态管理
│   │   └── PasswordContext.tsx # 全局状态
│   ├── hooks/             # 自定义 Hooks
│   │   ├── useDebounce.ts      # 防抖 Hook
│   │   └── useMulby.ts       # Mulby API Hook
│   ├── services/          # 服务层
│   │   ├── encryption.ts       # 加密服务
│   │   ├── storage.ts          # 存储服务
│   │   └── importer.ts         # 导入导出服务
│   ├── types/             # 类型定义
│   │   └── index.ts
│   ├── utils/             # 工具函数
│   │   ├── crypto.ts          # 加密工具
│   │   ├── strength.ts        # 密码强度分析
│   │   ├── helpers.ts         # 辅助函数
│   │   └── constants.ts       # 常量
│   ├── main.ts            # 插件入口
│   └── ui/
│       ├── App.tsx        # 主应用组件
│       ├── index.tsx      # UI 入口
│       └── index.html     # HTML 模板
├── ui/                    # 构建输出 (Vite)
├── dist/                  # 构建输出 (后端)
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── manifest.json
```

## 📝 使用说明

### 首次使用
1. 打开插件
2. 设置门锁密码（用于保护密码库）
3. 开始添加密码

### 添加密码
1. 点击「添加密码」按钮
2. 填写网站名称、账号、密码等信息
3. 选择所属分组
4. 保存

### 导入密码
1. 点击「导入」按钮
2. 选择 CSV 文件（Chrome/Edge 导出格式）
3. 选择冲突处理策略
4. 确认导入

### 导出密码
1. 点击「导出」按钮
2. 选择导出格式（CSV/JSON）
3. 选择是否包含密码明文
4. 点击导出

## 🔧 技术栈

- **React 18** - UI 框架
- **TypeScript** - 类型安全
- **Tailwind CSS v3** - 样式
- **Vite** - 构建工具
- **@dnd-kit** - 拖拽功能
- **crypto-js** - 加密库
- **PapaParse** - CSV 解析
- **Lucide React** - 图标库

## 📄 许可证

MIT
