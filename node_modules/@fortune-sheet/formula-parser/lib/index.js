"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "ERROR", {
  enumerable: true,
  get: function get() {
    return _error.ERROR;
  }
});
Object.defineProperty(exports, "ERROR_DIV_ZERO", {
  enumerable: true,
  get: function get() {
    return _error.ERROR_DIV_ZERO;
  }
});
Object.defineProperty(exports, "ERROR_NAME", {
  enumerable: true,
  get: function get() {
    return _error.ERROR_NAME;
  }
});
Object.defineProperty(exports, "ERROR_NOT_AVAILABLE", {
  enumerable: true,
  get: function get() {
    return _error.ERROR_NOT_AVAILABLE;
  }
});
Object.defineProperty(exports, "ERROR_NULL", {
  enumerable: true,
  get: function get() {
    return _error.ERROR_NULL;
  }
});
Object.defineProperty(exports, "ERROR_NUM", {
  enumerable: true,
  get: function get() {
    return _error.ERROR_NUM;
  }
});
Object.defineProperty(exports, "ERROR_REF", {
  enumerable: true,
  get: function get() {
    return _error.ERROR_REF;
  }
});
Object.defineProperty(exports, "ERROR_VALUE", {
  enumerable: true,
  get: function get() {
    return _error.ERROR_VALUE;
  }
});
Object.defineProperty(exports, "Parser", {
  enumerable: true,
  get: function get() {
    return _parser["default"];
  }
});
Object.defineProperty(exports, "SUPPORTED_FORMULAS", {
  enumerable: true,
  get: function get() {
    return _supportedFormulas["default"];
  }
});
Object.defineProperty(exports, "columnIndexToLabel", {
  enumerable: true,
  get: function get() {
    return _cell.columnIndexToLabel;
  }
});
Object.defineProperty(exports, "columnLabelToIndex", {
  enumerable: true,
  get: function get() {
    return _cell.columnLabelToIndex;
  }
});
Object.defineProperty(exports, "error", {
  enumerable: true,
  get: function get() {
    return _error["default"];
  }
});
Object.defineProperty(exports, "extractLabel", {
  enumerable: true,
  get: function get() {
    return _cell.extractLabel;
  }
});
Object.defineProperty(exports, "rowIndexToLabel", {
  enumerable: true,
  get: function get() {
    return _cell.rowIndexToLabel;
  }
});
Object.defineProperty(exports, "rowLabelToIndex", {
  enumerable: true,
  get: function get() {
    return _cell.rowLabelToIndex;
  }
});
Object.defineProperty(exports, "toLabel", {
  enumerable: true,
  get: function get() {
    return _cell.toLabel;
  }
});

var _parser = _interopRequireDefault(require("./parser"));

var _supportedFormulas = _interopRequireDefault(require("./supported-formulas"));

var _error = _interopRequireWildcard(require("./error"));

var _cell = require("./helper/cell");

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }