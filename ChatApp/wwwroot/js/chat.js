"use strict";

let connection = null;
let currentUser = "";
let currentRoom = "General";
let typingTimer = null;
let isTyping = false;
const roomMessages = {};
const SYSTEM_MESSAGE_ID_PREFIX = "sys-";
const currentUserInput = document.getElementById("current-user");

// Kết nối SignalR
async function startConnection() {
    connection = new signalR.HubConnectionBuilder()
        .withUrl("/chathub")
        .withAutomaticReconnect([0, 2000, 5000, 10000])
        .configureLogging(signalR.LogLevel.Warning)
        .build();

    registerHandlers();

    connection.onreconnecting(() => {
        setConnectionStatus("reconnecting");
        appendSystem("⚠️ Đang kết nối lại...");
    });
    connection.onreconnected(async () => {
        setConnectionStatus("connected");
        appendSystem("Đã kết nối lại!");
        await connection.invoke("RegisterUser");
        await connection.invoke("JoinRoom", currentRoom);
    });
    connection.onclose(() => {
        setConnectionStatus("disconnected");
        appendSystem("Mất kết nối.");
    });

    try {
        await connection.start();
        setConnectionStatus("connected");
        await connection.invoke("RegisterUser");
        await connection.invoke("JoinRoom", currentRoom);
        appendSystem(`🎉 Chào mừng ${currentUser}! Bạn đang ở phòng #${currentRoom}`);
    } catch (err) {
        console.error("Lỗi kết nối SignalR:", err);
        appendSystem("Không thể kết nối. Thử lại sau 5 giây...");
        setTimeout(startConnection, 5000);
    }
}

function registerHandlers() {
    // Nhận tin nhắn trong phòng
    connection.on("ReceiveMessage", msg => {
        addChatEntry(msg.room, msg);

        if (msg.room === currentRoom) {
            appendMessage(msg.user, msg.message, msg.timestamp, msg.user === currentUser);
        }
    });

    connection.on("ReceiveRoomHistory", (roomName, messages) => {
        const existingSystem = (roomMessages[roomName] || []).filter(m => m.type === "system");
        const chatEntries = (messages || []).map(toChatEntry);
        roomMessages[roomName] = [...chatEntries, ...existingSystem];
        if (roomName === currentRoom) {
            renderRoomMessages(roomName);
        }
    });

    // Người dùng mới tham gia (toàn app)
    connection.on("UserJoined", userName => {
        if (userName !== currentUser)
            appendSystem(`👋 ${userName} vừa tham gia!`);
    });

    // Người dùng rời
    connection.on("UserLeft", userName => {
        appendSystem(`🚪 ${userName} đã rời phòng.`);
    });

    // Ai đó vào phòng
    connection.on("UserJoinedRoom", (userName, room) => {
        if (room === currentRoom && userName !== currentUser)
            appendSystem(`📌 ${userName} đã vào #${room}`);
    });

    // Cập nhật danh sách online
    connection.on("UpdateOnlineUsers", users => {
        document.getElementById("online-count").textContent = users.length;
        const list = document.getElementById("online-users");
        list.innerHTML = users.map(u =>
            `<li class="${u === currentUser ? 'me' : ''}">
                <span class="dot"></span>${u}${u === currentUser ? ' (bạn)' : ''}
            </li>`
        ).join("");
    });

    connection.on("UserTyping", (userName, isTyping) => {
        const el = document.getElementById("typing-indicator");
        el.textContent = isTyping ? `${userName} đang gõ...` : "";
    });
}

//Gửi tin nhắn
const msgInput = document.getElementById("message-input");
const sendBtn  = document.getElementById("send-btn");

sendBtn.addEventListener("click", sendMessage);
msgInput.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
});

msgInput.addEventListener("input", () => {
    if (!connection || connection.state !== signalR.HubConnectionState.Connected) return;

    if (!isTyping) {
        isTyping = true;
        connection.invoke("SendTypingIndicator", currentRoom, true).catch(() => {});
    }
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
        isTyping = false;
        connection.invoke("SendTypingIndicator", currentRoom, false).catch(() => {});
    }, 1500);
});

async function sendMessage() {
    const text = msgInput.value.trim();
    if (!text) return;
    if (!connection || connection.state !== signalR.HubConnectionState.Connected) {
        appendSystem("❌ Chưa kết nối. Vui lòng chờ...");
        return;
    }

    msgInput.value = "";

    isTyping = false;
    clearTimeout(typingTimer);
    connection.invoke("SendTypingIndicator", currentRoom, false).catch(() => {});

    try {
        await connection.invoke("SendMessageToRoom", currentRoom, text);
    } catch (err) {
        console.error("Lỗi gửi tin:", err);
        appendSystem("❌ Gửi thất bại.");
    }
}

//Chuyển phòng
document.querySelectorAll(".room-btn").forEach(btn => {
    btn.addEventListener("click", () => switchRoom(btn.dataset.room));
});

async function switchRoom(room) {
    if (room === currentRoom) return;

    if (connection && connection.state === signalR.HubConnectionState.Connected) {
        await connection.invoke("LeaveRoom", currentRoom);
    }

    currentRoom = room;
    document.querySelectorAll(".room-btn").forEach(b =>
        b.classList.toggle("active", b.dataset.room === room));
    document.getElementById("room-title").textContent = "# " + room;
    renderRoomMessages(room);
    document.getElementById("typing-indicator").textContent = "";

    if (connection && connection.state === signalR.HubConnectionState.Connected) {
        await connection.invoke("JoinRoom", room);
        appendSystem(`📌 Bạn đã vào phòng #${room}`);
    }

    msgInput.focus();
}

//Render messages
function appendMessage(user, text, timestamp, isMe) {
    const list = document.getElementById("message-list");
    const div = document.createElement("div");
    div.className = `msg ${isMe ? "me" : "other"}`;

    const time = timestamp
        ? new Date(timestamp).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
        : new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

    div.innerHTML = `
        <div class="msg-meta">
            <span class="msg-user">${isMe ? "Bạn" : escapeHtml(user)}</span>
            <span class="msg-time">${time}</span>
        </div>
        <div class="msg-bubble">${escapeHtml(text)}</div>`;

    list.appendChild(div);
    list.scrollTop = list.scrollHeight;
}

function renderRoomMessages(room) {
    const list = document.getElementById("message-list");
    list.innerHTML = "";
    const messages = roomMessages[room] || [];
    messages.forEach(msg => {
        if (msg.type === "system") {
            renderSystem(msg.text);
        } else {
            appendMessage(msg.user, msg.message, msg.timestamp, msg.user === currentUser);
        }
    });
}

function appendSystem(text) {
    ensureRoomStore(currentRoom);
    roomMessages[currentRoom].push({
        id: `${SYSTEM_MESSAGE_ID_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type: "system",
        text,
        room: currentRoom,
        timestamp: new Date().toISOString()
    });
    renderSystem(text);
}

function renderSystem(text) {
    const list = document.getElementById("message-list");
    const div = document.createElement("div");
    div.className = "sys-msg";
    div.textContent = text;
    list.appendChild(div);
    list.scrollTop = list.scrollHeight;
}

function ensureRoomStore(room) {
    if (!roomMessages[room]) {
        roomMessages[room] = [];
    }
}

function addChatEntry(room, msg) {
    ensureRoomStore(room);
    roomMessages[room].push(toChatEntry(msg));
}

function toChatEntry(msg) {
    return {
        id: msg.id,
        type: "chat",
        user: msg.user,
        message: msg.message,
        room: msg.room,
        timestamp: msg.timestamp
    };
}

async function initializeChat() {
    currentUser = (currentUserInput?.value || "").trim();
    if (!currentUser) {
        return;
    }

    document.getElementById("user-name-display").textContent = currentUser;
    document.getElementById("user-avatar").textContent = currentUser.charAt(0).toUpperCase();
    document.getElementById("room-title").textContent = "# " + currentRoom;
    document.getElementById("message-input").focus();
    await startConnection();
}

function setConnectionStatus(status) {
    const badge = document.getElementById("conn-badge");
    badge.className = "conn-badge " + status;
    badge.title = { connected: "Đang kết nối", reconnecting: "Đang kết nối lại...", disconnected: "Mất kết nối" }[status];
}

function escapeHtml(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

initializeChat();
