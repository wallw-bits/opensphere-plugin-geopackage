goog.provide('plugin.geopackage.GeoPackagePlugin');

goog.require('os.data.DataManager');
goog.require('os.data.ProviderEntry');
goog.require('os.plugin.AbstractPlugin');
goog.require('os.plugin.PluginManager');
goog.require('plugin.geopackage.GeoPackageDescriptor');
goog.require('plugin.geopackage.GeoPackageProvider');


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
 * @type {string}
 * @const
 */
plugin.geopackage.ID = 'geopackage';


/**
 * @inheritDoc
 */
plugin.geopackage.GeoPackagePlugin.prototype.init = function() {

  
  // register geopackage provider type
  var dm = os.data.DataManager.getInstance();
  var title = 'GeoPackage Layers';
  dm.registerProviderType(new os.data.ProviderEntry(
      plugin.geopackage.ID,               // the type
      plugin.geopackage.GeoPackageProvider,   // the class
      title, // the title
      title  // the description
      ));
  
  // register the geopackage descriptor type
  dm.registerDescriptorType(plugin.geopackage.ID, plugin.geopackage.GeoPackageDescriptor)
};


// add the plugin to the application
os.plugin.PluginManager.getInstance().addPlugin(new plugin.geopackage.GeoPackagePlugin());
