using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GundamStoreApi.Models
{
    public class Product
    {
        [Key]
        public int ProductID { get; set; }

        [Required]
        [MaxLength(255)]
        public string ProductName { get; set; } = string.Empty;

        [Required]
        public int CategoryID { get; set; }

        [ForeignKey("CategoryID")]
        public Category? Category { get; set; }

        [Required]
        [MaxLength(100)]
        public string Series { get; set; } = string.Empty; // e.g., Witch from Mercury

        [MaxLength(50)]
        public string Grade { get; set; } = string.Empty; // HG, RG, MG, PG, SD, N/A

        [MaxLength(50)]
        public string Scale { get; set; } = string.Empty; // 1/144, 1/100, 1/60, N/A

        [Required]
        [MaxLength(100)]
        public string Manufacturer { get; set; } = string.Empty; // Bandai, Good Smile Company

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Price { get; set; }

        [Required]
        public int StockQuantity { get; set; }

        public string Description { get; set; } = string.Empty;

        [MaxLength(500)]
        public string ImageUrl { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
