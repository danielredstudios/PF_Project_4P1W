using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using resource_api.Data;
using resource_api.DTOs;
using resource_api.Models;

namespace resource_api.Controllers;

[ApiController]
[Route("cms/puzzles")]
[Authorize(Roles = "admin")]
public class CmsPuzzlesController : ControllerBase
{
    private readonly AppDbContext _db;

    public CmsPuzzlesController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var puzzles = await _db.Puzzles
            .Include(p => p.PuzzleImages).ThenInclude(pi => pi.Image)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
        return Ok(puzzles.Select(MapPuzzle));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var puzzle = await _db.Puzzles
            .Include(p => p.PuzzleImages).ThenInclude(pi => pi.Image)
            .FirstOrDefaultAsync(p => p.Id == id);
        if (puzzle == null) return NotFound();
        return Ok(MapPuzzle(puzzle));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePuzzleRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.AnswerWord))
            return BadRequest(new { error = "Answer word is required." });
        if (req.Images == null || req.Images.Count != 4)
            return BadRequest(new { error = "Exactly 4 images are required." });

        var puzzle = new Puzzle
        {
            AnswerWord = req.AnswerWord.Trim().ToLower(),
            Hint = req.Hint,
            Difficulty = req.Difficulty ?? "medium",
            PuzzleImages = req.Images.Select(i => new PuzzleImage
            {
                ImageId = i.ImageId,
                Position = i.Position
            }).ToList()
        };

        _db.Puzzles.Add(puzzle);
        await _db.SaveChangesAsync();

        var created = await _db.Puzzles.Include(p => p.PuzzleImages).ThenInclude(pi => pi.Image)
            .FirstAsync(p => p.Id == puzzle.Id);
        return Ok(MapPuzzle(created));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdatePuzzleRequest req)
    {
        var puzzle = await _db.Puzzles.Include(p => p.PuzzleImages).FirstOrDefaultAsync(p => p.Id == id);
        if (puzzle == null) return NotFound();

        if (req.Images == null || req.Images.Count != 4)
            return BadRequest(new { error = "Exactly 4 images are required." });

        puzzle.AnswerWord = req.AnswerWord.Trim().ToLower();
        puzzle.Hint = req.Hint;
        puzzle.Difficulty = req.Difficulty ?? "medium";

        _db.PuzzleImages.RemoveRange(puzzle.PuzzleImages);
        puzzle.PuzzleImages = req.Images.Select(i => new PuzzleImage
        {
            PuzzleId = id,
            ImageId = i.ImageId,
            Position = i.Position
        }).ToList();

        await _db.SaveChangesAsync();
        var updated = await _db.Puzzles.Include(p => p.PuzzleImages).ThenInclude(pi => pi.Image)
            .FirstAsync(p => p.Id == id);
        return Ok(MapPuzzle(updated));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var puzzle = await _db.Puzzles.FindAsync(id);
        if (puzzle == null) return NotFound();
        _db.Puzzles.Remove(puzzle);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    public static PuzzleDto MapPuzzle(Puzzle p) => new(
        p.Id,
        p.AnswerWord,
        p.Hint,
        p.Difficulty,
        p.PuzzleImages.OrderBy(pi => pi.Position)
            .Select(pi => new PuzzleImageDto(pi.ImageId, pi.Image?.Url ?? string.Empty, pi.Position))
            .ToList()
    );
}
