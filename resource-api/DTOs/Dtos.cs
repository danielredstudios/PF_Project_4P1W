namespace resource_api.DTOs;

// Image DTOs
public record ImageDto(int Id, string Url, string FileName, DateTime UploadedAt, List<TagDto> Tags);
public record CreateImageUrlRequest(string Url, string FileName);

// Tag DTOs
public record TagDto(int Id, string Name);
public record CreateTagRequest(string Name);

// Pack DTOs
public record PackDto(int Id, string Name, string Description, bool IsPublished, int Order, int PuzzleCount);
public record CreatePackRequest(string Name, string Description);
public record UpdatePackRequest(string Name, string Description, int Order);

// Puzzle DTOs
public record PuzzleDto(int Id, string AnswerWord, string? Hint, string Difficulty, List<PuzzleImageDto> Images);
public record PuzzleImageDto(int ImageId, string Url, int Position);
public record CreatePuzzleRequest(string AnswerWord, string? Hint, string Difficulty, List<PuzzleImageInput> Images);
public record PuzzleImageInput(int ImageId, int Position);
public record UpdatePuzzleRequest(string AnswerWord, string? Hint, string Difficulty, List<PuzzleImageInput> Images);

// Player DTOs
public record NextPuzzleDto(int PuzzleId, List<PuzzleImageDto> Images, string? Hint, string Difficulty, int AnswerLength, string ScrambledLetters, string AnswerWord);
public record SubmitGuessRequest(int PuzzleId, string Guess);
public record SubmitGuessResponse(bool Correct, int ScoreDelta, bool NextAvailable, string Message);
public record ProfileDto(string UserId, int TotalSolved, int TotalAttempts, int TotalScore);
