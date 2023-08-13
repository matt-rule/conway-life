using Microsoft.AspNetCore.Mvc.RazorPages;

namespace conway_life.Pages;

public class D3ForceSimulationModel : PageModel
{
    private readonly ILogger<D3ForceSimulationModel> _logger;

    public D3ForceSimulationModel(ILogger<D3ForceSimulationModel> logger)
    {
        _logger = logger;
    }

    public void OnGet()
    {

    }
}
