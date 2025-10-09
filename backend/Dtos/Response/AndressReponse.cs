namespace QBooking.Dtos.Response
{
    public class ProvinceDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Slug { get; set; }
        public string Code { get; set; }
        public string Region { get; set; }
        public string Type { get; set; }
    }
    public class ProvinceAdminDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Slug { get; set; }
        public string Code { get; set; }
        public string Region { get; set; }
        public string Type { get; set; }

        public bool IsActive { get; set; }
    }
    /* -----------------------------Võ Tấn Qui-------------------------------------- */


    public class CommuneDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Slug { get; set; }
        public string Code { get; set; }
        public string Type { get; set; }
        public string ProvinceName { get; set; }
        public string ProvinceCode { get; set; }
    }
    public class CommuneAdminDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Slug { get; set; }
        public string Code { get; set; }
        public string Type { get; set; }
        public string ProvinceName { get; set; }
        public string ProvinceCode { get; set; }
        public bool IsActive { get; set; } // thêm để admin thấy trạng thái
    }
}
