using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using resource_api.Data;
using resource_api.DTOs;
using resource_api.Models;

namespace resource_api.Controllers;

[ApiController]
[Route("cms/images")]
[Authorize(Roles = "admin")]
public class CmsImagesController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IWebHostEnvironment _env;

    public CmsImagesController(AppDbContext db, IWebHostEnvironment env)
    {
        _db = db;
        _env = env;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? tagId)
    {
        var query = _db.Images.Include(i => i.ImageTags).ThenInclude(it => it.Tag).AsQueryable();
        if (tagId.HasValue)
            query = query.Where(i => i.ImageTags.Any(it => it.TagId == tagId.Value));

        var images = await query.OrderByDescending(i => i.UploadedAt).ToListAsync();
        return Ok(images.Select(MapImage));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var image = await _db.Images.Include(i => i.ImageTags).ThenInclude(it => it.Tag)
            .FirstOrDefaultAsync(i => i.Id == id);
        if (image == null) return NotFound();
        return Ok(MapImage(image));
    }

    [HttpPost("upload")]
    public async Task<IActionResult> Upload(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { error = "No file provided." });

        var allowed = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
        var ext = Path.GetExtension(file.FileName).ToLower();
        if (!allowed.Contains(ext))
            return BadRequest(new { error = "Only image files are allowed." });

        if (file.Length > 10 * 1024 * 1024)
            return BadRequest(new { error = "File size must be under 10MB." });

        var webRootPath = _env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot");
        var uploadsDir = Path.Combine(webRootPath, "uploads");
        Directory.CreateDirectory(uploadsDir);

        var fileName = $"{Guid.NewGuid()}{ext}";
        var filePath = Path.Combine(uploadsDir, fileName);
        await using var stream = new FileStream(filePath, FileMode.Create);
        await file.CopyToAsync(stream);

        var baseUrl = $"{Request.Scheme}://{Request.Host}";
        var image = new Image
        {
            FileName = fileName,
            Url = $"{baseUrl}/uploads/{fileName}"
        };
        _db.Images.Add(image);
        await _db.SaveChangesAsync();
        return Ok(MapImage(image));
    }

    [HttpPost("url")]
    public async Task<IActionResult> AddByUrl([FromBody] CreateImageUrlRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Url))
            return BadRequest(new { error = "URL is required." });

        var image = new Image { FileName = req.FileName, Url = req.Url };
        _db.Images.Add(image);
        await _db.SaveChangesAsync();
        return Ok(MapImage(image));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var image = await _db.Images.FindAsync(id);
        if (image == null) return NotFound();
        _db.Images.Remove(image);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{id}/tags/{tagId}")]
    public async Task<IActionResult> AddTag(int id, int tagId)
    {
        var exists = await _db.ImageTags.AnyAsync(it => it.ImageId == id && it.TagId == tagId);
        if (exists) return Conflict(new { error = "Tag already assigned." });
        _db.ImageTags.Add(new ImageTag { ImageId = id, TagId = tagId });
        await _db.SaveChangesAsync();
        return Ok();
    }

    [HttpDelete("{id}/tags/{tagId}")]
    public async Task<IActionResult> RemoveTag(int id, int tagId)
    {
        var entry = await _db.ImageTags.FindAsync(id, tagId);
        if (entry == null) return NotFound();
        _db.ImageTags.Remove(entry);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private static ImageDto MapImage(Image image) => new(
        image.Id,
        image.Url,
        image.FileName,
        image.UploadedAt,
        image.ImageTags.Select(it => new TagDto(it.Tag.Id, it.Tag.Name)).ToList()
    );
}
