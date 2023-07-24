using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace conway_life.Pages;

public class MandelbrotFractalModel : PageModel
{
    private readonly ILogger<MandelbrotFractalModel> _logger;

    public MandelbrotFractalModel(ILogger<MandelbrotFractalModel> logger)
    {
        _logger = logger;
    }

    public void OnGet()
    {

    }
}
