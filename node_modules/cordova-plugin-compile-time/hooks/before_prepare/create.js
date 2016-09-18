#!/usr/bin/env node

var fs = require('fs');

module.exports = function(context) {
  var env = / --release ?/.test(context.cmdLine) ? 'production' : 'development';
  var util = context.requireCordovaModule(
    'cordova-lib/src/cordova/util'
  );
  var ConfigParser = context.requireCordovaModule(
    'cordova-lib/src/configparser/ConfigParser'
  );
  var xml = new ConfigParser(util.projectConfig(util.isCordova()));
  var config = {
    id: xml.packageName(),
    version: xml.version(),
    name: xml.name(),
    description: xml.description(),
    author: xml.author(),
    env: env,
  };
  var www = context.opts.plugin.dir + '/www';

  if (!fs.existsSync(www)) {
    fs.mkdirSync(www);
  }

  fs.writeFileSync(
    context.opts.plugin.dir + '/www/compile-time.js',
    'module.exports=' + JSON.stringify(config)
  );
};
