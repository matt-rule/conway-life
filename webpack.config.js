const path = require('path');

module.exports = {
    entry: {
        cellular_automata: ['./wwwroot/ts/cellular_automata/main.ts', './wwwroot/ts/project_menu.ts'],
        tree_genotypes: ['./wwwroot/ts/tree_genotypes/main.ts', './wwwroot/ts/project_menu.ts']
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