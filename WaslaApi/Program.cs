using Microsoft.EntityFrameworkCore;
using WaslaApi.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

// التغيير هنا: استخدام UseSqlite بدلاً من UseSqlServer
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
    });
});

var app = builder.Build();

app.UseStaticFiles();
app.UseCors("AllowAll");
app.UseAuthorization();
app.MapControllers();

app.Run();