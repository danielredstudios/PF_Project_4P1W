using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using resource_api.Data;
using resource_api.Models;

var builder = WebApplication.CreateBuilder(args);

// CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod());
});

// Database
builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

// JWT Auth - MUST MATCH AUTH-API KEY!
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var key = Encoding.UTF8.GetBytes(jwtSettings["Key"]!);

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings["Issuer"],
            ValidAudience = jwtSettings["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(key)
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Seed DB
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();

    // Keep image records aligned with local uploaded files so the app uses current pictures.
    var uploadsDir = Path.Combine(builder.Environment.ContentRootPath, "wwwroot", "uploads");
    Directory.CreateDirectory(uploadsDir);

    var allowedExtensions = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".gif", ".webp"
    };

    var localFiles = Directory.EnumerateFiles(uploadsDir)
        .Where(path => allowedExtensions.Contains(Path.GetExtension(path)))
        .Select(Path.GetFileName)
        .Where(name => !string.IsNullOrWhiteSpace(name))
        .Select(name => name!)
        .OrderBy(name => name)
        .ToList();

    var baseUrl = "http://localhost:5002";
    var existingLocalFileNames = db.Images
        .AsNoTracking()
        .Where(i => i.Url.StartsWith(baseUrl + "/uploads/"))
        .Select(i => i.FileName)
        .ToHashSet(StringComparer.OrdinalIgnoreCase);

    var newImageEntities = localFiles
        .Where(fileName => !existingLocalFileNames.Contains(fileName))
        .Select(fileName => new Image
        {
            FileName = fileName,
            Url = $"{baseUrl}/uploads/{fileName}"
        })
        .ToList();

    if (newImageEntities.Count > 0)
    {
        db.Images.AddRange(newImageEntities);
    }

    if (newImageEntities.Count > 0)
    {
        db.SaveChanges();
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Serve uploaded images statically
app.UseCors();

var uploadsPath = Path.Combine(builder.Environment.ContentRootPath, "wwwroot", "uploads");
Directory.CreateDirectory(uploadsPath);

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(uploadsPath),
    RequestPath = "/uploads"
});
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();
