goog.provide('plugin.geopackage');


/**
 * @define {string}
 */
goog.define('plugin.geopackage.ROOT', '../opensphere-plugin-geopackage/');

/**
 * @define {string}
 */
goog.define('plugin.geopackage.GPKG_PATH', 'vendor/geopackage/geopackage.min.js');

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
 * @enum {string}
 */
plugin.geopackage.MsgType = {
  OPEN_LIBRARY: 'openLibrary',
  OPEN: 'open',
  CLOSE: 'close',
  LIST_DESCRIPTORS: 'listDescriptors',
  GET_TILE: 'getTile',
  GET_FEATURES: 'getFeatures',
  EXPORT: 'export',
  SUCCESS: 'success',
  ERROR: 'error'
};

/**
 * @enum {string}
 */
plugin.geopackage.ExportCommands = {
  CREATE: 'create',
  CREATE_TABLE: 'createTable',
  GEOJSON: 'geojson',
  WRITE: 'write',
  GET_CHUNK: 'getChunk',
  WRITE_FINISH: 'writeFinish'
};


/**
 * @type {?Worker}
 * @private
 */
plugin.geopackage.worker_ = null;


/**
 * @return {!Worker} The GeoPackage worker
 */
plugin.geopackage.getWorker = function() {
  if (!plugin.geopackage.worker_) {
    var src = plugin.geopackage.ROOT + 'src/worker/gpkg.worker.js';

    if (window.global && window.process) {
      // spawn a child process and make it look like a worker

      // bracket notation because closure + browser AND node is gonna suck
      var cp = window['require']('child_process');
      var child = cp['fork'](src);

      child['addEventListener'] = child['addListener'];
      child['removeEventListener'] = child['removeListener'];
      child['postMessage'] = function(msg) {
        child['send'](msg);
      };

      plugin.geopackage.worker_ = /** @type {!Worker} */ (child);
    } else {
      plugin.geopackage.worker_ = new Worker(src);
      plugin.geopackage.worker_.postMessage(/** @type {GeoPackageWorkerMessage} */ ({
        type: plugin.geopackage.MsgType.OPEN_LIBRARY,
        url: (!plugin.geopackage.GPKG_PATH.startsWith('/') ? '../../' : '') + plugin.geopackage.GPKG_PATH
      }));
    }
  }

  return plugin.geopackage.worker_;
};
