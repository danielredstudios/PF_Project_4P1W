using Microsoft.EntityFrameworkCore;
using resource_api.Models;

namespace resource_api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Image> Images => Set<Image>();
    public DbSet<Tag> Tags => Set<Tag>();
    public DbSet<ImageTag> ImageTags => Set<ImageTag>();
    public DbSet<Pack> Packs => Set<Pack>();
    public DbSet<Puzzle> Puzzles => Set<Puzzle>();
    public DbSet<PuzzleImage> PuzzleImages => Set<PuzzleImage>();
    public DbSet<PackPuzzle> PackPuzzles => Set<PackPuzzle>();
    public DbSet<UserProgress> UserProgress => Set<UserProgress>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ImageTag>()
            .HasKey(it => new { it.ImageId, it.TagId });

        modelBuilder.Entity<PuzzleImage>()
            .HasKey(pi => new { pi.PuzzleId, pi.ImageId });

        modelBuilder.Entity<PackPuzzle>()
            .HasKey(pp => new { pp.PackId, pp.PuzzleId });

        modelBuilder.Entity<Tag>()
            .HasIndex(t => t.Name)
            .IsUnique();

        modelBuilder.Entity<UserProgress>()
            .HasIndex(up => new { up.UserId, up.PuzzleId })
            .IsUnique();
    }
}
