# 💬 ChatApp — Real-time Chat với ASP.NET Core SignalR

## Yêu cầu hệ thống
- **.NET 8 SDK** — tải tại https://dotnet.microsoft.com/download/dotnet/8.0
- **Visual Studio 2022** (v17.x) hoặc VS Code

---

## ▶️ Cách chạy bằng Visual Studio 2022

1. Mở file **`ChatApp.sln`**
2. Nhấn **F5** hoặc **Ctrl+F5**
3. Trình duyệt tự mở tại `http://localhost:5000`

---

## ▶️ Cách chạy bằng Command Line (.NET CLI)

```bash
cd ChatApp
dotnet run
```
Sau đó mở trình duyệt: http://localhost:5000

---

## 🧪 Test real-time

**Mở nhiều tab / nhiều trình duyệt** cùng truy cập `http://localhost:5000`  
→ Tin nhắn sẽ hiện ngay lập tức ở tất cả các tab!

---

## ✨ Tính năng

| Tính năng | Mô tả |
|-----------|-------|
| 🔗 WebSocket | Kết nối 2 chiều thời gian thực |
| 📂 Phòng chat | General, Dev Team, Random |
| 👥 Online users | Danh sách cập nhật live |
| ⌨️ Typing indicator | Hiện "đang gõ..." |
| 🔄 Auto-reconnect | Tự kết nối lại khi mất mạng |
| 🎨 Dark UI | Giao diện hiện đại |

---

## 📁 Cấu trúc project

```
ChatApp/
├── ChatApp.sln
└── ChatApp/
    ├── Hubs/ChatHub.cs          ← SignalR Hub (xử lý WebSocket)
    ├── Models/ChatMessage.cs    ← Model tin nhắn
    ├── Controllers/HomeController.cs
    ├── Views/Home/Index.cshtml  ← Giao diện chat
    ├── wwwroot/
    │   ├── css/chat.css
    │   └── js/chat.js           ← SignalR JS client
    └── Program.cs               ← Cấu hình SignalR
```

---

## 🎓 Công nghệ sử dụng

- **ASP.NET Core 8** — Web framework
- **SignalR** — Real-time communication qua WebSocket
- **JavaScript SignalR Client** — `@microsoft/signalr` v8.0 (từ CDN)
- **MVC Pattern** — Controller + View

---

*Đề tài môn Công nghệ .NET — ASP.NET Core SignalR*
