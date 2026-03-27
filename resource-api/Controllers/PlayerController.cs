using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using resource_api.Data;
using resource_api.DTOs;
using resource_api.Models;

namespace resource_api.Controllers;

[ApiController]
[Route("api")]
[Authorize] // Player or admin can access
public class PlayerController : ControllerBase
{
    private readonly AppDbContext _db;

    public PlayerController(AppDbContext db) => _db = db;

    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";

    [HttpGet("packs")]
    public async Task<IActionResult> GetPacks([FromQuery] bool random = false)
    {
        var query = _db.Packs.Where(p => p.IsPublished);
        
        var packs = await query
            .Select(p => new PackDto(p.Id, p.Name, p.Description, p.IsPublished, p.Order, p.PackPuzzles.Count))
            .ToListAsync();

        if (random)
        {
            var rng = new Random();
            packs = packs.OrderBy(x => rng.Next()).ToList();
        }
        else
        {
            packs = packs.OrderBy(p => p.Order).ToList();
        }

        return Ok(packs);
    }

    [HttpGet("puzzles/next")]
    public async Task<IActionResult> GetNextPuzzle([FromQuery] int packId)
    {
        var userId = UserId;
        var packPuzzles = await _db.PackPuzzles
            .Where(pp => pp.PackId == packId)
            .Select(pp => pp.PuzzleId)
            .ToListAsync();

        if (!packPuzzles.Any())
            return NotFound(new { error = "Pack has no puzzles." });

        var solvedPuzzles = await _db.UserProgress
            .Where(up => up.UserId == userId && up.Solved && packPuzzles.Contains(up.PuzzleId))
            .Select(up => up.PuzzleId)
            .ToListAsync();

        var remainingPuzzles = packPuzzles.Except(solvedPuzzles).ToList();
        
        if (!remainingPuzzles.Any())
            return Ok(new { message = "Pack completed!" }); // Or cycle back

        // Randomize the next puzzle from the remaining ones
        var rng = new Random();
        var nextPuzzleId = remainingPuzzles[rng.Next(remainingPuzzles.Count)];

        var puzzle = await _db.Puzzles
            .Include(p => p.PuzzleImages).ThenInclude(pi => pi.Image)
            .FirstOrDefaultAsync(p => p.Id == nextPuzzleId);

        if (puzzle == null) return NotFound();

        string answer = puzzle.AnswerWord.Replace(" ", "").Replace("-", "").ToUpperInvariant();
        int answerLength = answer.Length;
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        string scrambled = answer;
        while (scrambled.Length < 12)
        {
            scrambled += chars[rng.Next(chars.Length)];
        }
        string finalScrambled = new string(scrambled.OrderBy(x => rng.Next()).ToArray());

        var nextDto = new NextPuzzleDto(
            puzzle.Id,
            puzzle.PuzzleImages.OrderBy(pi => pi.Position).Select(pi => new PuzzleImageDto(pi.ImageId, pi.Image.Url, pi.Position)).ToList(),
            puzzle.Hint,
            puzzle.Difficulty,
            answerLength,
            finalScrambled,
            answer
        );

        return Ok(nextDto);
    }

    [HttpPost("game/submit")]
    public async Task<IActionResult> SubmitGuess([FromBody] SubmitGuessRequest req)
    {
        var puzzle = await _db.Puzzles.Include(p => p.PackPuzzles).FirstOrDefaultAsync(p => p.Id == req.PuzzleId);
        if (puzzle == null) return NotFound(new { error = "Puzzle not found." });

        var userId = UserId;
        var progress = await _db.UserProgress.FirstOrDefaultAsync(up => up.UserId == userId && up.PuzzleId == req.PuzzleId);
        if (progress == null)
        {
            progress = new UserProgress { UserId = userId, PuzzleId = req.PuzzleId };
            _db.UserProgress.Add(progress);
        }

        if (progress.Solved)
            return Ok(new SubmitGuessResponse(true, 0, true, "Already solved."));

        progress.Attempts++;
        progress.LastAttemptAt = DateTime.UtcNow;

        var normalizedAnswer = puzzle.AnswerWord.Replace(" ", "").Replace("-", "").ToLowerInvariant();
        var normalizedGuess = req.Guess.Replace(" ", "").Replace("-", "").ToLowerInvariant();

        bool correct = normalizedAnswer == normalizedGuess;

        if (correct)
        {
            progress.Solved = true;
            progress.SolvedAt = DateTime.UtcNow;
            
            // simple scoring
            int scoreDelta = puzzle.Difficulty switch
            {
                "hard" => 30,
                "medium" => 20,
                "easy" => 10,
                _ => 10
            };
            
            // Penalty for extra attempts
            int penalty = (progress.Attempts - 1) * 2;
            scoreDelta = Math.Max(5, scoreDelta - penalty); 
            
            progress.Score = scoreDelta;
        }

        await _db.SaveChangesAsync();

        // Check if next available
        bool nextAvailable = false;
        var packId = puzzle.PackPuzzles.FirstOrDefault()?.PackId;
        if (packId.HasValue)
        {
            var packPuzzles = await _db.PackPuzzles.Where(pp => pp.PackId == packId).Select(pp => pp.PuzzleId).ToListAsync();
            var solvedPuzzles = await _db.UserProgress.Where(up => up.UserId == userId && up.Solved && packPuzzles.Contains(up.PuzzleId)).Select(up => up.PuzzleId).ToListAsync();
            nextAvailable = packPuzzles.Except(solvedPuzzles).Any();
        }

        return Ok(new SubmitGuessResponse(correct, correct ? progress.Score : 0, nextAvailable, correct ? "Correct!" : "Try again."));
    }

    [HttpGet("profile/progress")]
    public async Task<IActionResult> GetProfile()
    {
        var userId = UserId;
        var progress = await _db.UserProgress.Where(up => up.UserId == userId).ToListAsync();
        
        var solved = progress.Count(up => up.Solved);
        var attempts = progress.Sum(up => up.Attempts);
        var score = progress.Sum(up => up.Score);

        return Ok(new ProfileDto(userId, solved, attempts, score));
    }
}
