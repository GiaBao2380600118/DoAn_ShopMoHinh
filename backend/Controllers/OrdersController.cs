using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GundamStoreApi.Models;
using GundamStoreApi.Data;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace GundamStoreApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OrdersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public OrdersController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/orders
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Order>>> GetOrders()
        {
            return await _context.Orders
                .Include(o => o.User)
                .Include(o => o.OrderDetails)
                .ThenInclude(od => od.Product)
                .OrderByDescending(o => o.OrderDate)
                .ToListAsync();
        }

        // POST: api/orders/checkout
        [HttpPost("checkout")]
        public async Task<IActionResult> Checkout([FromBody] CheckoutDto dto)
        {
            if (dto.Items == null || dto.Items.Count == 0)
            {
                return BadRequest("Giỏ hàng rỗng.");
            }

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var totalAmount = 0m;
                var orderDetails = new List<OrderDetail>();

                var order = new Order
                {
                    UserID = dto.UserID,
                    OrderDate = DateTime.UtcNow,
                    OrderStatus = "Pending",
                    PaymentMethod = dto.PaymentMethod,
                    ShippingAddress = dto.ShippingAddress,
                    Notes = dto.Notes,
                    TotalAmount = 0 // Will calculate
                };

                _context.Orders.Add(order);
                await _context.SaveChangesAsync(); // Generates OrderID

                foreach (var item in dto.Items)
                {
                    var product = await _context.Products.FindAsync(item.ProductID);
                    if (product == null)
                    {
                        return BadRequest($"Không tìm thấy sản phẩm ID {item.ProductID}");
                    }

                    if (product.StockQuantity < item.Quantity)
                    {
                        return BadRequest($"Sản phẩm '{product.ProductName}' không đủ hàng tồn kho.");
                    }

                    // Deduct stock
                    product.StockQuantity -= item.Quantity;

                    var itemPrice = product.Price;
                    totalAmount += itemPrice * item.Quantity;

                    var detail = new OrderDetail
                    {
                        OrderID = order.OrderID,
                        ProductID = item.ProductID,
                        Quantity = item.Quantity,
                        UnitPrice = itemPrice
                    };

                    _context.OrderDetails.Add(detail);
                }

                order.TotalAmount = totalAmount;
                await _context.SaveChangesAsync();

                await transaction.CommitAsync();

                return Ok(new { message = "Đơn hàng đã được đặt thành công!", orderId = order.OrderID, total = totalAmount });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, $"Lỗi hệ thống: {ex.Message}");
            }
        }

        // PUT: api/orders/5/status
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] string status)
        {
            var order = await _context.Orders.FindAsync(id);
            if (order == null)
            {
                return NotFound("Đơn hàng không tồn tại.");
            }

            order.OrderStatus = status;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Cập nhật trạng thái thành công!" });
        }
    }

    public class CheckoutDto
    {
        public int UserID { get; set; }
        public string PaymentMethod { get; set; } = "COD";
        public string ShippingAddress { get; set; } = string.Empty;
        public string Notes { get; set; } = string.Empty;
        public List<CartItemDto> Items { get; set; } = new List<CartItemDto>();
    }

    public class CartItemDto
    {
        public int ProductID { get; set; }
        public int Quantity { get; set; }
    }
}
