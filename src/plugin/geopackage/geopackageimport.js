goog.provide('plugin.geopackage.GeoPackageImportCtrl');
goog.provide('plugin.geopackage.geopackageImportDirective');

goog.require('os.data.DataManager');
goog.require('os.file.FileStorage');
goog.require('os.ui.Module');
goog.require('os.ui.file.ui.AbstractFileImportCtrl');
goog.require('os.ui.window');
goog.require('plugin.geopackage.defines');


/**
 * The GeoPackage import directive
 * @return {angular.Directive}
 */
/* istanbul ignore next */
plugin.geopackage.geopackageImportDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: true,
    // The plugin.geopackage.ROOT define used here helps to fix the paths in the debug instance
    // vs. the compiled instance. This example assumes that you are creating an external
    // plugin. You do not necessarily need a ROOT define per plugin, but rather per project
    // so that the OpenSphere build can find the files properly.
    //
    // For an internal plugin, just require os.defines and use os.ROOT.
    templateUrl: plugin.geopackage.ROOT + 'views/plugin/geopackage/geopackageimport.html',
    controller: plugin.geopackage.GeoPackageImportCtrl,
    controllerAs: 'geopackageImport'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('geopackageimport', [plugin.geopackage.geopackageImportDirective]);


/**
 * Controller for the GeoPackage import dialog
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @extends {os.ui.file.ui.AbstractFileImportCtrl<!os.parse.FileParserConfig, !plugin.geopackage.GeoPackageDescriptor>}
 * @constructor
 * @ngInject
 */
/* istanbul ignore next */
plugin.geopackage.GeoPackageImportCtrl = function($scope, $element) {
  plugin.geopackage.GeoPackageImportCtrl.base(this, 'constructor', $scope, $element);
  this.formName = 'geopackageForm';
};
goog.inherits(plugin.geopackage.GeoPackageImportCtrl, os.ui.file.ui.AbstractFileImportCtrl);


/**
 * @inheritDoc
 */
/* istanbul ignore next */
plugin.geopackage.GeoPackageImportCtrl.prototype.createDescriptor = function() {
  var descriptor = null;
  if (this.config['descriptor']) {
    // existing descriptor, update it
    descriptor = /** @type {!plugin.geopackage.GeoPackageDescriptor} */ (this.config['descriptor']);
    plugin.geopackage.GeoPackageDescriptor.updateFromConfig(descriptor, this.config);
  } else {
    // this is a new import
    descriptor = plugin.geopackage.GeoPackageDescriptor.createFromConfig(this.config);
  }

  return descriptor;
};


/**
 * @inheritDoc
 */
/* istanbul ignore next */
plugin.geopackage.GeoPackageImportCtrl.prototype.getProvider = function() {
  return plugin.geopackage.GeoPackageProvider.getInstance();
};
