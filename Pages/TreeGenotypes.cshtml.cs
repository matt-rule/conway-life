using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace conway_life.Pages;

public class TreeGenotypesModel : PageModel
{
    private readonly ILogger<TreeGenotypesModel> _logger;

    public TreeGenotypesModel(ILogger<TreeGenotypesModel> logger)
    {
        _logger = logger;
    }

    public void OnGet()
    {

    }
}
