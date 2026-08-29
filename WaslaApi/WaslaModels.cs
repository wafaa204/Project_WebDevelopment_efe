namespace WaslaApi.Models;

public class Tool
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public string Category { get; set; } = string.Empty;
    public int TotalQuantity { get; set; }
    public int AvailableQuantity { get; set; }
    public string? Description { get; set; }
    public int OwnerId { get; set; }
    public string OwnerName { get; set; } = string.Empty;
    public string OwnerEmail { get; set; } = string.Empty;
    public string OwnerPhone { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.Now;

    // --- حقول الحذف الناعم والتعديل ---
        public bool IsDeleted { get; set; } = false;
        public DateTime? DeletedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
}

public class BorrowRecord
{
    public int Id { get; set; }
    public int ToolId { get; set; }
    public string ToolName { get; set; } = string.Empty;
    public int BorrowerId { get; set; }
    public string BorrowerName { get; set; } = string.Empty;
    public string BorrowerEmail { get; set; } = string.Empty;
    public string BorrowerPhone { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public DateTime BorrowedAt { get; set; } = DateTime.Now;
    public DateTime ExpectedReturnDate { get; set; }
    public bool IsReturnRequested { get; set; } = false;
    public DateTime? ReturnRequestedAt { get; set; }
    public bool IsOwnerApproved { get; set; } = false;
    public DateTime? ReturnedAt { get; set; }
}

public class User
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? VerificationCode { get; set; }
    public string? Code { get; set; }
    public bool IsPhoneVerified { get; set; } = false;
}

public class RegisterDto
{
    public string Name { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
}

public class VerifyDto
{
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? VerificationCode { get; set; }
    public string? Code { get; set; }
}

public class CreateToolDto
{
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public int TotalQuantity { get; set; }
    public string? Description { get; set; }
    public int OwnerId { get; set; }
    public string OwnerName { get; set; } = string.Empty;
    public string OwnerEmail { get; set; } = string.Empty;
    public string OwnerPhone { get; set; } = string.Empty;
}

public class BorrowRequestDto
{
    public int ToolId { get; set; }
    public int BorrowerId { get; set; }
    public string BorrowerName { get; set; } = string.Empty;
    public string BorrowerEmail { get; set; } = string.Empty;
    public string BorrowerPhone { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public DateTime ExpectedReturnDate { get; set; }
}