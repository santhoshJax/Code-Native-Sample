/*
 * Bundles the code-native integration into a single dist/index.js that
 * `prism integrations:import` uploads to Revecast Connect.
 */
const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  target: "node",
  mode: "production",
  entry: "./src/index.ts",
  module: {
    rules: [{ test: /\.ts$/, use: "ts-loader", exclude: /node_modules/ }],
  },
  resolve: { extensions: [".ts", ".js"] },
  // Keep the bundle readable in the Revecast Connect execution logs.
  optimization: { minimize: false },
  output: {
    filename: "index.js",
    path: path.resolve(__dirname, "dist"),
    libraryTarget: "commonjs2",
    clean: true,
  },
  plugins: [
    // Copies the optional integration icon (assets/icon.png) next to the bundle.
    new CopyPlugin({ patterns: [{ from: "assets", to: ".", noErrorOnMissing: true }] }),
  ],
};
