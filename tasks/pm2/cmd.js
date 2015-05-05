var utils = require('shipit-utils');
var chalk = require('chalk');
var sprintf = require('sprintf-js').sprintf;
var Bluebird = require('bluebird');
var argv = require('yargs').argv;

/**
 * cmd task allows access to any pm2 cli command
 */

module.exports = function (gruntOrShipit) {
  utils.registerTask(gruntOrShipit, 'pm2:cmd', task);

  function task() {
    var shipit = utils.getShipit(gruntOrShipit);

    function cmd() {

      var cdPath = shipit.currentPath;

      if(!cdPath) {
        var msg = 'Please specify a deploy to path (shipit.config.deployTo)';
        throw new Error(
          shipit.log(chalk.red(msg))
        );
      }

      if(!argv.cmd) {
        throw new Error(
          shipit.log(
            chalk.red('Please specify a pm2 command eg'),
            chalk.gray('shipit staging pm2:run'),
            chalk.white('--cmd "update"')
          )
        );
      }

      shipit.log('Running - ', chalk.blue('pm2 ', argv.cmd));

      return shipit['remote'](
        sprintf('cd %s && pm2 %s', cdPath, argv.cmd)
      );

    }

    if(shipit.pm2_inited) {

      return cmd()
      .then(function () {
        shipit.log(chalk.green('Complete - pm2 ' + argv.cmd));
      })
      .catch(function (e) {
        shipit.log(e);
      });

    }else {
      throw new Error(
        shipit.log(
          chalk.gray('try running pm2:init before pm2:cmd')
        )
      );
    }
  }
};
