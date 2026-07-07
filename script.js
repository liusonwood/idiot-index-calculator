/**
 * script.js - Main Application Logic for Idiot Index Calculator
 *
 * Coordinates UI interactions, API calls, and data flow
 */

// ===== Global State =====
let conversationHistory = [];
let currentMarkdownContent = '';
let isCalculating = false;

const DEFAULT_SETTINGS = {
  apiKey: '',
  apiUrl: 'https://openrouter.ai/api/v1',
  apiModel: 'anthropic/claude-3.5-sonnet'
};

const LS_KEYS = {
  apiKey: 'openrouter_api_key',
  apiUrl: 'openrouter_api_url',
  apiModel: 'openrouter_model'
};

// ===== Initialization =====
document.addEventListener('DOMContentLoaded', () => {
  restoreSettings();
  initTooltips();
  setupEventListeners();
  configureMarkdown();
});

// ===== Settings Management =====
function readSetting(key, fallback) {
  return localStorage.getItem(key) ?? fallback;
}

function writeSettings(settings) {
  localStorage.setItem(LS_KEYS.apiKey, settings.apiKey);
  localStorage.setItem(LS_KEYS.apiUrl, settings.apiUrl);
  localStorage.setItem(LS_KEYS.apiModel, settings.apiModel);
}

function readAllSettings() {
  return {
    apiKey: readSetting(LS_KEYS.apiKey, DEFAULT_SETTINGS.apiKey),
    apiUrl: readSetting(LS_KEYS.apiUrl, DEFAULT_SETTINGS.apiUrl),
    apiModel: readSetting(LS_KEYS.apiModel, DEFAULT_SETTINGS.apiModel)
  };
}

function restoreSettings() {
  const settings = readAllSettings();
  document.getElementById('apiKey').value = settings.apiKey;
  document.getElementById('apiUrl').value = settings.apiUrl;
  document.getElementById('apiModel').value = settings.apiModel;
}

function collectSettingsFromForm() {
  return {
    apiKey: document.getElementById('apiKey').value.trim(),
    apiUrl: document.getElementById('apiUrl').value.trim(),
    apiModel: document.getElementById('apiModel').value.trim()
  };
}

function saveSettings() {
  const settings = collectSettingsFromForm();
  const validation = validateSettings(settings);
  if (!validation.valid) {
    alert('设置错误：' + validation.error);
    return;
  }
  writeSettings(settings);
  bootstrap.Modal.getInstance(document.getElementById('settingsModal'))?.hide();
  showToast('设置已保存', 'success');
}

// ===== Event Listeners =====
function setupEventListeners() {
  document.getElementById('settingsBtn').addEventListener('click', () => {
    const modal = new bootstrap.Modal(document.getElementById('settingsModal'));
    modal.show();
  });
  document.getElementById('saveSettingsBtn').addEventListener('click', saveSettings);
  document.getElementById('exportBtn').addEventListener('click', handleExport);
  document.getElementById('startBtn').addEventListener('click', handleStart);
  document.getElementById('sendChatBtn').addEventListener('click', handleChat);
  document.getElementById('chatInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleChat();
    }
  });
}

/**
 * Initializes Bootstrap tooltips
 */
function initTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function(tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl, {
            html: true,
            sanitize: false
        });
    });
}

/**
 * Configures Marked.js options
 */
function configureMarkdown() {
    marked.setOptions({
        gfm: true, // GitHub Flavored Markdown
        breaks: true, // Convert \n to <br>
        tables: true, // Enable table support
        smartLists: true,
        smartypants: false
    });
}

// ===== Main Calculation Flow =====

/**
 * Handles the Start button click
 */
async function handleStart() {
    // Prevent duplicate requests
    if (isCalculating) {
        showToast('正在分析中，请稍候...', 'warning');
        return;
    }

    // Get user input
    const userInput = document.getElementById('productInput').value.trim();
    const inputValidation = validateUserInput(userInput);

    if (!inputValidation.valid) {
        showToast(inputValidation.error, 'error');
        return;
    }

    // Get settings
    const settings = getSettings();
    const settingsValidation = validateSettings(settings);

    if (!settingsValidation.valid) {
        showToast('请先配置 API 设置：' + settingsValidation.error, 'error');
        const modal = new bootstrap.Modal(document.getElementById('settingsModal'));
        modal.show();
        return;
    }

    // Start calculation
    isCalculating = true;
    showLoading(true);
    hideResults();
    showChatSection(false); // Hide chat section when starting new calculation

    // Prepare messages
    conversationHistory = [
        {
            role: 'system',
            content: SYSTEM_PROMPT
        },
        {
            role: 'user',
            content: generateUserPrompt(userInput)
        }
    ];

    try {
        // Call API
        await sendMessage(
            settings,
            conversationHistory,
            // onChunk callback
            (chunk, fullResponse) => {
                currentMarkdownContent = fullResponse;
                renderResults(fullResponse);
            },
            // onComplete callback
            (fullResponse) => {
                // Add assistant response to history
                conversationHistory.push({
                    role: 'assistant',
                    content: fullResponse
                });

                // Verify output
                verifyAndWarnOutput(fullResponse);

                // Enable chat
                showChatSection(true);
                showLoading(false);
                isCalculating = false;

                showToast('分析完成', 'success');
            },
            // onError callback
            (error) => {
                console.error('API Error:', error);
                showErrorMessage(error);
                showLoading(false);
                isCalculating = false;
                showToast('分析失败：' + error, 'error');
            }
        );

    } catch (error) {
        console.error('Unexpected error:', error);
        showErrorMessage('发生未知错误：' + error.message);
        showLoading(false);
        isCalculating = false;
    }
}

/**
 * Handles chat continuation
 */
async function handleChat() {
    // Prevent duplicate requests
    if (isCalculating) {
        showToast('正在处理中，请稍候...', 'warning');
        return;
    }

    // Get chat input
    const chatInput = document.getElementById('chatInput');
    const chatMessage = chatInput.value.trim();

    if (!chatMessage) {
        showToast('请输入问题', 'warning');
        return;
    }

    // Get settings
    const settings = getSettings();
    const settingsValidation = validateSettings(settings);

    if (!settingsValidation.valid) {
        showToast('API 设置无效', 'error');
        return;
    }

    // Start processing
    isCalculating = true;
    showLoading(true);
    chatInput.value = ''; // Clear input

    // Add user message to history
    conversationHistory.push({
        role: 'user',
        content: generateChatPrompt(chatMessage)
    });

    try {
        // Call API
        await sendMessage(
            settings,
            conversationHistory,
            // onChunk callback
            (chunk, fullResponse) => {
                // Append to existing content
                const updatedContent = currentMarkdownContent + '\n\n---\n\n## 💬 后续问答\n\n' + fullResponse;
                renderResults(updatedContent);
            },
            // onComplete callback
            (fullResponse) => {
                // Add assistant response to history
                conversationHistory.push({
                    role: 'assistant',
                    content: fullResponse
                });

                // Update stored content
                currentMarkdownContent += '\n\n---\n\n## 💬 后续问答\n\n' + fullResponse;

                showLoading(false);
                isCalculating = false;
            },
            // onError callback
            (error) => {
                console.error('Chat Error:', error);
                showErrorMessage('聊天失败：' + error);
                showLoading(false);
                isCalculating = false;
            }
        );

    } catch (error) {
        console.error('Unexpected error:', error);
        showErrorMessage('发生未知错误：' + error.message);
        showLoading(false);
        isCalculating = false;
    }
}

// ===== Export =====

/**
 * Handles export button click
 */
function handleExport() {
    if (!currentMarkdownContent) {
        showToast('没有可导出的内容，请先进行分析', 'warning');
        return;
    }

    // Extract product name for filename
    const info = extractProductInfo(currentMarkdownContent);
    const productName = info.productName || '产品分析';

    // Export
    try {
        exportToMarkdown(currentMarkdownContent, productName);
        showToast('导出成功', 'success');
    } catch (error) {
        console.error('Export error:', error);
        showToast('导出失败：' + error.message, 'error');
    }
}

// ===== UI Manipulation =====

/**
 * Shows/hides loading indicator
 * @param {boolean} show - Whether to show loading
 */
function showLoading(show) {
    const indicator = document.getElementById('loadingIndicator');
    const startBtn = document.getElementById('startBtn');
    const sendChatBtn = document.getElementById('sendChatBtn');

    if (show) {
        indicator.style.display = 'block';
        startBtn.disabled = true;
        sendChatBtn.disabled = true;
    } else {
        indicator.style.display = 'none';
        startBtn.disabled = false;
        sendChatBtn.disabled = false;
    }
}

/**
 * Renders Markdown results
 * @param {string} markdown - Markdown content to render
 */
function renderResults(markdown) {
    const resultsCard = document.getElementById('resultsCard');
    const resultsContent = document.getElementById('resultsContent');

    // Render Markdown to HTML
    const html = marked.parse(markdown);

    // Update display
    resultsContent.innerHTML = html;
    resultsCard.style.display = 'block';
    resultsCard.classList.add('show');

    // Auto-scroll to bottom of content during streaming
    // Calculate scroll position to show the latest content
    const windowHeight = window.innerHeight;
    const cardRect = resultsCard.getBoundingClientRect();
    const cardBottom = cardRect.bottom;

    // If the bottom of the card is below the viewport, scroll to it
    if (cardBottom > windowHeight) {
        resultsCard.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
}

/**
 * Hides results section
 */
function hideResults() {
    const resultsCard = document.getElementById('resultsCard');
    resultsCard.style.display = 'none';
    resultsCard.classList.remove('show');
}

/**
 * Shows/hides chat section
 * @param {boolean} show - Whether to show chat
 */
function showChatSection(show) {
    const chatCard = document.getElementById('chatCard');

    if (show) {
        chatCard.style.display = 'block';
        chatCard.classList.add('show');
    } else {
        chatCard.style.display = 'none';
        chatCard.classList.remove('show');
    }
}

/**
 * Shows error message in results area
 * @param {string} message - Error message
 */
function showErrorMessage(message) {
    const errorHtml = marked.parse(formatErrorMessage('unknown', message));
    const resultsCard = document.getElementById('resultsCard');
    const resultsContent = document.getElementById('resultsContent');

    resultsContent.innerHTML = errorHtml;
    resultsCard.style.display = 'block';
    resultsCard.classList.add('show');
}

/**
 * Verifies output and shows warnings if needed
 * @param {string} markdown - Markdown content to verify
 */
function verifyAndWarnOutput(markdown) {
    const warnings = [];

    // Check structure
    const structureValidation = validateOutputStructure(markdown);
    if (!structureValidation.valid) {
        warnings.push(generateStructureWarning(structureValidation.missingSections));
    }

    // Check calculation
    const productInfo = extractProductInfo(markdown);
    const calculationVerification = verifyCalculation(productInfo);
    if (!calculationVerification.valid && calculationVerification.expectedIndex) {
        warnings.push(generateCalculationWarning(calculationVerification));
    }

    // Display warnings if any
    if (warnings.length > 0) {
        const warningHtml = warnings.map(w => marked.parse(w)).join('');
        const resultsContent = document.getElementById('resultsContent');
        resultsContent.innerHTML += '<div class="mt-3">' + warningHtml + '</div>';
    }
}

/**
 * Shows a toast notification
 * @param {string} message - Message to display
 * @param {string} type - Toast type (success, error, warning)
 */
function showToast(message, type = 'info') {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        toastContainer.style.zIndex = '1050';
        document.body.appendChild(toastContainer);
    }

    // Create toast
    const toastId = 'toast-' + Date.now();
    const bgClass = {
        success: 'bg-success',
        error: 'bg-danger',
        warning: 'bg-warning',
        info: 'bg-info'
    }[type] || 'bg-info';

    const toastHtml = `
        <div id="${toastId}" class="toast align-items-center text-white ${bgClass} border-0" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;

    toastContainer.insertAdjacentHTML('beforeend', toastHtml);

    // Show toast
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, {
        autohide: true,
        delay: 3000
    });
    toast.show();

    // Remove from DOM after hidden
    toastElement.addEventListener('hidden.bs.toast', function() {
        toastElement.remove();
    });
}
