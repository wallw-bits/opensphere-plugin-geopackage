goog.provide('plugin.geopackage.TileLayerConfig');

goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('ol.source.TileImage');
goog.require('ol.tilegrid.TileGrid');
goog.require('os.layer.config.AbstractTileLayerConfig');
goog.require('plugin.geopackage.Tile');


/**
 * Creates a tile layer from a GeoPackage.
 *
 * @extends {os.layer.config.AbstractTileLayerConfig}
 * @constructor
 */
plugin.geopackage.TileLayerConfig = function() {
  plugin.geopackage.TileLayerConfig.base(this, 'constructor');
  this.tileClass = plugin.geopackage.Tile;
};
goog.inherits(plugin.geopackage.TileLayerConfig, os.layer.config.AbstractTileLayerConfig);


/**
 * @inheritDoc
 */
plugin.geopackage.TileLayerConfig.prototype.getSource = function(options) {
  var parts = options['id'].split(os.ui.data.BaseProvider.ID_DELIMITER);

  var source = new ol.source.TileImage(/** @type {olx.source.TileImageOptions} */ ({
    'projection': this.projection,
    'tileLoadFunction': plugin.geopackage.getTileLoadFunction_(parts[0]),
    'tileUrlFunction': plugin.geopackage.getTileUrlFunction_(parts[1]),
    'tileGrid': new ol.tilegrid.TileGrid(/** @type {olx.tilegrid.TileGridOptions} */ ({
      'extent': options.extent,
      'minZoom': Math.round(options['minZoom']),
      'resolutions': options['resolutions'],
      'tileSizes': options['tileSizes']
    })),
    'wrapX': this.projection.isGlobal()
  }));

  return source;
};


/**
 * @param {string} providerId
 * @return {!ol.TileLoadFunctionType}
 * @private
 * @suppress {accessControls}
 */
plugin.geopackage.getTileLoadFunction_ = function(providerId) {
  var gpkg = plugin.geopackage.getGeoPackageByProviderId(providerId);

  return (
    /**
     * @param {ol.Tile} tile The image tile
     * @param {string} layerName The layer name
     */
    function(tile, layerName) {
      var imageTile = /** @type {ol.ImageTile} */ (tile);
      var prevSrc = imageTile.getImage().src;
      if (prevSrc) {
        // recycle it
        URL.revokeObjectURL(prevSrc);
      }


      if (layerName) {
        gpkg.getTileDaoWithTableName(layerName, function(err, tileDao) {
          if (err) {
            goog.log.error(plugin.geopackage.LOGGER, 'Error querying tileDao from GeoPackage: ' + String(err));
            imageTile.state = ol.TileState.ERROR;
            imageTile.changed();
            return;
          }

          var tileCoord = imageTile.getTileCoord();
          tileDao.queryForTile(tileCoord[1], -tileCoord[2] - 1, tileCoord[0], function(err, tile) {
            if (err) {
              imageTile.state = ol.TileState.ERROR;
              imageTile.changed();
              goog.log.error(plugin.geopackage.LOGGER, 'Error querying tile from GeoPackage:' + String(err));
              return;
            }

            if (!tile) {
              // no tile data, finish loading
              imageTile.state = ol.TileState.LOADED;
              imageTile.changed();
              return;
            }

            var array = tile.getTileData();

            // determine the image type
            var type;
            if (plugin.geopackage.isJPEG(array)) {
              type = 'image/jpeg';
            } else if (plugin.geopackage.isPNG(array)) {
              type = 'image/png';
            }

            var blob = new Blob([array], {type: type});
            imageTile.getImage().src = URL.createObjectURL(blob);
          });
        });
      }
    });
};


/**
 * @param {Uint8Array} array Byte data
 * @return {boolean} Whether or not the image is a JPEG
 */
plugin.geopackage.isJPEG = function(array) {
  if (!array) {
    return false;
  }

  // JPEGs should begin with FFD8 and end with FFD9
  var begin = [0xFF, 0xD8];
  var end = [0xFF, 0xD9];

  for (var i = 0, n = Math.min(begin.length, array.length); i < n; i++) {
    if (array[i] !== begin[i]) {
      return false;
    }
  }

  for (i = array.length - end.length, n = array.length; i < n; i++) {
    if (array[i] !== end[i]) {
      return false;
    }
  }

  return true;
};


/**
 * @param {Uint8Array} array Byte data
 * @return {boolean} Whether or not the image is a PNG
 */
plugin.geopackage.isPNG = function(array) {
  if (!array) {
    return false;
  }

  // all PNG files should begin with 89 50 4E 47 0D 0A 1A 0A
  var check = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
  for (var i = 0, n = Math.min(check.length, array.length); i < n; i++) {
    if (array[i] !== check[i]) {
      return false;
    }
  }

  return true;
};


/**
 * @param {string} layerName The table name for the layer
 * @return {ol.TileUrlFunctionType}
 * @private
 */
plugin.geopackage.getTileUrlFunction_ = function(layerName) {
  return (
    /**
     * @param {ol.TileCoord} tileCoord The tile coordinate
     * @param {number} pixelRatio The tile pixel ratio
     * @param {ol.proj.Projection} projection The projection
     * @return {string|undefined} Tile URL
     */
    function(tileCoord, pixelRatio, projection) {
      return layerName;
    });
};
