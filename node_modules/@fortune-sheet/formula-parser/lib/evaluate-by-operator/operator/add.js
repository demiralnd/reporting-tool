"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SYMBOL = void 0;
exports["default"] = func;

var _number = require("./../../helper/number");

var _error = require("./../../error");

var SYMBOL = "+";
exports.SYMBOL = SYMBOL;

function func(first) {
  for (var _len = arguments.length, rest = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    rest[_key - 1] = arguments[_key];
  }

  var result = rest.reduce(function (acc, value) {
    return acc + (0, _number.toNumber)(value || 0);
  }, (0, _number.toNumber)(first || 0));

  if (isNaN(result)) {
    throw Error(_error.ERROR_VALUE);
  }

  return result;
}

func.SYMBOL = SYMBOL;