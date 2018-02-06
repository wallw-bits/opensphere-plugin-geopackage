goog.require('os.file');
goog.require('plugin.geopackage.GeoPackageImportUI');

describe('plugin.geopackage.GeoPackageImportUI', function() {
  it('should have the proper title', function() {
    var importui = new plugin.geopackage.GeoPackageImportUI();
    expect(importui.getTitle()).toBe('GeoPackage');
  });

  it('should launch an import UI with an empty config', function() {
    var importui = new plugin.geopackage.GeoPackageImportUI();
    var file = os.file.createFromContent('gdal_sample_v1.2_no_extensions.gpkg', 'http://www.geopackage.org/data/gdal_sample_v1.2_no_extensions.gpkg', undefined, '');
    spyOn(os.ui.window, 'create');
    var ui = importui.launchUI(file, {});
    expect(os.ui.window.create).toHaveBeenCalled();
  });

  it('should launch an import UI with a null config', function() {
    var importui = new plugin.geopackage.GeoPackageImportUI();
    var file = os.file.createFromContent('gdal_sample_v1.2_no_extensions.gpkg', 'http://www.geopackage.org/data/gdal_sample_v1.2_no_extensions.gpkg', undefined, '');
    spyOn(os.ui.window, 'create');
    var ui = importui.launchUI(file, undefined);
    expect(os.ui.window.create).toHaveBeenCalled();
  });

  it('should launch an import UI with a config', function() {
    var importui = new plugin.geopackage.GeoPackageImportUI();
    var file = os.file.createFromContent('gdal_sample_v1.2_no_extensions.gpkg', 'http://www.geopackage.org/data/gdal_sample_v1.2_no_extensions.gpkg', undefined, '');
    spyOn(os.ui.window, 'create');
    var ui = importui.launchUI(file, {'title' : 'other'});
    expect(os.ui.window.create).toHaveBeenCalled();
  });
});

