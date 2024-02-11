

/**
 * @type {import("webpack").Configuration}
 */
module.exports = {
  module: {
    rules: [{
      test: /\.css$/,
      loader: 'raw-loader',
      resourceQuery: /raw/,
    }],
  }, resolve: {
    fallback: {
      //fs: false,
      //util: false
    }
  }
};