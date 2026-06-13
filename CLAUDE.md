# Idiot Index Calculator

## Introduction
This project implements a web-based "Idiot Index Calculator" inspired by Elon Musk's concept of the "Idiot Index" and "First Principles" thinking. The core idea is to evaluate a product by comparing its selling price to the fundamental cost of its raw materials and manufacturing. This tool aims to provide an analytical breakdown of product costs and an "Idiot Index" score, offering insights into pricing and potential areas for cost optimization.

## Features
- **Idiot Index Calculation**: Analyze products based on their material costs and selling price using an AI model.
- **Configurable Settings**: Users can configure their Open Router API key, API URL, and desired model for AI interactions. Settings are saved locally in the browser.
- **Export Functionality**: Export the AI-generated product analysis, including the Idiot Index calculation, to a Markdown file.
- **Interactive Chat**: Continue the conversation with the AI for follow-up questions or further analysis after the initial calculation.
- **User-Friendly Interface**: A simple web interface built with Bootstrap for responsiveness and ease of use.
- **Informative Input**: An "I" button next to the input field provides examples for precise and fuzzy product descriptions.

## Technology Stack
- **Frontend**:
    - HTML5
    - CSS3 (with Bootstrap 5 for styling)
    - JavaScript (with Bootstrap 5 JS bundle, Marked.js for Markdown rendering)
- **Backend**:
    - Go (Expected, based on `script.js`'s API calls to `/api/calculate`)
    - Open Router API (for accessing AI models like Claude)

## File Structure

```
idiot-index-calculator/
├───promote.txt             // Original design document and requirements
├───Gemini.md               // This document
└───static/
    ├───index.html          // Main HTML structure of the web application
    ├───script.js           // Frontend JavaScript logic, API calls, and interactivity
    └───style.css           // Custom CSS for styling
```

## Setup and Running

### Prerequisites
- A Go environment for the backend (if not already set up).
- An Open Router API Key.

### Frontend
The frontend consists of static HTML, CSS, and JavaScript files. You can serve them using any static file server or integrate them with a Go backend.

### Backend (Go - Expected)
The `script.js` file makes POST requests to `/api/calculate`. A Go backend is expected to handle these requests, communicate with the Open Router API, and stream the AI's responses back to the frontend. An example `main.go` file for this backend would look something like this:

```go
package main

import (
	"bytes"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"
)

// Request and Response structs for OpenRouter API
type OpenRouterMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type OpenRouterRequest struct {
	Model    string              `json:"model"`
	Messages []OpenRouterMessage `json:"messages"`
	Stream   bool                `json:"stream"`
}

type OpenRouterResponse struct {
	Choices []struct {
		Delta struct {
			Content string `json:"content"`
		} `json:"delta"`
	} `json:"choices"`
}

// Struct for the request coming from the frontend
type CalculateRequest struct {
	ApiUrl   string              `json:"apiUrl"`
	ApiKey   string              `json:"apiKey"`
	ApiModel string              `json:"apiModel"`
	Messages []OpenRouterMessage `json:"messages"`
}

func enableCors(w *http.ResponseWriter) {
	(*w).Header().Set("Access-Control-Allow-Origin", "*")
	(*w).Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
	(*w).Header().Set("Access-Control-Allow-Headers", "Accept, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")
}

func calculateHandler(w http.ResponseWriter, r *http.Request) {
	enableCors(&w) // Enable CORS for local development

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var reqData CalculateRequest
	if err := json.NewDecoder(r.Body).Decode(&reqData); err != nil {
		http.Error(w, "Invalid request body: "+err.Error(), http.StatusBadRequest)
		return
	}

	if reqData.ApiKey == "" {
		http.Error(w, "Open Router API Key is required", http.StatusBadRequest)
		return
	}

	openRouterReq := OpenRouterRequest{
		Model:    reqData.ApiModel,
		Messages: reqData.Messages,
		Stream:   true,
	}

	jsonBody, err := json.Marshal(openRouterReq)
	if err != nil {
		http.Error(w, "Failed to marshal OpenRouter request: "+err.Error(), http.StatusInternalServerError)
		return
	}

	client := &http.Client{Timeout: 300 * time.Second} // Extend timeout for streaming
	proxyReq, err := http.NewRequest("POST", reqData.ApiUrl+"/chat/completions", bytes.NewBuffer(jsonBody))
	if err != nil {
		http.Error(w, "Failed to create proxy request: "+err.Error(), http.StatusInternalServerError)
		return
	}

	proxyReq.Header.Set("Authorization", "Bearer "+reqData.ApiKey)
	proxyReq.Header.Set("Content-Type", "application/json")
	proxyReq.Header.Set("HTTP-Referer", "https://localhost:8080") // Replace with your actual frontend URL
	proxyReq.Header.Set("X-Title", "Idiot Index Calculator") // Replace with your app title

	proxyResp, err := client.Do(proxyReq)
	if err != nil {
		http.Error(w, "Failed to send request to OpenRouter API: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer proxyResp.Body.Close()

	if proxyResp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(proxyResp.Body)
		log.Printf("OpenRouter API error: %s", string(bodyBytes))
		http.Error(w, "OpenRouter API error: "+proxyResp.Status+" - "+string(bodyBytes), proxyResp.StatusCode)
		return
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	// Stream response directly to client
	reader := io.NopCloser(proxyResp.Body)
	decoder := json.NewDecoder(reader)

	for {
		lineBytes := make([]byte, 0, 1024)
		for {
			b := make([]byte, 1)
			_, err := reader.Read(b)
			if err != nil {
				if err == io.EOF {
					goto endStream // Custom goto for EOF
				}
				log.Printf("Error reading stream: %v", err)
				return
			}
			lineBytes = append(lineBytes, b[0])
			if b[0] == '
' {
				break
			}
		}

		line := string(lineBytes)
		if strings.HasPrefix(line, "data: ") {
			data := strings.TrimPrefix(line, "data: ")
			if data == "[DONE]
" {
				// Send DONE to frontend as well
				w.Write([]byte("data: [DONE]

"))
				break
			}

			// Validate and write only valid JSON
			var parsedJSON map[string]interface{}
			if err := json.Unmarshal([]byte(data), &parsedJSON); err != nil {
				log.Printf("Invalid JSON received from OpenRouter: %s, Error: %v", data, err)
				// Optionally skip or send an error message to the client
				continue
			}
			w.Write([]byte(line))
			if f, ok := w.(http.Flusher); ok {
				f.Flush()
			}
		}
	}
endStream:
	log.Println("Streaming finished.")
}

func main() {
	// Serve static files
	http.Handle("/", http.FileServer(http.Dir("./static")))

	// API endpoint for AI calculation
	http.HandleFunc("/api/calculate", calculateHandler)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("Server starting on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
```

To run the Go backend:
1.  Save the code above as `main.go` in the project root.
2.  Navigate to the project root in your terminal.
3.  Run `go mod init idiot-index-calculator` (if not already initialized).
4.  Run `go run main.go`.
5.  Access the web application in your browser at `http://localhost:8080`.

## LLM Prompt Details
The AI model is instructed with a comprehensive system prompt to act as an expert analyst for the "Idiot Index." It emphasizes:
- **First Principles Thinking**: Breaking down products to raw material costs.
- **Purpose**: Critical evaluation of pricing and manufacturing efficiency.
- **Mandatory Markdown Format**: The AI is strictly required to output its analysis in a specific Markdown structure, ensuring consistent and parsable results. This format includes:
    - Product Overview (Name, Price, Introduction)
    - Cost Breakdown (detailed table with components, weights, raw material costs, final component costs, and notes)
    - Cost Analysis
    - Idiot Index Calculation (formula and result)
    - Evaluation & Elon Musk's Likely Perspective

## Challenges
1.  **Content Quality and Format**: Ensuring the AI consistently generates high-quality, accurate, and perfectly formatted Markdown content. This is mitigated by the highly structured system prompt.
2.  **Accuracy of Cost Data**: Obtaining precise and up-to-date raw material costs and selling prices, which can be volatile and proprietary. The AI is instructed to use its knowledge base and acknowledge estimates.
3.  **Calculation Accuracy**: Ensuring the "Idiot Index" calculation is correctly performed by the AI based on the provided formula and data. The explicit formula in the prompt guides this.

---
*Generated by Gemini CLI*
