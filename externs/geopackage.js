/**
 * @fileoverview Externs for ngageoint/geopackage 1.0.24
 * @externs
 */


/**
 * @type {Object}
 * @const
 */
var geopackage = {};

/**
 * Open a GeoPackage at the path specified
 * @param  {string}   gppath   path where the GeoPackage exists
 * @param  {Function} callback called with an error and the GeoPackage object if opened
 */
geopackage.openGeoPackage = function(gppath, callback) {};

/**
 * Open a GeoPackage from the byte array
 * @param  {Uint8Array}   array    Array of GeoPackage bytes
 * @param  {Function} callback called with an error if it occurred and the open GeoPackage object
 */
geopackage.openGeoPackageByteArray = function(array, callback) {};


/**
 * Gets the feature tables from the GeoPackage
 * @param  {Object}   geopackage open GeoPackage object
 * @param  {Function} callback   called with an error if one occurred and the array of feature table names
 */
geopackage.getFeatureTables = function(geopackage, callback) {};

/**
 * Get a Feature DAO from Contents
 * @param  {string}   tableName table name
 * @param  {Function} callback callback called with an error if one occurred and the {FeatureDao}
 */
geopackage.getFeatureDaoWithTableName = function (tableName, callback) {};


/**
 * Iterate GeoJSON features from table
 * @param  {Object} geopackage      open GeoPackage object
 * @param  {String} table           Table name to Iterate
 * @param  {Function} featureCallback called with an error if one occurred and the next GeoJSON feature in the table
 * @param  {Function} doneCallback    called when all rows are complete
 */
geopackage.iterateGeoJSONFeaturesFromTable = function(geopackage, table, featureCallback, doneCallback) {};

