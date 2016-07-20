# egg-logrotater

egg 的日志切割插件，默认会按照时间切割 `config.logger.rotateLogDirs` 目录下的日志文件。

## 配置

- `plugin.js`

```js
exports.logrotater = true;
```

- `config.js`

```js
// 如果有需要按照文件大小切割的日志，在这里配置
exports.logrotater = {
  filesRotateBySize: [],           // 需要按大小切割的文件，其他日志文件仍按照通常方式切割
  maxFileSize: 60 * 1024 * 1024,   // 最大文件大小，默认为50m
  maxFiles: 10,                    // 按大小切割时，文件最大切割的份数
  rotateDuration: 60000,           // 按大小切割时，文件扫描的间隔时间
};
```