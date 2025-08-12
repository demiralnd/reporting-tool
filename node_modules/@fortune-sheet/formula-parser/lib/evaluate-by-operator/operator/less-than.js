"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SYMBOL = void 0;
exports["default"] = func;
var SYMBOL = "<";
exports.SYMBOL = SYMBOL;

function func(exp1, exp2) {
  return exp1 < exp2;
}

func.SYMBOL = SYMBOL;