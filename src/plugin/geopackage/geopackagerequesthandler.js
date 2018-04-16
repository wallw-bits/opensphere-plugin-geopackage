goog.provide('plugin.geopackage.RequestHandler');

goog.require('goog.events.EventTarget');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('os.net.IRequestHandler');


/**
 * @constructor
 * @extends {goog.events.EventTarget}
 * @implements {os.net.IRequestHandler}
 */
plugin.geopackage.RequestHandler = function() {
  plugin.geopackage.RequestHandler.base(this, 'constructor');

  this.log = plugin.geopackage.RequestHandler.LOGGER_;

  /**
   * @type {number}
   * @protected
   */
  this.statusCode = -1;

  /**
   * @type {Array<string>}
   * @protected
   */
  this.errors = [];

  /**
   * @type {Array<Object>}
   * @protected
   */
  this.features = null;
};
goog.inherits(plugin.geopackage.RequestHandler, goog.events.EventTarget);


/**
 * Logger
 * @type {goog.log.Logger}
 * @const
 * @private
 */
plugin.geopackage.RequestHandler.LOGGER_ = goog.log.getLogger('plugin.geopackage.RequestHandler');


/**
 * @inheritDoc
 */
plugin.geopackage.RequestHandler.prototype.getScore = function() {
  return 100;
};


/**
 * @inheritDoc
 */
plugin.geopackage.RequestHandler.prototype.handles = function(method, uri) {
  return uri.getScheme() === 'gpkg';
};


/**
 * @inheritDoc
 */
plugin.geopackage.RequestHandler.prototype.getResponse = function() {
  return this.features;
};


/**
 * @inheritDoc
 */
plugin.geopackage.RequestHandler.prototype.getResponseHeaders = function() {
  return null;
};


/**
 * @inheritDoc
 */
plugin.geopackage.RequestHandler.prototype.getErrors = function() {
  return this.errors.length ? this.errors : null;
};


/**
 * @inheritDoc
 */
plugin.geopackage.RequestHandler.prototype.getStatusCode = function() {
  return this.statusCode;
};


/**
 * @inheritDoc
 */
plugin.geopackage.RequestHandler.prototype.getHandlerType = function() {
  return plugin.geopackage.ID;
};


/**
 * @inheritDoc
 */
plugin.geopackage.RequestHandler.prototype.isHandled = function() {
  return true;
};


/**
 * @inheritDoc
 */
plugin.geopackage.RequestHandler.prototype.buildRequest = goog.nullFunction;


/**
 * @inheritDoc
 */
plugin.geopackage.RequestHandler.prototype.abort = goog.nullFunction;


/**
 * @inheritDoc
 */
plugin.geopackage.RequestHandler.prototype.execute = function(method, uri, opt_headers, opt_formatter,
    opt_nocache, opt_responseType) {
  var providerId = uri.getDomain();
  // skip the leading slash in the path for the tableName
  var tableName = uri.getPath().substring(1);

  try {
    var gpkg = plugin.geopackage.getGeoPackageByProviderId(providerId);
  } catch (e) {
    this.statusCode = 404;
    this.errors.push(e.message);
    this.dispatchEvent(goog.net.EventType.ERROR);
    return;
  }

  geopackage.iterateGeoJSONFeaturesFromTable(gpkg, tableName, this.onFeature_.bind(this), this.onDone_.bind(this));
};


/**
 * @param {*} err
 * @param {Object} geoJson The GeoJSON object
 * @param {function()} rowDone The row done callback
 * @private
 */
plugin.geopackage.RequestHandler.prototype.onFeature_ = function(err, geoJson, rowDone) {
  if (err) {
    this.errors.push(String(err));
    this.statusCode = 500;
  }

  if (geoJson) {
    if ('geometry' in geoJson['properties']) {
      // this will really screw up the resulting feature
      delete geoJson['properties']['geometry'];
    }

    if (!this.features) {
      this.features = [];
    }

    this.features.push(geoJson);
  }

  rowDone();
};


/**
 * @param {*} err
 * @private
 */
plugin.geopackage.RequestHandler.prototype.onDone_ = function(err) {
  if (err) {
    this.errors.push(String(err));
    this.statusCode = 500;
  }

  this.dispatchEvent(this.getErrors() ? goog.net.EventType.ERROR : goog.net.EventType.SUCCESS);
};
