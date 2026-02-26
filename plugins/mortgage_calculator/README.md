# 房贷计算器 Mulby 插件

一个功能强大的房贷计算器插件，支持商业贷款、公积金贷款和组合贷款计算。

## 功能特性

### 核心功能
- **三种贷款类型**：商业贷款、公积金贷款、组合贷款
- **还款方式**：等额本息、等额本金
- **输入参数**：贷款金额、年利率、贷款期限

### 高级功能
- **提前还款计算器**：支持部分提前还款和一次性还清
- **利率对比**：多家银行利率对比
- **贷款能力评估**：根据收入计算可贷金额
- **还款计划表**：详细的月度还款计划
- **图表可视化**：还款进度、利息构成等图表

### 设计特点
- **iOS 26 玻璃态设计**：采用最新的neumorphic玻璃效果
- **响应式布局**：适配不同屏幕尺寸
- **深色/浅色模式**：自动跟随系统主题
- **数据导出**：支持导出为Excel/PDF格式

## 安装与使用

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev
```

### 构建插件
```bash
npm run build
```

### 部署到Mulby
1. 构建插件：`npm run build`
2. 将生成的`ui`文件夹和`manifest.json`、`icon.png`打包
3. 上传到Mulby插件商店

## 项目结构

```
├── src/
│   ├── main.ts              # 插件后端入口
│   ├── types/               # TypeScript类型定义
│   ├── ui/                  # 前端界面
│   │   ├── App.tsx          # 主组件
│   │   ├── main.tsx         # 前端入口
│   │   ├── index.html       # HTML模板
│   │   ├── styles.css       # 样式文件
│   │   └── hooks/           # React Hooks
│   └── utils/               # 工具函数
│       └── calculator.ts    # 计算器核心逻辑
├── manifest.json            # 插件配置
├── package.json             # 项目依赖
├── vite.config.ts           # 构建配置
└── README.md                # 说明文档
```

## 技术栈

- **前端**：React 18 + TypeScript
- **构建工具**：Vite
- **图表库**：Recharts
- **样式**：CSS3 + 自定义玻璃态效果
- **后端**：Node.js HTTP Server

## 计算器算法

### 等额本息
每月还款额 = [贷款本金 × 月利率 × (1+月利率)^还款月数] ÷ [(1+月利率)^还款月数-1]

### 等额本金
每月还款额 = (贷款本金 ÷ 还款月数) + (本金 - 已归还本金累计额) × 月利率

### 提前还款计算
支持多种提前还款方式：
1. 部分提前还款（减少月供）
2. 部分提前还款（缩短期限）
3. 一次性还清

## 配置说明

### manifest.json
```json
{
  "id": "mortgage-calculator",
  "name": "房贷计算器",
  "version": "1.0.0",
  "description": "专业的房贷计算工具",
  "author": "Your Name",
  "icon": "icon.png",
  "entry": "main.ts",
  "permissions": ["storage", "clipboard"]
}
```

## 开发指南

### 添加新的贷款类型
1. 在`src/types/index.ts`中定义新的贷款类型
2. 在`src/utils/calculator.ts`中添加对应的计算函数
3. 在`src/ui/App.tsx`中添加UI组件

### 自定义主题
修改`src/ui/styles.css`中的CSS变量：
```css
:root {
  --primary-color: #007AFF;
  --glass-bg: rgba(255, 255, 255, 0.1);
  --shadow-color: rgba(0, 0, 0, 0.1);
}
```

## 性能优化

- **代码分割**：按需加载图表组件
- **缓存策略**：计算结果本地存储
- **防抖处理**：输入框实时计算优化
- **虚拟滚动**：大量数据表格优化

## 测试

```bash
# 运行单元测试
npm test

# 运行E2E测试
npm run test:e2e
```

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 许可证

MIT License

## 支持与反馈

如有问题或建议，请提交Issue或联系开发者。

---

**注意**：本计算器提供的结果仅供参考，实际贷款条件以银行最终审批为准。