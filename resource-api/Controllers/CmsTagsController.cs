using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using resource_api.Data;
using resource_api.DTOs;
using resource_api.Models;

namespace resource_api.Controllers;

[ApiController]
[Route("cms/tags")]
[Authorize(Roles = "admin")]
public class CmsTagsController : ControllerBase
{
    private readonly AppDbContext _db;

    public CmsTagsController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var tags = await _db.Tags.OrderBy(t => t.Name).ToListAsync();
        return Ok(tags.Select(t => new TagDto(t.Id, t.Name)));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTagRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Name))
            return BadRequest(new { error = "Tag name is required." });

        var name = req.Name.Trim().ToLower();
        if (await _db.Tags.AnyAsync(t => t.Name == name))
            return Conflict(new { error = "Tag already exists." });

        var tag = new Tag { Name = name };
        _db.Tags.Add(tag);
        await _db.SaveChangesAsync();
        return Ok(new TagDto(tag.Id, tag.Name));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var tag = await _db.Tags.FindAsync(id);
        if (tag == null) return NotFound();
        _db.Tags.Remove(tag);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
