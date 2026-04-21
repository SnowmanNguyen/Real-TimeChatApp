using ChatApp.Data;
using Microsoft.AspNetCore.SignalR;
using ChatApp.Models;
using System.Collections.Concurrent;
using Microsoft.EntityFrameworkCore;

namespace ChatApp.Hubs
{
    public class ChatHub : Hub
    {
        private static readonly ConcurrentDictionary<string, string> _connectedUsers = new();
        private readonly ChatDbContext _db;

        public ChatHub(ChatDbContext db)
        {
            _db = db;
        }

        public override async Task OnConnectedAsync()
        {
            await Clients.All.SendAsync("UserConnected", Context.ConnectionId);
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            if (_connectedUsers.TryGetValue(Context.ConnectionId, out var userName))
            {
                _connectedUsers.TryRemove(Context.ConnectionId, out _);
                await Clients.All.SendAsync("UserLeft", userName);
                await UpdateOnlineUsers();
            }
            await base.OnDisconnectedAsync(exception);
        }

        public async Task RegisterUser(string userName)
        {
            _connectedUsers[Context.ConnectionId] = userName;
            await Groups.AddToGroupAsync(Context.ConnectionId, "General");
            await Clients.Others.SendAsync("UserJoined", userName);
            await UpdateOnlineUsers();
        }

        public async Task SendMessageToRoom(string user, string roomName, string message)
        {
            var chatMessage = new ChatMessage
            {
                User = user,
                Message = message,
                Room = roomName,
                Timestamp = DateTime.Now
            };
            _db.ChatMessages.Add(chatMessage);
            await _db.SaveChangesAsync();

            await Clients.Group(roomName).SendAsync("ReceiveMessage", chatMessage);
        }

        public async Task JoinRoom(string roomName)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, roomName);
            var userName = _connectedUsers.GetValueOrDefault(Context.ConnectionId, "Anonymous");
            var snapshot = await _db.ChatMessages
                .Where(m => m.Room == roomName)
                .OrderByDescending(m => m.Timestamp)
                .Take(100)
                .OrderBy(m => m.Timestamp)
                .ToListAsync();
            await Clients.Caller.SendAsync("ReceiveRoomHistory", roomName, snapshot);
            await Clients.Group(roomName).SendAsync("UserJoinedRoom", userName, roomName);
        }

        public async Task LeaveRoom(string roomName)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, roomName);
        }

        public async Task SendTypingIndicator(string user, string roomName, bool isTyping)
        {
            await Clients.OthersInGroup(roomName).SendAsync("UserTyping", user, isTyping);
        }

        private async Task UpdateOnlineUsers()
        {
            var users = _connectedUsers.Values.ToList();
            await Clients.All.SendAsync("UpdateOnlineUsers", users);
        }
    }
}
