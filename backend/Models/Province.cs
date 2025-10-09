
namespace QBooking.Models
{
    public class Province
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Slug { get; set; }
        public string Code { get; set; }
        public string Region { get; set; }
        public string Type { get; set; } 
        public bool IsActive { get; set; } = true;
        public DateTime? CreatedAt { get; set; } = DateTime.Now;


        public ICollection<Commune> Communes { get; set; } = new List<Commune>();
        public ICollection<User> Users { get; set; } = new List<User>();

    }
}
