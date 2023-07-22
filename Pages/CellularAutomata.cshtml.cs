using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace conway_life.Pages;

public class CellularAutomataModel : PageModel
{
    private readonly ILogger<CellularAutomataModel> _logger;

    public CellularAutomataModel(ILogger<CellularAutomataModel> logger)
    {
        _logger = logger;
    }

    public void OnGet()
    {

    }
}
