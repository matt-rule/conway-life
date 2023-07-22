const MAX_ORGANISMS: number = 16;

const PANEL_WIDTH: number = 142;

var generation: number = 0;
var list_selected: boolean[] = [];
var number_selected: number = 0;
var errorVisible: boolean = false;

initialise_canvases();
add_event_listeners();

function initialise_canvases(): void
{
	for (var org: number = 0; org < MAX_ORGANISMS; org++)
	{
		var str_canvas_ID: string = "canvas_" + (org);
		var elem: HTMLCanvasElement = document.getElementById(str_canvas_ID) as HTMLCanvasElement;
        if (elem)
        {
            elem.style.width = '142px';
            elem.style.height = '142px';

            elem.width = 142;
            elem.height = 142;
        }
	}
}

// Add all event listeners to buttons
function add_event_listeners(): void
{
	for (var org: number = 0; org < MAX_ORGANISMS; org++)
	{
		var str_button_ID: string = "canvas_" + (org);
		var elem: HTMLCanvasElement = document.getElementById(str_button_ID) as HTMLCanvasElement;
        if (elem)
            elem.addEventListener('mousedown', organism_click);
	}
	
    var init_btn = document.getElementById("initialise_button");
    var repl_btn = document.getElementById("replicate_button");
    var elitism_btn = document.getElementById("fitness_based_selection_button");
    // var clos_btn = document.getElementById("close_button");

    if (init_btn)
        init_btn.addEventListener('mouseup', initialise_btn_click);
    if (repl_btn)
        repl_btn.addEventListener('mouseup', replicate_btn_click);
    if (elitism_btn)
        elitism_btn.addEventListener('mouseup', elitism_select_reproduce);
}

function organism_click(event: any): void
{
	if (!errorVisible)
	{		
		for (var org: number = 0; org < MAX_ORGANISMS; org++)
		{
			var str_button_ID: string = "canvas_" + (org);

            let elem: HTMLCanvasElement = event.target as HTMLCanvasElement;

			if (str_button_ID == elem.id)
			{
				if (list_selected[org])
				{
					list_selected[org] = false;
				}
				else
				{
					if (number_selected < 4)
					{
						list_selected[org] = true;
					}
				}
				
				update_number_selected();
				update_selection_display();
			}
		}
	}
}

function initialise_btn_click(): void
{
    
}

function replicate_btn_click(): void
{
    
}

function elitism_select_reproduce(): void
{
    
}

function close_btn_click(): void
{
    
}

// TODO: remove this function and associated variable, use array length
function update_number_selected(): void
{
	number_selected = 0;
	for (var org: number = 0; org < MAX_ORGANISMS; org++)
	{
		if ( list_selected[org] )
		{
			number_selected++;
		}
	}
}

function update_selection_display():void
{
    var info_box: HTMLDivElement = document.getElementById("info_panel") as HTMLDivElement;
    if (!info_box)
        return;

    info_box.innerHTML = "";
    info_box.innerHTML += "GENERATION " + generation + "<br>";
    info_box.innerHTML += number_selected + " ORGANISM(S) SELECTED<br><br>";
		
	for (var org: number = 0; org < MAX_ORGANISMS; org++)
	{
		var str_select_ID: string = "canvas_" + (org);
		var elem: HTMLCanvasElement = document.getElementById(str_select_ID) as HTMLCanvasElement;
        const ctx = elem.getContext('2d');

        if(ctx) {
            ctx.clearRect(0, 0, elem.width, elem.height);
            
            if (list_selected[org] == true) {
                ctx.strokeStyle = "#FF0000";
                ctx.lineWidth = 4;
                
                // top left
                ctx.beginPath();
                ctx.moveTo(10, 30);
                ctx.lineTo(10, 10);
                ctx.lineTo(30, 10);
                ctx.stroke();
        
                // top right
                ctx.beginPath();
                ctx.moveTo(PANEL_WIDTH - 30, 10);
                ctx.lineTo(PANEL_WIDTH - 10, 10);
                ctx.lineTo(PANEL_WIDTH - 10, 30);
                ctx.stroke();
        
                // bottom right
                ctx.beginPath();
                ctx.moveTo(PANEL_WIDTH - 10, PANEL_WIDTH - 30);
                ctx.lineTo(PANEL_WIDTH - 10, PANEL_WIDTH - 10);
                ctx.lineTo(PANEL_WIDTH - 30, PANEL_WIDTH - 10);
                ctx.stroke();
        
                // bottom left
                ctx.beginPath();
                ctx.moveTo(30, PANEL_WIDTH - 10);
                ctx.lineTo(10, PANEL_WIDTH - 10);
                ctx.lineTo(10, PANEL_WIDTH - 30);
                ctx.stroke();

                // TODO
                // let info_box = document.getElementById("info_box") as HTMLElement; // Change "info_box" to the ID of your actual info box div
                // info_box.textContent += `- ORGANISM ${org}\n`;
                // info_box.textContent += `Subdivisions: ${Math.round(genotype[org][1])}, `;
                // info_box.textContent += `Mean Branch Angle: ${Math.round(genotype[org][2])}, `;
                // info_box.textContent += `Mean Branch Length: ${Math.round(genotype[org][3])}, `;
                // info_box.textContent += `Thickness at base of trunk: ${Math.round(genotype[org][3])}\n`;
            }
        }
	}
}
