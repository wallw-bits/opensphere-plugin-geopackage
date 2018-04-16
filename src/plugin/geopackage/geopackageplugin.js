goog.provide('plugin.geopackage.GeoPackagePlugin');

goog.require('os.data.DataManager');
goog.require('os.data.ProviderEntry');
goog.require('os.net.RequestHandlerFactory');
goog.require('os.plugin.AbstractPlugin');
goog.require('os.plugin.PluginManager');
goog.require('plugin.geopackage');
goog.require('plugin.geopackage.Exporter');
goog.require('plugin.geopackage.GeoPackageProvider');
goog.require('plugin.geopackage.RequestHandler');
goog.require('plugin.geopackage.TileLayerConfig');
goog.require('plugin.geopackage.VectorLayerConfig');


/**
 * Provides support for GeoPackage vector files
 * @extends {os.plugin.AbstractPlugin}
 * @constructor
 */
plugin.geopackage.GeoPackagePlugin = function() {
  plugin.geopackage.GeoPackagePlugin.base(this, 'constructor');
  this.id = plugin.geopackage.ID;
  this.errorMessage = null;
};
goog.inherits(plugin.geopackage.GeoPackagePlugin, os.plugin.AbstractPlugin);


/**
 * @inheritDoc
 */
plugin.geopackage.GeoPackagePlugin.prototype.init = function() {
  // register geopackage provider type
  var dm = os.data.DataManager.getInstance();
  dm.registerProviderType(new os.data.ProviderEntry(
      plugin.geopackage.ID,               // the type
      plugin.geopackage.GeoPackageProvider,   // the class
      'GeoPackage File', // the title
      'Provides raster and vector data in a single file format'  // the description
      ));

  var lcm = os.layer.config.LayerConfigManager.getInstance();
  lcm.registerLayerConfig(plugin.geopackage.ID + '-tile', plugin.geopackage.TileLayerConfig);
  lcm.registerLayerConfig(plugin.geopackage.ID + '-vector', plugin.geopackage.VectorLayerConfig);

  os.net.RequestHandlerFactory.addHandler(plugin.geopackage.RequestHandler);

  // register the GeoPackage exporter
  os.ui.exportManager.registerExportMethod(new plugin.geopackage.Exporter());
};


// add the plugin to the application
os.plugin.PluginManager.getInstance().addPlugin(new plugin.geopackage.GeoPackagePlugin());
