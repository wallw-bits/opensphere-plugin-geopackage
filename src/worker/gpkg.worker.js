/**
 * Worker to provide GPKG access to avoid blocking the main thread during database interactions
 */
'use strict';

var geopackage;


/**
 * This corresponds to plugin.geopackage.MsgType
 * @enum {string}
 */
var MsgType = {
  SUCCESS: 'success',
  ERROR: 'error'
};


/**
 * @type {boolean}
 */
var isNode = false;

/**
 * placeholder for library
 */
var geopackage = null;


/**
 * @param {string} reason
 * @param {GeoPackageWorkerMessage} originalMsg
 */
var handleError = function(reason, originalMsg) {
  // don't send anything potentially large back in the error message
  delete originalMsg.data;

  postMessage({type: MsgType.ERROR, reason: reason, message: originalMsg});
};


/**
 * @param {GeoPackageWorkerMessage} originalMsg
 * @param {*=} opt_data
 */
var success = function(originalMsg, opt_data) {
  var msg = {
    message: originalMsg,
    type: MsgType.SUCCESS
  };

  var transferables;

  if (opt_data != null) {
    msg.data = opt_data;

    if (!isNode) {
      if (msg.data instanceof ArrayBuffer) {
        transferables = [msg.data];
      } else if (ArrayBuffer.isView(msg.data)) {
        msg.data = msg.data.buffer;
        transferables = [msg.data];
      }
    }
  }

  postMessage(msg, transferables);
};


/**
 * @type {Object<string, Geopackage>}
 */
var gpkgById = {};

/**
 * @param {GeoPackageWorkerMessage} msg
 */
var openGpkg = function(msg) {
  if (!msg.url && !msg.data) {
    handleError('url or data property must exist', msg);
    return;
  }

  if (!msg.id) {
    handleError('id property must exist', msg);
    return;
  }

  var onGpkg = function(err, gpkg) {
    if (err) {
      handleError(err, msg);
      return;
    }

    gpkgById[msg.id] = gpkg;
    success(msg);
  };

  if (msg.data) {
    var data = msg.data;
    if (data instanceof ArrayBuffer) {
      data = new Uint8Array(data);
    }

    if (!(data instanceof Uint8Array)) {
      handleError('data must be ArrayBuffer or Uint8Array', msg);
      return;
    }

    geopackage.openGeoPackageByteArray(data, onGpkg);
  } else if (msg.url) {
    if (msg.url.startsWith('file://')) {
      geopackage.GeoPackageManager.open(msg.url.substring(7), onGpkg);
    }
  }
};


/**
 * @param {GeoPackageWorkerMessage} msg
 * @return {Geopackage|undefined}
 */
var getGpkg = function(msg) {
  if (!msg.id) {
    handleError('id property must be set', msg);
    return;
  }

  var id = msg.id;
  if (!(id in gpkgById)) {
    handleError('No open GeoPackage exists for the given ID', msg);
    return;
  }

  return gpkgById[id];
};


/**
 * @param {GeoPackageWorkerMessage} msg
 */
var closeGpkg = function(msg) {
  // we get it this way so it does not error if it does not exist
  var gpkg = gpkgById[msg.id];

  if (gpkg) {
    gpkg.close();
    delete gpkgById[msg.id];
  }
};


/**
 * @param {?GeoPackage.TileMatrix} tileMatrix
 * @return {?number} resolution
 */
var tileMatrixToResolution = function(tileMatrix) {
  return tileMatrix ? tileMatrix.pixel_x_size : null;
};


/**
 * @param {?GeoPackage.TileMatrix} tileMatrix
 * @return {?(number|ol.Size)} The tile size
 */
var tileMatrixToTileSize = function(tileMatrix) {
  if (!tileMatrix) {
    return null;
  }

  var h = tileMatrix.tile_height;
  var w = tileMatrix.tile_width;
  return w === h ? w : [w, h];
};


/**
 * OpenLayers does not permit resolution arrays with null/undefined values.
 * We'll invent some numbers. The minZoom will save the invented numbers from
 * actually being accessed in any real sense.
 * @param {Array<?number>} resolutions
 * @return {Array<!number>} resolutions
 */
var fixResolutions = function(resolutions) {
  var first = -1;
  var second = -1;

  for (var i = 0, n = resolutions.length; i < n; i++) {
    if (resolutions[i] != null) {
      first = resolutions[i];
      break;
    }
  }

  if (resolutions.length - i > 1) {
    second = resolutions[i + 1];
  }

  if (first > -1) {
    var zoomFactor = second > -1 ? first / second : 2;

    while (i--) {
      resolutions[i] = resolutions[i + 1] * zoomFactor;
    }
  }

  return resolutions;
};


/**
 * @param {GeoPackageWorkerMessage} msg
 */
var listDescriptors = function(msg) {
  var gpkg = getGpkg(msg);

  if (gpkg) {
    var descriptors = [];
    var tileTablesRemaining = -1;
    var featureTablesRemaining = -1;

    var onTileInfo = function(tileDao, err, info) {
      if (err) {
        handleError(err, msg);
        return;
      }

      if (info) {
        var tileMatrices = tileDao.zoomLevelToTileMatrix;

        var config = {
          type: 'geopackage-tile',
          title: info.tableName,
          tableName: info.tableName,
          minZoom: Math.round(info.minZoom),
          maxZoom: Math.round(info.maxZoom),
          resolutions: fixResolutions(tileMatrices.map(tileMatrixToResolution)),
          tileSizes: tileMatrices.map(tileMatrixToTileSize)
        };

        if (info.contents) {
          config.title = info.contents.identifier || config.title;
          config.description = info.contents.description || config.description;
        }

        if (info.srs) {
          config.projection = info.srs.organization.toUpperCase() + ':' +
              (info.srs.organization_coordsys_id || info.srs.id);
        }

        if (info.tileMatrixSet) {
          config.extent = [
            info.tileMatrixSet.minX,
            info.tileMatrixSet.minY,
            info.tileMatrixSet.maxX,
            info.tileMatrixSet.maxY];

          config.extentProjection = config.projection || 'EPSG:' + info.tileMatrixSet.srsId;
        }

        descriptors.push(config);
        tileTablesRemaining--;

        if (!tileTablesRemaining && !featureTablesRemaining) {
          success(msg, descriptors);
        }
      }
    };

    var onTileDao = function(err, tileDao) {
      if (err) {
        handleError(err, msg);
        return;
      }

      gpkg.getInfoForTable(tileDao, onTileInfo.bind(null, tileDao));
    };

    var onTileTables = function(err, tileTables) {
      if (err) {
        handleError(err, msg);
        return;
      }

      tileTablesRemaining = tileTables.length;
      tileTables.forEach(function(tileTable) {
        gpkg.getTileDaoWithTableName(tileTable, onTileDao);
      });
    };

    gpkg.getTileTables(onTileTables);


    var onFeatureInfo = function(err, info) {
      if (err) {
        handleError(err, msg);
        return;
      }

      if (info) {
        var cols = info.columns.map(function(col) {
          return /** @type {os.ogc.FeatureTypeColumn} */ ({
            type: col.dataType.toLowerCase(),
            name: col.name
          });
        });

        var config = {
          type: 'geopackage-vector',
          title: info.tableName,
          tableName: info.tableName,
          dbColumns: cols
        };

        if (info.contents) {
          config.title = info.contents.identifier || config.title;
          config.description = info.contents.description || config.description;
        }

        descriptors.push(config);
        featureTablesRemaining--;

        if (!tileTablesRemaining && !featureTablesRemaining) {
          success(msg, descriptors);
        }
      }
    };

    var onFeatureDao = function(err, featureDao) {
      if (err) {
        handleError(err, msg);
        return;
      }

      gpkg.getInfoForTable(featureDao, onFeatureInfo);
    };

    var onFeatureTables = function(err, featureTables) {
      if (err) {
        handleError(err, msg);
        return;
      }

      featureTablesRemaining = featureTables.length;
      featureTables.forEach(function(featureTable) {
        gpkg.getFeatureDaoWithTableName(featureTable, onFeatureDao);
      });
    };

    gpkg.getFeatureTables(onFeatureTables);
  }
};


/**
 * @param {GeoPackageWorkerMessage} msg
 */
var getTile = function(msg) {
  var gpkg = getGpkg(msg);

  if (!msg.tableName) {
    handleError('tableName property must be set', msg);
    return;
  }

  if (!msg.tileCoord) {
    handleError('tileCoord property must be set', msg);
    return;
  }

  if (msg.tileCoord.length !== 3) {
    handleError('tileCoord [z, x, y] must have a length of exactly 3', msg);
    return;
  }

  var onTile = function(err, tile) {
    if (err) {
      handleError(err, msg);
      return;
    }

    if (!tile) {
      success(msg);
      return;
    }

    var array = tile.getTileData();

    if (isNode) {
      success(msg, Array.from(new Int32Array(array)));
    } else {
      var blob = new Blob([array]);
      success(msg, URL.createObjectURL(blob));
    }
  };

  var onTileDao = function(err, tileDao) {
    if (err) {
      handleError(err, msg);
      return;
    }

    tileDao.queryForTile(msg.tileCoord[1], -msg.tileCoord[2] - 1, msg.tileCoord[0], onTile);
  };

  gpkg.getTileDaoWithTableName(msg.tableName, onTileDao);
};


/**
 * @param {GeoPackageWorkerMessage} msg
 */
var getFeatures = function(msg) {
  var gpkg = getGpkg(msg);

  if (!msg.tableName) {
    handleError('tableName property must be set', msg);
    return;
  }

  var onFeature = function(err, geoJson, rowDone) {
    if (err) {
      handleError(err, msg);
      return;
    }

    if (geoJson) {
      success(msg, geoJson);
    }

    rowDone();
  };

  var onDone = function(err) {
    if (err) {
      handleError(err, msg);
      return;
    }

    success(msg, 0);
  };

  geopackage.iterateGeoJSONFeaturesFromTable(gpkg, msg.tableName, onFeature, onDone);
};


/**
 * @param {GeoPackageWorkerMessage} msg
 */
var exportCreate = function(msg) {
  if (!msg.id) {
    handleError('id property must be set', msg);
    return;
  }

  var url = msg.url || 'tmp.gpkg';
  var onCreate = function(err, gpkg) {
    if (err) {
      handleError(err, msg);
      return;
    }

    if (gpkg) {
      gpkgById[msg.id] = gpkg;
      success(msg);
    }
  };

  geopackage.createGeoPackage(url, onCreate);
};


/**
 * @param {GeoPackageWorkerMessage} msg
 */
var exportCreateTable = function(msg) {
  var gpkg = getGpkg(msg);

  if (!msg.tableName) {
    handleError('tableName property must be set', msg);
    return;
  }

  if (!msg.columns) {
    handleError('columns property must be set', msg);
    return;
  }

  var FeatureColumn = geopackage.FeatureColumn;
  var DataType = geopackage.DataTypes.GPKGDataType;

  var geometryColumns = new geopackage.GeometryColumns();
  geometryColumns.table_name = msg.tableName;
  geometryColumns.column_name = 'geometry';
  geometryColumns.geometry_type_name = 'GEOMETRY';
  geometryColumns.z = 2;
  geometryColumns.m = 0;

  var columns = [];
  columns.push(FeatureColumn.createPrimaryKeyColumnWithIndexAndName(0, 'id'));
  columns.push(FeatureColumn.createGeometryColumn(1, 'geometry', 'GEOMETRY', false, null));

  msg.columns.forEach(function(col) {
    if (col.field.toLowerCase() === 'id' || col.field.toLowerCase() === 'geometry') {
      return;
    }

    var type = DataType.GPKG_DT_TEXT;
    var defaultValue = '';
    var colType = col.type.toLowerCase();

    if (colType === 'decimal') {
      type = DataType.GPKG_DT_REAL;
      defaultValue = null;
    } else if (colType === 'integer') {
      type = DataType.GPKG_DT_INTEGER;
      defaultValue = null;
    } else if (colType === 'datetime') {
      type = DataType.GPKG_DT_DATETIME;
      defaultValue = null;
    }

    if (col.field === 'recordTime') {
      columns.push(FeatureColumn.createColumnWithIndex(columns.length,
          'TIME_START', DataType.GPKG_DT_DATETIME, false, null));
      columns.push(FeatureColumn.createColumnWithIndex(columns.length,
          'TIME_STOP', DataType.GPKG_DT_DATETIME, false, null));
    } else {
      columns.push(FeatureColumn.createColumnWithIndex(columns.length, col.field, type, false, defaultValue));
    }
  });

  var onCreateTable = function(err, featureDao) {
    if (err) {
      handleError(err, msg);
      return;
    }

    success(msg);
  };

  geopackage.createFeatureTable(gpkg, msg.tableName, geometryColumns, columns, onCreateTable);
};


/**
 * @param {GeoPackageWorkerMessage} msg
 */
var exportGeoJSON = function(msg) {
  var gpkg = getGpkg(msg);

  if (!msg.tableName) {
    handleError('tableName property must be set', msg);
    return;
  }

  if (!msg.data || typeof msg.data !== 'object') {
    handleError('GeoJSON feature not found on msg.data', msg);
    return;
  }

  geopackage.addGeoJSONFeatureToGeoPackage(gpkg, msg.data, msg.tableName, function(err) {
    if (err) {
      handleError(err, msg);
    } else {
      success(msg);
    }
  });
};


/**
 * @type {Object<string, {data: Uint8Array, index: number}>}
 */
var exportsById = {};


/**
 * @param {GeoPackageWorkerMessage} msg
 */
var exportWrite = function(msg) {
  var gpkg = getGpkg(msg);

  gpkg.export(function(err, data) {
    if (err) {
      handleError(err, msg);
      return;
    }

    exportsById[msg.id] = {
      data: new Uint8Array(data),
      index: 0
    };

    success(msg);
  });
};


/**
 * @param {GeoPackageWorkerMessage} msg
 */
var exportGetChunk = function(msg) {
  if (!msg.id) {
    handleError('id property must be set', msg);
    return;
  }

  var ex = exportsById[msg.id];

  if (!ex) {
    handleError('an export for the id has not been started', msg);
    return;
  }

  var data = ex.data;

  if (isNode) {
    var limit = Math.min(ex.index + (1024 * 1024) + 1, ex.data.length);
    var data = Array.from(ex.data.subarray(ex.index, limit));
    ex.index = limit;
  }

  success(msg, data);
};


/**
 * @param {GeoPackageWorkerMessage} msg
 */
var exportWriteFinish = function(msg) {
  closeGpkg(msg);
  delete exportsById[msg.id];
  success(msg);
};


var ExportCommands = {
  create: exportCreate,
  createTable: exportCreateTable,
  geojson: exportGeoJSON,
  write: exportWrite,
  getChunk: exportGetChunk,
  writeFinish: exportWriteFinish
};


/**
 * @param {GeoPackageWorkerMessage} msg
 */
var exportGpkg = function(msg) {
  if (!msg.command) {
    handleError('command property must be set', msg);
    return;
  }

  if (msg.command in ExportCommands) {
    ExportCommands[msg.command](msg);
  } else {
    handleError('Unknown command type', msg);
  }
};


/**
 * @param {GeoPackageWorkerMessage} msg
 */
var openLibrary = function(msg) {
  if (!isNode) {
    // this allows the main application to detect where this is loaded
    importScripts(msg.url);
    geopackage = window.geopackage;
  }
};

var MsgCommands = {
  openLibrary: openLibrary,
  open: openGpkg,
  close: closeGpkg,
  listDescriptors: listDescriptors,
  getTile: getTile,
  getFeatures: getFeatures,
  export: exportGpkg
};

/**
 * @param {Event|GeoPackageWorkerMessage} evt The message
 * @this Worker
 */
var onMessage = function(evt) {
  var msg = /** @type {GeoPackageWorkerMessage} */ (isNode ? evt : evt.data);

  if (msg) {
    if (msg.type in MsgCommands) {
      MsgCommands[msg.type](msg);
    } else {
      handleError('Unknown message type', msg);
    }
  }
};


// the browser library needs this to exist
var window = this;

(function() {
  if (typeof self === 'object') {
    self.addEventListener('message', onMessage);
  } else {
    isNode = true;
    process.on('message', onMessage);

    /**
     * @param {GeoPackageWorkerResponse} msg
     */
    global.postMessage = function(msg) {
      process.send(msg);
    };

    geopackage = require('@ngageoint/geopackage');
  }
})();
