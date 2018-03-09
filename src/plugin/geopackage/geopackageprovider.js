goog.provide('plugin.geopackage.GeoPackageProvider');

goog.require('ol.Feature');
goog.require('os.data.DataProviderEvent');
goog.require('os.ui.server.AbstractLoadingServer');


/**
 * GeoPackage provider
 * @extends {os.ui.server.AbstractLoadingServer}
 * @constructor
 */
plugin.geopackage.GeoPackageProvider = function() {
  plugin.geopackage.GeoPackageProvider.base(this, 'constructor');
  
  this.geopkg = null;
  
  /**
   * The feature table names.
   * @type {Array<string>}
   */
  this.featureTables = [];
  
  // this.listInServer = false;
};
goog.inherits(plugin.geopackage.GeoPackageProvider, os.ui.server.AbstractLoadingServer);
goog.addSingletonGetter(plugin.geopackage.GeoPackageProvider);


/**
 * @inheritDoc
 */
plugin.geopackage.GeoPackageProvider.prototype.configure = function(config) {
  plugin.geopackage.GeoPackageProvider.base(this, 'configure', config);
  this.setId('geopackage');
  this.setLabel('GeoPackages');
  this.setUrl(/** @type{string} */ (config['url']));
};

/**
 * @inheritDoc
 */
plugin.geopackage.GeoPackageProvider.prototype.load = function(opt_ping) {
  plugin.geopackage.GeoPackageProvider.base(this, 'load', opt_ping);
  this.setLoading(true);
  geopackage.openGeoPackage(this.url, this.loaded_.bind(this));
};

/**
 * @private
 * @this plugin.geopackage.GeoPackageProvider
 */
plugin.geopackage.GeoPackageProvider.prototype.loaded_ = function(err, gpkg) {
  if (!err) {
    this.geopkg = gpkg;
    geopackage.getFeatureTables(this.geopkg, this.processFeatureTables_.bind(this));
  }
  // TODO: this.finish();
};

/**
 * @private
 * @this plugin.geopackage.GeoPackageProvider
 */
plugin.geopackage.GeoPackageProvider.prototype.processFeatureTables_ = function(err, featureTableNames) {
  this.featureTables = featureTableNames;
  for (var i = 0; i <  this.featureTables.length; ++i) {
    this.processFeatureTable_(this.featureTables[i]);
  }
};

/**
 * @private
 * @this plugin.geopackage.GeoPackageProvider
 */
plugin.geopackage.GeoPackageProvider.prototype.processFeatureTable_ = function(featureTableName) {
  geopackage.iterateGeoJSONFeaturesFromTable(this.geopkg, featureTableName, this.processFeature_.bind(this), this.tableComplete_.bind(this));
};

/**
 * @private
 * @this plugin.geopackage.GeoPackageProvider
 */
plugin.geopackage.GeoPackageProvider.prototype.processFeature_ = function(err, json) {
  if (!err) {
    var jsonGeo = json['geometry'];
    var jsonProps = json['properties'];
    if (jsonGeo) {
      // TODO: handle other geometry types
      var geom = new ol.geom.Point(jsonGeo['coordinates']);
      jsonProps['geometry'] = geom.osTransform();
    }
    console.log(jsonProps);
    var feature = new ol.Feature(jsonProps);
    feature.setStyle(os.style.StyleManager.getInstance().getOrCreateStyle(os.style.DEFAULT_VECTOR_CONFIG));
    os.MapContainer.getInstance().addFeatures([feature]);
  }
};


/**
 * @private
 * @this plugin.geopackage.GeoPackageProvider
 */
plugin.geopackage.GeoPackageProvider.prototype.tableComplete_ = function(err) {
};

