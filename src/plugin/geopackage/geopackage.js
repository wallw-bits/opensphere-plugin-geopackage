goog.provide('plugin.geopackage');

/**
 * @type {string}
 * @const
 */
plugin.geopackage.ID = 'geopackage';


/**
 * The logger.
 * @const
 * @type {goog.debug.Logger}
 * @private
 */
plugin.geopackage.LOGGER = goog.log.getLogger('plugin.geopackage');


/**
 * @param {!string} providerId The ID of the GeoPackage provider to retrieve
 * @return {!GeoPackage}
 * @throws {Error} if the provider does not exist, is not a GeoPackageProvider, or its GeoPackage is not defined
 */
plugin.geopackage.getGeoPackageByProviderId = function(providerId) {
  var list = os.dataManager.getProviderRoot().getChildren();
  if (!list) {
    throw new Error('Provider does not exist!');
  }

  list = list.filter(function(p) {
    return p.getId() === providerId;
  });

  if (!list || !list.length) {
    throw new Error('Provider does not exist!');
  }

  if (!(list[0] instanceof plugin.geopackage.GeoPackageProvider)) {
    throw new Error('Provider is not a GeoPackage provider!');
  }

  var gpkg = /** @type {plugin.geopackage.GeoPackageProvider} */ (list[0]).getGeoPackage();

  if (!gpkg) {
    throw new Error('Provider GeoPackage is not defined!');
  }

  return gpkg;
};
