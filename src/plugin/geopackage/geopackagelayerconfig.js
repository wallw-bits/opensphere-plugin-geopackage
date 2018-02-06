goog.provide('plugin.geopackage.GeoPackageLayerConfig');

goog.require('os.im.mapping.TimeType');
goog.require('os.im.mapping.time.DateTimeMapping');
goog.require('os.layer.config.AbstractDataSourceLayerConfig');
goog.require('os.ui.im.ImportManager');
goog.require('plugin.geopackage.GeoPackageParser');


/**
 * @extends {os.layer.config.AbstractDataSourceLayerConfig}
 * @constructor
 */
plugin.geopackage.GeoPackageLayerConfig = function() {
  plugin.geopackage.GeoPackageLayerConfig.base(this, 'constructor');
};
goog.inherits(plugin.geopackage.GeoPackageLayerConfig, os.layer.config.AbstractDataSourceLayerConfig);


/**
 * @inheritDoc
 */
plugin.geopackage.GeoPackageLayerConfig.prototype.getParser = function(options) {
  return new plugin.geopackage.GeoPackageParser();
};


/**
 * @inheritDoc
 */
plugin.geopackage.GeoPackageLayerConfig.prototype.getImporter = function(options) {
  var importer = plugin.geopackage.GeoPackageLayerConfig.base(this, 'getImporter', options);

  // add time mapping to importer
  var timeMapping = new os.im.mapping.time.DateTimeMapping(os.im.mapping.TimeType.INSTANT);
  timeMapping.field = 'updated';
  // there's no need to call timeMapping.setFormat() since the default is what we want

  importer.setExecMappings([timeMapping]);
  return importer;
};
