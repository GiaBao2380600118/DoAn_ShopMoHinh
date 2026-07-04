using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GundamStoreApi.Models
{
    public class Order
    {
        [Key]
        public int OrderID { get; set; }

        [Required]
        public int UserID { get; set; }

        [ForeignKey("UserID")]
        public User? User { get; set; }

        public DateTime OrderDate { get; set; } = DateTime.UtcNow;

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalAmount { get; set; }

        [Required]
        [MaxLength(50)]
        public string OrderStatus { get; set; } = "Pending"; // Pending, Shipping, Completed, Cancelled

        [Required]
        [MaxLength(50)]
        public string PaymentMethod { get; set; } = "COD"; // COD, VNPAY

        [Required]
        [MaxLength(255)]
        public string ShippingAddress { get; set; } = string.Empty;

        [MaxLength(500)]
        public string Notes { get; set; } = string.Empty;

        public ICollection<OrderDetail> OrderDetails { get; set; } = new List<OrderDetail>();
    }
}
