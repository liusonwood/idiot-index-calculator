/**
 * utils.js - Utility Functions for Idiot Index Calculator
 *
 * Contains helper functions for:
 * - Markdown export
 * - Input validation
 * - Calculation verification
 * - Text formatting
 */

// ===== Markdown Export =====

/**
 * Exports Markdown content to a downloadable file
 * @param {string} content - The Markdown content to export
 * @param {string} productName - Optional product name for filename
 */
function exportToMarkdown(content, productName = '产品分析') {
    // Clean filename: remove special characters, limit length
    const cleanName = productName
        .replace(/[^\w一-龥\s]/g, '') // Remove special chars
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .substring(0, 50); // Limit length

    const filename = `${cleanName}_白痴指数分析.md`;

    // Create blob and download link
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    setTimeout(() => URL.revokeObjectURL(url), 100);
}

// ===== Input Validation =====

/**
 * Validates API settings
 * @param {Object} settings - Settings object
 * @returns {Object} - { valid: boolean, error: string }
 */
function validateSettings(settings) {
    if (!settings.apiKey || settings.apiKey.trim() === '') {
        return { valid: false, error: '请填写 API Key' };
    }

    if (!settings.apiUrl || settings.apiUrl.trim() === '') {
        return { valid: false, error: '请填写 API 地址' };
    }

    if (!settings.apiModel || settings.apiModel.trim() === '') {
        return { valid: false, error: '请填写使用模型' };
    }

    // Validate URL format
    try {
        new URL(settings.apiUrl);
    } catch (e) {
        return { valid: false, error: 'API 地址格式不正确' };
    }

    return { valid: true, error: null };
}

/**
 * Validates user input
 * @param {string} input - User input text
 * @returns {Object} - { valid: boolean, error: string }
 */
function validateUserInput(input) {
    if (!input || input.trim() === '') {
        return { valid: false, error: '请输入产品描述' };
    }

    if (input.trim().length < 3) {
        return { valid: false, error: '产品描述太短，请提供更多信息' };
    }

    return { valid: true, error: null };
}

// ===== Calculation Verification =====

/**
 * Extracts product information from Markdown content
 * @param {string} markdown - The Markdown content
 * @returns {Object} - { sellingPrice, totalCost, idiotIndex }
 */
function extractProductInfo(markdown) {
    const result = {
        sellingPrice: null,
        totalCost: null,
        idiotIndex: null,
        productName: null
    };

    // Extract product name
    const nameMatch = markdown.match(/\*\*产品名称\*\*[：:]\s*(.+)/i);
    if (nameMatch) {
        result.productName = nameMatch[1].trim();
    }

    // Extract selling price
    const priceMatch = markdown.match(/\*\*售价\*\*[：:]\s*([0-9,\.]+)/i);
    if (priceMatch) {
        result.sellingPrice = parseFloat(priceMatch[1].replace(/,/g, ''));
    }

    // Extract total cost from table
    const totalCostMatch = markdown.match(/\*\*总计\*\*.*?\*\*([0-9,\.]+)\*\*/is);
    if (totalCostMatch) {
        result.totalCost = parseFloat(totalCostMatch[1].replace(/,/g, ''));
    }

    // Extract idiot index
    const indexMatch = markdown.match(/白痴指数\s*=.*?=\s*([0-9\.]+)/i);
    if (indexMatch) {
        result.idiotIndex = parseFloat(indexMatch[1]);
    }

    return result;
}

/**
 * Verifies the calculation accuracy
 * @param {Object} productInfo - { sellingPrice, totalCost, idiotIndex }
 * @returns {Object} - { valid: boolean, expectedIndex: number, tolerance: number }
 */
function verifyCalculation(productInfo) {
    const { sellingPrice, totalCost, idiotIndex } = productInfo;

    // Check if all values are present
    if (sellingPrice === null || totalCost === null || idiotIndex === null) {
        return {
            valid: false,
            error: '无法提取完整数据进行验证',
            expectedIndex: null
        };
    }

    // Check for division by zero
    if (totalCost === 0) {
        return {
            valid: false,
            error: '总成本为零，计算无效',
            expectedIndex: null
        };
    }

    // Calculate expected index
    const expectedIndex = sellingPrice / totalCost;

    // Calculate tolerance (5% or 0.1, whichever is larger)
    const tolerance = Math.max(0.1, expectedIndex * 0.05);

    // Check if within tolerance
    const diff = Math.abs(expectedIndex - idiotIndex);
    const valid = diff <= tolerance;

    return {
        valid,
        expectedIndex: expectedIndex.toFixed(2),
        statedIndex: idiotIndex.toFixed(2),
        difference: diff.toFixed(2),
        tolerance: tolerance.toFixed(2)
    };
}

/**
 * Generates a warning message for calculation discrepancies
 * @param {Object} verification - Result from verifyCalculation
 * @returns {string} - Warning message in Markdown
 */
function generateCalculationWarning(verification) {
    if (verification.valid) {
        return '';
    }

    if (!verification.expectedIndex) {
        return `> ⚠️ **验证提示**：${verification.error}`;
    }

    return `> ⚠️ **计算验证警告**
>
> 预期白痴指数：**${verification.expectedIndex}**
> 显示白痴指数：**${verification.statedIndex}**
> 差异：**${verification.difference}**（容差：${verification.tolerance}）
>
> 请核实计算过程。`;
}

// ===== Output Validation =====

/**
 * Validates that all required sections are present in the output
 * @param {string} markdown - The Markdown content
 * @returns {Object} - { valid: boolean, missingSections: string[] }
 */
function validateOutputStructure(markdown) {
    const requiredSections = [
        { name: '产品名称', pattern: /产品名称/i },
        { name: '售价', pattern: /售价/i },
        { name: '产品简介', pattern: /产品简介|简介/i },
        { name: '成本分析', pattern: /成本分析|成本明细/i },
        { name: '成本表格', pattern: /\|.*部件.*\|.*材料.*\|/i },
        { name: '白痴指数计算', pattern: /白痴指数计算|白痴指数/i },
        { name: '评价与反思', pattern: /评价|反思/i }
    ];

    const missingSections = [];

    for (const section of requiredSections) {
        if (!section.pattern.test(markdown)) {
            missingSections.push(section.name);
        }
    }

    return {
        valid: missingSections.length === 0,
        missingSections
    };
}

/**
 * Generates a warning message for missing sections
 * @param {Array} missingSections - List of missing section names
 * @returns {string} - Warning message
 */
function generateStructureWarning(missingSections) {
    if (missingSections.length === 0) {
        return '';
    }

    return `> ⚠️ **格式警告**：以下章节可能缺失：${missingSections.join('、')}。建议重新生成。`;
}

// ===== Text Formatting =====

/**
 * Formats a number with thousands separator
 * @param {number} num - Number to format
 * @returns {string} - Formatted number
 */
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Truncates text to a specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated text
 */
function truncateText(text, maxLength = 100) {
    if (text.length <= maxLength) {
        return text;
    }
    return text.substring(0, maxLength) + '...';
}

/**
 * Extracts a summary from Markdown content
 * @param {string} markdown - Markdown content
 * @returns {string} - Brief summary
 */
function extractSummary(markdown) {
    const info = extractProductInfo(markdown);

    if (info.productName && info.idiotIndex) {
        return `${info.productName} - 白痴指数: ${info.idiotIndex}`;
    }

    if (info.productName) {
        return info.productName;
    }

    // Fallback: first line
    const firstLine = markdown.split('\n')[0];
    return truncateText(firstLine, 50);
}

// ===== Error Handling =====

/**
 * Formats an error message for display
 * @param {string} errorType - Type of error
 * @param {string} message - Error message
 * @returns {string} - Formatted error message in Markdown
 */
function formatErrorMessage(errorType, message) {
    const errorIcons = {
        'network': '🌐',
        'api': '🔌',
        'validation': '⚠️',
        'unknown': '❌'
    };

    const icon = errorIcons[errorType] || '❌';

    return `> ${icon} **错误**：${message}`;
}

// ===== Export =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        exportToMarkdown,
        validateSettings,
        validateUserInput,
        extractProductInfo,
        verifyCalculation,
        generateCalculationWarning,
        validateOutputStructure,
        generateStructureWarning,
        formatNumber,
        truncateText,
        extractSummary,
        formatErrorMessage
    };
}
