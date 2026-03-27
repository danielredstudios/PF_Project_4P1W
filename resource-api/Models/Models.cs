namespace resource_api.Models;

public class Image
{
    public int Id { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
    public ICollection<ImageTag> ImageTags { get; set; } = new List<ImageTag>();
}

public class Tag
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public ICollection<ImageTag> ImageTags { get; set; } = new List<ImageTag>();
}

public class ImageTag
{
    public int ImageId { get; set; }
    public Image Image { get; set; } = null!;
    public int TagId { get; set; }
    public Tag Tag { get; set; } = null!;
}

public class Pack
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsPublished { get; set; } = false;
    public int Order { get; set; } = 0;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<PackPuzzle> PackPuzzles { get; set; } = new List<PackPuzzle>();
}

public class Puzzle
{
    public int Id { get; set; }
    public string AnswerWord { get; set; } = string.Empty;
    public string? Hint { get; set; }
    public string Difficulty { get; set; } = "medium"; // easy, medium, hard
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<PuzzleImage> PuzzleImages { get; set; } = new List<PuzzleImage>();
    public ICollection<PackPuzzle> PackPuzzles { get; set; } = new List<PackPuzzle>();
}

public class PuzzleImage
{
    public int PuzzleId { get; set; }
    public Puzzle Puzzle { get; set; } = null!;
    public int ImageId { get; set; }
    public Image Image { get; set; } = null!;
    public int Position { get; set; } // 1-4
}

public class PackPuzzle
{
    public int PackId { get; set; }
    public Pack Pack { get; set; } = null!;
    public int PuzzleId { get; set; }
    public Puzzle Puzzle { get; set; } = null!;
}

public class UserProgress
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty; // JWT sub claim
    public int PuzzleId { get; set; }
    public Puzzle Puzzle { get; set; } = null!;
    public bool Solved { get; set; } = false;
    public int Attempts { get; set; } = 0;
    public int Score { get; set; } = 0;
    public DateTime? SolvedAt { get; set; }
    public DateTime LastAttemptAt { get; set; } = DateTime.UtcNow;
}
