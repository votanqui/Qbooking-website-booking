

namespace QBooking.Models
{
    public class Commune
    {
        public int Id { get; set; }
        public int ProvinceId { get; set; }
        public string Name { get; set; }
        public string Slug { get; set; }
        public string Code { get; set; }
        public string Type { get; set; }
        public bool IsActive { get; set; } = true;


        public Province Province { get; set; }
        public ICollection<User> Users { get; set; } = new List<User>();

    }
}
