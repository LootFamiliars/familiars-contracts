"use strict";
/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
exports.__esModule = true;
exports.IExample__factory = void 0;
var ethers_1 = require("ethers");
var IExample__factory = /** @class */ (function () {
    function IExample__factory() {
    }
    IExample__factory.connect = function (address, signerOrProvider) {
        return new ethers_1.Contract(address, _abi, signerOrProvider);
    };
    return IExample__factory;
}());
exports.IExample__factory = IExample__factory;
var _abi = [
    {
        inputs: [
            {
                internalType: "bool",
                name: "isExample",
                type: "bool"
            },
        ],
        name: "isExample",
        outputs: [
            {
                internalType: "bool",
                name: "",
                type: "bool"
            },
        ],
        stateMutability: "view",
        type: "function"
    },
];
