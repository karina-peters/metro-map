const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");
const webpack = require("webpack");

module.exports = {
  mode: "none",
  entry: "./src/app.js",
  output: {
    path: __dirname + "/dist",
    filename: "bundle.js",
  },
  devServer: {
    static: {
      directory: path.join(__dirname, "dist"),
    },
    port: 8080, // Frontend dev server port
    proxy: [
      {
        context: ["/api"],
        target: "http://localhost:3000/", // Backend server address
        secure: false,
        changeOrigin: true,
        logLevel: "debug",
      },
    ],
    hot: true,
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"],
          },
        },
      },
      {
        test: /\.svg$/,
        use: ["raw-loader"],
      },
    ],
  },
  devtool: "source-map",
  plugins: [
    new HtmlWebpackPlugin({
      template: path.join(__dirname, "public/index.html"),
      inject: true,
    }),
    new webpack.DefinePlugin({
      "process.env.VITE_API_URL": JSON.stringify(process.env.VITE_API_URL || "http://localhost:3000"),
    }),
  ],
};
