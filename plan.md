# Implementation Plan: Idiot Index Calculator

## Project Overview

Build a web-based "白痴指数计算器" (Idiot Index Calculator) that allows users to analyze products using Elon Musk's First Principles thinking approach. The tool will use OpenRouter API to access LLM models for generating detailed cost breakdowns and calculating the Idiot Index.

## Architecture

**Frontend-only approach**: HTML5 + CSS3 + JavaScript (vanilla JS with Bootstrap 5)
- No backend server required
- Direct API calls to OpenRouter from the browser
- Local storage for user settings (API key, endpoint, model)

## File Structure

```
idiot-index-calculator/
├── index.html              # Main HTML structure
├── style.css               # Custom styling and layout
├── script.js               # Main application logic
├── api.js                  # OpenRouter API integration
├── utils.js                # Utility functions (export, validation, etc.)
├── prompts.js              # LLM prompt templates
├── README.md               # Setup instructions and usage guide
├── promote.txt             # Original design document (already exists)
└── Gemini.md               # Project documentation (already exists)
```

### File Responsibilities

1. **index.html** - Main structure
   - Header with title, Export button, Settings button
   - Settings modal (API configuration)
   - Main input area with Start button and (I) info icon
   - Results display area (Markdown rendered to HTML)
   - Chat input area for follow-up questions

2. **style.css** - Styling
   - Bootstrap customization
   - Layout and spacing
   - Loading states and animations
   - Responsive design adjustments

3. **script.js** - Main logic
   - UI event handlers
   - Settings management (localStorage)
   - Markdown rendering (using Marked.js)
   - Export functionality
   - Chat conversation management

4. **api.js** - API integration
   - OpenRouter API client
   - Request/response handling
   - Error handling and retry logic
   - Streaming response support

5. **utils.js** - Utilities
   - Markdown export to file
   - Input validation
   - Text formatting helpers
   - Cost calculation verification

6. **prompts.js** - LLM prompts
   - System prompt template (Idiot Index explanation, First Principles)
   - User prompt templates
   - Format requirements and examples
   - Output structure enforcement

## Implementation Approach

### Phase 1: Core Structure (Day 1-2)

**1.1 HTML Setup**
- Create semantic HTML5 structure
- Include Bootstrap 5 CDN (CSS + JS bundle)
- Include Marked.js CDN for Markdown rendering
- Build settings modal with form fields:
  - API Key (password input)
  - API URL (default: https://openrouter.ai/api/v1)
  - Model selection (dropdown or text input)
- Build main input section with:
  - Textarea with placeholder "描述你想要计算的任何东西"
  - Start button
  - Info icon (i) with hover tooltip showing examples
- Build results display area (div for rendered Markdown)
- Build chat input section (disabled initially, enabled after first calculation)

**1.2 Basic Styling**
- Apply Bootstrap theme
- Custom CSS for spacing, typography
- Loading spinner styles
- Responsive adjustments for mobile

**1.3 Settings Management**
- Save/load settings from localStorage
- Keys: `openrouter_api_key`, `openrouter_api_url`, `openrouter_model`
- Default values for API URL
- Validation: API key not empty before saving

### Phase 2: API Integration (Day 2-3)

**2.1 OpenRouter API Client (api.js)**
- Function: `sendMessage(apiConfig, messages, onChunk)`
  - Parameters:
    - `apiConfig`: { apiKey, apiUrl, model }
    - `messages`: Array of { role, content }
    - `onChunk`: Callback for streaming response
  - Uses fetch API with streaming support
  - Handles Server-Sent Events (SSE) format
  - Returns: Promise that resolves when stream completes
- Error handling:
  - Network errors
  - API authentication errors
  - Rate limiting
  - Invalid responses

**2.2 Prompt Engineering (prompts.js)**
- System prompt structure:
  ```
  1. 角色定位：你是埃隆·马斯克的白痴指数分析专家
  2. 概念解释：
     - 白痴指数 (Idiot Index) = 产品售价 / 原材料成本
     - 第一性原理思维：从基本物理和经济学原理出发分析
  3. 项目目的：帮助用户评估产品定价合理性
  4. 输出格式要求（严格Markdown格式）：
     - 产品名称
     - 售价
     - 简介
     - 成本分析（表格形式）
     - 白痴指数计算（公式 + 代入 + 结果）
     - 后续评价（包括马斯克视角）
  5. 质量要求：
     - 使用真实市场数据
     - 计算必须准确
     - 表格格式规范
  ```

- User prompt template:
  ```
  请分析以下产品：
  {user_input}

  请按照指定的Markdown格式输出完整分析。
  ```

**2.3 Streaming Response Handling**
- Parse SSE format: `data: {...}`
- Extract content from `choices[0].delta.content`
- Accumulate response text
- Update UI in real-time (optional: show streaming effect)
- Handle `[DONE]` signal

### Phase 3: Core Functionality (Day 3-4)

**3.1 Main Calculation Flow (script.js)**
- Start button click handler:
  1. Validate settings (API key exists)
  2. Get user input
  3. Disable input, show loading state
  4. Build message array with system prompt + user input
  5. Call API with streaming
  6. Accumulate response
  7. Render Markdown to HTML (using Marked.js)
  8. Display in results area
  9. Enable chat input
  10. Re-enable main input

**3.2 Markdown Rendering**
- Use Marked.js library
- Configure options:
  - `gfm: true` (GitHub Flavored Markdown)
  - `breaks: true` (line breaks)
  - `tables: true` (table support)
- Sanitize output to prevent XSS (optional: use DOMPurify)

**3.3 Chat Continuation**
- After initial calculation, enable chat input
- Maintain conversation history (messages array)
- Send follow-up questions with full context
- Append new responses to results area
- Clear chat button (optional)

**3.4 Export Functionality (utils.js)**
- Export button click handler:
  1. Get accumulated Markdown text
  2. Create Blob with Markdown content
  3. Generate download link
  4. Trigger download with filename: `{product_name}_白痴指数分析.md`
  5. Clean up blob URL

**3.5 Info Tooltip**
- (I) icon with Bootstrap tooltip
- Hover content:
  ```
  示例输入：
  
  精准版：
  iPhone 16 Pro 256GB：8999元
  
  模糊版：
  典型相机
  ```

### Phase 4: Quality Assurance (Day 4-5)

**4.1 Solving Challenge #1: LLM Output Quality**

**Problem**: Ensuring high-quality, format-compliant output

**Solutions**:
1. **Strict System Prompt**:
   - Explicitly define every section with examples
   - Use numbered lists and clear structure
   - Include "必须" (must) requirements
   - Provide exact Markdown template

2. **Output Validation** (utils.js):
   - Parse rendered HTML to verify structure
   - Check for required sections:
     - 产品名称
     - 售价
     - 成本 (table present)
     - 白痴指数计算
     - 后续评价
   - If validation fails, show warning but still display content
   - Optional: Retry button to regenerate

3. **Prompt Refinement**:
   - Include few-shot examples in system prompt
   - Show expected table format explicitly
   - Emphasize calculation accuracy

4. **Model Selection Guidance**:
   - Recommend models in README:
     - Best: claude-3.5-sonnet, gpt-4-turbo
     - Good: claude-3-opus, gpt-4
   - Warn against smaller models for complex calculations

**4.2 Solving Challenge #2: Accurate Cost Data**

**Problem**: Getting accurate material costs and selling prices

**Solutions**:
1. **Prompt Engineering**:
   - Instruct LLM to use latest knowledge cutoff data
   - Ask for data sources when possible
   - Request range estimates for volatile materials
   - Include disclaimer: "成本数据基于公开市场信息，实际价格可能因时间、地区、供应商而异"

2. **User Input Enhancement**:
   - Encourage users to provide specific prices
   - Support structured input: "iPhone 16 Pro 256GB：8999元"
   - Parse user-provided prices and inject into prompt

3. **Transparency**:
   - Display LLM's data confidence level (if mentioned)
   - Show calculation breakdown clearly
   - Allow users to edit costs manually (future enhancement)

4. **Continuous Improvement**:
   - Document known limitations in README
   - Suggest users verify critical data
   - Collect feedback for prompt improvements

**4.3 Solving Challenge #3: Calculation Accuracy**

**Problem**: Ensuring Idiot Index calculation is correct

**Solutions**:
1. **Explicit Formula in Prompt**:
   ```
   白痴指数计算公式：
   Idiot Index = 产品售价 / 原材料总成本

   示例：
   如果iPhone售价 = 8999元，原材料成本 = 3000元
   则：Idiot Index = 8999 / 3000 = 3.0

   请严格按照此公式计算，先写公式，再代入数值，最后得出结果。
   ```

2. **Client-side Verification** (utils.js):
   - Parse the LLM output to extract:
     - Stated selling price
     - Calculated total cost
     - Stated Idiot Index
   - Recalculate: `expected_index = selling_price / total_cost`
   - Compare with stated index (allow 5% tolerance for rounding)
   - If mismatch > 5%, show warning:
     ```
     ⚠️ 计算可能存在问题：
     预期白痴指数：X.XX
     显示白痴指数：Y.YY
     请核实计算过程。
     ```

3. **Clear Calculation Display**:
   - Force LLM to show step-by-step calculation
   - Format: `Idiot Index = 售价 / 成本 = 数值 / 数值 = 结果`
   - Makes errors visible to users

4. **Table Structure Enforcement**:
   - Require cost breakdown table with columns:
     | 部件 | 材料 | 重量 | 市场原料价格 | 价格 |
   - Sum row must be clearly marked
   - Client-side: Parse table, sum prices, verify total

**4.4 Additional Quality Measures**

1. **Error Handling**:
   - Network errors: Show retry button
   - API errors: Display error message clearly
   - Invalid responses: Fallback to raw text display

2. **Loading States**:
   - Show spinner during API calls
   - Display "正在分析..." message
   - Disable buttons to prevent duplicate requests

3. **Responsive Design**:
   - Test on mobile, tablet, desktop
   - Adjust layout for small screens
   - Ensure touch-friendly buttons

4. **Accessibility**:
   - Semantic HTML
   - ARIA labels for interactive elements
   - Keyboard navigation support
   - Sufficient color contrast

## Step-by-Step Implementation Plan

### Day 1: Foundation
1. ✅ Create `index.html` with complete structure
2. ✅ Create `style.css` with basic styling
3. ✅ Add Bootstrap 5 and Marked.js CDN links
4. ✅ Build settings modal and input forms
5. ✅ Implement localStorage for settings

### Day 2: API Integration
1. ✅ Create `api.js` with OpenRouter client
2. ✅ Implement streaming response handling
3. ✅ Create `prompts.js` with system prompt
4. ✅ Test API connection with sample requests
5. ✅ Handle errors and edge cases

### Day 3: Core Features
1. ✅ Create `script.js` with main logic
2. ✅ Implement Start button handler
3. ✅ Add Markdown rendering
4. ✅ Implement export functionality
5. ✅ Add info tooltip with examples

### Day 4: Advanced Features
1. ✅ Implement chat continuation
2. ✅ Add calculation verification (utils.js)
3. ✅ Add output validation
4. ✅ Improve error messages
5. ✅ Add loading states

### Day 5: Polish & Testing
1. ✅ Responsive design testing
2. ✅ Cross-browser testing (Chrome, Firefox, Safari, Edge)
3. ✅ Test with different LLM models
4. ✅ Write README.md with setup instructions
5. ✅ Final UI/UX refinements

## Testing Strategy

### Manual Testing Checklist
- [ ] Settings save/load correctly
- [ ] API key validation works
- [ ] Calculation with precise input (e.g., "iPhone 16 Pro 256GB：8999元")
- [ ] Calculation with fuzzy input (e.g., "典型相机")
- [ ] Streaming response displays correctly
- [ ] Markdown renders properly (tables, lists, code blocks)
- [ ] Export downloads correct .md file
- [ ] Chat continuation maintains context
- [ ] Calculation verification catches errors
- [ ] Error messages are clear and helpful
- [ ] Mobile responsive layout works
- [ ] Loading states display correctly

### Test Cases
1. **Happy Path**:
   - Enter valid API settings
   - Input: "iPhone 16 Pro 256GB：8999元"
   - Verify: All sections present, table formatted, calculation correct

2. **Fuzzy Input**:
   - Input: "典型相机"
   - Verify: LLM provides reasonable estimates, format still correct

3. **Error Scenarios**:
   - Invalid API key → Clear error message
   - Network timeout → Retry option
   - Malformed response → Graceful fallback

4. **Edge Cases**:
   - Very long product descriptions
   - Special characters in input
   - Rapid button clicks (debouncing)
   - Empty settings

## Deployment

### Local Development
```bash
# Option 1: Python HTTP server
python3 -m http.server 8000

# Option 2: Node.js http-server
npx http-server -p 8000

# Option 3: VS Code Live Server extension
# Right-click index.html → "Open with Live Server"
```

### Production Deployment
1. **GitHub Pages**:
   - Push to GitHub repository
   - Enable GitHub Pages in settings
   - Access via `https://username.github.io/repo-name`

2. **Netlify/Vercel**:
   - Connect GitHub repository
   - Auto-deploy on push
   - Custom domain support

3. **Static Hosting**:
   - Upload files to any static host (S3, CloudFront, etc.)
   - No server-side processing required

## Future Enhancements (Optional)

1. **Manual Cost Editing**:
   - Allow users to adjust costs in the table
   - Recalculate Idiot Index in real-time

2. **Comparison Mode**:
   - Compare multiple products side-by-side
   - Show relative Idiot Index values

3. **History**:
   - Save past analyses to localStorage
   - Browse and re-run previous calculations

4. **Share Functionality**:
   - Generate shareable URL with encoded results
   - Export to PDF (in addition to Markdown)

5. **Dark Mode**:
   - Theme toggle (light/dark)
   - Respect system preference

6. **Multi-language Support**:
   - English/Chinese toggle
   - Localize prompts and UI

7. **Backend Proxy** (optional):
   - Simple Go/Node.js server to proxy API calls
   - Hide API key from client-side
   - Add caching layer

## Success Criteria

✅ User can configure OpenRouter API settings
✅ User can input product description (precise or fuzzy)
✅ LLM generates complete, formatted analysis
✅ All required sections present (name, price, intro, cost table, calculation, evaluation)
✅ Markdown renders correctly with tables
✅ Idiot Index calculation is accurate (verified)
✅ Export to Markdown file works
✅ Chat continuation maintains context
✅ Responsive design works on mobile
✅ Error handling is clear and helpful

## Next Steps

1. Start with Phase 1 (Core Structure)
2. Test each phase before moving to next
3. Focus on prompt engineering for quality output
4. Iterate on prompts based on test results
5. Document learnings in README.md
