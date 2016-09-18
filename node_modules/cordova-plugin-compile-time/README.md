Cordova compile time plugin
==========================

This plugin reads information of your app that you put in config.xml and makes it available inside your app via Javascript. 

**This plugin should work on any platform since it does not rely on any native code.**

## Installation
### Cordova CLI
```
cordova plugin add cordova-compile-time-plugin
```
The plugin will then be accessable via `window.cordova.compileTime.xxx`. xxx include id / name / version / description / author / env.

## Usage
### config.xml example
```xml
<?xml version='1.0' encoding='utf-8'?>
<widget id="my.app.id" version="1.5.0">
  <name>Example App</name>
  <description>
      An example app.
  </description>
  <author email="colder@example.com" href="http://vitarn.com">
      ViTarn.com
  </author>
</widget>

```

```js
window.cordova.compileTime.id == "my.app.id";
window.cordova.compileTime.name == "Example App";
window.cordova.compileTime.version == "1.5.0";
window.cordova.compileTime.description == "An example app.";
window.cordova.compileTime.author == "ViTarn.com";
```

```bash
> cordova build ios --release
```

```js
window.cordova.compileTime.env == "production"; // "development" if no "--release"
```

## How does it work?
The plugins uses the `before_prepare` hook to generate javascript files in plugin own `www` folder which will be added to the App on build. It will clean these generate files `after_prepare`.

## Changelog

* 0.4.2
  * publish to npm.
* 0.3.3
  * dont clean because it will fail the other plugins install.
  * commit www. reason same as above.
* 0.3.0
  * clean after prepare.
* 0.2.0
  * change namespace to `cordova.compileTime`.
  * make more infomation available:
    * id
    * name
    * version
    * description
    * author
  * add env.
    * `production` if `--release` arg provide. otherwise `development`.
* 0.1.0
  * Added namespace `version` to not override other plugins see [issue 2](https://github.com/Binarypark/cordova_app_version_plugin/issues/2) <br/> Call to retrieve the appVersion is now: `window.cordova.plugins.version.getAppVersion()`
* 0.0.4
  * Changed directory separators from `\\`to `/` see [issue 1](https://github.com/Binarypark/cordova_app_version_plugin/issues/1)
