/**
 * api.js - OpenRouter API Integration
 *
 * Handles communication with OpenRouter API, including:
 * - Streaming response support
 * - Error handling
 * - Request/response formatting
 */

/**
 * Sends a message to the OpenRouter API with streaming support
 * @param {Object} config - API configuration
 * @param {string} config.apiKey - OpenRouter API key
 * @param {string} config.apiUrl - API base URL
 * @param {string} config.apiModel - Model to use
 * @param {Array} messages - Array of message objects { role, content }
 * @param {Function} onChunk - Callback function for each chunk of response
 * @param {Function} onComplete - Callback function when stream completes
 * @param {Function} onError - Callback function on error
 * @returns {Promise} - Promise that resolves when stream completes
 */
async function sendMessage(config, messages, onChunk, onComplete, onError) {
    const { apiKey, apiUrl, apiModel } = config;

    // Validate configuration
    const validation = validateSettings(config);
    if (!validation.valid) {
        onError(validation.error);
        return Promise.reject(new Error(validation.error));
    }

    // Prepare API endpoint
    const endpoint = apiUrl.endsWith('/')
        ? `${apiUrl}chat/completions`
        : `${apiUrl}/chat/completions`;

    // Prepare request body
    const requestBody = {
        model: apiModel,
        messages: messages,
        stream: true
    };

    // Prepare headers
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': window.location.origin || 'http://localhost',
        'X-Title': 'Idiot Index Calculator'
    };

    try {
        // Make the API request
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(requestBody)
        });

        // Handle HTTP errors
        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = `API 请求失败 (${response.status})`;

            try {
                const errorJson = JSON.parse(errorText);
                if (errorJson.error && errorJson.error.message) {
                    errorMessage = errorJson.error.message;
                }
            } catch (e) {
                errorMessage += `: ${errorText}`;
            }

            onError(errorMessage);
            return Promise.reject(new Error(errorMessage));
        }

        // Handle streaming response
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();

            if (done) {
                break;
            }

            // Decode the chunk
            buffer += decoder.decode(value, { stream: true });

            // Process complete lines
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep incomplete line in buffer

            for (const line of lines) {
                const trimmedLine = line.trim();

                // Skip empty lines
                if (!trimmedLine) continue;

                // Check for SSE format
                if (trimmedLine.startsWith('data: ')) {
                    const data = trimmedLine.substring(6);

                    // Check for end of stream
                    if (data === '[DONE]') {
                        break;
                    }

                    try {
                        // Parse JSON
                        const parsed = JSON.parse(data);

                        // Extract content from choices
                        if (parsed.choices && parsed.choices[0]) {
                            const delta = parsed.choices[0].delta;
                            if (delta && delta.content) {
                                const content = delta.content;
                                fullResponse += content;
                                onChunk(content, fullResponse);
                            }
                        }
                    } catch (e) {
                        // Skip invalid JSON
                        console.warn('Failed to parse SSE data:', data, e);
                    }
                }
            }
        }

        // Stream completed
        onComplete(fullResponse);
        return Promise.resolve(fullResponse);

    } catch (error) {
        // Handle network errors
        let errorMessage = '网络错误';

        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            errorMessage = '无法连接到 API 服务器，请检查网络连接';
        } else if (error.name === 'AbortError') {
            errorMessage = '请求被中断';
        } else {
            errorMessage = error.message || '未知错误';
        }

        onError(errorMessage);
        return Promise.reject(error);
    }
}

/**
 * Sends a non-streaming message (for simple requests)
 * @param {Object} config - API configuration
 * @param {Array} messages - Array of message objects
 * @returns {Promise<string>} - Promise that resolves with the response
 */
async function sendMessageNonStreaming(config, messages) {
    const { apiKey, apiUrl, apiModel } = config;

    const validation = validateSettings(config);
    if (!validation.valid) {
        return Promise.reject(new Error(validation.error));
    }

    const endpoint = apiUrl.endsWith('/')
        ? `${apiUrl}chat/completions`
        : `${apiUrl}/chat/completions`;

    const requestBody = {
        model: apiModel,
        messages: messages,
        stream: false
    };

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': window.location.origin || 'http://localhost',
        'X-Title': 'Idiot Index Calculator'
    };

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API 请求失败: ${errorText}`);
        }

        const data = await response.json();

        if (data.choices && data.choices[0] && data.choices[0].message) {
            return Promise.resolve(data.choices[0].message.content);
        } else {
            throw new Error('API 响应格式错误');
        }

    } catch (error) {
        return Promise.reject(error);
    }
}

/**
 * Tests API connection with a simple message
 * @param {Object} config - API configuration
 * @returns {Promise<boolean>} - Promise that resolves with connection status
 */
async function testConnection(config) {
    try {
        const testMessage = {
            role: 'user',
            content: 'Hi'
        };

        const response = await sendMessageNonStreaming(
            config,
            [testMessage]
        );

        return Promise.resolve(response && response.length > 0);
    } catch (error) {
        return Promise.resolve(false);
    }
}

// ===== Export =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        sendMessage,
        sendMessageNonStreaming,
        testConnection
    };
}
