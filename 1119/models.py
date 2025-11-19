import google.generativeai as genai
import os
 
api_key = 'AIzaSyDyWp8XiVo8pfL1hMU5dGv4SYMiesI1hL0'

if not api_key:
    print("錯誤：找不到 API Key")
else:
    # 2. 設定 API Key
    genai.configure(api_key=api_key)

    print("正在查詢你的 API Key 可用的模型清單...\n")
    
    try:
        # 3. 列出所有模型
        models = genai.list_models()
        
        found_any = False
        for m in models:
            # 我們只關心能「生成內容 (generateContent)」的模型
            if 'generateContent' in m.supported_generation_methods:
                print(f"可用模型: {m.name}")
                # 顯示它是否支援視覺 (Vision) - 雖然現在 1.5 幾乎都支援
                if 'vision' in m.name or '1.5' in m.name:
                    print(f"   (這通常支援圖片輸入)")
                found_any = True
        
        if not found_any:
            print("沒有找到任何支援 generateContent 的模型。請確認你的 API Key 是否正確啟用。")
            
    except Exception as e:
        print(f"查詢失敗，原因：{e}")