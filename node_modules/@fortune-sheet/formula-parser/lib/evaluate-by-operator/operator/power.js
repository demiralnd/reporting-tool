"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SYMBOL = void 0;
exports["default"] = func;

var _number = require("./../../helper/number");

var _error = require("./../../error");

var SYMBOL = "^";
exports.SYMBOL = SYMBOL;

function func(exp1, exp2) {
  var result = Math.pow((0, _number.toNumber)(exp1), (0, _number.toNumber)(exp2));

  if (isNaN(result)) {
    throw Error(_error.ERROR_VALUE);
  }

  return result;
}

func.SYMBOL = SYMBOL;