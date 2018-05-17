/**
 * Port configuration for the service. Default port is 1337.
 */

const argv = require('./argv');

module.exports = parseInt(argv.port || process.env.PORT || '1337', 10);