// const webpack = require("webpack");
const path = require("path");

module.exports = {
    entry: path.resolve(__dirname, "example.js"),
    output: {
        path: path.resolve(__dirname),
        filename: "index.js"
    },
    module: {
        loaders: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: "babel",
                query: {
                    presets: ["es2015"],
                    plugins: ["transform-runtime"]
                }
            }
        ]
    }
};

