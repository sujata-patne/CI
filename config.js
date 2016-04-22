/**
 * Created by sujata.patne on 7/7/2015.
 */
var env = require('./env.json');

module.exports = function() {
    var node_env = 'development';
    var conf_arr = env[node_env];
    conf_arr.base_path = process.cwd();
    return conf_arr;
};