goog.require('plugin.geopackage.GeoPackageLayerConfig');
goog.require('plugin.geopackage.GeoPackageParser');

describe('plugin.geopackage.GeoPackageLayerConfig', function() {
  it('should return a GeoPackage parser', function() {
    var config = new plugin.geopackage.GeoPackageLayerConfig();
    expect(config.getParser() instanceof plugin.geopackage.GeoPackageParser).toBe(true);
  });

  it('should return a GeoPackage importer', function() {
    var config = new plugin.geopackage.GeoPackageLayerConfig();
    expect(config.getImporter('http://www.geopackage.org/data/gdal_sample_v1.2_no_extensions.gpkg', {}) instanceof os.im.FeatureImporter).toBe(true);
  });
});
