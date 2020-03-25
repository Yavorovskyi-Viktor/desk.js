const path = require('path');

module.exports = {
    entry: {
        'desk': './src/Desk.ts'
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            cacheDirectory: true
                        }
                    },
                    {
                        loader: 'ts-loader'
                    },
                ]
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
        filename: 'desk.js',
        path: path.resolve(__dirname, 'dist'),
        library: [ 'Desk' ],
        libraryTarget: 'umd',
    },
};