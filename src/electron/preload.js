/* eslint-disable */

const child_process = require('child_process');
const fs = require('fs');
const path = require('path');

const {contextBridge} = require('electron')

/**
 * Fork a child process.
 * @param {string} modulePath The module to run in the child.
 * @param {Array|undefined} args List of string arguments.
 * @param {Object|undefined} options The process options.
 * @return {!Worker} The wrapped process, emulating a web worker.
 */
const forkProcess = (modulePath, args, options) => {
  const child = child_process.fork(modulePath, args, options);

  //
  // Electron's contextIsolation limits what can be passed back to the main process, as all return values are proxied
  // through Electron. Objects will only include their direct keys, not keys inherited by the prototype. This means
  // classes like the child process will not have keys from their parent, the event emitter. To expose the necessary
  // functions, we'll provide a wrapper object.
  //
  // https://www.electronjs.org/docs/all#contextbridge
  //
  return /** @type {!Worker} */ ({
    addEventListener: (type, callback) => {
      child.addListener(type, callback)
    },
    removeEventListener: (type, callback) => {
      child.removeListener(type, callback)
    },
    postMessage: (msg) => {
      child.send(msg);
    }
  });
};

/**
 * Get Electron environment options for use in child processes.
 * @return {!Object}
 */
const getElectronEnvOptions = () => {
  const options = {
    env: {
      ELECTRON_EXTRA_PATH: process.env.ELECTRON_EXTRA_PATH
    }
  };

  if ('electron' in process.versions) {
    options.env.ELECTRON_VERSION = process.versions.electron;
  }

  return options;
};

/**
 * Resolve a path relative to the OpenSphere base path.
 * @param {string} base The base path.
 * @return {string} The resolved path.
 */
const resolveOpenspherePath = (base) => {
  return path.join(process.env.OPENSPHERE_PATH, base);
};

/**
 * Asynchronously remove a file or symbolic link.
 * @param {string} file The file.
 * @param {Function} callback Function to call when the unlink completes.
 */
const unlinkFile = (file, callback) => {
  fs.unlink(file, callback);
};

//
// Expose a minimal interface to the Node environment for use in OpenSphere.
//
// For more information, see:
//
// https://www.electronjs.org/docs/all#contextbridge
// https://www.electronjs.org/docs/tutorial/security#2-do-not-enable-nodejs-integration-for-remote-content
// https://www.electronjs.org/docs/tutorial/security#3-enable-context-isolation-for-remote-content
//
contextBridge.exposeInMainWorld('ElectronGpkg', {
  getElectronEnvOptions,
  forkProcess,
  resolveOpenspherePath,
  unlinkFile
});
