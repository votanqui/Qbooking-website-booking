namespace QBooking.Dtos.Response
{
    public class FavoriteDto
    {
        public int Id { get; set; }
        public int PropertyId { get; set; }
        public string PropertyName { get; set; }
        public string Slug { get; set; }
        public string PropertyImage { get; set; } // Ảnh chính
        public string ProvinceName { get; set; }
        public string CommuneName { get; set; }
        public string ProductTypeName { get; set; }
        public List<AmenityDto> Amenities { get; set; } = new List<AmenityDto>();
        public DateTime CreatedAt { get; set; }
    }

    public class AmenityDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public bool IsFree { get; set; }
        public string AdditionalInfo { get; set; }
    }

    public class FavoriteToggleResult
    {
        public bool IsAdded { get; set; }
        public int PropertyId { get; set; }
    }
    public class AdminFavoriteDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string UserEmail { get; set; } = string.Empty;
        public int PropertyId { get; set; }
        public string PropertyName { get; set; } = string.Empty;
        public string PropertySlug { get; set; } = string.Empty;
        public string PropertyImage { get; set; } = string.Empty;
        public string ProvinceName { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    public class FavoriteStatisticsDto
    {
        public int TotalFavorites { get; set; }
        public int TotalUsersWithFavorites { get; set; }
        public int TotalPropertiesFavorited { get; set; }
        public int FavoritesLast30Days { get; set; }
        public int FavoritesLast7Days { get; set; }
        public int FavoritesToday { get; set; }
        public double AverageFavoritesPerUser { get; set; }
    }

    public class TopFavoritePropertyDto
    {
        public int PropertyId { get; set; }
        public string PropertyName { get; set; } = string.Empty;
        public string PropertySlug { get; set; } = string.Empty;
        public string PropertyImage { get; set; } = string.Empty;
        public string ProvinceName { get; set; } = string.Empty;
        public string ProductTypeName { get; set; } = string.Empty;
        public int FavoriteCount { get; set; }
    }

    public class TopFavoriteUserDto
    {
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string UserEmail { get; set; } = string.Empty;
        public int FavoriteCount { get; set; }
        public DateTime LastFavoriteDate { get; set; }
    }

    public class FavoriteTimelineDto
    {
        public string Period { get; set; } = string.Empty;
        public int Count { get; set; }
        public DateTime Date { get; set; }
    }
}
