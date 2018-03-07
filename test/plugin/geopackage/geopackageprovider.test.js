goog.require('plugin.geopackage.GeoPackageProvider');

describe('plugin.geopackage.GeoPackageProvider', function() {
  it('should configure properly', function() {
    var p = new plugin.geopackage.GeoPackageProvider();

    p.configure({
      type: 'geopackage'
    });

    expect(p.getId()).toBe('geopackage');
    expect(p.getLabel()).toBe('GeoPackage Files');
  });
});
