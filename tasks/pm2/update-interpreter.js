var utils = require('shipit-utils');
var chalk = require('chalk');
var mkdirp = require('mkdirp');
var path = require('path');
var js = require('jsonfile');
var sprintf = require('sprintf-js').sprintf;
var Promise = require('bluebird');
var pathIsAbsolute = require('path-is-absolute');

/**
 * Runs pm2 update interpreter
 */

module.exports = function (gruntOrShipit) {
  utils.registerTask(gruntOrShipit, 'pm2:update-interpreter', task);

  function task() {
    var shipit = utils.getShipit(gruntOrShipit);
    var pm2WorkspaceDir = '/.pm2';

    function getInterpreter(remote) {

      var method = remote ? 'remote' : 'local';

      var nvmrcPath = remote ? shipit.releasePath || shipit.currentPath : shipit.config.workspace;
      //if .nvmrc is a shared file.
      if(remote && shipit.config.shared && shipit.config.shared.files.indexOf('.nvmrc') >= 0){
        nvmrcPath = shipit.sharedPath;
      }

      nvmrcPath = remote ? nvmrcPath+'/' : nvmrcPath;

      return shipit[method]( sprintf('cat %s.nvmrc', nvmrcPath))
      .then(function (res) {
        v = remote ? res[0].stdout : res.stdout;

        //run install nvm v by default to make sure its installed.
        return shipit[method](
          sprintf('nvm install %s', v)
        )
        .then(function (res) {
          shipit.log(chalk.green('Installed node version : %s'), v);
          return shipit[method](
            sprintf('nvm which %s', v)
          )
          .then(function (res) {
            shipit.config.pm2.interpreter = remote ? res[0].stdout : res.stdout;
            shipit.config.pm2.interpreter = shipit.config.pm2.interpreter.replace(/\n$/, '');
            shipit.log(chalk.green('Interpreter found: %s'), shipit.config.pm2.interpreter);
          })
        })
      })

    }

    function createPm2Workspace() {
      function create() {
        shipit.log('Create workspace "%s"', shipit.config.workspace + pm2WorkspaceDir);
        return Promise.promisify(mkdirp)(shipit.config.workspace + pm2WorkspaceDir)
        .then(function () {
          shipit.log(chalk.green('PM2 Workspace created.'));
        });
      }

      shipit.log('Deleting existing PM2 workspace "%s"', shipit.config.workspace + pm2WorkspaceDir);
      return shipit.local('rm -rf ' + shipit.config.workspace + pm2WorkspaceDir)
      .then(create);
    }

    function getJson() {
      if (!pathIsAbsolute(shipit.config.pm2.json)) {

        //check if path absolute and update path to .json if not.
        var jsonAbsPath = shipit.releasePath || shipit.currentPath;

        //if shipit.config.pm2.json is a shared file.
        if(shipit.config.shared && shipit.config.shared.files.indexOf(shipit.config.pm2.json) >= 0){
          jsonAbsPath = shipit.sharedPath;
        }

        shipit.config.pm2.json = path.join(jsonAbsPath, shipit.config.pm2.json);
      }

      return shipit.remoteCopy(shipit.config.pm2.json, shipit.config.workspace + pm2WorkspaceDir, {direction:'remoteToLocal'})
      .then(function () {
        shipit.log(chalk.green('Fetched JSON "%s"'),shipit.config.pm2.json);
      });
    }

    function updateJson() {

      //Single process updates for confd style setup
      return Promise.promisify(js.readFile)(path.join(shipit.config.workspace, pm2WorkspaceDir , path.basename(shipit.config.pm2.json)))
      .then(function(obj){
        if(obj.exec_interpreter !== shipit.config.pm2.interpreter){
          obj.exec_interpreter = shipit.config.pm2.interpreter
          shipit.log(chalk.yellow('exec_interpreter'),'updated to:', chalk.yellow(shipit.config.pm2.interpreter),'for the process:', chalk.yellow(obj.name));
        } else {
          shipit.log(chalk.cyan('exec_interpreter'),'is already', chalk.cyan(shipit.config.pm2.interpreter),'for the process:', chalk.cyan(obj.name));
        }
        return obj;
      })
      .then(function(obj){
        return Promise.promisify(js.writeFile)(path.join(shipit.config.workspace, pm2WorkspaceDir , path.basename(shipit.config.pm2.json)), obj)
        .then(function () {
          shipit.log(chalk.green('JSON updated.'));
        });
      });


    }

    function putJson() {

      return shipit.remoteCopy(path.join(shipit.config.workspace, pm2WorkspaceDir , path.basename(shipit.config.pm2.json)), shipit.config.pm2.json)
      .then(function () {
        shipit.log(chalk.green('Remote put JSON complete "%s"'), shipit.config.pm2.json);
      });

    }

    if(shipit.pm2_inited) {

      return getInterpreter(true)
      .then(createPm2Workspace)
      .then(getJson)
      .then(updateJson)
      .then(putJson)
      .then(function () {
        shipit.log(chalk.green('PM2 update confd complete'));
      })
      .catch(function (e) {
        shipit.log(chalk.red(e));
      })


    }else {
      throw new Error(
        shipit.log(
          chalk.gray('try running pm2:init before pm2:update-interpreter')
        )
      );
    }
  }
};
