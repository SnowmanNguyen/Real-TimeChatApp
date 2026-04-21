using System.ComponentModel.DataAnnotations;

namespace ChatApp.ViewModels
{
    public class RegisterViewModel
    {
        [Required(ErrorMessage = "Tên hiển thị là bắt buộc.")]
        [StringLength(30, MinimumLength = 2, ErrorMessage = "Tên hiển thị phải từ 2 đến 30 ký tự.")]
        public string DisplayName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email là bắt buộc.")]
        [EmailAddress(ErrorMessage = "Email không đúng định dạng.")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Mật khẩu là bắt buộc.")]
        [DataType(DataType.Password)]
        [MinLength(6, ErrorMessage = "Mật khẩu tối thiểu 6 ký tự.")]
        public string Password { get; set; } = string.Empty;

        [Required(ErrorMessage = "Vui lòng nhập lại mật khẩu.")]
        [DataType(DataType.Password)]
        [Compare(nameof(Password), ErrorMessage = "Mật khẩu nhập lại không khớp.")]
        public string ConfirmPassword { get; set; } = string.Empty;
    }
}
