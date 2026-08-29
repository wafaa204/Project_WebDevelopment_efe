using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WaslaApi.Data;
using WaslaApi.Models;

namespace WaslaApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ToolsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IWebHostEnvironment _env;

    public ToolsController(AppDbContext context, IWebHostEnvironment env)
    {
        _context = context;
        _env = env;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Phone == dto.Phone);
        if (user == null)
        {
            user = new User
            {
                Name = dto.Name,
                FullName = string.IsNullOrEmpty(dto.FullName) ? dto.Name : dto.FullName,
                Email = dto.Email,
                Phone = dto.Phone,
                VerificationCode = "1234",
                Code = "1234"
            };
            _context.Users.Add(user);
        }
        else
        {
            user.VerificationCode = "1234";
            user.Code = "1234";
        }
        await _context.SaveChangesAsync();
        return Ok(new { Message = "تم إرسال رمز التحقق (1234)", Phone = user.Phone, UserId = user.Id });
    }

    [HttpPost("verify")]
    public async Task<IActionResult> Verify([FromBody] VerifyDto dto)
    {
        var code = !string.IsNullOrEmpty(dto.Code) ? dto.Code : dto.VerificationCode;
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Phone == dto.Phone && (u.VerificationCode == code || u.Code == code));
        
        if (user == null) return BadRequest("رمز التحقق غير صحيح");

        user.IsPhoneVerified = true;
        await _context.SaveChangesAsync();
        return Ok(user);
    }

    [HttpGet]
    public async Task<IActionResult> GetTools()
    {
        return Ok(await _context.Tools
        .Where(t => !t.IsDeleted) // جلب الأدوات غير المحذوفة فقط
        .OrderByDescending(t => t.CreatedAt) // ترتيبها من الأحدث للأقدم
        .ToListAsync());
    }

    // إضافة أداة - مع دعم إرسال الصورة والبحث عن المالك بالـ Id أو الـ Email
    [HttpPost]
    public async Task<IActionResult> AddTool([FromForm] CreateToolDto dto, IFormFile? image)
    {
        // البحث عن المستخدم بـ OwnerId أو بالبريد الإلكتروني إن لم يتوفر الـ Id
        User? owner = null;
        if (dto.OwnerId > 0)
        {
            owner = await _context.Users.FindAsync(dto.OwnerId);
        }
        else if (!string.IsNullOrEmpty(dto.OwnerEmail))
        {
            owner = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.OwnerEmail);
        }

        // إنشاء مستخدم تلقائي إذا لم يكن موجوداً لتفادي فشل الطلب
        if (owner == null)
        {
            owner = new User
            {
                Name = dto.OwnerName ?? "مستخدم",
                FullName = dto.OwnerName ?? "مستخدم",
                Email = dto.OwnerEmail ?? "user@wasla.com",
                Phone = dto.OwnerPhone ?? "0700000000"
            };
            _context.Users.Add(owner);
            await _context.SaveChangesAsync();
        }

        string imageUrl = "/uploads/default.png";
        if (image != null && image.Length > 0)
        {
            var uploadsFolder = Path.Combine(_env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "uploads");
            if (!Directory.Exists(uploadsFolder)) Directory.CreateDirectory(uploadsFolder);

            var fileName = Guid.NewGuid().ToString() + Path.GetExtension(image.FileName);
            var filePath = Path.Combine(uploadsFolder, fileName);
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await image.CopyToAsync(stream);
            }
            imageUrl = $"/uploads/{fileName}";
        }

        var tool = new Tool
        {
            Name = dto.Name,
            Category = dto.Category,
            Description = dto.Description,
            TotalQuantity = dto.TotalQuantity,
            AvailableQuantity = dto.TotalQuantity,
            OwnerId = owner.Id,
            OwnerName = owner.FullName,
            OwnerEmail = owner.Email,
            OwnerPhone = owner.Phone,
            ImageUrl = imageUrl,
            CreatedAt = DateTime.Now
        };

        _context.Tools.Add(tool);
        await _context.SaveChangesAsync();
        return Ok(tool);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateTool(int id, [FromBody] CreateToolDto dto)
    {
        var tool = await _context.Tools.FindAsync(id);
        if (tool == null) return NotFound();

        // 1. حساب عدد القطع المستعارة حالياً (التي لم يتم تأكيد إرجاعها بعد)
        var activeBorrowsCount = await _context.BorrowRecords
            .Where(b => b.ToolId == id && !b.IsOwnerApproved)
            .SumAsync(b => b.Quantity);

        // 2. تحديث البيانات الأساسية
        tool.Name = dto.Name;
        tool.Category = dto.Category;
        tool.Description = dto.Description;
        tool.TotalQuantity = dto.TotalQuantity;
        tool.UpdatedAt = DateTime.UtcNow;
        // 3. إعادة حساب الكمية المتاحة = الكمية الكلية الجديدة - القطع المستعارة حالياً
        tool.AvailableQuantity = dto.TotalQuantity - activeBorrowsCount;
        if (tool.AvailableQuantity < 0) tool.AvailableQuantity = 0;

        await _context.SaveChangesAsync();
        return Ok(tool);
    }


    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTool(int id)
    {
        var tool = await _context.Tools.FindAsync(id);
        if (tool == null) return NotFound();

        // بدلاً من _context.Tools.Remove(tool);
        tool.IsDeleted = true;
        tool.DeletedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("borrow")]
    public async Task<IActionResult> BorrowTool([FromBody] BorrowRequestDto dto)
    {
        var tool = await _context.Tools.FindAsync(dto.ToolId);
        var borrower = await _context.Users.FindAsync(dto.BorrowerId);

        if (tool == null || borrower == null) return NotFound();
        if (tool.OwnerId == borrower.Id) return BadRequest("لا يمكنك استعارة أداة قمت بنشرها بنفسك");

        var existing = await _context.BorrowRecords.AnyAsync(r => r.ToolId == dto.ToolId && r.BorrowerId == dto.BorrowerId && !r.IsOwnerApproved);
        if (existing) return BadRequest("لديك طلب استعارة قائم بالفعل لهذه الأداة");

        if (tool.AvailableQuantity < dto.Quantity) return BadRequest("الكمية المطلوبة غير متوفرة");

        tool.AvailableQuantity -= dto.Quantity;

        var record = new BorrowRecord
        {
            ToolId = tool.Id,
            ToolName = tool.Name,
            BorrowerId = borrower.Id,
            BorrowerName = borrower.FullName,
            BorrowerEmail = borrower.Email,
            BorrowerPhone = borrower.Phone,
            Quantity = dto.Quantity,
            ExpectedReturnDate = dto.ExpectedReturnDate,
            BorrowedAt = DateTime.Now
        };

        _context.BorrowRecords.Add(record);
        await _context.SaveChangesAsync();
        return Ok(record);
    }

    [HttpPost("request-return/{recordId}")]
    public async Task<IActionResult> RequestReturn(int recordId)
    {
        var record = await _context.BorrowRecords.FindAsync(recordId);
        if (record == null) return NotFound();

        record.IsReturnRequested = true;
        record.ReturnRequestedAt = DateTime.Now;
        await _context.SaveChangesAsync();
        return Ok(record);
    }

    [HttpPost("approve-return/{recordId}")]
    public async Task<IActionResult> ApproveReturn(int recordId)
    {
        var record = await _context.BorrowRecords.FindAsync(recordId);
        if (record == null) return NotFound();

        var tool = await _context.Tools.FindAsync(record.ToolId);
        if (tool != null) tool.AvailableQuantity += record.Quantity;

        record.IsOwnerApproved = true;
        record.ReturnedAt = DateTime.Now;
        await _context.SaveChangesAsync();
        return Ok(record);
    }

    [HttpGet("history")]
    public async Task<IActionResult> GetHistory()
    {
        return Ok(await _context.BorrowRecords.OrderByDescending(r => r.BorrowedAt).ToListAsync());
    }
}