"use strict";
/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
exports.__esModule = true;
exports.ERC721Interface__factory = void 0;
var ethers_1 = require("ethers");
var ERC721Interface__factory = /** @class */ (function () {
    function ERC721Interface__factory() {
    }
    ERC721Interface__factory.connect = function (address, signerOrProvider) {
        return new ethers_1.Contract(address, _abi, signerOrProvider);
    };
    return ERC721Interface__factory;
}());
exports.ERC721Interface__factory = ERC721Interface__factory;
var _abi = [
    {
        inputs: [
            {
                internalType: "address",
                name: "owner",
                type: "address"
            },
        ],
        name: "balanceOf",
        outputs: [
            {
                internalType: "uint256",
                name: "balance",
                type: "uint256"
            },
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "tokenId",
                type: "uint256"
            },
        ],
        name: "ownerOf",
        outputs: [
            {
                internalType: "address",
                name: "owner",
                type: "address"
            },
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "owner",
                type: "address"
            },
            {
                internalType: "uint256",
                name: "index",
                type: "uint256"
            },
        ],
        name: "tokenOfOwnerByIndex",
        outputs: [
            {
                internalType: "uint256",
                name: "tokenId",
                type: "uint256"
            },
        ],
        stateMutability: "view",
        type: "function"
    },
];
