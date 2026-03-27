using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using resource_api.Data;
using resource_api.DTOs;
using resource_api.Models;

namespace resource_api.Controllers;

[ApiController]
[Route("cms/packs")]
[Authorize(Roles = "admin")]
public class CmsPacksController : ControllerBase
{
    private readonly AppDbContext _db;

    public CmsPacksController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var packs = await _db.Packs
            .Include(p => p.PackPuzzles)
            .OrderBy(p => p.Order)
            .ToListAsync();
        return Ok(packs.Select(p => new PackDto(p.Id, p.Name, p.Description, p.IsPublished, p.Order, p.PackPuzzles.Count)));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var pack = await _db.Packs.Include(p => p.PackPuzzles).FirstOrDefaultAsync(p => p.Id == id);
        if (pack == null) return NotFound();
        return Ok(new PackDto(pack.Id, pack.Name, pack.Description, pack.IsPublished, pack.Order, pack.PackPuzzles.Count));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePackRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Name))
            return BadRequest(new { error = "Pack name is required." });

        var pack = new Pack { Name = req.Name.Trim(), Description = req.Description ?? string.Empty };
        _db.Packs.Add(pack);
        await _db.SaveChangesAsync();
        return Ok(new PackDto(pack.Id, pack.Name, pack.Description, pack.IsPublished, pack.Order, 0));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdatePackRequest req)
    {
        var pack = await _db.Packs.FindAsync(id);
        if (pack == null) return NotFound();

        pack.Name = req.Name.Trim();
        pack.Description = req.Description;
        pack.Order = req.Order;
        await _db.SaveChangesAsync();
        return Ok(new PackDto(pack.Id, pack.Name, pack.Description, pack.IsPublished, pack.Order, 0));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var pack = await _db.Packs.FindAsync(id);
        if (pack == null) return NotFound();
        _db.Packs.Remove(pack);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{id}/publish")]
    public async Task<IActionResult> TogglePublish(int id)
    {
        var pack = await _db.Packs.FindAsync(id);
        if (pack == null) return NotFound();
        pack.IsPublished = !pack.IsPublished;
        await _db.SaveChangesAsync();
        return Ok(new { pack.Id, pack.IsPublished });
    }

    [HttpPost("{id}/puzzles/{puzzleId}")]
    public async Task<IActionResult> AddPuzzle(int id, int puzzleId)
    {
        var exists = await _db.PackPuzzles.AnyAsync(pp => pp.PackId == id && pp.PuzzleId == puzzleId);
        if (exists) return Conflict(new { error = "Puzzle already in pack." });

        _db.PackPuzzles.Add(new PackPuzzle { PackId = id, PuzzleId = puzzleId });
        await _db.SaveChangesAsync();
        return Ok();
    }

    [HttpDelete("{id}/puzzles/{puzzleId}")]
    public async Task<IActionResult> RemovePuzzle(int id, int puzzleId)
    {
        var entry = await _db.PackPuzzles.FindAsync(id, puzzleId);
        if (entry == null) return NotFound();
        _db.PackPuzzles.Remove(entry);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
