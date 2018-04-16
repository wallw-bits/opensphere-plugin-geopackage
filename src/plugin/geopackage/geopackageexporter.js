goog.provide('plugin.geopackage.Exporter');

goog.require('goog.log');
goog.require('ol.format.GeoJSON');
goog.require('os.data.RecordField');
goog.require('os.ex.AbstractExporter');
goog.require('os.map');


/**
 * The GeoPackage exporter.
 * @extends {os.ex.AbstractExporter<ol.Feature>}
 * @constructor
 */
plugin.geopackage.Exporter = function() {
  plugin.geopackage.Exporter.base(this, 'constructor');
  this.log = plugin.geopackage.Exporter.LOGGER_;
  this.format = new ol.format.GeoJSON();
  this.boundFeatureComplete_ = this.onFeatureAdded_.bind(this);
  this.boundTable_ = this.createTable_.bind(this);
  this.boundTableComplete_ = this.onTableComplete_.bind(this);

  /**
   * @type {?GeoPackage}
   * @private
   */
  this.gpkg_ = null;

  /**
   * @type {!Object<string, null>}
   * @private
   */
  this.tables_ = {};

  /**
   * @type {!Object<string, string>}
   * @private
   */
  this.idsToTables_ = {};
};
goog.inherits(plugin.geopackage.Exporter, os.ex.AbstractExporter);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
plugin.geopackage.Exporter.LOGGER_ = goog.log.getLogger('plugin.geopackage.Exporter');


/**
 * @inheritDoc
 */
plugin.geopackage.Exporter.prototype.getLabel = function() {
  return 'GeoPackage';
};


/**
 * @inheritDoc
 */
plugin.geopackage.Exporter.prototype.getExtension = function() {
  return 'gpkg';
};


/**
 * @inheritDoc
 */
plugin.geopackage.Exporter.prototype.getMimeType = function() {
  return 'application/x-sqlite3';
};


/**
 * @inheritDoc
 */
plugin.geopackage.Exporter.prototype.isAsync = function() {
  return true;
};


/**
 * @inheritDoc
 */
plugin.geopackage.Exporter.prototype.supportsMultiple = function() {
  return true;
};


/**
 * @inheritDoc
 */
plugin.geopackage.Exporter.prototype.reset = function() {
  plugin.geopackage.Exporter.base(this, 'reset');
  if (this.gpkg_) {
    this.gpkg_.close();
  }
  this.gpkg_ = null;
  this.tables_ = {};
  this.idsToTables_ = {};
};


/**
 * @param {!string} errorMsg
 * @private
 */
plugin.geopackage.Exporter.prototype.reportError_ = function(errorMsg) {
  var msg = 'Error creating ' + this.getLabel() + ' file: ' + errorMsg;
  os.alertManager.sendAlert(msg, os.alert.AlertEventSeverity.ERROR, this.log);

  if (this.gpkg_) {
    this.gpkg_.close();
  }

  this.dispatchEvent(os.events.EventType.ERROR);
};

/**
 * @inheritDoc
 */
plugin.geopackage.Exporter.prototype.process = function() {
  geopackage.createGeoPackage('tmp.gpkg', this.onCreate_.bind(this));
};


/**
 * @param {*} err
 * @param {GeoPackage} gpkg The GeoPackage
 */
plugin.geopackage.Exporter.prototype.onCreate_ = function(err, gpkg) {
  if (err) {
    this.reportError_(String(err));
    return;
  }

  if (!gpkg) {
    this.reportError_('GeoPackage creation failed!');
    return;
  }

  this.gpkg_ = gpkg;
  this.index_ = 0;
  this.parseNext_(null);
};


/**
 * @param {*} err
 * @private
 */
plugin.geopackage.Exporter.prototype.parseNext_ = function(err) {
  if (err) {
    this.reportError_(String(err));
    return;
  }

  if (this.index_ === this.items.length) {
    this.gpkg_.export(this.onExport_.bind(this));
    return;
  }

  var feature = this.items[this.index_];
  var source = this.getSource_(feature);
  if (!source) {
    this.reportError_('Could not determine source for ' + feature.getId());
    return;
  }

  var id = source.getId();
  var tableName;

  if (id in this.idsToTables_) {
    tableName = this.idsToTables_[id];
  } else {
    tableName = /** @type {!os.layer.ILayer} */ (os.MapContainer.getInstance().getLayer(id)).getTitle();
    this.idsToTables_[id] = tableName;
  }

  if (!tableName) {
    this.reportError_('Could not determine table name for ' + feature.getId());
    return;
  }

  if (!(tableName in this.tables_)) {
    this.boundTable_(source, tableName);
    return;
  }

  var geojson = this.format.writeFeatureObject(feature, {
    featureProjection: os.map.PROJECTION,
    dataProjection: os.proj.EPSG4326,
    fields: this.fields
  });

  var props = geojson['properties'];

  var itime = feature.get(os.data.RecordField.TIME);
  if (itime) {
    props[plugin.geopackage.Exporter.RECORD_TIME_START_FIELD] = new Date(itime.getStart()).toISOString();

    if (itime instanceof os.time.TimeRange) {
      props[plugin.geopackage.Exporter.RECORD_TIME_STOP_FIELD] = new Date(itime.getEnd()).toISOString();
    }
  }

  geopackage.addGeoJSONFeatureToGeoPackage(this.gpkg_, geojson, tableName, this.boundFeatureComplete_);
};


/**
 * @param {*} err
 * @private
 */
plugin.geopackage.Exporter.prototype.onFeatureAdded_ = function(err) {
  if (err) {
    this.reportError_(String(err));
    return;
  }

  this.index_++;
  this.parseNext_(null);
};


/**
 * @param {!os.source.Vector} source The source
 * @param {!string} tableName The name for the new table
 * @private
 */
plugin.geopackage.Exporter.prototype.createTable_ = function(source, tableName) {
  var FeatureColumn = geopackage.FeatureColumn;
  var DataType = geopackage['DataTypes']['GPKGDataType'];

  var geometryColumns = new geopackage.GeometryColumns();
  geometryColumns.table_name = tableName;
  geometryColumns.column_name = 'geometry';
  geometryColumns.geometry_type_name = 'GEOMETRY';
  geometryColumns.z = 2;
  geometryColumns.m = 0;

  var sourceColumns = source.getColumns();
  var columns = [];

  columns.push(FeatureColumn.createPrimaryKeyColumnWithIndexAndName(0, 'id'));
  columns.push(FeatureColumn.createGeometryColumn(1, 'geometry', 'GEOMETRY', false, null));

  for (var i = 0, n = sourceColumns.length; i < n; i++) {
    var col = sourceColumns[i];

    if (col.field.toLowerCase() === 'id' || col.field.toLowerCase() === 'geometry') {
      continue;
    }

    var type = DataType['GPKG_DT_TEXT'];
    var defaultValue = '';

    var colType = col.type.toLowerCase();

    if (colType === 'decimal') {
      type = DataType['GPKG_DT_REAL'];
      defaultValue = null;
    } else if (colType === 'integer') {
      type = DataType['GPKG_DT_INTEGER'];
      defaultValue = null;
    } else if (colType === 'datetime') {
      type = DataType['GPKG_DT_DATETIME'];
      defaultValue = null;
    }

    if (col.field === os.data.RecordField.TIME) {
      columns.push(FeatureColumn.createColumnWithIndex(columns.length,
          plugin.geopackage.Exporter.RECORD_TIME_START_FIELD, DataType['GPKG_DT_DATETIME'], false, null));
      columns.push(FeatureColumn.createColumnWithIndex(columns.length,
          plugin.geopackage.Exporter.RECORD_TIME_STOP_FIELD, DataType['GPKG_DT_DATETIME'], false, null));
    } else {
      columns.push(FeatureColumn.createColumnWithIndex(columns.length, col.field, type, false, defaultValue));
    }
  }

  geopackage.createFeatureTable(this.gpkg_, tableName, geometryColumns, columns, this.boundTableComplete_);
};


/**
 * @type {string}
 * @const
 */
plugin.geopackage.Exporter.RECORD_TIME_START_FIELD = 'TIME_START';


/**
 * @type {string}
 * @const
 */
plugin.geopackage.Exporter.RECORD_TIME_STOP_FIELD = 'TIME_STOP';


/**
 * @param {*} err
 * @param {Uint8Array} data
 * @private
 */
plugin.geopackage.Exporter.prototype.onExport_ = function(err, data) {
  if (err) {
    this.reportError_(String(err));
    return;
  }

  this.output = data;

  var gpkg = this.gpkg_;
  setTimeout(function() {
    gpkg.close();
  }, 50);

  this.dispatchEvent(os.events.EventType.COMPLETE);
};


/**
 * @param {*} err
 * @param {GeoPackage.FeatureDao} featureDao
 */
plugin.geopackage.Exporter.prototype.onTableComplete_ = function(err, featureDao) {
  if (err) {
    this.reportError_(String(err));
    return;
  }

  this.tables_[featureDao.table_name] = null;
  this.parseNext_(null);
};


/**
 * @param {ol.Feature} feature The feature
 * @return {?os.source.Vector}
 * @private
 */
plugin.geopackage.Exporter.prototype.getSource_ = function(feature) {
  if (feature) {
    var sourceId = feature.get(os.data.RecordField.SOURCE_ID);
    if (goog.isString(sourceId)) {
      return /** @type {os.source.Vector} */ (os.osDataManager.getSource(sourceId));
    }
  }

  return null;
};
