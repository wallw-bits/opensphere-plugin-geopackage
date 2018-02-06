goog.require('os.events.EventType');
goog.require('os.file.File');
goog.require('os.ui.file.method.UrlMethod');
goog.require('os.mock');
goog.require('plugin.geopackage.GeoPackageTypeMethod');

describe('plugin.geopackage.GeoPackageTypeMethod', function() {
  it('should detect GeoPackage files', function() {
    var testUrl = 'http://www.geopackage.org/data/gdal_sample_v1.2_no_extensions.gpkg';
    // var testUrl = 'gdal_sample_v1.2_no_extensions.gpkg';
    var urlMethod = new os.ui.file.method.UrlMethod();
    urlMethod.setUrl(testUrl);

    var methodComplete = false;
    var onComplete = function(event) {
      methodComplete = true;
    };

    urlMethod.listenOnce(os.events.EventType.COMPLETE, onComplete);
    urlMethod.loadFile();

    waitsFor(function() {
      return methodComplete == true;
    }, 'url to load');

    runs(function() {
      var file = urlMethod.getFile();
      var typeMethod = new plugin.geopackage.GeoPackageTypeMethod();
      expect(typeMethod.isType(file)).toBe(true);
    });
  });

  it('should report the GeoPackage plugin ID as its type', function() {
    var typeMethod = new plugin.geopackage.GeoPackageTypeMethod();
    expect(typeMethod.getLayerType()).toBe('GeoPackage');
  });
});
