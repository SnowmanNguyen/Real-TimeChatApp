using ChatApp.Models;
using Microsoft.EntityFrameworkCore;

namespace ChatApp.Data
{
    public class ChatDbContext : DbContext
    {
        public ChatDbContext(DbContextOptions<ChatDbContext> options) : base(options)
        {
        }

        public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<ChatMessage>()
                .Property(m => m.User)
                .HasMaxLength(50);

            modelBuilder.Entity<ChatMessage>()
                .Property(m => m.Room)
                .HasMaxLength(50);

            modelBuilder.Entity<ChatMessage>()
                .Property(m => m.Message)
                .HasMaxLength(1000);
        }
    }
}
