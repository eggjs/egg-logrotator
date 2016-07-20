# egg-logrotater

[![TNPM version][tnpm-image]][tnpm-url]
[![TNPM downloads][tnpm-downloads-image]][tnpm-url]

[tnpm-image]: http://web.npm.alibaba-inc.com/badge/v/@ali/egg-logrotater.svg?style=flat-square
[tnpm-url]: http://web.npm.alibaba-inc.com/package/@ali/egg-logrotater
[tnpm-downloads-image]: http://web.npm.alibaba-inc.com/badge/d/@ali/egg-logrotater.svg?style=flat-square

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

## Contributors(3)

Ordered by date of first contribution, by [ali-contributors](http://gitlab.alibaba-inc.com/node/ali-contributors).

- ![](https://work.alibaba-inc.com/photo/52624.30x30.jpg) [@不四](https://work.alibaba-inc.com/work/u/52624)<a target="_blank" href="http://amos.im.alisoft.com/msg.aw?v=2&site=cntaobao&s=2&charset=utf-8&uid=%E4%B8%8D%E5%9B%9B"><img src="http://amos.alicdn.com/online.aw?v=2&uid=%E4%B8%8D%E5%9B%9B&site=cntaobao&s=1&charset=utf-8"></a>
- ![](https://work.alibaba-inc.com/photo/28761.30x30.jpg) [@贯高](http://chuo.me)<a target="_blank" href="http://amos.im.alisoft.com/msg.aw?v=2&site=cntaobao&s=2&charset=utf-8&uid=%E8%B4%AF%E9%AB%98"><img src="http://amos.alicdn.com/online.aw?v=2&uid=%E8%B4%AF%E9%AB%98&site=cntaobao&s=1&charset=utf-8"></a>
- ![](https://work.alibaba-inc.com/photo/43624.30x30.jpg) [@苏千](http://fengmk2.com)<a target="_blank" href="http://amos.im.alisoft.com/msg.aw?v=2&site=cntaobao&s=2&charset=utf-8&uid=%E8%8B%8F%E5%8D%83"><img src="http://amos.alicdn.com/online.aw?v=2&uid=%E8%8B%8F%E5%8D%83&site=cntaobao&s=1&charset=utf-8"></a>

--------------------
