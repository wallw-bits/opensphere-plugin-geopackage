goog.provide('plugin.geopackage.GeoPackageTypeMethod');
goog.require('os.file.IContentTypeMethod');


/**
 * Type method for GeoPackage vector content.
 * @implements {os.file.IContentTypeMethod}
 * @constructor
 */
plugin.geopackage.GeoPackageTypeMethod = function() {};



/**
 * @type {RegExp}
 * @const
 */
plugin.geopackage.GeoPackageTypeMethod.EXT_REGEXP = /\.gpkg$/i;


/**
 * @inheritDoc
 */
plugin.geopackage.GeoPackageTypeMethod.prototype.getPriority = function() {
  return 0;
};


/**
 * @inheritDoc
 */
plugin.geopackage.GeoPackageTypeMethod.prototype.getContentType = function() {
  return 'application/x-sqlite3';
};


/**
 * @inheritDoc
 */
plugin.geopackage.GeoPackageTypeMethod.prototype.getLayerType = function() {
  return 'GeoPackage';
};


/**
 * @inheritDoc
 */
plugin.geopackage.GeoPackageTypeMethod.prototype.isType = function(file, opt_zipEntries) {
  var content = /** @type {ArrayBuffer} */ (file.getContent());
  var fileName = file.getFileName();

  if (content instanceof ArrayBuffer && fileName.match(plugin.geopackage.GeoPackageTypeMethod.EXT_REGEXP)) {
    return plugin.geopackage.GeoPackageTypeMethod.isGeoPackageFileType(/** @type {ArrayBuffer} */ (content));
  }

  return false;
};

/**
 * Tests if the supplied content is for a GeoPackage file.
 * @param {ArrayBuffer} content
 * @return {boolean}
 * @private
 */
plugin.geopackage.GeoPackageTypeMethod.isGeoPackageFileType = function(content) {
  var dv = new DataView(content.slice(0, 15));
  var header = '';
  for (var i = 0, n = dv.byteLength; i < n; i++) {
    header += /** @type {string} */ (String.fromCharCode(dv.getUint8(i)));
  }
  return header == 'SQLite format 3';
};
