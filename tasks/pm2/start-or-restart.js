var utils = require('shipit-utils');
var chalk = require('chalk');
var sprintf = require('sprintf-js').sprintf;
var Bluebird = require('bluebird');
var pathIsAbsolute = require('path-is-absolute');
var path = require('path');
/**
 * Runs pm2 start or restart
 */

module.exports = function (gruntOrShipit) {
  utils.registerTask(gruntOrShipit, 'pm2:start-or-restart', task);

  function task() {
    var shipit = utils.getShipit(gruntOrShipit);

    function startOrRestart(remote) {

      var method = remote ? 'remote' : 'local';

      if (!pathIsAbsolute(shipit.config.pm2.json)) {

        //check if path absolute and update path to .json if not.
        var jsonAbsPath = shipit.releasePath || shipit.currentPath;

        //if shipit.config.pm2.json is a shared file.
        if(shipit.config.shared && shipit.config.shared.files.indexOf(shipit.config.pm2.json) >= 0){
          jsonAbsPath = shipit.sharedPath;
        }

        shipit.config.pm2.json = path.join(jsonAbsPath, shipit.config.pm2.json);
      }

      return shipit[method](
        sprintf('pm2 startOrRestart %s', shipit.config.pm2.json)
      );

    }

    if(shipit.pm2_inited) {

      return startOrRestart(true)
      .then(function () {
        shipit.log(chalk.green('pm2 startOrRestart complete'));
      })
      .catch(function (e) {
        shipit.log(chalk.red(e));
      });

    }else {
      throw new Error(
        shipit.log(
          chalk.gray('try running pm2:init before pm2:start-or-restart')
        )
      );
    }
  }
};
