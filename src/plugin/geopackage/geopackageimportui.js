goog.provide('plugin.geopackage.GeoPackageImportUI');

goog.require('os.parse.FileParserConfig');
goog.require('os.ui.im.FileImportUI');
goog.require('os.ui.window');
goog.require('plugin.geopackage.geopackageImportDirective');


/**
 * @extends {os.ui.im.FileImportUI}
 * @constructor
 */
plugin.geopackage.GeoPackageImportUI = function() {
  plugin.geopackage.GeoPackageImportUI.base(this, 'constructor');
};
goog.inherits(plugin.geopackage.GeoPackageImportUI, os.ui.im.FileImportUI);


/**
 * @inheritDoc
 */
plugin.geopackage.GeoPackageImportUI.prototype.getTitle = function() {
  return 'GeoPackage';
};


/**
 * @inheritDoc
 */
plugin.geopackage.GeoPackageImportUI.prototype.launchUI = function(file, opt_config) {
  var config = new os.parse.FileParserConfig();

  // if an existing config was provided, merge it in
  if (opt_config) {
    this.mergeConfig(opt_config, config);
  }

  config['file'] = file;
  config['title'] = file.getFileName();

  var scopeOptions = {
    'config': config
  };
  var windowOptions = {
    'label': 'Import GeoPackage',
    'icon': 'fa fa-file-text lt-blue-icon',
    'x': 'center',
    'y': 'center',
    'width': 350,
    'min-width': 350,
    'max-width': 600,
    'height': 'auto',
    'modal': true,
    'show-close': true,
    'no-scroll': true
  };
  var template = '<geopackageimport></geopackageimport>';
  os.ui.window.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
};
