var utils = require('shipit-utils');

/**
 * Register PM2 tasks.
 * - pm2:run
 */

module.exports = function (gruntOrShipit) {
  var shipit = utils.getShipit(gruntOrShipit);

  require('./init')(gruntOrShipit);
  require('./update-interpreter')(gruntOrShipit);
  require('./start-or-restart')(gruntOrShipit);
  require('./cmd')(gruntOrShipit);

  utils.registerTask(gruntOrShipit, 'pm2:run', [
    'pm2:init',
    'pm2:cmd'
  ]);

  shipit.on('deploy', function () {

    shipit.start('pm2:init');

    shipit.on('pm2_inited', function () {

      shipit.on('nvm_inited', function () {

        shipit.on('updated', function () {
          shipit.start('pm2:update-interpreter');
        });

      });

      shipit.on('published', function () {
        shipit.start('pm2:start-or-restart');
      });

    });

  });

};