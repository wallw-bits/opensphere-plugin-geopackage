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
        var worker = plugin.geopackage.getWorker();
        var tileCoord = imageTile.getTileCoord();

        /**
         * @param {Event|GeoPackageWorkerResponse} evt
         */
        var onMessage = function(evt) {
          var msg = /** @type {GeoPackageWorkerResponse} */ (evt instanceof Event ? evt.data : evt);

          if (msg.message.id === providerId && msg.message.type === plugin.geopackage.MsgType.GET_TILE &&
              msg.message.tableName === layerName && tileCoord.join(',') === msg.message.tileCoord.join(',')) {
            worker.removeEventListener(goog.events.EventType.MESSAGE, onMessage);

            if (msg.type === plugin.geopackage.MsgType.SUCCESS) {
              if (msg.data) {
                var url = null;

                if (goog.isString(msg.data)) {
                  url = msg.data;
                } else if (goog.isArray(msg.data)) {
                  var i32arr = Int32Array.from(/** @type {!Array<!number>} */ (msg.data));
                  var i8arr = new Uint8Array(i32arr);
                  var blob = new Blob([i8arr]);
                  url = URL.createObjectURL(blob);
                }

                if (url) {
                  imageTile.getImage().src = url;
                }
              } else {
                // empty
                imageTile.state = ol.TileState.LOADED;
                imageTile.changed();
              }
            } else {
              imageTile.state = ol.TileState.ERROR;
              imageTile.changed();
              goog.log.error(plugin.geopackage.LOGGER, 'Error querying tile from GeoPackage:' + msg.reason);
            }
          }
        };

        worker.addEventListener(goog.events.EventType.MESSAGE, onMessage);

        worker.postMessage(/** @type {GeoPackageWorkerMessage} */ ({
          id: providerId,
          type: plugin.geopackage.MsgType.GET_TILE,
          tableName: layerName,
          tileCoord: tileCoord
        }));
      }
    });
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
