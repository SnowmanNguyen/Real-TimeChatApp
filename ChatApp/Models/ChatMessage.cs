namespace ChatApp.Models
{
    public class ChatMessage
    {
        public int Id { get; set; }
        public string User { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string Room { get; set; } = "General";
        public DateTime Timestamp { get; set; } = DateTime.Now;
    }
}
