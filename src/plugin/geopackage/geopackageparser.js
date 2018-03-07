goog.provide('plugin.geopackage.GeoPackageParser');

goog.require('ol.Feature');
goog.require('ol.geom.LineString');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('ol.xml');
goog.require('os.map');
goog.require('os.parse.IParser');

// TODO: replace all of this.

/**
 * Parser for GeoPackage vector files.
 * @implements {os.parse.IParser<ol.Feature>}
 * @template T
 * @constructor
 */
plugin.geopackage.GeoPackageParser = function() {
  this.geopackage = null;
};


/**
 * @inheritDoc
 */
plugin.geopackage.GeoPackageParser.prototype.setSource = function(source) {
  var buffer = new Uint8Array(/** @type {ArrayBuffer} */ (source));
  geopackage.openGeoPackageByteArray(buffer, this.loaded);
};


plugin.geopackage.GeoPackageParser.prototype.loaded = function(err, geopackage) {
  if (!err) {
    this.geopackage = geopackage;
  }
};

/**
 * @inheritDoc
 */
plugin.geopackage.GeoPackageParser.prototype.cleanup = function() {
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
  return null;
};


/**
 * @param {Element} el The element to parse
 * @return {ol.geom.Geometry|undefined} the geometry
 */
plugin.geopackage.GeoPackageParser.parseGeometry = function(el) {
  switch (el.localName) {
    case 'point':
      return plugin.geopackage.GeoPackageParser.parsePoint_(el);
    case 'line':
      return plugin.geopackage.GeoPackageParser.parseLine_(el);
    case 'polygon':
      return plugin.geopackage.GeoPackageParser.parsePolygon_(el);
    default:
      break;
  }
};


/**
 * @param {Element} el The element to parse
 * @return {ol.geom.Point|undefined} The point geometry
 * @private
 */
plugin.geopackage.GeoPackageParser.parsePoint_ = function(el) {
  var coords = plugin.geopackage.GeoPackageParser.parseCoords_(el);

  if (!coords || coords.length === 0) {
    // no coords found!
    return;
  }

  return new ol.geom.Point(coords[0]);
};


/**
 * @param {Element} el The element to parse
 * @return {ol.geom.LineString|undefined} The line geometry
 * @private
 */
plugin.geopackage.GeoPackageParser.parseLine_ = function(el) {
  var coords = plugin.geopackage.GeoPackageParser.parseCoords_(el);

  if (!coords) {
    // no coords found!
    return;
  }

  if (coords.length < 2) {
    // need at least 2 coords for line!
    return;
  }

  return new ol.geom.LineString(coords);
};


/**
 * @param {Element} el The element to parse
 * @return {ol.geom.Polygon|undefined} The polygon geometry
 * @private
 */
plugin.geopackage.GeoPackageParser.parsePolygon_ = function(el) {
  var coords = plugin.geopackage.GeoPackageParser.parseCoords_(el);

  if (!coords) {
    // no coords found!
    return;
  }

  if (coords.length < 3) {
    // need at least 3 coords for polygon!
    return;
  }

  return new ol.geom.Polygon([coords]);
};


/**
 * @param {Element} el The element to parse
 * @return {Array<ol.Coordinate>|undefined} The array of coordinates
 * @private
 */
plugin.geopackage.GeoPackageParser.parseCoords_ = function(el) {
  var parts = el.textContent.trim().split(/\s+/);

  if (parts.length % 2 !== 0) {
    // odd amount of numbers, cannot produce pairs!
    return;
  }

  var coords = [];
  for (var i = 1, n = parts.length; i < n; i += 2) {
    var lat = parseFloat(parts[i - 1]);
    var lon = parseFloat(parts[i]);

    if (isNaN(lat) || isNaN(lon)) {
      // could not parse all lat/lons of coordinates!
      return;
    }

    var coord = [lon, lat];

    // convert to the application projection
    coords.push(ol.proj.fromLonLat(coord, os.map.PROJECTION));
  }

  return coords;
};
