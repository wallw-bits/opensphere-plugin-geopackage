goog.provide('plugin.geopackage.TileLayerConfig');

goog.require('goog.log');
goog.require('ol.ImageTile');
goog.require('ol.TileState');
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
      'minZoom': Math.max(0, Math.round(options['minZoom'])),
      'resolutions': options['resolutions'],
      'tileSizes': options['tileSizes']
    })),
    'wrapX': this.projection.isGlobal()
  }));

  plugin.geopackage.addTileListener_();
  return source;
};


/**
 * @param {string} providerId
 * @return {!ol.TileLoadFunctionType}
 * @private
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
        var msg = /** @type {GeoPackageWorkerMessage} */ ({
          id: providerId,
          type: plugin.geopackage.MsgType.GET_TILE,
          tableName: layerName,
          tileCoord: imageTile.getTileCoord()
        });

        var key = msg.id + '#' + msg.type + '#' + msg.tableName + '#' + msg.tileCoord.join(',');
        plugin.geopackage.tiles_[key] = imageTile;
        plugin.geopackage.getWorker().postMessage(msg);
      }
    });
};


/**
 * @type {boolean}
 * @private
 */
plugin.geopackage.tileListenerSet_ = false;


/**
 * @private
 */
plugin.geopackage.addTileListener_ = function() {
  if (!plugin.geopackage.tileListenerSet_) {
    plugin.geopackage.getWorker().addEventListener(goog.events.EventType.MESSAGE, plugin.geopackage.tileListener_);
    plugin.geopackage.tileListenerSet_ = true;
  }
};


/**
 * @type {!Object<string, !ol.ImageTile>}
 */
plugin.geopackage.tiles_ = {};


/**
 * @param {Event|GeoPackageWorkerResponse} evt
 * @private
 * @suppress {accessControls}
 */
plugin.geopackage.tileListener_ = function(evt) {
  var msg = /** @type {GeoPackageWorkerResponse} */ (evt instanceof Event ? evt.data : evt);

  if (msg.message.type === plugin.geopackage.MsgType.GET_TILE) {
    var key = msg.message.id + '#' + msg.message.type + '#' + msg.message.tableName + '#' +
        msg.message.tileCoord.join(',');
    var imageTile = plugin.geopackage.tiles_[key];

    if (imageTile) {
      delete plugin.geopackage.tiles_[key];

      if (msg.type === plugin.geopackage.MsgType.SUCCESS) {
        if (msg.data) {
          var url = null;

          if (typeof msg.data === 'string') {
            // Web Worker path
            url = msg.data;
          } else if (goog.isArray(msg.data)) {
            // node process path
            var i32arr = Int32Array.from(/** @type {!Array<!number>} */ (msg.data));
            var i8arr = new Uint8Array(i32arr);
            var blob = new Blob([i8arr]);
            url = URL.createObjectURL(blob);
          }

          if (url) {
            imageTile.getImage().src = url;
          }
        } else {
          // Tile is emtpy, so display a blank image. Note that ol.TileState.EMPTY is NOT WHAT WE WANT.
          // Empty causes OpenLayers to keep displaying the parent tile for coverage. We want a blank
          // tile.
          imageTile.image_ = ol.ImageTile.getBlankImage();
          imageTile.state = ol.TileState.LOADED;
          imageTile.changed();
        }
      } else {
        imageTile.handleImageError_();
        goog.log.error(plugin.geopackage.LOGGER, 'Error querying tile from GeoPackage:' + msg.reason);
      }
    }
  }
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
