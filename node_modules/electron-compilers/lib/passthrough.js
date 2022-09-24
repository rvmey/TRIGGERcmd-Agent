'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _compilerBase = require('./compiler-base');

var _mimeTypes = require('@paulcbetts/mime-types');

var _mimeTypes2 = _interopRequireDefault(_mimeTypes);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const inputMimeTypes = ['text/plain', 'image/svg+xml'];

/**
 * @access private
 * 
 * This class is used for binary files and other files that should end up in 
 * your cache directory, but aren't actually compiled
 */
class PassthroughCompiler extends _compilerBase.SimpleCompilerBase {
  constructor() {
    super();
  }

  static getInputMimeTypes() {
    return inputMimeTypes;
  }

  compileSync(sourceCode, filePath) {
    return {
      code: sourceCode,
      mimeType: _mimeTypes2.default.lookup(filePath)
    };
  }

  getCompilerVersion() {
    return require(_path2.default.join(__dirname, '..', 'package.json')).version;
  }
}
exports.default = PassthroughCompiler;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9wYXNzdGhyb3VnaC5qcyJdLCJuYW1lcyI6WyJpbnB1dE1pbWVUeXBlcyIsIlBhc3N0aHJvdWdoQ29tcGlsZXIiLCJjb25zdHJ1Y3RvciIsImdldElucHV0TWltZVR5cGVzIiwiY29tcGlsZVN5bmMiLCJzb3VyY2VDb2RlIiwiZmlsZVBhdGgiLCJjb2RlIiwibWltZVR5cGUiLCJsb29rdXAiLCJnZXRDb21waWxlclZlcnNpb24iLCJyZXF1aXJlIiwiam9pbiIsIl9fZGlybmFtZSIsInZlcnNpb24iXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBOzs7O0FBQ0E7O0FBQ0E7Ozs7OztBQUVBLE1BQU1BLGlCQUFpQixDQUFDLFlBQUQsRUFBZSxlQUFmLENBQXZCOztBQUdBOzs7Ozs7QUFNZSxNQUFNQyxtQkFBTiwwQ0FBcUQ7QUFDbEVDLGdCQUFjO0FBQ1o7QUFDRDs7QUFFRCxTQUFPQyxpQkFBUCxHQUEyQjtBQUN6QixXQUFPSCxjQUFQO0FBQ0Q7O0FBRURJLGNBQVlDLFVBQVosRUFBd0JDLFFBQXhCLEVBQWtDO0FBQ2hDLFdBQU87QUFDTEMsWUFBTUYsVUFERDtBQUVMRyxnQkFBVSxvQkFBVUMsTUFBVixDQUFpQkgsUUFBakI7QUFGTCxLQUFQO0FBSUQ7O0FBRURJLHVCQUFxQjtBQUNuQixXQUFPQyxRQUFRLGVBQUtDLElBQUwsQ0FBVUMsU0FBVixFQUFxQixJQUFyQixFQUEyQixjQUEzQixDQUFSLEVBQW9EQyxPQUEzRDtBQUNEO0FBbEJpRTtrQkFBL0NiLG1CIiwiZmlsZSI6InBhc3N0aHJvdWdoLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCB7U2ltcGxlQ29tcGlsZXJCYXNlfSBmcm9tICcuL2NvbXBpbGVyLWJhc2UnO1xyXG5pbXBvcnQgbWltZVR5cGVzIGZyb20gJ0BwYXVsY2JldHRzL21pbWUtdHlwZXMnO1xyXG5cclxuY29uc3QgaW5wdXRNaW1lVHlwZXMgPSBbJ3RleHQvcGxhaW4nLCAnaW1hZ2Uvc3ZnK3htbCddO1xyXG5cclxuXHJcbi8qKlxyXG4gKiBAYWNjZXNzIHByaXZhdGVcclxuICogXHJcbiAqIFRoaXMgY2xhc3MgaXMgdXNlZCBmb3IgYmluYXJ5IGZpbGVzIGFuZCBvdGhlciBmaWxlcyB0aGF0IHNob3VsZCBlbmQgdXAgaW4gXHJcbiAqIHlvdXIgY2FjaGUgZGlyZWN0b3J5LCBidXQgYXJlbid0IGFjdHVhbGx5IGNvbXBpbGVkXHJcbiAqLyBcclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUGFzc3Rocm91Z2hDb21waWxlciBleHRlbmRzIFNpbXBsZUNvbXBpbGVyQmFzZSB7XHJcbiAgY29uc3RydWN0b3IoKSB7XHJcbiAgICBzdXBlcigpO1xyXG4gIH1cclxuXHJcbiAgc3RhdGljIGdldElucHV0TWltZVR5cGVzKCkge1xyXG4gICAgcmV0dXJuIGlucHV0TWltZVR5cGVzO1xyXG4gIH1cclxuXHJcbiAgY29tcGlsZVN5bmMoc291cmNlQ29kZSwgZmlsZVBhdGgpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIGNvZGU6IHNvdXJjZUNvZGUsXHJcbiAgICAgIG1pbWVUeXBlOiBtaW1lVHlwZXMubG9va3VwKGZpbGVQYXRoKVxyXG4gICAgfTtcclxuICB9XHJcbiAgXHJcbiAgZ2V0Q29tcGlsZXJWZXJzaW9uKCkge1xyXG4gICAgcmV0dXJuIHJlcXVpcmUocGF0aC5qb2luKF9fZGlybmFtZSwgJy4uJywgJ3BhY2thZ2UuanNvbicpKS52ZXJzaW9uO1xyXG4gIH1cclxufVxyXG4iXX0=