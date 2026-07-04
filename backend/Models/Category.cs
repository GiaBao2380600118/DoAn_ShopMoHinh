using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace GundamStoreApi.Models
{
    public class Category
    {
        [Key]
        public int CategoryID { get; set; }

        [Required]
        [MaxLength(100)]
        public string CategoryName { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public ICollection<Product> Products { get; set; } = new List<Product>();
    }
}
