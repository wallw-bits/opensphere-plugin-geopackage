goog.provide('plugin.geopackage.GeoPackageProvider');
goog.require('os.data.FileProvider');


/**
 * GeoPackage file provider
 * @extends {os.data.FileProvider}
 * @constructor
 */
plugin.geopackage.GeoPackageProvider = function() {
  plugin.geopackage.GeoPackageProvider.base(this, 'constructor');
};
goog.inherits(plugin.geopackage.GeoPackageProvider, os.data.FileProvider);
goog.addSingletonGetter(plugin.geopackage.GeoPackageProvider);


/**
 * @inheritDoc
 */
plugin.geopackage.GeoPackageProvider.prototype.configure = function(config) {
  plugin.geopackage.GeoPackageProvider.base(this, 'configure', config);
  this.setId(plugin.geopackage.ID);
  this.setLabel('GeoPackage Files');
};
