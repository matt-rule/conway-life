using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace conway_life.Pages;

public class VoxelTerrainModel : PageModel
{
    private readonly ILogger<VoxelTerrainModel> _logger;

    public VoxelTerrainModel(ILogger<VoxelTerrainModel> logger)
    {
        _logger = logger;
    }

    public void OnGet()
    {

    }
}
