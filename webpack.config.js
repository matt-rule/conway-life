const path = require('path');

module.exports = {
    entry: {
        index: ['./wwwroot/ts/project_menu.ts'],
        cellular_automata: ['./wwwroot/ts/cellular_automata/main.ts', './wwwroot/ts/project_menu.ts'],
        d3_force_simulation: ['./wwwroot/ts/d3_force_sim/main.ts', './wwwroot/ts/project_menu.ts'],
        hot_rocks: ['./wwwroot/ts/hot_rocks/main.ts', './wwwroot/ts/project_menu.ts'],
        tree_genotypes: ['./wwwroot/ts/tree_genotypes/main.ts', './wwwroot/ts/project_menu.ts'],
        mandelbrot_fractal: ['./wwwroot/ts/mandelbrot_fractal/main.ts', './wwwroot/ts/project_menu.ts'],
        voxel_terrain: ['./wwwroot/ts/voxel_terrain/main.ts', './wwwroot/ts/project_menu.ts']
    },
    mode: 'development',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'wwwroot/js'),
    },
};