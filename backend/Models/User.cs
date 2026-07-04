using System;
using System.ComponentModel.DataAnnotations;

namespace GundamStoreApi.Models
{
    public class User
    {
        [Key]
        public int UserID { get; set; }

        [Required]
        [EmailAddress]
        [MaxLength(255)]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MaxLength(500)]
        public string PasswordHash { get; set; } = string.Empty;

        [Required]
        [MaxLength(150)]
        public string FullName { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string Role { get; set; } = "Customer"; // Admin, Customer

        [MaxLength(255)]
        public string Address { get; set; } = string.Empty;

        [MaxLength(20)]
        public string PhoneNumber { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
