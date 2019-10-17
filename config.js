const PRODUCTION = process.env.NODE_ENV == 'production';

module.exports = {};

module.exports.PRODUCTION = PRODUCTION;
module.exports.hmrEnabled = true;
module.exports.shouldCompressImages = PRODUCTION;
