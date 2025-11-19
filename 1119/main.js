import { GoogleGenerativeAI } from "@google/generative-ai";

// 1. 設定 API Key
const API_KEY = "AIzaSyDyWp8XiVo8pfL1hMU5dGv4SYMiesI1hL0";
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-robotics-er-1.5-preview" });

// DOM 元素
const chatHistory = document.getElementById('chat-history');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const imageInput = document.getElementById('image-input');
const imagePreviewContainer = document.getElementById('image-preview-container');
const imagePreview = document.getElementById('image-preview');
const removeImageBtn = document.getElementById('remove-image');

let currentImageFile = null; // 暫存當前選擇的圖片

// 2. 輔助函式：將 File 物件轉為 Google AI 需要的 Base64 物件
async function fileToGenerativePart(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64Data = reader.result.split(',')[1];
            resolve({
                inlineData: {
                    data: base64Data,
                    mimeType: file.type
                }
            });
        };
        reader.readAsDataURL(file);
    });
}

// 3. 處理訊息發送
async function handleSend() {
    const text = userInput.value.trim();
    if (!text && !currentImageFile) return;

    // UI: 顯示使用者訊息
    appendMessage(text, 'user-message', currentImageFile);
    
    // UI: 清空輸入框與圖片
    userInput.value = '';
    clearImageSelection();
    sendBtn.disabled = true;

    // UI: 建立一個空的 AI 訊息框，準備接收串流
    const aiMessageDiv = appendMessage('...', 'ai-message');
    let fullResponse = "";

    try {
        let result;
        
        // 判斷是「純文字」還是「圖+文」
        if (currentImageFile) {
            // 圖片模式 (目前 SDK 的 Vision 不支援 chat history 串流，我們用 generateContentStream)
            const imagePart = await fileToGenerativePart(currentImageFile);
            const prompt = text || "請描述這張圖片"; // 如果沒輸入文字，預設 Prompt
            
            result = await model.generateContentStream([prompt, imagePart]);
        } else {
            // 純文字模式 (使用 generateContentStream)
            // 註：如果要記憶對話，需使用 model.startChat()，這裡為了教學單純化，先示範單次串流
            result = await model.generateContentStream(text);
        }

        // 4. 處理串流回應 (Streaming)
        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            fullResponse += chunkText;
            // 即時渲染 Markdown
            aiMessageDiv.innerHTML = marked.parse(fullResponse);
            // 捲動到底部
            chatHistory.scrollTop = chatHistory.scrollHeight;
        }

    } catch (error) {
        console.error(error);
        aiMessageDiv.innerHTML = `<span style="color:red">發生錯誤: ${error.message}</span>`;
    } finally {
        sendBtn.disabled = false;
    }
}

// 5. UI 輔助：顯示訊息
function appendMessage(content, className, imageFile = null) {
    const div = document.createElement('div');
    div.className = `message ${className}`;
    
    if (imageFile) {
        const img = document.createElement('img');
        img.src = URL.createObjectURL(imageFile);
        img.style.maxWidth = "100%";
        img.style.borderRadius = "8px";
        img.style.marginBottom = "5px";
        div.appendChild(img);
    }
    
    if (content) {
        // 使用 marked 解析 Markdown (如果是 user message 則不需要，但為了一致性可保留)
        div.innerHTML += (className === 'ai-message') ? marked.parse(content) : content;
    }
    
    chatHistory.appendChild(div);
    chatHistory.scrollTop = chatHistory.scrollHeight;
    return div; // 回傳 div 讓後續可以更新內容
}

// 6. 圖片處理邏輯
imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        currentImageFile = file;
        imagePreview.src = URL.createObjectURL(file);
        imagePreviewContainer.style.display = 'block';
    }
});

function clearImageSelection() {
    currentImageFile = null;
    imageInput.value = '';
    imagePreviewContainer.style.display = 'none';
}

removeImageBtn.addEventListener('click', clearImageSelection);
sendBtn.addEventListener('click', handleSend);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSend();
});