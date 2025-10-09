using Microsoft.AspNetCore.SignalR;

namespace QBooking.Hubs
{
    public class NotificationHub : Hub
    {
        // Khi user kết nối, lưu ConnectionId theo UserId
        public async Task RegisterUser(int userId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
        }

        // Khi user ngắt kết nối
        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            // Xử lý cleanup nếu cần
            await base.OnDisconnectedAsync(exception);
        }

        // Method để client có thể đánh dấu đã đọc
        public async Task MarkAsRead(int notificationId)
        {
            // Gọi service để update database
            await Clients.Caller.SendAsync("NotificationRead", notificationId);
        }
    }
}