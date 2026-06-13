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

    return { valid: true, error: null };
}

// ===== Calculation Verification =====

/**
 * Extracts product information from Markdown content
 * @param {string} markdown - The Markdown content
 * @returns {Object} - { retailPrice, bomCost, rawMaterialValue, consumerIndex, manufacturingIndex, productName }
 */
function extractProductInfo(markdown) {
    const result = {
        retailPrice: null,
        bomCost: null,
        rawMaterialValue: null,
        consumerIndex: null,
        manufacturingIndex: null,
        productName: null
    };

    // Extract product name
    const nameMatch = markdown.match(/\*\*产品名称\*\*[：:]\s*(.+)/i);
    if (nameMatch) {
        result.productName = nameMatch[1].trim();
    }

    // Extract retail price
    const retailMatch = markdown.match(/\*\*官方零售价\*\*[：:]\s*[\$￥]?([0-9,\.]+)/i);
    if (retailMatch) {
        result.retailPrice = parseFloat(retailMatch[1].replace(/,/g, ''));
    }

    // Extract BOM cost
    const bomMatch = markdown.match(/\*\*硬件物料成本.*?\*\*[：:]\s*[\$￥]?([0-9,\.]+)/i);
    if (bomMatch) {
        result.bomCost = parseFloat(bomMatch[1].replace(/,/g, ''));
    }

    // Extract raw material value from table
    const rawValueMatch = markdown.match(/\*\*合计\*\*.*?\*\*约\s*[\$￥]?([0-9,\.]+)\*\*/is);
    if (rawValueMatch) {
        result.rawMaterialValue = parseFloat(rawValueMatch[1].replace(/,/g, ''));
    }

    // Extract consumer idiot index
    const consumerIndexMatch = markdown.match(/消费者白痴指数.*?=.*?=.*?([0-9\.]+)/is);
    if (consumerIndexMatch) {
        result.consumerIndex = parseFloat(consumerIndexMatch[1]);
    }

    // Extract manufacturing idiot index
    const mfgIndexMatch = markdown.match(/制造白痴指数.*?=.*?=.*?([0-9\.]+)/is);
    if (mfgIndexMatch) {
        result.manufacturingIndex = parseFloat(mfgIndexMatch[1]);
    }

    return result;
}

/**
 * Verifies the calculation accuracy for both Consumer and Manufacturing indices
 * @param {Object} productInfo - { retailPrice, bomCost, rawMaterialValue, consumerIndex, manufacturingIndex }
 * @returns {Object} - Verification results for both indices
 */
function verifyCalculation(productInfo) {
    const { retailPrice, bomCost, rawMaterialValue, consumerIndex, manufacturingIndex } = productInfo;

    const warnings = [];

    // Check if all values are present
    if (rawMaterialValue === null) {
        return {
            valid: false,
            error: '无法提取原材料价值数据进行验证',
            consumerVerification: null,
            manufacturingVerification: null
        };
    }

    // Check for division by zero
    if (rawMaterialValue === 0) {
        return {
            valid: false,
            error: '原材料价值为零，计算无效',
            consumerVerification: null,
            manufacturingVerification: null
        };
    }

    // Verify Consumer Idiot Index
    let consumerVerification = null;
    if (retailPrice !== null && consumerIndex !== null) {
        const expectedConsumerIndex = retailPrice / rawMaterialValue;
        const tolerance = Math.max(0.5, expectedConsumerIndex * 0.05);
        const diff = Math.abs(expectedConsumerIndex - consumerIndex);
        const valid = diff <= tolerance;

        consumerVerification = {
            valid,
            expectedIndex: expectedConsumerIndex.toFixed(1),
            statedIndex: consumerIndex.toFixed(1),
            difference: diff.toFixed(1),
            tolerance: tolerance.toFixed(1)
        };

        if (!valid) {
            warnings.push('消费者白痴指数计算可能有误');
        }
    }

    // Verify Manufacturing Idiot Index
    let manufacturingVerification = null;
    if (bomCost !== null && manufacturingIndex !== null) {
        const expectedMfgIndex = bomCost / rawMaterialValue;
        const tolerance = Math.max(0.5, expectedMfgIndex * 0.05);
        const diff = Math.abs(expectedMfgIndex - manufacturingIndex);
        const valid = diff <= tolerance;

        manufacturingVerification = {
            valid,
            expectedIndex: expectedMfgIndex.toFixed(1),
            statedIndex: manufacturingIndex.toFixed(1),
            difference: diff.toFixed(1),
            tolerance: tolerance.toFixed(1)
        };

        if (!valid) {
            warnings.push('制造白痴指数计算可能有误');
        }
    }

    return {
        valid: warnings.length === 0,
        warnings,
        consumerVerification,
        manufacturingVerification
    };
}

/**
 * Generates warning messages for calculation discrepancies
 * @param {Object} verification - Result from verifyCalculation
 * @returns {string} - Warning message in Markdown
 */
function generateCalculationWarning(verification) {
    if (verification.valid) {
        return '';
    }

    if (!verification.consumerVerification && !verification.manufacturingVerification) {
        return `> ⚠️ **验证提示**：${verification.error}`;
    }

    let warningText = '> ⚠️ **计算验证警告**\n>\n';

    // Consumer Index Warning
    if (verification.consumerVerification && !verification.consumerVerification.valid) {
        warningText += `> **消费者白痴指数**：\n`;
        warningText += `> - 预期值：**${verification.consumerVerification.expectedIndex}**\n`;
        warningText += `> - 显示值：**${verification.consumerVerification.statedIndex}**\n`;
        warningText += `> - 差异：${verification.consumerVerification.difference}（容差：${verification.consumerVerification.tolerance}）\n>\n`;
    }

    // Manufacturing Index Warning
    if (verification.manufacturingVerification && !verification.manufacturingVerification.valid) {
        warningText += `> **制造白痴指数**：\n`;
        warningText += `> - 预期值：**${verification.manufacturingVerification.expectedIndex}**\n`;
        warningText += `> - 显示值：**${verification.manufacturingVerification.statedIndex}**\n`;
        warningText += `> - 差异：${verification.manufacturingVerification.difference}（容差：${verification.manufacturingVerification.tolerance}）\n>\n`;
    }

    warningText += '> 请核实计算过程。';

    return warningText;
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

    if (info.productName && info.consumerIndex) {
        let summary = `${info.productName}`;
        if (info.consumerIndex) {
            summary += ` - 消费者指数: ${info.consumerIndex}`;
        }
        if (info.manufacturingIndex) {
            summary += ` | 制造指数: ${info.manufacturingIndex}`;
        }
        return summary;
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
