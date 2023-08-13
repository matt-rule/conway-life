import * as d3 from 'd3';
import * as d3Force from 'd3-force';

class Node {
    public name: string;
    public index: number;
    public x: number;
    public y: number;
    public vx: number;
    public vy: number;

    constructor(name: string, index: number) {
        this.name = name;
        this.index = index;
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
    }
}

interface Edge {
    source: Node;
    target: Node;
}

interface Dataset {
    nodes: Node[];
    edges: Edge[];
}

const LINK_DISTANCE: number = 120;
const CIRCLE_RADIUS: number = 15;
const TEXT_OFFSET_Y: number = 30;
const CHARGE_STRENGTH: number = -200;
const GRAVITY_STRENGTH_X: number = 0.02;
const GRAVITY_STRENGTH_Y: number = 0.03;

//Width and height
var svgWidth = 1800;
var svgHeight = 800;
//Original data
let initNodes = [
        new Node("Northern Undead Asylum", 0 ),
        new Node("Firelink Shrine", 1 ),
        new Node("Undead Burg", 2 ),
        new Node("Undead Parish", 3 ),
        new Node("Lower Undead Burg", 4 ),
        new Node("Depths", 5 ),
        new Node("Blighttown", 6 ),
        new Node("Quelaag's Domain", 7 ),
        new Node("The Great Hollow", 8 ),
        new Node("Ash Lake", 9 ),
        new Node("Sen's Fortress", 10 ),
        new Node("Anor Londo", 11 ),
        new Node("Painted World of Ariamis", 12 ),
        new Node("Darkroot Garden", 13 ),
        new Node("Darkroot Basin", 14 ),
        new Node("New Londo Ruins", 15 ),
        new Node("The Duke's Archives", 16 ),
        new Node("Crystal Caves", 17 ),
        new Node("Demon Ruins", 18 ),
        new Node("Lost Izalith", 19 ),
        new Node("The Catacombs", 20 ),
        new Node("Tomb of the Giants", 21 ),
        new Node("Firelink Altar", 22 ),
        new Node("Kiln of the First Flame", 23 ),
        new Node("Valley of the Drakes", 24 ),
        new Node("Sanctuary Garden", 25 ),
        new Node("Oolacile Sanctuary", 26 ),
        new Node("Royal Wood", 27 ),
        new Node("Oolacile Township", 28 ),
        new Node("Chasm of the Abyss", 29 ),
        new Node("Battle of Stoicism", 30 ),
        new Node("The Abyss", 31 ),
    ];
var dataset: Dataset = {
    nodes: initNodes,
    edges: [
        // Tutorial
        { source: initNodes[0], target: initNodes[1] },

        // First areas
        { source: initNodes[1], target: initNodes[2] },
        { source: initNodes[1], target: initNodes[3] },
        { source: initNodes[2], target: initNodes[3] },

        // Towards Quelaag, the long route
        { source: initNodes[3], target: initNodes[4] },
        { source: initNodes[4], target: initNodes[5] },
        { source: initNodes[5], target: initNodes[6] },
        { source: initNodes[6], target: initNodes[7] },

        // Towards Ash Lake
        { source: initNodes[6], target: initNodes[8] },
        { source: initNodes[8], target: initNodes[9] },
        
        // Sen's Fortress / Anor Londo
        { source: initNodes[3], target: initNodes[10] },
        { source: initNodes[10], target: initNodes[11] },

        // Painted World
        { source: initNodes[11], target: initNodes[12] },
        
        // Darkroot: 
        { source: initNodes[3], target: initNodes[13] },
        { source: initNodes[2], target: initNodes[14] },
        { source: initNodes[13], target: initNodes[14] },

        // Lord Soul 1: Four Kings: linear
        { source: initNodes[1], target: initNodes[15] },
        { source: initNodes[15], target: initNodes[31] },

        // Lord Soul 2: Seath: linear
        { source: initNodes[11], target: initNodes[16] },
        { source: initNodes[16], target: initNodes[17] },

        // Lord Soul 3: BoC: linear
        { source: initNodes[7], target: initNodes[18] },
        { source: initNodes[18], target: initNodes[19] },

        // Lord Soul 4: Nito: linear
        { source: initNodes[1], target: initNodes[20] },
        { source: initNodes[20], target: initNodes[21] },

        // Endgame: linear
        { source: initNodes[1], target: initNodes[22] },
        { source: initNodes[22], target: initNodes[23] },

        // Valley of the Drakes: optional
        { source: initNodes[24], target: initNodes[6] },
        { source: initNodes[24], target: initNodes[14] },
        { source: initNodes[24], target: initNodes[15] },

        // DLC
        { source: initNodes[14], target: initNodes[25] },
        { source: initNodes[25], target: initNodes[26] },
        { source: initNodes[26], target: initNodes[27] },
        { source: initNodes[27], target: initNodes[28] },
        { source: initNodes[28], target: initNodes[29] },
        { source: initNodes[27], target: initNodes[30] },
    ]
};

var simulation: d3.Simulation<d3.SimulationNodeDatum, d3.SimulationLinkDatum<d3.SimulationNodeDatum>> = d3.forceSimulation()
    .force("center", d3.forceCenter(svgWidth / 2, svgHeight / 2))
    .force("link", d3.forceLink().id(function (d, i) {
        return i;
    }).distance( LINK_DISTANCE ))
    .force("gravityX", d3.forceX(svgWidth / 2).strength(GRAVITY_STRENGTH_X))
    .force("gravityY", d3.forceY(svgHeight / 2).strength(GRAVITY_STRENGTH_Y))
    .force("charge", d3.forceManyBody().strength(CHARGE_STRENGTH));

var colors = d3.scaleOrdinal(d3.schemeCategory10);

//Create SVG element
var svg = d3.select("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight);

var edges = svg.append('g')
    .attr('class', 'links')
    .selectAll("line")
    .data(dataset.edges)
    .enter()
    .append("line");

var node: d3.Selection<SVGCircleElement, Node, SVGGElement, unknown> = svg.append('g')
    .attr('class', 'nodes')
    .selectAll('circle')
    .data(dataset.nodes)
    .enter()
    .append("circle")
    .attr("r", CIRCLE_RADIUS)
    .attr('fill', function (d, i) {
        return colors(i.toString())
    })
    .call(
        d3.drag<SVGCircleElement, Node>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended)
    ) as d3.Selection<SVGCircleElement, Node, SVGGElement, unknown>;

var nodes_text = svg.selectAll(".nodetext")
    .data(dataset.nodes)
    .enter()
    .append("text")
    .attr("class", "nodetext unselectable slds-text-heading--label")
    .attr("text-anchor", "middle")
    .attr("dx", 0)
    .attr("dy", TEXT_OFFSET_Y)
    .text(function (d) {
        return d.name;
    });

simulation
    .nodes(dataset.nodes)
    .on("tick", ticked);
let linkForce = simulation.force("link") as d3.ForceLink<d3.SimulationNodeDatum, d3.SimulationLinkDatum<d3.SimulationNodeDatum>> | undefined;
if (linkForce) {
    linkForce.links(dataset.edges);
}
function ticked() {
    edges
        .attr("x1", function (d) {
            var xPos = d.source.x;
            if (xPos < 0) return 0;
            if (xPos > (svgWidth - CIRCLE_RADIUS)) return (svgWidth - CIRCLE_RADIUS);
            return xPos;
        })
        .attr("y1", function (d) {
            var yPos = d.source.y;
            if (yPos < 0) return 0;
            if (yPos > (svgHeight - CIRCLE_RADIUS)) return (svgHeight - CIRCLE_RADIUS);
            return yPos;
        })
        .attr("x2", function (d) {
            var xPos = d.target.x;
            if (xPos < 0) return 0;
            if (xPos > (svgWidth - CIRCLE_RADIUS)) return (svgWidth - CIRCLE_RADIUS);
            return xPos;
        })
        .attr("y2", function (d) {
            var yPos = d.target.y;
            if (yPos < 0) return 0;
            if (yPos > (svgHeight - CIRCLE_RADIUS)) return (svgHeight - CIRCLE_RADIUS);
            return yPos;
        });

    node
        .attr("cx", function (d) {
            var xPos = d.x;
            if (xPos < 0) return 0;
            if (xPos > (svgWidth - CIRCLE_RADIUS)) return (svgWidth - CIRCLE_RADIUS);
            return xPos;
        })
        .attr("cy", function (d) {
            var yPos = d.y;
            if (yPos < 0) return 0;
            if (yPos > (svgHeight - CIRCLE_RADIUS)) return (svgHeight - CIRCLE_RADIUS);
            return yPos;
        });

    nodes_text
        .attr("x", function (d) {
            var xPos = d.x;
            if (xPos < 0) return 0;
            if (xPos > (svgWidth - CIRCLE_RADIUS)) return (svgWidth - CIRCLE_RADIUS);
            return xPos;
        })
        .attr("y", function (d) {
            var yPos = d.y;
            if (yPos < 0) return 0;
            if (yPos > (svgHeight - CIRCLE_RADIUS)) return (svgHeight - CIRCLE_RADIUS);
            return yPos;
        });
}

function dragstarted(event: d3.D3DragEvent<Element, unknown, unknown>, d: d3Force.SimulationNodeDatum) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
}

function dragged(event: d3.D3DragEvent<Element, unknown, unknown>, d: d3Force.SimulationNodeDatum) {
    d.fx = event.x;
    d.fy = event.y;
}

function dragended(event: d3.D3DragEvent<Element, unknown, unknown>, d: d3Force.SimulationNodeDatum) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
}

function infoMenuMouseDown() {
    let menuContainer = document.getElementById("hideable-info-menu-content-container");
    if (!menuContainer)
        return;

    menuContainer.classList.toggle('hidden');
}

let infoMenuButton = document.getElementById("info-menu-div");
if (infoMenuButton) {
    infoMenuButton.addEventListener('mousedown', infoMenuMouseDown);
}
