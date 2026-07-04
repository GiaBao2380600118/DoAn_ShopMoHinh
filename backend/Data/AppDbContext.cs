using Microsoft.EntityFrameworkCore;
using GundamStoreApi.Models;

namespace GundamStoreApi.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Product> Products { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderDetail> OrderDetails { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure precise decimal scales for money columns
            modelBuilder.Entity<Product>()
                .Property(p => p.Price)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Order>()
                .Property(o => o.TotalAmount)
                .HasPrecision(18, 2);

            modelBuilder.Entity<OrderDetail>()
                .Property(od => od.UnitPrice)
                .HasPrecision(18, 2);

            // Seed Categories
            modelBuilder.Entity<Category>().HasData(
                new Category { CategoryID = 1, CategoryName = "Gundam", Description = "Mô hình lắp ráp nhựa Gundam Gunpla" },
                new Category { CategoryID = 2, CategoryName = "Anime Figure", Description = "Mô hình tĩnh nhân vật Anime, Nendoroid, Figma" },
                new Category { CategoryID = 3, CategoryName = "Dụng cụ", Description = "Kềm cắt, bút kẻ lằn, keo dán nhựa chuyên dụng" },
                new Category { CategoryID = 4, CategoryName = "Phụ kiện", Description = "Action Base, decal dán nước, chi tiết độ" }
            );
        }
    }
}
