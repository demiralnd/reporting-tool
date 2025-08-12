"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SYMBOL = void 0;
exports["default"] = func;
var SYMBOL = "&";
exports.SYMBOL = SYMBOL;

function func() {
  for (var _len = arguments.length, params = new Array(_len), _key = 0; _key < _len; _key++) {
    params[_key] = arguments[_key];
  }

  return params.reduce(function (acc, value) {
    return acc + value.toString();
  }, "");
}

func.SYMBOL = SYMBOL;