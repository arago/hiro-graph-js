const port = 8080;
const WebpackDevServer = require("webpack-dev-server");
const webpack = require("webpack");
const webpackConfig = require("./example/webpack.config");
const openurl = require("openurl");

webpackConfig.entry = [
    "webpack-dev-server/client?http://0.0.0.0:8080",
    "webpack/hot/dev-server"
].concat(webpackConfig.entry);


webpackConfig.devtool = "inline-source-map";
//overwrite with the sourcemap generating one with HM
//remove the plugins
webpackConfig.plugins = [new webpack.HotModuleReplacementPlugin()];

const compiler = webpack(webpackConfig);
const server = new WebpackDevServer(compiler, {
    contentBase: "example/",
    hot: true,
    historyApiFallback: true,
    quiet: false,
    noInfo: false
});
server.listen(port, "0.0.0.0", function() {
    console.log("webpack dev server started: http://0.0.0.0:" + port);
    try {
        //openurl.open("http://vi.lo");
    } catch (e) {
        console.log(e);
    }
});
