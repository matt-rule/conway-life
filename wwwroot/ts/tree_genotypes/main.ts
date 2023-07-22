import { vec3, mat4 } from "gl-matrix";

const MAX_ORGANISMS: number = 16;
const MAX_GENES: number = 8;
const MAX_PARENTS: number = 4;				// number of parent organisms to select
const MAX_CHILDREN: number = 4;				// number offspring per selected parent

// gene [0]: leaf colour
const LEAF_COLOUR_MUTATION: number = 0.1;
const LEAF_COLOUR_OPTIMAL: number = 0.6;

// gene [1]: number of divisons
const SUBDIVISIONS_MEAN: number = 7;
const SUBDIVISIONS_VARIATION: number = 4;
const SUBDIVISIONS_MUTATION: number = 0.5;
const SUBDIVISIONS_OPTIMAL: number = 8;

// gene [2]: mean branch angle
const BRANCH_ANGLE_DEGREES_MEAN_MEAN: number = 45;
const BRANCH_ANGLE_DEGREES_MEAN_VARIATION: number = 30;
const BRANCH_ANGLE_DEGREES_MEAN_MUTATION: number = 3;
const BRANCH_ANGLE_DEGREES_MEAN_OPTIMAL: number = 50;

// gene [3]: mean branch length
const BRANCH_LENGTH_MEAN_MEAN: number = 30;
const BRANCH_LENGTH_MEAN_VARIATION: number = 20;
const BRANCH_LENGTH_MEAN_MUTATION: number = 1;
const BRANCH_LENGTH_MEAN_OPTIMAL: number = 30;

// gene [4]: mean trunk base thickness
const TRUNK_BASE_THICKNESS_MEAN: number = 5;
const TRUNK_BASE_THICKNESS_VARIATION: number = 8;
const TRUNK_BASE_THICKNESS_MUTATION: number = 0.25;
const TRUNK_BASE_THICKNESS_OPTIMAL: number = 6;

// gene [5]: branch angle variation
const BRANCH_ANGLE_DEGREES_VARIATION_MEAN: number = 30;
const BRANCH_ANGLE_DEGREES_VARIATION_VARIATION: number = 15;
const BRANCH_ANGLE_DEGREES_VARIATION_MUTATION: number = 1.5;
const BRANCH_ANGLE_DEGREES_VARIATION_OPTIMAL: number = 30;

// gene [6]: branch length variation
const BRANCH_LENGTH_VARIATION_MEAN: number = 0.8;
const BRANCH_LENGTH_VARIATION_VARIATION: number = 0.4;
const BRANCH_LENGTH_VARIATION_MUTATION: number = 0.02;
const BRANCH_LENGTH_VARIATION_OPTIMAL: number = 1.5;

const PANEL_WIDTH: number = 142;

const SCALE_LEN_BASE: number = 0.65;
const SCALE_LEN_MAIN: number = 0.8;
const SCALE_THICKNESS: number = 0.4;

function degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
}

export class Branch3D {
    public order: number;
    public vA: vec3;
    public vB: vec3;
    public thicknessA: number;
    public thicknessB: number;

    constructor(iOrder: number, ivA: vec3, ivB: vec3, iThicknessA: number, iThicknessB: number) {
        this.order = iOrder;
        this.vA = ivA;
        this.vB = ivB;
        this.thicknessA = iThicknessA;
        this.thicknessB = iThicknessB;
    }
}

var genotype: number[][] = [];
var generation: number = 0;
var list_selected: boolean[] = [];
var number_selected: number = 0;
var branches: Branch3D[][] = [];
var errorVisible: boolean = false;
var initialised: boolean = false;

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
                show_phenotype();
				update_selection_display();
			}
		}
	}
}

function initialise_btn_click(): void
{
	if (!errorVisible)
	{
		initialised = true;
		clear();
		random_genotype_initialisation();
		create_trees();
		show_phenotype();
		update_selection_display();
	}
}

function replicate_btn_click(): void
{
	if (initialised)
	{
		// if (!errorVisible)
		// {
		// 	// doesn't process if the wrong number of organisms are selected
		// 	if (number_selected == MAX_PARENTS)
		// 	{	
		// 		replicate_new_generation(event);
		// 		clear(event);
		// 		mutate_new_generation();
		// 		generation++;
		// 		create_trees();
		// 		show_phenotype();
		// 		update_selection_display();
		// 	}
		// 	else
		// 	{
		// 		errorVisible = true;
		// 		error_dialog.visible = true;
		// 		clos_btn.visible = true;
		// 		error_text.visible = true;
		// 		error_text.text_box.text = "FIRST SELECT 4 ORGANISMS FOR REPLICATION.";
		// 	}
		// }
	}
	else
	{		
		// errorVisible = true;
		// error_dialog.visible = true;
		// clos_btn.visible = true;
		// error_text.visible = true;
		// error_text.text_box.text = "PLEASE BEGIN BY INITIALISING THE GENOTYPE.";
	}
}

function elitism_select_reproduce(): void
{
    
}

function close_btn_click(): void
{
    
}

// deselect all organisms
function deselect_all():void
{
	for (var org: number = 0; org < MAX_ORGANISMS; org++)
	{
		list_selected[org] = false;
	}
	number_selected = 0;
}

function random_range_integer(min: number, max: number): number
{
	// returns a random integer number between two extremes min and max
	var randominteger: number = Math.floor(Math.random()*(max-min+1))+min;
	return randominteger;
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
        if (!elem)
            continue;
        const ctx = elem.getContext('2d');

        if(ctx) {
            //ctx.clearRect(0, 0, elem.width, elem.height);
            
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

function replicate_new_generation(event:MouseEvent): void
{

}

function calculate_fitnesses(): void
{

}

function mutate_new_generation(): void
{

}

function recursive_add_branch(org: number, level: number, beginPos: vec3, orient: mat4, len: number, trunkThickness: number): void
{
	let currLen: number = len - len * genotype[org][6] / 2 + Math.random() * len * genotype[org][6];
	let newVec: vec3 = vec3.fromValues(0, currLen, 0);
    
    vec3.transformMat4(newVec, newVec, orient);
    // if (level === 0)
    // {
    //     console.log("beginPos", beginPos);
    //     console.log("newVec", newVec);
    // }
    
    let endPos: vec3 = vec3.create();
    vec3.add(endPos, beginPos, newVec);
    // if (level === 0)
    //     console.log("endPos", endPos);
    
    branches[org].push(new Branch3D(level, beginPos, endPos, trunkThickness, trunkThickness * SCALE_THICKNESS));
    // if (level === 0)
    // {
    //     console.log('branches[org].length()', branches[org].length);
    //     console.log('branches[org][0]', branches[org][0]);
    // }

    let initMatY: mat4 = mat4.create();
    let finalMat: mat4 = mat4.clone(orient);
    let angleY: number;
    let numBranches: number = random_range_integer(2, 3);
    mat4.rotateY(initMatY, initMatY, 2 * Math.PI * Math.random());
    
    if (level < Math.floor(genotype[org][1]) - 1) {
        for (angleY = 0; angleY < Math.PI * 2; angleY += (Math.PI * 2 / numBranches)) {
            finalMat = mat4.clone(orient);
            mat4.multiply(finalMat, initMatY, finalMat);
            mat4.rotateY(finalMat, finalMat, angleY);
            mat4.rotateZ(finalMat, finalMat, degreesToRadians(genotype[org][2]) * Math.random());
            recursive_add_branch(org, level + 1, endPos, finalMat, len * SCALE_LEN_MAIN, trunkThickness * SCALE_THICKNESS);
        }
    }
    
    if (level == 0) {
        let midPos: vec3 = vec3.clone(newVec);
        vec3.scale(midPos, midPos, 0.5);
        vec3.add(midPos, beginPos, midPos);
        
        for (angleY = 0; angleY < Math.PI * 2; angleY += (Math.PI * 2 / numBranches)) {
            finalMat = mat4.clone(orient);
            mat4.multiply(finalMat, initMatY, finalMat);
            mat4.rotateY(finalMat, finalMat, angleY);
            mat4.rotateZ(finalMat, finalMat, degreesToRadians(genotype[org][2]) * Math.random());
            recursive_add_branch(org, level + 1, midPos, finalMat, len * SCALE_LEN_BASE, trunkThickness * SCALE_THICKNESS);

            // debug only; TODO: remove
            // var v: vec3 = vec3.fromValues(0,1,0);
            // var v2: vec3 = vec3.fromValues(0,1,0);
            // vec3.transformMat4(v2, v, finalMat);
        }
    }
}

function create_trees(): void
{
	branches = [];
	var org: number = 0;
	
	for (org = 0; org < MAX_ORGANISMS; org++)
	{
		branches[org] = [];
	}
	
	for (org = 0; org < MAX_ORGANISMS; org++)
	{
		const initialOrient: mat4 = mat4.create();
		recursive_add_branch(org, 0, vec3.fromValues(PANEL_WIDTH / 2, 0, 0), initialOrient, genotype[org][3], genotype[org][4]);
	}
}

function random_genotype_initialisation(): void
{
	generation = 0;			// increment this where necessary!!
	number_selected = 0;
	
	var genotype_1organism: number[] = [];
	
	for (var org: number = 0; org < MAX_ORGANISMS; org++)
	{
		deselect_all();
		
		genotype_1organism[0] = Math.random();
		genotype_1organism[1] = SUBDIVISIONS_MEAN - SUBDIVISIONS_VARIATION/2 + Math.random() * SUBDIVISIONS_VARIATION;
		genotype_1organism[2] = BRANCH_ANGLE_DEGREES_MEAN_MEAN - BRANCH_ANGLE_DEGREES_MEAN_VARIATION/2 + Math.random() * BRANCH_ANGLE_DEGREES_MEAN_VARIATION;
		genotype_1organism[3] = BRANCH_LENGTH_MEAN_MEAN - BRANCH_LENGTH_MEAN_VARIATION/2 + Math.random() * BRANCH_LENGTH_MEAN_VARIATION;
		genotype_1organism[4] = TRUNK_BASE_THICKNESS_MEAN - TRUNK_BASE_THICKNESS_VARIATION/2 + Math.random() * TRUNK_BASE_THICKNESS_VARIATION;
		genotype_1organism[5] = BRANCH_ANGLE_DEGREES_VARIATION_MEAN - BRANCH_ANGLE_DEGREES_VARIATION_VARIATION/2 + Math.random() * BRANCH_ANGLE_DEGREES_VARIATION_VARIATION;
		genotype_1organism[6] = BRANCH_LENGTH_VARIATION_MEAN - BRANCH_LENGTH_VARIATION_VARIATION/2 + Math.random() * BRANCH_LENGTH_VARIATION_VARIATION;
		
		genotype[org] = genotype_1organism.slice();
	}
}

function show_phenotype(): void
{
	let org: number;
    let str_canvas_ID: string;

    for (org = 0; org < MAX_ORGANISMS; org++) {
        str_canvas_ID = "canvas_" + (org);
        let canvasElement = document.getElementById(str_canvas_ID) as HTMLCanvasElement;
        let context = canvasElement.getContext("2d");
        context?.clearRect(0, 0, canvasElement.width, canvasElement.height);

        if (context === null) {
            throw new Error('Cannot get 2D context from the canvas');
        }
        
        for (let i = 0; i < branches[org].length; ++i) {
            // Set the line style
            context.strokeStyle = "#000000"; // black color
            context.lineWidth = 1; // line thickness
    
            let vecA = branches[org][i].vA;
            let vecB = branches[org][i].vB;
			
            let diffVecA = vec3.subtract(vec3.create(), vecA, vecB);
            vec3.normalize(diffVecA, diffVecA);
			
            let diffVecB = vec3.clone(diffVecA);

            // if node is a leaf
            if (branches[org][i].order == Math.floor(genotype[org][1]) - 1) {
                vec3.scale(diffVecA, diffVecA, 2);
                vec3.scale(diffVecB, diffVecB, 2);
            } else {
                vec3.scale(diffVecA, diffVecA, branches[org][i].thicknessA);
                vec3.scale(diffVecB, diffVecB, branches[org][i].thicknessB);
            }

            let perpendicularVecA = vec3.fromValues(-diffVecA[1], diffVecA[0], 0);
            let negPerpendicularVecA = vec3.fromValues(diffVecA[1], -diffVecA[0], 0);
            let perpendicularVecB = vec3.fromValues(-diffVecB[1], diffVecB[0], 0);
            let negPerpendicularVecB = vec3.fromValues(diffVecB[1], -diffVecB[0], 0);
        
			// If node is a leaf
            if (branches[org][i].order == Math.floor(genotype[org][1]) - 1) {
                // determine vector between beginning and end: (vecA+vecB)/2
                let midPoint = vec3.add(vec3.create(), vecA, vecB);
                vec3.scale(midPoint, midPoint, 0.5);

                // determine leaf colours
                let lineRed = Math.floor(0x3F * genotype[org][0]) * 0x10000;
                let lineGreen = 0x3F * 0x100;
                let fillRed = Math.floor(0x7F * genotype[org][0]) * 0x10000;
                let fillGreen = 0x7F * 0x100;

                // specify colours according to genotype (varies between yellow/green)
                context.strokeStyle = `#${(lineRed + lineGreen).toString(16)}`; // convert to hex
                context.fillStyle = `#${(fillRed + fillGreen).toString(16)}`; // convert to hex

                // draw leaf rectangle. 4 vertices, first one = last
                context.beginPath();
                context.moveTo(vecA[0] + perpendicularVecA[0], PANEL_WIDTH -vecA[1] - perpendicularVecA[1]);
                context.lineTo(midPoint[0] + negPerpendicularVecA[0], PANEL_WIDTH -midPoint[1] - negPerpendicularVecA[1]);
                context.lineTo(vecB[0], PANEL_WIDTH -vecB[1]);
                context.lineTo(midPoint[0] + perpendicularVecB[0], PANEL_WIDTH -midPoint[1] - perpendicularVecB[1]);
                context.closePath();
                context.stroke();
                context.fill();
            }
            else {
                // specify branch colour (always black)
                context.fillStyle = "#000000";

                if (i === 0)
                {
                    console.log("vecA", vecA);
                    console.log("vecB", vecB);
                    console.log("perpendicularVecA", perpendicularVecA);
                    console.log("negPerpendicularVecA", negPerpendicularVecA);
                    console.log("negPerpendicularVecB", negPerpendicularVecB);
                    console.log("perpendicularVecB", perpendicularVecB);
                }

                // draw branch rectangle. 4 vertices, first one = last
                context.beginPath();
                context.moveTo(vecA[0] + perpendicularVecA[0], PANEL_WIDTH - vecA[1] - perpendicularVecA[1]);
                context.lineTo(vecA[0] + negPerpendicularVecA[0], PANEL_WIDTH - vecA[1] - negPerpendicularVecA[1]);
                context.lineTo(vecB[0] + negPerpendicularVecB[0], PANEL_WIDTH - vecB[1] - negPerpendicularVecB[1]);
                context.lineTo(vecB[0] + perpendicularVecB[0], PANEL_WIDTH - vecB[1] - perpendicularVecB[1]);
                context.closePath();
                context.fill();
            }
		}
	}
}

function clear(): void
{
	for (var org = 0; org < MAX_ORGANISMS; org++)
	{
		var canvas_ID: string = "canvas_" + (org);
		var elem: HTMLCanvasElement = document.getElementById(canvas_ID) as HTMLCanvasElement;
        if (!elem)
            continue;
        const ctx = elem.getContext('2d');
        if (!ctx)
            continue;
        ctx.clearRect(0, 0, elem.width, elem.height);
	}
}
