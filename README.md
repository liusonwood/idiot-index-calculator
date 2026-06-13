# 白痴指数计算器 (Idiot Index Calculator)

一个基于第一性原理思维的产品成本分析工具，灵感来自埃隆·马斯克的"白痴指数"概念。

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 📖 简介

**白痴指数（Idiot Index）** = 产品售价 ÷ 原材料总成本

这个工具帮助你：
- 🧮 计算产品的白痴指数
- 💰 分析产品成本构成
- 🎯 评估定价合理性
- 💡 发现成本优化空间
- 🚀 培养第一性原理思维

## ✨ 功能特性

- **智能分析**：使用 AI 大语言模型进行深度成本分析
- **流式响应**：实时显示分析结果，无需等待
- **格式规范**：严格按照指定格式输出，包含完整的成本表格
- **计算验证**：自动验证白痴指数计算的准确性
- **导出功能**：一键导出 Markdown 格式的分析报告
- **聊天续接**：支持后续提问，深入探讨产品细节
- **本地存储**：API 设置保存在浏览器本地，安全可靠
- **响应式设计**：完美适配桌面和移动设备

## 🚀 快速开始

### 1. 获取 OpenRouter API Key

1. 访问 [OpenRouter](https://openrouter.ai/)
2. 注册账号
3. 在 [API Keys](https://openrouter.ai/keys) 页面创建 API Key

### 2. 运行应用

#### 方法一：使用 Python（推荐）

```bash
# 在项目目录下启动 HTTP 服务器
python3 -m http.server 8000
```

然后在浏览器访问：`http://localhost:8000`

#### 方法二：使用 Node.js

```bash
# 安装 http-server（如果还没有）
npm install -g http-server

# 启动服务器
http-server -p 8000
```

然后在浏览器访问：`http://localhost:8000`

#### 方法三：使用 VS Code

1. 安装 [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) 扩展
2. 右键点击 `index.html`
3. 选择 "Open with Live Server"

#### 方法四：直接打开

直接双击 `index.html` 文件在浏览器中打开（注意：某些浏览器可能会限制跨域请求）

### 3. 配置 API 设置

1. 点击右上角的 **设置** 按钮
2. 填写以下信息：
   - **API Key**：你的 OpenRouter API Key
   - **API 地址**：`https://openrouter.ai/api/v1`（默认）
   - **使用模型**：推荐以下模型
     - `anthropic/claude-3.5-sonnet`（推荐，性价比高）
     - `anthropic/claude-3-opus`（最强，但较贵）
     - `openai/gpt-4-turbo`（OpenAI 最强模型）
     - `openai/gpt-4`（稳定可靠）
3. 点击 **保存设置**

### 4. 开始分析

#### 精准输入示例

```
iPhone 16 Pro 256GB：8999元
```

#### 模糊输入示例

```
典型数码相机
特斯拉 Model 3
MacBook Pro M3
```

点击 **开始** 按钮，等待 AI 生成分析报告。

### 5. 继续聊天（可选）

分析完成后，可以在下方的聊天框继续提问：
- "显示器的成本能否再详细分析？"
- "如果采用国产屏幕，成本会如何变化？"
- "马斯克会如何看待这个产品？"

### 6. 导出报告

点击右上角的 **导出** 按钮，下载 Markdown 格式的分析报告。

## 📁 项目结构

```
idiot-index-calculator/
├── index.html          # 主页面结构
├── style.css           # 样式和布局
├── script.js           # 主逻辑和 UI 交互
├── api.js              # OpenRouter API 集成
├── utils.js            # 工具函数（导出、验证等）
├── prompts.js          # LLM 提示词模板
├── README.md           # 项目文档
├── promote.txt         # 原始设计文档
└── Gemini.md           # 项目说明
```

## 🎯 使用说明

### 输入格式

**精准版**（推荐）：
```
产品名称 规格：价格
例如：iPhone 16 Pro 256GB：8999元
```

**模糊版**：
```
产品类型
例如：典型相机、笔记本电脑、电动汽车
```

### 输出格式

AI 会生成以下结构化的分析报告：

1. **产品名称**：产品完整名称
2. **售价**：市场售价
3. **产品简介**：产品功能和定位
4. **成本分析**：
   - 成本明细表（部件、材料、重量、原料价格、价格）
   - 成本分析说明
5. **白痴指数计算**：
   - 计算公式
   - 代入数据
   - 计算结果
6. **评价与反思**：
   - 白痴指数解读
   - 成本优化建议
   - 马斯克视角分析
   - 免责声明

## 🔧 技术栈

- **前端框架**：纯 HTML5 + CSS3 + JavaScript
- **UI 库**：Bootstrap 5.3.0
- **Markdown 渲染**：Marked.js 11.1.0
- **API**：OpenRouter API
- **存储**：localStorage（本地设置）

## ⚠️ 注意事项

1. **数据准确性**：
   - 成本数据基于 AI 的知识库，可能存在偏差
   - 原材料价格会随时间波动
   - 建议核实关键数据后再做决策

2. **API 费用**：
   - OpenRouter API 按使用量收费
   - 不同模型价格不同
   - 建议在 OpenRouter 官网查看最新价格

3. **计算验证**：
   - 系统会自动验证白痴指数计算
   - 如果显示警告，请检查计算过程
   - 容差范围为 5% 或 0.1（取较大值）

4. **隐私安全**：
   - API Key 仅保存在浏览器本地
   - 不会上传到任何服务器
   - 建议定期更换 API Key

## 🐛 常见问题

### Q: 为什么分析结果格式不对？

A: 尝试以下方法：
1. 使用更强大的模型（如 claude-3.5-sonnet 或 gpt-4-turbo）
2. 在输入中提供更详细的产品信息
3. 重新点击"开始"按钮重新生成

### Q: 计算验证显示警告怎么办？

A: 可能的原因：
1. AI 计算错误（罕见但可能发生）
2. 成本表格中的总计与各项之和不一致
3. 白痴指数计算有误

建议：检查成本表格和计算过程，必要时手动验证。

### Q: 如何更改模型？

A: 点击设置按钮，在"使用模型"字段输入新的模型名称，然后保存。

### Q: 支持中文输入吗？

A: 完全支持！建议使用中文输入产品描述，AI 会生成中文分析报告。

### Q: 可以离线使用吗？

A: 不可以，需要联网调用 OpenRouter API。


## 📄 许可证

MIT License

## 👤 作者

**liusonwood**

## 🙏 致谢

- 灵感来源：Elon Musk 的第一性原理思维
- API 服务：[OpenRouter](https://openrouter.ai/)
- UI 框架：[Bootstrap](https://getbootstrap.com/)
- Markdown 解析：[Marked.js](https://marked.js.org/)

## 📮 反馈与支持

如果你有任何问题、建议或发现 bug，欢迎提交 Issue 或 PR。

---

**免责声明**：本工具仅供学习和参考，不构成任何商业决策建议。分析结果可能存在偏差，请自行核实关键数据。
