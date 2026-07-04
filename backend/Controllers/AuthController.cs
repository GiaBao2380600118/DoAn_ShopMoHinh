using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using GundamStoreApi.Models;
using GundamStoreApi.Data;
using Microsoft.EntityFrameworkCore;

namespace GundamStoreApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _config;

        public AuthController(AppDbContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
            {
                return BadRequest("Email đã được đăng ký.");
            }

            // Simplistic plain hashing for simplicity (usually BCrypt / Argon2 is used)
            var passwordHash = Convert.ToBase64String(
                System.Security.Cryptography.SHA256.HashData(Encoding.UTF8.GetBytes(dto.Password))
            );

            var user = new User
            {
                Email = dto.Email,
                PasswordHash = passwordHash,
                FullName = dto.FullName,
                Role = "Customer",
                Address = dto.Address,
                PhoneNumber = dto.PhoneNumber
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đăng ký tài khoản thành công!" });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            var passwordHash = Convert.ToBase64String(
                System.Security.Cryptography.SHA256.HashData(Encoding.UTF8.GetBytes(dto.Password))
            );

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email && u.PasswordHash == passwordHash);
            if (user == null)
            {
                return Unauthorized("Email hoặc Mật khẩu không chính xác.");
            }

            var token = GenerateJwtToken(user);
            return Ok(new { token, role = user.Role, fullName = user.FullName });
        }

        private string GenerateJwtToken(User user)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"] ?? "DefaultKeyThatMustBeThirtyTwoChars"));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.UserID.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role),
                new Claim("FullName", user.FullName)
            };

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(double.Parse(_config["Jwt:ExpiryMinutes"] ?? "180")),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }

    public class RegisterDto
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
    }

    public class LoginDto
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }
}
