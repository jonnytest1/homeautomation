module.exports = {
  module: {
    rules: [{
      test: /\.css$/,
      loader: 'raw-loader',
      resourceQuery: /raw/,
    }],
  },
};