goog.provide('plugin.geopackage.GeoPackageParser');

goog.require('ol.Feature');
goog.require('ol.geom.LineString');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('os.parse.AsyncParser');
goog.require('os.parse.FileParserConfig');

// TODO: fix all of this.

/**
 * Parser for GeoPackage vector files.
 * @param {os.parse.FileParserConfig} config
 * @extends {os.parse.AsyncParser<ol.Feature>}
 * @constructor
 */
plugin.geopackage.GeoPackageParser = function(config) {
  plugin.geopackage.GeoPackageParser.base(this, 'constructor');

  this.geopkg = null;

  /**
   * @type {boolean}
   * @private
   */
  this.initialised_ = false;

};
goog.inherits(plugin.geopackage.GeoPackageParser, os.parse.AsyncParser);


/**
 * @inheritDoc
 */
plugin.geopackage.GeoPackageParser.prototype.setSource = function(source) {
  var buffer = new Uint8Array(/** @type {ArrayBuffer} */ (source));
  geopackage.openGeoPackageByteArray(buffer, this.loaded_);
};

/**
 * @private
 */
plugin.geopackage.GeoPackageParser.prototype.loaded_ = function(err, gpkg) {
  if (err) {
    this.onError();
  } else {
    this.geopkg = gpkg;
    // TODO: why is onReady not a function?
    // Debugger says "this" is a Window object.
    this.onReady();
  }
};

/**
 * @inheritDoc
 */
plugin.geopackage.GeoPackageParser.prototype.onError = function() {
  this.initialised_ = true;
  plugin.geopackage.GeoPackageParser.base(this, 'onError');
};


/**
 * @inheritDoc
 */
plugin.geopackage.GeoPackageParser.prototype.onReady = function() {
  this.initialised_ = true;
  plugin.geopackage.GeoPackageParser.base(this, 'onReady');
};


/**
 * @inheritDoc
 */
plugin.geopackage.GeoPackageParser.prototype.cleanup = function() {
  this.initialised_ = false;
};

/**
 * @inheritDoc
 */
plugin.geopackage.GeoPackageParser.prototype.disposeInternal = function() {
  this.cleanup();
};

/**
 * @inheritDoc
 */
plugin.geopackage.GeoPackageParser.prototype.hasNext = function() {
  return false;
};


/**
 * @inheritDoc
 */
plugin.geopackage.GeoPackageParser.prototype.parseNext = function() {
  var properties = {};
  var geom = new ol.geom.Point([135.2, -34.2]);
  properties['geometry'] = geom;
  return new ol.Feature(properties);
};


