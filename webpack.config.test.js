const config = require('./webpack-shared-config.js');

delete config.externals;

module.exports = [ config ];
