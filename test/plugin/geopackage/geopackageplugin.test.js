// os.mock sets up a bunch of basic opensphere APIs, like settings, which are used in our plugin
goog.require('os.mock');
goog.require('plugin.geopackage.GeoPackagePlugin');

describe('plugin.geopackage.GeoPackagePlugin', function() {
  it('should have the proper ID', function() {
    expect(new plugin.geopackage.GeoPackagePlugin().id).toBe('geopackage');
  });

  it('should not throw an error', function() {
    var fn = function() {
      var p = new plugin.geopackage.GeoPackagePlugin();
      p.init();
    };

    expect(fn).not.toThrow();
  });
});
