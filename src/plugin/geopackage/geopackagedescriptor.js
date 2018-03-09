goog.provide('plugin.geopackage.GeoPackageDescriptor');

goog.require('os.data.FileDescriptor');
goog.require('os.layer');
goog.require('os.layer.LayerType');
goog.require('os.style');
goog.require('os.ui.ControlType');
goog.require('plugin.geopackage.GeoPackageProvider');



/**
 * GeoPackage descriptor.
 * @extends {os.data.FileDescriptor}
 * @constructor
 */
plugin.geopackage.GeoPackageDescriptor = function() {
  plugin.geopackage.GeoPackageDescriptor.base(this, 'constructor');
  this.descriptorType = plugin.geopackage.ID;
};
goog.inherits(plugin.geopackage.GeoPackageDescriptor, os.data.FileDescriptor);


/**
 * @inheritDoc
 */
plugin.geopackage.GeoPackageDescriptor.prototype.getType = function() {
  return os.layer.LayerType.FEATURES;
};


/**
 * @inheritDoc
 */
plugin.geopackage.GeoPackageDescriptor.prototype.getLayerOptions = function() {
  var options = plugin.geopackage.GeoPackageDescriptor.base(this, 'getLayerOptions');
  options['type'] = plugin.geopackage.ID;

  // allow resetting the layer color to the default
  options[os.ui.ControlType.COLOR] = os.ui.ColorControlType.PICKER_RESET;
  return options;
};


/**
 * Creates a new descriptor from a parser configuration.
 * @param {!os.parse.FileParserConfig} config
 * @return {!plugin.geopackage.GeoPackageDescriptor}
 */
plugin.geopackage.GeoPackageDescriptor.createFromConfig = function(config) {
  var file = config['file'];
  var provider = plugin.geopackage.GeoPackageProvider.getInstance();
  var descriptor = new plugin.geopackage.GeoPackageDescriptor();
  descriptor.setId(provider.getUniqueId());
  descriptor.setProvider(provider.getLabel());
  descriptor.setUrl(file.getUrl());
  descriptor.setColor(os.style.DEFAULT_LAYER_COLOR);

  plugin.geopackage.GeoPackageDescriptor.updateFromConfig(descriptor, config);

  return descriptor;
};


/**
 * Updates an existing descriptor from a parser configuration.
 * @param {!plugin.geopackage.GeoPackageDescriptor} descriptor
 * @param {!os.parse.FileParserConfig} config
 */
plugin.geopackage.GeoPackageDescriptor.updateFromConfig = function(descriptor, config) {
  descriptor.setColor(config['color']);
  descriptor.setDescription(config['description']);
  descriptor.setTitle(config['title']);
  descriptor.setTags(config['tags'] ? config['tags'].split(/\s*,\s*/) : null);
  descriptor.setParserConfig(config);
};
