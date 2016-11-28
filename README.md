# shipit-pm2

A set of tasks for [Shipit](https://github.com/shipitjs/shipit) used for [pm2](https://github.com/Unitech/pm2) specific tasks.

**Features:**

- Automatically starts or restarts (or reloads) your [processes.json](https://github.com/Unitech/PM2/blob/master/ADVANCED_README.md#json-app-declaration). Triggered on `published`.
- Automatically updates the process `execute_interpreter` to a specific node version before start or restart. Triggered on `updated`. (Note: this currently only works with a single app process and requires [shipit-nvm](https://github.com/callerc1/shipit-nvm)).
- Works with [shipit-deploy](https://github.com/shipitjs/shipit-deploy)
- Has a direct pass though task to [pm2](https://github.com/Unitech/pm2) commands.
- Works via [shipit-cli](https://github.com/shipitjs/shipit) and [grunt-shipit](https://github.com/shipitjs/grunt-shipit)

## Install

```
npm install shipit-pm2
```

## Usage

Just simply run: (This triggers the `pm2` specific tasks on the events mentioned previously. No additional config necessary.)

```
shipit staging deploy

```

Or you can run the tasks separately :

```
  shipit staging pm2:init pm2:config
  shipit staging pm2:run --cmd "update"
```


## Options `shipit.config.pm2`

### `pm2.json`

Type: `String`
Default: *`'app.json'`*

An string specifying the path to the pm2 json app declaration file (see [pm2 readme](https://github.com/Unitech/PM2/blob/master/ADVANCED_README.md#json-app-declaration) for more info).

### `pm2.reload`

Type: `Boolean`
Default: *`false`

If true, the app reloads gracefully with `pm2 startOrReload`.  If false, the app is restarted with `pm2 startOrRestart`.


### Example `shipitfile.js` options usage

```js
module.exports = function (shipit) {
  require('shipit-deploy')(shipit);
  require('shipit-pm2')(shipit);

  shipit.initConfig({
    default: {
      pm2: {
        json: '/etc/pm2/conf.d/node-app.json'
      }
    }
  });
};
```

## License

MIT
