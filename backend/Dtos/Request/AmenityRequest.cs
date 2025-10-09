namespace QBooking.Dtos.Request
{
    public class CreateAmenityCategoryRequest
    {
        public string Name { get; set; }
        public string Slug { get; set; }
        public string Icon { get; set; }
        public string Description { get; set; }
        public int SortOrder { get; set; } = 0;
    }

    /* ------------------------------------------------------------------- */



    public class UpdateAmenityCategoryRequest
    {
        public string Name { get; set; }
        public string Slug { get; set; }
        public string Icon { get; set; }
        public string Description { get; set; }
        public int SortOrder { get; set; }
    }


    /* ------------------------------------------------------------------- */

    public class CreateAmenityRequest
    {
        public int CategoryId { get; set; }
        public string Name { get; set; }
        public string Slug { get; set; }
        public string Icon { get; set; }
        public string Description { get; set; }
        public bool IsPopular { get; set; } = false;
        public int SortOrder { get; set; } = 0;
    }


    /* ------------------------------------------------------------------- */
    public class UpdateAmenityRequest
    {
        public int CategoryId { get; set; }
        public string Name { get; set; }
        public string Slug { get; set; }
        public string Icon { get; set; }
        public string Description { get; set; }
        public bool IsPopular { get; set; }
        public int SortOrder { get; set; }
    }
    public class UpdateSortOrderRequest
    {
        public int SortOrder { get; set; }
    }
}
