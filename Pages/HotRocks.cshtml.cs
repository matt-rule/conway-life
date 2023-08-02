using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace conway_life.Pages;

public class HotRocksModel : PageModel
{
    private readonly ILogger<HotRocksModel> _logger;

    public HotRocksModel(ILogger<HotRocksModel> logger)
    {
        _logger = logger;
    }

    public void OnGet()
    {

    }
}
