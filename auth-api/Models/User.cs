namespace auth_api.Models;

public class User
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = "player"; // "player" or "admin"
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
