var utils = require('shipit-utils');
var chalk = require('chalk');
var mkdirp = require('mkdirp');
var path = require('path');
//var fs = require('fs-extra');
var js = require('jsonfile');
var sprintf = require('sprintf-js').sprintf;
var Promise = require('bluebird');
var pathIsAbsolute = require('path-is-absolute');

/**
 * Runs pm2 update interpreter
 */

module.exports = function (gruntOrShipit) {
  utils.registerTask(gruntOrShipit, 'pm2:update-confd', task);

  function task() {
    var shipit = utils.getShipit(gruntOrShipit);
    var pm2WorkspaceDir = '/.pm2';

    function getInterpreter(remote) {

      var method = remote ? 'remote' : 'local';

      /*var cdPath = remote ? shipit.releasePath || shipit.currentPath : shipit.config.workspace;

      if(!cdPath) {
        var msg = remote ? 'Please specify a deploy to path (shipit.config.deployTo)' : 'Please specify a workspace (shipit.config.workspace)'
        throw new Error(
          shipit.log(chalk.red(msg))
        );
      }

      return shipit[method](
        sprintf('cd %s && nvm which', cdPath)
      )
      .then(function (res) {
        shipit.config.pm2.interpreter = remote ? res[0].stdout : res.stdout;
        shipit.config.pm2.interpreter = shipit.config.pm2.interpreter.replace(/\n$/, '');
        shipit.log(chalk.green('Interpreter found: %s'), shipit.config.pm2.interpreter);
      })*/

      var nvmrcPath = remote ? shipit.releasePath || shipit.currentPath : shipit.config.workspace;
      //if .nvmrc is a shared file.
      if(remote && shipit.config.shared.files.indexOf('.nvmrc') >= 0){
        nvmrcPath = shipit.sharedPath;
      }

      nvmrcPath = remote ? nvmrcPath+'/' : nvmrcPath;

      //sprintf('nvm which $(cat %s.nvmrc)', nvmrcPath)

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
        /*.catch(function (e) {
          //console.log(e)
          //nvm install
          throw new Error(
            shipit.log(
              chalk.green(e)
            )
          );
        });*/
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
        if(shipit.config.shared.files.indexOf(shipit.config.pm2.json) >= 0){
          jsonAbsPath = shipit.sharedPath;
        }
        console.log(jsonAbsPath);

        shipit.config.pm2.json = path.join(jsonAbsPath, shipit.config.pm2.json);
      }

      return shipit.remoteCopy(shipit.config.pm2.json, shipit.config.workspace + pm2WorkspaceDir, {direction:'remoteToLocal'})
      .then(function () {
        shipit.log(chalk.green('Fetched JSON "%s"'),shipit.config.pm2.json);
      });
    }

    function updateJson() {

      // Idea for multi process apps
      // check if obj['apps'] use this
      // check if obj or obj['apps'] is an array only update matched processes that are to be started or restarted shipit.config.pm2.processes
      // NO SHIT IDEA. This is for single process/app update.
      // Would have to get cwd for each process assuming its set (.json app deceleration) and get node version from each .nvmrc file in cwd and then extract the interpreter. Its possible but for now lets leave it.
      // PERHAPS: move this functionality to its own task.

      /*return Promise.promisify(js.readFile)(path.join(shipit.config.workspace, pm2WorkspaceDir , path.basename(shipit.config.pm2.json)))
      .then(function(obj){
        if(obj['apps']){
          var apps = obj['apps'];
          //console.log(apps.length)
          var process_found = false;
          for (var i = 0; i < apps.length; i++) {

            if(  shipit.config.pm2.processes === apps[i].name || shipit.config.pm2.processes.indexOf(apps[i].name) > -1 ){
              //console.log(apps[i].name);
              if(apps[i].exec_interpreter !== shipit.config.pm2.interpreter){
                apps[i].exec_interpreter = shipit.config.pm2.interpreter
                shipit.log(chalk.yellow('exec_interpreter'),'updated to:', chalk.yellow(shipit.config.pm2.interpreter),'for the process:', chalk.yellow(apps[i].name));
              } else {
                shipit.log(chalk.cyan('exec_interpreter'),'is already', chalk.cyan(shipit.config.pm2.interpreter),'for the process:', chalk.cyan(apps[i].name));
              }
              process_found = true;
            }
          }
          if(!process_found) throw new Error( shipit.log(chalk.red('Process not found. Make sure you have your processes defined in shipit.config.pm2.processes')));
        } else {
          if(  shipit.config.pm2.processes === obj.name || shipit.config.pm2.processes.indexOf(obj.name) > -1 ){
            if(obj.exec_interpreter !== shipit.config.pm2.interpreter){
              obj.exec_interpreter = shipit.config.pm2.interpreter
            }
          }
        }
        return obj;
      })
      .then(function(obj){
        return Promise.promisify(js.writeFile)(path.join(shipit.config.workspace, pm2WorkspaceDir , path.basename(shipit.config.pm2.json)), obj)
        .then(function () {
          shipit.log(chalk.green('JSON updated.'));
        });
      });*/

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
      //console.log(shipit.config.pm2.json);

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
          chalk.gray('try running pm2:init before pm2:update-confd')
        )
      );
    }
  }
};
