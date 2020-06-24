const config = require('./webpack.config.base');

delete config.externals;

module.exports = [ config ];
