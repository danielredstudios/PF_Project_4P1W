using auth_api.Data;
using auth_api.DTOs;
using auth_api.Models;
using auth_api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace auth_api.Controllers;

[ApiController]
[Route("auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly TokenService _tokenService;
    private readonly Microsoft.AspNetCore.Identity.PasswordHasher<User> _hasher;

    public AuthController(AppDbContext db, TokenService tokenService)
    {
        _db = db;
        _tokenService = tokenService;
        _hasher = new Microsoft.AspNetCore.Identity.PasswordHasher<User>();
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password))
            return BadRequest(new { error = "Email and password are required." });

        if (await _db.Users.AnyAsync(u => u.Email == req.Email.ToLower()))
            return Conflict(new { error = "Email already registered." });

        if (req.Password.Length < 6)
            return BadRequest(new { error = "Password must be at least 6 characters." });

        var user = new User
        {
            Email = req.Email.ToLower().Trim(),
            PasswordHash = _hasher.HashPassword(null!, req.Password),
            Role = "player"
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        var token = _tokenService.GenerateToken(user);
        return Ok(new AuthResponse(token, user.Email, user.Role));
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password))
            return BadRequest(new { error = "Email and password are required." });

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == req.Email.ToLower().Trim());
        if (user == null || _hasher.VerifyHashedPassword(user, user.PasswordHash, req.Password) != Microsoft.AspNetCore.Identity.PasswordVerificationResult.Success)
            return Unauthorized(new { error = "Invalid email or password." });

        var token = _tokenService.GenerateToken(user);
        return Ok(new AuthResponse(token, user.Email, user.Role));
    }
}
