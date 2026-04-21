using ChatApp.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace ChatApp.Data
{
    public class ChatDbContext : IdentityDbContext
    {
        public ChatDbContext(DbContextOptions<ChatDbContext> options) : base(options)
        {
        }

        public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

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
