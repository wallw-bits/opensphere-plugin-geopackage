/**
 * @fileoverview Externs for interacting with src/worker/gpkg.worker.js
 * @externs
 */


/**
 * @typedef {{
 *  id: !string,
 *  type: !string,
 *  data: (ArrayBuffer|Object|undefined),
 *  extent: (ol.Extent|undefined),
 *  projection: (string|undefined),
 *  tileCoord: (Array<number>|undefined),
 *  tableName: (string|undefined),
 *  url: (string|undefined),
 *  height: (number|undefined),
 *  width: (number|undefined),
 *  zoom: (number|undefined),
 *  columns: ({field: string, type: string}|undefined)
 * }}
 */
var GeoPackageWorkerMessage;

/**
 * @typedef {{
 *  message: !GeoPackageWorkerMessage,
 *  type: !string,
 *  data: *,
 *  reason: (string|undefined)
 * }}
 */
var GeoPackageWorkerResponse;
