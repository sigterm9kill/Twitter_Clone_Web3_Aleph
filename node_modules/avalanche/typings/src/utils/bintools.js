"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @packageDocumentation
 * @module Utils-BinTools
 */
const bn_js_1 = __importDefault(require("bn.js"));
const buffer_1 = require("buffer/");
const create_hash_1 = __importDefault(require("create-hash"));
const bech32 = __importStar(require("bech32"));
const base58_1 = require("./base58");
/**
 * A class containing tools useful in interacting with binary data cross-platform using
 * nodejs & javascript.
 *
 * This class should never be instantiated directly. Instead,
 * invoke the "BinTools.getInstance()" static * function to grab the singleton
 * instance of the tools.
 *
 * Everything in this library uses
 * the {@link https://github.com/feross/buffer|feross's Buffer class}.
 *
 * ```js
 * const bintools = BinTools.getInstance();
 * let b58str = bintools.bufferToB58(Buffer.from("Wubalubadubdub!"));
 * ```
 */
class BinTools {
    constructor() {
        /**
         * Returns true if meets requirements to parse as an address as Bech32 on X-Chain or P-Chain, otherwise false
         * @param address the string to verify is address
         */
        this.isPrimaryBechAddress = (address) => {
            const parts = address.trim().split('-');
            if (parts.length !== 2) {
                return false;
            }
            try {
                bech32.fromWords(bech32.decode(parts[1]).words);
            }
            catch (err) {
                return false;
            }
            return true;
        };
        /**
           * Produces a string from a {@link https://github.com/feross/buffer|Buffer}
           * representing a string. ONLY USED IN TRANSACTION FORMATTING, ASSUMED LENGTH IS PREPENDED.
           *
           * @param buff The {@link https://github.com/feross/buffer|Buffer} to convert to a string
           */
        this.bufferToString = (buff) => this.copyFrom(buff, 2).toString('utf8');
        /**
           * Produces a {@link https://github.com/feross/buffer|Buffer} from a string. ONLY USED IN TRANSACTION FORMATTING, LENGTH IS PREPENDED.
           *
           * @param str The string to convert to a {@link https://github.com/feross/buffer|Buffer}
           */
        this.stringToBuffer = (str) => {
            const buff = buffer_1.Buffer.alloc(2 + str.length);
            buff.writeUInt16BE(str.length, 0);
            buff.write(str, 2, str.length, 'utf8');
            return buff;
        };
        /**
           * Makes a copy (no reference) of a {@link https://github.com/feross/buffer|Buffer}
           * over provided indecies.
           *
           * @param buff The {@link https://github.com/feross/buffer|Buffer} to copy
           * @param start The index to start the copy
           * @param end The index to end the copy
           */
        this.copyFrom = (buff, start = 0, end = undefined) => {
            if (end === undefined) {
                end = buff.length;
            }
            return buffer_1.Buffer.from(Uint8Array.prototype.slice.call(buff.slice(start, end)));
        };
        /**
           * Takes a {@link https://github.com/feross/buffer|Buffer} and returns a base-58 string of
           * the {@link https://github.com/feross/buffer|Buffer}.
           *
           * @param buff The {@link https://github.com/feross/buffer|Buffer} to convert to base-58
           */
        this.bufferToB58 = (buff) => this.b58.encode(buff);
        /**
           * Takes a base-58 string and returns a {@link https://github.com/feross/buffer|Buffer}.
           *
           * @param b58str The base-58 string to convert
           * to a {@link https://github.com/feross/buffer|Buffer}
           */
        this.b58ToBuffer = (b58str) => this.b58.decode(b58str);
        /**
           * Takes a {@link https://github.com/feross/buffer|Buffer} and returns an ArrayBuffer.
           *
           * @param buff The {@link https://github.com/feross/buffer|Buffer} to
           * convert to an ArrayBuffer
           */
        this.fromBufferToArrayBuffer = (buff) => {
            const ab = new ArrayBuffer(buff.length);
            const view = new Uint8Array(ab);
            for (let i = 0; i < buff.length; ++i) {
                view[i] = buff[i];
            }
            return view;
        };
        /**
           * Takes an ArrayBuffer and converts it to a {@link https://github.com/feross/buffer|Buffer}.
           *
           * @param ab The ArrayBuffer to convert to a {@link https://github.com/feross/buffer|Buffer}
           */
        this.fromArrayBufferToBuffer = (ab) => {
            const buf = buffer_1.Buffer.alloc(ab.byteLength);
            for (let i = 0; i < ab.byteLength; ++i) {
                buf[i] = ab[i];
            }
            return buf;
        };
        /**
           * Takes a {@link https://github.com/feross/buffer|Buffer} and converts it
           * to a {@link https://github.com/indutny/bn.js/|BN}.
           *
           * @param buff The {@link https://github.com/feross/buffer|Buffer} to convert
           * to a {@link https://github.com/indutny/bn.js/|BN}
           */
        this.fromBufferToBN = (buff) => {
            if (typeof buff === "undefined") {
                return undefined;
            }
            return new bn_js_1.default(buff.toString('hex'), 16, 'be');
        };
        /**
         * Takes a {@link https://github.com/indutny/bn.js/|BN} and converts it
         * to a {@link https://github.com/feross/buffer|Buffer}.
         *
         * @param bn The {@link https://github.com/indutny/bn.js/|BN} to convert
         * to a {@link https://github.com/feross/buffer|Buffer}
         * @param length The zero-padded length of the {@link https://github.com/feross/buffer|Buffer}
         */
        this.fromBNToBuffer = (bn, length) => {
            if (typeof bn === "undefined") {
                return undefined;
            }
            const newarr = bn.toArray('be');
            /**
             * CKC: Still unsure why bn.toArray with a "be" and a length do not work right. Bug?
             */
            if (length) { // bn toArray with the length parameter doesn't work correctly, need this.
                const x = length - newarr.length;
                for (let i = 0; i < x; i++) {
                    newarr.unshift(0);
                }
            }
            return buffer_1.Buffer.from(newarr);
        };
        /**
           * Takes a {@link https://github.com/feross/buffer|Buffer} and adds a checksum, returning
           * a {@link https://github.com/feross/buffer|Buffer} with the 4-byte checksum appended.
           *
           * @param buff The {@link https://github.com/feross/buffer|Buffer} to append a checksum
           */
        this.addChecksum = (buff) => {
            const hashslice = buffer_1.Buffer.from(create_hash_1.default('sha256').update(buff).digest().slice(28));
            return buffer_1.Buffer.concat([buff, hashslice]);
        };
        /**
           * Takes a {@link https://github.com/feross/buffer|Buffer} with an appended 4-byte checksum
           * and returns true if the checksum is valid, otherwise false.
           *
           * @param b The {@link https://github.com/feross/buffer|Buffer} to validate the checksum
           */
        this.validateChecksum = (buff) => {
            const checkslice = buff.slice(buff.length - 4);
            const hashslice = buffer_1.Buffer.from(create_hash_1.default('sha256').update(buff.slice(0, buff.length - 4)).digest().slice(28));
            return checkslice.toString('hex') === hashslice.toString('hex');
        };
        /**
           * Takes a {@link https://github.com/feross/buffer|Buffer} and returns a base-58 string with
           * checksum as per the cb58 standard.
           *
           * @param bytes A {@link https://github.com/feross/buffer|Buffer} to serialize
           *
           * @returns A serialized base-58 strig of the Buffer.
           */
        this.cb58Encode = (bytes) => {
            const x = this.addChecksum(bytes);
            return this.bufferToB58(x);
        };
        /**
           * Takes a cb58 serialized {@link https://github.com/feross/buffer|Buffer} or base-58 string
           * and returns a {@link https://github.com/feross/buffer|Buffer} of the original data. Throws on error.
           *
           * @param bytes A cb58 serialized {@link https://github.com/feross/buffer|Buffer} or base-58 string
           */
        this.cb58Decode = (bytes) => {
            if (typeof bytes === 'string') {
                bytes = this.b58ToBuffer(bytes);
            }
            if (this.validateChecksum(bytes)) {
                return this.copyFrom(bytes, 0, bytes.length - 4);
            }
            throw new Error('Error - BinTools.cb58Decode: invalid checksum');
        };
        this.addressToString = (hrp, chainid, bytes) => `${chainid}-${bech32.encode(hrp, bech32.toWords(bytes))}`;
        this.stringToAddress = (address) => {
            const parts = address.trim().split('-');
            if (parts[1].startsWith("0x") || parts[1].match(/^[0-9A-F]+$/i)) {
                return buffer_1.Buffer.from(parts[1].replace("0x", ""), "hex");
            }
            return buffer_1.Buffer.from(bech32.fromWords(bech32.decode(parts[1]).words));
        };
        /**
         * Takes an address and returns its {@link https://github.com/feross/buffer|Buffer}
         * representation if valid. A more strict version of stringToAddress.
         *
         * @param addr A string representation of the address
         * @param blockchainID A cb58 encoded string representation of the blockchainID
         * @param alias A chainID alias, if any, that the address can also parse from.
         * @param addrlen VMs can use any addressing scheme that they like, so this is the appropriate number of address bytes. Default 20.
         *
         * @returns A {@link https://github.com/feross/buffer|Buffer} for the address if valid,
         * undefined if not valid.
         */
        this.parseAddress = (addr, blockchainID, alias = undefined, addrlen = 20) => {
            const abc = addr.split('-');
            if (abc.length === 2 && ((alias && abc[0] === alias) || (blockchainID && abc[0] === blockchainID))) {
                const addrbuff = this.stringToAddress(addr);
                if ((addrlen && addrbuff.length === addrlen) || !(addrlen)) {
                    return addrbuff;
                }
            }
            return undefined;
        };
        this.b58 = base58_1.Base58.getInstance();
    }
    /**
     * Retrieves the BinTools singleton.
     */
    static getInstance() {
        if (!BinTools.instance) {
            BinTools.instance = new BinTools();
        }
        return BinTools.instance;
    }
    /**
     * Returns true if base64, otherwise false
     * @param str the string to verify is Base64
     */
    isBase64(str) {
        if (str === '' || str.trim() === '') {
            return false;
        }
        try {
            let b64 = buffer_1.Buffer.from(str, "base64");
            return b64.toString("base64") === str;
        }
        catch (err) {
            return false;
        }
    }
    /**
     * Returns true if base58, otherwise false
     * @param str the string to verify is base58
     */
    isBase58(str) {
        if (str === '' || str.trim() === '') {
            return false;
        }
        try {
            return this.b58.encode(this.b58.decode(str)) === str;
        }
        catch (err) {
            return false;
        }
    }
    /**
     * Returns true if hexidecimal, otherwise false
     * @param str the string to verify is hexidecimal
     */
    isHex(str) {
        if (str === '' || str.trim() === '') {
            return false;
        }
        return (str.startsWith("0x") && str.slice(2).match(/^[0-9A-Fa-f]/g) || str.match(/^[0-9A-Fa-f]/g));
    }
    /**
     * Returns true if decimal, otherwise false
     * @param str the string to verify is hexidecimal
     */
    isDecimal(str) {
        if (str === '' || str.trim() === '') {
            return false;
        }
        try {
            return new bn_js_1.default(str, 10).toString(10) === str.trim();
        }
        catch (err) {
            return false;
        }
    }
}
exports.default = BinTools;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmludG9vbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvdXRpbHMvYmludG9vbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7OztHQUdHO0FBQ0gsa0RBQXVCO0FBQ3ZCLG9DQUFpQztBQUNqQyw4REFBcUM7QUFDckMsK0NBQWlDO0FBQ2pDLHFDQUFrQztBQUdsQzs7Ozs7Ozs7Ozs7Ozs7O0dBZUc7QUFDSCxNQUFxQixRQUFRO0lBRzNCO1FBaUVBOzs7V0FHRztRQUNILHlCQUFvQixHQUFHLENBQUMsT0FBYyxFQUFVLEVBQUU7WUFDaEQsTUFBTSxLQUFLLEdBQWlCLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDdEQsSUFBRyxLQUFLLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtnQkFDckIsT0FBTyxLQUFLLENBQUM7YUFDZDtZQUNELElBQUk7Z0JBQ0YsTUFBTSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDO2FBQ2pEO1lBQUMsT0FBTSxHQUFHLEVBQUU7Z0JBQ1gsT0FBTyxLQUFLLENBQUE7YUFDYjtZQUNELE9BQU8sSUFBSSxDQUFDO1FBQ2QsQ0FBQyxDQUFDO1FBR0Y7Ozs7O2FBS0s7UUFDTCxtQkFBYyxHQUFHLENBQUMsSUFBVyxFQUFTLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7UUFFakY7Ozs7YUFJSztRQUNMLG1CQUFjLEdBQUcsQ0FBQyxHQUFVLEVBQVMsRUFBRTtZQUNyQyxNQUFNLElBQUksR0FBVSxlQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDakQsSUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2xDLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRSxHQUFHLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQ3ZDLE9BQU8sSUFBSSxDQUFDO1FBQ2QsQ0FBQyxDQUFDO1FBRUY7Ozs7Ozs7YUFPSztRQUNMLGFBQVEsR0FBRyxDQUFDLElBQVcsRUFBRSxRQUFlLENBQUMsRUFBRSxNQUFhLFNBQVMsRUFBUyxFQUFFO1lBQzFFLElBQUksR0FBRyxLQUFLLFNBQVMsRUFBRTtnQkFDckIsR0FBRyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7YUFDbkI7WUFDRCxPQUFPLGVBQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM5RSxDQUFDLENBQUM7UUFFRjs7Ozs7YUFLSztRQUNMLGdCQUFXLEdBQUcsQ0FBQyxJQUFXLEVBQVMsRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRTVEOzs7OzthQUtLO1FBQ0wsZ0JBQVcsR0FBRyxDQUFDLE1BQWEsRUFBUyxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7UUFFaEU7Ozs7O2FBS0s7UUFDTCw0QkFBdUIsR0FBRyxDQUFDLElBQVcsRUFBYyxFQUFFO1lBQ3BELE1BQU0sRUFBRSxHQUFHLElBQUksV0FBVyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN4QyxNQUFNLElBQUksR0FBRyxJQUFJLFVBQVUsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUNoQyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsRUFBRTtnQkFDcEMsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUNuQjtZQUNELE9BQU8sSUFBSSxDQUFDO1FBQ2QsQ0FBQyxDQUFDO1FBRUY7Ozs7YUFJSztRQUNMLDRCQUF1QixHQUFHLENBQUMsRUFBYyxFQUFTLEVBQUU7WUFDbEQsTUFBTSxHQUFHLEdBQUcsZUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDeEMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUFDLEVBQUU7Z0JBQ3RDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7YUFDaEI7WUFDRCxPQUFPLEdBQUcsQ0FBQztRQUNiLENBQUMsQ0FBQztRQUVGOzs7Ozs7YUFNSztRQUNMLG1CQUFjLEdBQUcsQ0FBQyxJQUFXLEVBQUssRUFBRTtZQUNsQyxJQUFHLE9BQU8sSUFBSSxLQUFLLFdBQVcsRUFBRTtnQkFDOUIsT0FBTyxTQUFTLENBQUM7YUFDbEI7WUFDRCxPQUFPLElBQUksZUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEVBQUUsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFBO1FBQy9DLENBQUMsQ0FBQztRQUNBOzs7Ozs7O1dBT0c7UUFDTCxtQkFBYyxHQUFHLENBQUMsRUFBSyxFQUFFLE1BQWMsRUFBUyxFQUFFO1lBQ2hELElBQUcsT0FBTyxFQUFFLEtBQUssV0FBVyxFQUFFO2dCQUM1QixPQUFPLFNBQVMsQ0FBQzthQUNsQjtZQUNELE1BQU0sTUFBTSxHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDaEM7O2VBRUc7WUFDSCxJQUFJLE1BQU0sRUFBRSxFQUFFLDBFQUEwRTtnQkFDdEYsTUFBTSxDQUFDLEdBQUcsTUFBTSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUM7Z0JBQ2pDLEtBQUssSUFBSSxDQUFDLEdBQVUsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7b0JBQ2pDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7aUJBQ25CO2FBQ0Y7WUFDRCxPQUFPLGVBQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDN0IsQ0FBQyxDQUFDO1FBRUY7Ozs7O2FBS0s7UUFDTCxnQkFBVyxHQUFHLENBQUMsSUFBVyxFQUFTLEVBQUU7WUFDbkMsTUFBTSxTQUFTLEdBQVUsZUFBTSxDQUFDLElBQUksQ0FBQyxxQkFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMzRixPQUFPLGVBQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQztRQUMxQyxDQUFDLENBQUM7UUFFRjs7Ozs7YUFLSztRQUNMLHFCQUFnQixHQUFHLENBQUMsSUFBVyxFQUFVLEVBQUU7WUFDekMsTUFBTSxVQUFVLEdBQVUsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ3RELE1BQU0sU0FBUyxHQUFVLGVBQU0sQ0FBQyxJQUFJLENBQUMscUJBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3JILE9BQU8sVUFBVSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsS0FBSyxTQUFTLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2xFLENBQUMsQ0FBQztRQUVGOzs7Ozs7O2FBT0s7UUFDTCxlQUFVLEdBQUcsQ0FBQyxLQUFZLEVBQVMsRUFBRTtZQUNuQyxNQUFNLENBQUMsR0FBVSxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3pDLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM3QixDQUFDLENBQUM7UUFFRjs7Ozs7YUFLSztRQUNMLGVBQVUsR0FBRyxDQUFDLEtBQXFCLEVBQVMsRUFBRTtZQUM1QyxJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsRUFBRTtnQkFDN0IsS0FBSyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7YUFDakM7WUFDRCxJQUFJLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsRUFBRTtnQkFDaEMsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQzthQUNsRDtZQUNELE1BQU0sSUFBSSxLQUFLLENBQUMsK0NBQStDLENBQUMsQ0FBQztRQUNuRSxDQUFDLENBQUM7UUFFRixvQkFBZSxHQUFHLENBQUMsR0FBVSxFQUFFLE9BQWMsRUFBRSxLQUFZLEVBQ25ELEVBQUUsQ0FBQyxHQUFHLE9BQU8sSUFBSSxNQUFNLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQztRQUVyRSxvQkFBZSxHQUFHLENBQUMsT0FBYyxFQUFTLEVBQUU7WUFDMUMsTUFBTSxLQUFLLEdBQWlCLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDdEQsSUFBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLEVBQUM7Z0JBQzdELE9BQU8sZUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQzthQUN2RDtZQUNELE9BQU8sZUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUN0RSxDQUFDLENBQUM7UUFFRjs7Ozs7Ozs7Ozs7V0FXRztRQUNILGlCQUFZLEdBQUcsQ0FBQyxJQUFXLEVBQ3pCLFlBQW1CLEVBQ25CLFFBQWUsU0FBUyxFQUN4QixVQUFpQixFQUFFLEVBQVMsRUFBRTtZQUM5QixNQUFNLEdBQUcsR0FBaUIsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUMxQyxJQUFJLEdBQUcsQ0FBQyxNQUFNLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFLLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLEtBQUssQ0FBQyxJQUFJLENBQUMsWUFBWSxJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxZQUFZLENBQUMsQ0FBQyxFQUFFO2dCQUNoRyxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUM1QyxJQUFJLENBQUMsT0FBTyxJQUFJLFFBQVEsQ0FBQyxNQUFNLEtBQUssT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxFQUFFO29CQUMxRCxPQUFPLFFBQVEsQ0FBQztpQkFDakI7YUFDSjtZQUNELE9BQU8sU0FBUyxDQUFDO1FBQ25CLENBQUMsQ0FBQztRQTlSQSxJQUFJLENBQUMsR0FBRyxHQUFHLGVBQU0sQ0FBQyxXQUFXLEVBQUUsQ0FBQztJQUNsQyxDQUFDO0lBSUQ7O09BRUc7SUFDSCxNQUFNLENBQUMsV0FBVztRQUNoQixJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRTtZQUN0QixRQUFRLENBQUMsUUFBUSxHQUFHLElBQUksUUFBUSxFQUFFLENBQUM7U0FDcEM7UUFDRCxPQUFPLFFBQVEsQ0FBQyxRQUFRLENBQUM7SUFDM0IsQ0FBQztJQUVEOzs7T0FHRztJQUNILFFBQVEsQ0FBQyxHQUFVO1FBQ2pCLElBQUksR0FBRyxLQUFJLEVBQUUsSUFBSSxHQUFHLENBQUMsSUFBSSxFQUFFLEtBQUksRUFBRSxFQUFDO1lBQUUsT0FBTyxLQUFLLENBQUM7U0FBRTtRQUNuRCxJQUFJO1lBQ0EsSUFBSSxHQUFHLEdBQVUsZUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDNUMsT0FBTyxHQUFHLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEdBQUcsQ0FBQztTQUN6QztRQUFDLE9BQU8sR0FBRyxFQUFFO1lBQ1YsT0FBTyxLQUFLLENBQUM7U0FDaEI7SUFDSCxDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsUUFBUSxDQUFDLEdBQVU7UUFDakIsSUFBSSxHQUFHLEtBQUksRUFBRSxJQUFJLEdBQUcsQ0FBQyxJQUFJLEVBQUUsS0FBSSxFQUFFLEVBQUM7WUFBRSxPQUFPLEtBQUssQ0FBQztTQUFFO1FBQ25ELElBQUk7WUFDQSxPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUssR0FBRyxDQUFDO1NBQ3hEO1FBQUMsT0FBTyxHQUFHLEVBQUU7WUFDVixPQUFPLEtBQUssQ0FBQztTQUNoQjtJQUNILENBQUM7SUFFRDs7O09BR0c7SUFDSCxLQUFLLENBQUMsR0FBVTtRQUNkLElBQUksR0FBRyxLQUFJLEVBQUUsSUFBSSxHQUFHLENBQUMsSUFBSSxFQUFFLEtBQUksRUFBRSxFQUFDO1lBQUUsT0FBTyxLQUFLLENBQUM7U0FBRTtRQUNuRCxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxlQUFlLENBQUMsSUFBSSxHQUFHLENBQUMsS0FBSyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUM7SUFDckcsQ0FBQztJQUVEOzs7T0FHRztJQUNILFNBQVMsQ0FBQyxHQUFVO1FBQ2xCLElBQUksR0FBRyxLQUFJLEVBQUUsSUFBSSxHQUFHLENBQUMsSUFBSSxFQUFFLEtBQUksRUFBRSxFQUFDO1lBQUUsT0FBTyxLQUFLLENBQUM7U0FBRTtRQUNuRCxJQUFJO1lBQ0YsT0FBTyxJQUFJLGVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztTQUNwRDtRQUFDLE9BQU8sR0FBRyxFQUFFO1lBQ1YsT0FBTyxLQUFLLENBQUM7U0FDaEI7SUFDSCxDQUFDO0NBaU9GO0FBblNELDJCQW1TQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQHBhY2thZ2VEb2N1bWVudGF0aW9uXG4gKiBAbW9kdWxlIFV0aWxzLUJpblRvb2xzXG4gKi9cbmltcG9ydCBCTiBmcm9tICdibi5qcyc7XG5pbXBvcnQgeyBCdWZmZXIgfSBmcm9tICdidWZmZXIvJztcbmltcG9ydCBjcmVhdGVIYXNoIGZyb20gJ2NyZWF0ZS1oYXNoJztcbmltcG9ydCAqIGFzIGJlY2gzMiBmcm9tICdiZWNoMzInO1xuaW1wb3J0IHsgQmFzZTU4IH0gZnJvbSAnLi9iYXNlNTgnO1xuaW1wb3J0IHsgRGVmYXVsdHMgfSBmcm9tICcuL2NvbnN0YW50cyc7XG5cbi8qKlxuICogQSBjbGFzcyBjb250YWluaW5nIHRvb2xzIHVzZWZ1bCBpbiBpbnRlcmFjdGluZyB3aXRoIGJpbmFyeSBkYXRhIGNyb3NzLXBsYXRmb3JtIHVzaW5nXG4gKiBub2RlanMgJiBqYXZhc2NyaXB0LlxuICpcbiAqIFRoaXMgY2xhc3Mgc2hvdWxkIG5ldmVyIGJlIGluc3RhbnRpYXRlZCBkaXJlY3RseS4gSW5zdGVhZCxcbiAqIGludm9rZSB0aGUgXCJCaW5Ub29scy5nZXRJbnN0YW5jZSgpXCIgc3RhdGljICogZnVuY3Rpb24gdG8gZ3JhYiB0aGUgc2luZ2xldG9uXG4gKiBpbnN0YW5jZSBvZiB0aGUgdG9vbHMuXG4gKlxuICogRXZlcnl0aGluZyBpbiB0aGlzIGxpYnJhcnkgdXNlc1xuICogdGhlIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxmZXJvc3MncyBCdWZmZXIgY2xhc3N9LlxuICpcbiAqIGBgYGpzXG4gKiBjb25zdCBiaW50b29scyA9IEJpblRvb2xzLmdldEluc3RhbmNlKCk7XG4gKiBsZXQgYjU4c3RyID0gYmludG9vbHMuYnVmZmVyVG9CNTgoQnVmZmVyLmZyb20oXCJXdWJhbHViYWR1YmR1YiFcIikpO1xuICogYGBgXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEJpblRvb2xzIHtcbiAgcHJpdmF0ZSBzdGF0aWMgaW5zdGFuY2U6QmluVG9vbHM7XG5cbiAgcHJpdmF0ZSBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLmI1OCA9IEJhc2U1OC5nZXRJbnN0YW5jZSgpO1xuICB9XG5cbiAgcHJpdmF0ZSBiNTg6QmFzZTU4O1xuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZXMgdGhlIEJpblRvb2xzIHNpbmdsZXRvbi5cbiAgICovXG4gIHN0YXRpYyBnZXRJbnN0YW5jZSgpOiBCaW5Ub29scyB7XG4gICAgaWYgKCFCaW5Ub29scy5pbnN0YW5jZSkge1xuICAgICAgQmluVG9vbHMuaW5zdGFuY2UgPSBuZXcgQmluVG9vbHMoKTtcbiAgICB9XG4gICAgcmV0dXJuIEJpblRvb2xzLmluc3RhbmNlO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdHJ1ZSBpZiBiYXNlNjQsIG90aGVyd2lzZSBmYWxzZVxuICAgKiBAcGFyYW0gc3RyIHRoZSBzdHJpbmcgdG8gdmVyaWZ5IGlzIEJhc2U2NFxuICAgKi9cbiAgaXNCYXNlNjQoc3RyOnN0cmluZykge1xuICAgIGlmIChzdHIgPT09JycgfHwgc3RyLnRyaW0oKSA9PT0nJyl7IHJldHVybiBmYWxzZTsgfVxuICAgIHRyeSB7XG4gICAgICAgIGxldCBiNjQ6QnVmZmVyID0gQnVmZmVyLmZyb20oc3RyLCBcImJhc2U2NFwiKTtcbiAgICAgICAgcmV0dXJuIGI2NC50b1N0cmluZyhcImJhc2U2NFwiKSA9PT0gc3RyO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdHJ1ZSBpZiBiYXNlNTgsIG90aGVyd2lzZSBmYWxzZVxuICAgKiBAcGFyYW0gc3RyIHRoZSBzdHJpbmcgdG8gdmVyaWZ5IGlzIGJhc2U1OFxuICAgKi9cbiAgaXNCYXNlNTgoc3RyOnN0cmluZykge1xuICAgIGlmIChzdHIgPT09JycgfHwgc3RyLnRyaW0oKSA9PT0nJyl7IHJldHVybiBmYWxzZTsgfVxuICAgIHRyeSB7XG4gICAgICAgIHJldHVybiB0aGlzLmI1OC5lbmNvZGUodGhpcy5iNTguZGVjb2RlKHN0cikpID09PSBzdHI7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0cnVlIGlmIGhleGlkZWNpbWFsLCBvdGhlcndpc2UgZmFsc2VcbiAgICogQHBhcmFtIHN0ciB0aGUgc3RyaW5nIHRvIHZlcmlmeSBpcyBoZXhpZGVjaW1hbFxuICAgKi9cbiAgaXNIZXgoc3RyOnN0cmluZykge1xuICAgIGlmIChzdHIgPT09JycgfHwgc3RyLnRyaW0oKSA9PT0nJyl7IHJldHVybiBmYWxzZTsgfVxuICAgIHJldHVybiAoc3RyLnN0YXJ0c1dpdGgoXCIweFwiKSAmJiBzdHIuc2xpY2UoMikubWF0Y2goL15bMC05QS1GYS1mXS9nKSB8fCBzdHIubWF0Y2goL15bMC05QS1GYS1mXS9nKSk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0cnVlIGlmIGRlY2ltYWwsIG90aGVyd2lzZSBmYWxzZVxuICAgKiBAcGFyYW0gc3RyIHRoZSBzdHJpbmcgdG8gdmVyaWZ5IGlzIGhleGlkZWNpbWFsXG4gICAqL1xuICBpc0RlY2ltYWwoc3RyOnN0cmluZykge1xuICAgIGlmIChzdHIgPT09JycgfHwgc3RyLnRyaW0oKSA9PT0nJyl7IHJldHVybiBmYWxzZTsgfVxuICAgIHRyeSB7XG4gICAgICByZXR1cm4gbmV3IEJOKHN0ciwgMTApLnRvU3RyaW5nKDEwKSA9PT0gc3RyLnRyaW0oKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRydWUgaWYgbWVldHMgcmVxdWlyZW1lbnRzIHRvIHBhcnNlIGFzIGFuIGFkZHJlc3MgYXMgQmVjaDMyIG9uIFgtQ2hhaW4gb3IgUC1DaGFpbiwgb3RoZXJ3aXNlIGZhbHNlXG4gICAqIEBwYXJhbSBhZGRyZXNzIHRoZSBzdHJpbmcgdG8gdmVyaWZ5IGlzIGFkZHJlc3NcbiAgICovXG4gIGlzUHJpbWFyeUJlY2hBZGRyZXNzID0gKGFkZHJlc3M6c3RyaW5nKTpib29sZWFuID0+IHtcbiAgICBjb25zdCBwYXJ0czpBcnJheTxzdHJpbmc+ID0gYWRkcmVzcy50cmltKCkuc3BsaXQoJy0nKTtcbiAgICBpZihwYXJ0cy5sZW5ndGggIT09IDIpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgIGJlY2gzMi5mcm9tV29yZHMoYmVjaDMyLmRlY29kZShwYXJ0c1sxXSkud29yZHMpO1xuICAgIH0gY2F0Y2goZXJyKSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH07XG5cblxuICAvKipcbiAgICAgKiBQcm9kdWNlcyBhIHN0cmluZyBmcm9tIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn1cbiAgICAgKiByZXByZXNlbnRpbmcgYSBzdHJpbmcuIE9OTFkgVVNFRCBJTiBUUkFOU0FDVElPTiBGT1JNQVRUSU5HLCBBU1NVTUVEIExFTkdUSCBJUyBQUkVQRU5ERUQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gYnVmZiBUaGUge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gdG8gY29udmVydCB0byBhIHN0cmluZ1xuICAgICAqL1xuICBidWZmZXJUb1N0cmluZyA9IChidWZmOkJ1ZmZlcik6c3RyaW5nID0+IHRoaXMuY29weUZyb20oYnVmZiwgMikudG9TdHJpbmcoJ3V0ZjgnKTtcblxuICAvKipcbiAgICAgKiBQcm9kdWNlcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGZyb20gYSBzdHJpbmcuIE9OTFkgVVNFRCBJTiBUUkFOU0FDVElPTiBGT1JNQVRUSU5HLCBMRU5HVEggSVMgUFJFUEVOREVELlxuICAgICAqXG4gICAgICogQHBhcmFtIHN0ciBUaGUgc3RyaW5nIHRvIGNvbnZlcnQgdG8gYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfVxuICAgICAqL1xuICBzdHJpbmdUb0J1ZmZlciA9IChzdHI6c3RyaW5nKTpCdWZmZXIgPT4ge1xuICAgIGNvbnN0IGJ1ZmY6QnVmZmVyID0gQnVmZmVyLmFsbG9jKDIgKyBzdHIubGVuZ3RoKTtcbiAgICBidWZmLndyaXRlVUludDE2QkUoc3RyLmxlbmd0aCwgMCk7XG4gICAgYnVmZi53cml0ZShzdHIsIDIsIHN0ci5sZW5ndGgsICd1dGY4Jyk7XG4gICAgcmV0dXJuIGJ1ZmY7XG4gIH07XG5cbiAgLyoqXG4gICAgICogTWFrZXMgYSBjb3B5IChubyByZWZlcmVuY2UpIG9mIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn1cbiAgICAgKiBvdmVyIHByb3ZpZGVkIGluZGVjaWVzLlxuICAgICAqXG4gICAgICogQHBhcmFtIGJ1ZmYgVGhlIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHRvIGNvcHlcbiAgICAgKiBAcGFyYW0gc3RhcnQgVGhlIGluZGV4IHRvIHN0YXJ0IHRoZSBjb3B5XG4gICAgICogQHBhcmFtIGVuZCBUaGUgaW5kZXggdG8gZW5kIHRoZSBjb3B5XG4gICAgICovXG4gIGNvcHlGcm9tID0gKGJ1ZmY6QnVmZmVyLCBzdGFydDpudW1iZXIgPSAwLCBlbmQ6bnVtYmVyID0gdW5kZWZpbmVkKTpCdWZmZXIgPT4ge1xuICAgIGlmIChlbmQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgZW5kID0gYnVmZi5sZW5ndGg7XG4gICAgfVxuICAgIHJldHVybiBCdWZmZXIuZnJvbShVaW50OEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGJ1ZmYuc2xpY2Uoc3RhcnQsIGVuZCkpKTtcbiAgfTtcblxuICAvKipcbiAgICAgKiBUYWtlcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGFuZCByZXR1cm5zIGEgYmFzZS01OCBzdHJpbmcgb2ZcbiAgICAgKiB0aGUge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0uXG4gICAgICpcbiAgICAgKiBAcGFyYW0gYnVmZiBUaGUge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gdG8gY29udmVydCB0byBiYXNlLTU4XG4gICAgICovXG4gIGJ1ZmZlclRvQjU4ID0gKGJ1ZmY6QnVmZmVyKTpzdHJpbmcgPT4gdGhpcy5iNTguZW5jb2RlKGJ1ZmYpO1xuXG4gIC8qKlxuICAgICAqIFRha2VzIGEgYmFzZS01OCBzdHJpbmcgYW5kIHJldHVybnMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBiNThzdHIgVGhlIGJhc2UtNTggc3RyaW5nIHRvIGNvbnZlcnRcbiAgICAgKiB0byBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9XG4gICAgICovXG4gIGI1OFRvQnVmZmVyID0gKGI1OHN0cjpzdHJpbmcpOkJ1ZmZlciA9PiB0aGlzLmI1OC5kZWNvZGUoYjU4c3RyKTtcblxuICAvKipcbiAgICAgKiBUYWtlcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGFuZCByZXR1cm5zIGFuIEFycmF5QnVmZmVyLlxuICAgICAqXG4gICAgICogQHBhcmFtIGJ1ZmYgVGhlIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHRvXG4gICAgICogY29udmVydCB0byBhbiBBcnJheUJ1ZmZlclxuICAgICAqL1xuICBmcm9tQnVmZmVyVG9BcnJheUJ1ZmZlciA9IChidWZmOkJ1ZmZlcik6QXJyYXlCdWZmZXIgPT4ge1xuICAgIGNvbnN0IGFiID0gbmV3IEFycmF5QnVmZmVyKGJ1ZmYubGVuZ3RoKTtcbiAgICBjb25zdCB2aWV3ID0gbmV3IFVpbnQ4QXJyYXkoYWIpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYnVmZi5sZW5ndGg7ICsraSkge1xuICAgICAgdmlld1tpXSA9IGJ1ZmZbaV07XG4gICAgfVxuICAgIHJldHVybiB2aWV3O1xuICB9O1xuXG4gIC8qKlxuICAgICAqIFRha2VzIGFuIEFycmF5QnVmZmVyIGFuZCBjb252ZXJ0cyBpdCB0byBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9LlxuICAgICAqXG4gICAgICogQHBhcmFtIGFiIFRoZSBBcnJheUJ1ZmZlciB0byBjb252ZXJ0IHRvIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn1cbiAgICAgKi9cbiAgZnJvbUFycmF5QnVmZmVyVG9CdWZmZXIgPSAoYWI6QXJyYXlCdWZmZXIpOkJ1ZmZlciA9PiB7XG4gICAgY29uc3QgYnVmID0gQnVmZmVyLmFsbG9jKGFiLmJ5dGVMZW5ndGgpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYWIuYnl0ZUxlbmd0aDsgKytpKSB7XG4gICAgICBidWZbaV0gPSBhYltpXTtcbiAgICB9XG4gICAgcmV0dXJuIGJ1ZjtcbiAgfTtcblxuICAvKipcbiAgICAgKiBUYWtlcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGFuZCBjb252ZXJ0cyBpdFxuICAgICAqIHRvIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn0uXG4gICAgICpcbiAgICAgKiBAcGFyYW0gYnVmZiBUaGUge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gdG8gY29udmVydFxuICAgICAqIHRvIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICAgKi9cbiAgZnJvbUJ1ZmZlclRvQk4gPSAoYnVmZjpCdWZmZXIpOkJOID0+IHtcbiAgICBpZih0eXBlb2YgYnVmZiA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBCTihidWZmLnRvU3RyaW5nKCdoZXgnKSwgMTYsICdiZScpXG4gIH07XG4gICAgLyoqXG4gICAgICogVGFrZXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfSBhbmQgY29udmVydHMgaXRcbiAgICAgKiB0byBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9LlxuICAgICAqXG4gICAgICogQHBhcmFtIGJuIFRoZSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfSB0byBjb252ZXJ0XG4gICAgICogdG8gYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfVxuICAgICAqIEBwYXJhbSBsZW5ndGggVGhlIHplcm8tcGFkZGVkIGxlbmd0aCBvZiB0aGUge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn1cbiAgICAgKi9cbiAgZnJvbUJOVG9CdWZmZXIgPSAoYm46Qk4sIGxlbmd0aD86bnVtYmVyKTpCdWZmZXIgPT4ge1xuICAgIGlmKHR5cGVvZiBibiA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gICAgY29uc3QgbmV3YXJyID0gYm4udG9BcnJheSgnYmUnKTtcbiAgICAvKipcbiAgICAgKiBDS0M6IFN0aWxsIHVuc3VyZSB3aHkgYm4udG9BcnJheSB3aXRoIGEgXCJiZVwiIGFuZCBhIGxlbmd0aCBkbyBub3Qgd29yayByaWdodC4gQnVnP1xuICAgICAqL1xuICAgIGlmIChsZW5ndGgpIHsgLy8gYm4gdG9BcnJheSB3aXRoIHRoZSBsZW5ndGggcGFyYW1ldGVyIGRvZXNuJ3Qgd29yayBjb3JyZWN0bHksIG5lZWQgdGhpcy5cbiAgICAgIGNvbnN0IHggPSBsZW5ndGggLSBuZXdhcnIubGVuZ3RoO1xuICAgICAgZm9yIChsZXQgaTpudW1iZXIgPSAwOyBpIDwgeDsgaSsrKSB7XG4gICAgICAgIG5ld2Fyci51bnNoaWZ0KDApO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gQnVmZmVyLmZyb20obmV3YXJyKTtcbiAgfTtcblxuICAvKipcbiAgICAgKiBUYWtlcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGFuZCBhZGRzIGEgY2hlY2tzdW0sIHJldHVybmluZ1xuICAgICAqIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gd2l0aCB0aGUgNC1ieXRlIGNoZWNrc3VtIGFwcGVuZGVkLlxuICAgICAqXG4gICAgICogQHBhcmFtIGJ1ZmYgVGhlIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHRvIGFwcGVuZCBhIGNoZWNrc3VtXG4gICAgICovXG4gIGFkZENoZWNrc3VtID0gKGJ1ZmY6QnVmZmVyKTpCdWZmZXIgPT4ge1xuICAgIGNvbnN0IGhhc2hzbGljZTpCdWZmZXIgPSBCdWZmZXIuZnJvbShjcmVhdGVIYXNoKCdzaGEyNTYnKS51cGRhdGUoYnVmZikuZGlnZXN0KCkuc2xpY2UoMjgpKTtcbiAgICByZXR1cm4gQnVmZmVyLmNvbmNhdChbYnVmZiwgaGFzaHNsaWNlXSk7XG4gIH07XG5cbiAgLyoqXG4gICAgICogVGFrZXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSB3aXRoIGFuIGFwcGVuZGVkIDQtYnl0ZSBjaGVja3N1bVxuICAgICAqIGFuZCByZXR1cm5zIHRydWUgaWYgdGhlIGNoZWNrc3VtIGlzIHZhbGlkLCBvdGhlcndpc2UgZmFsc2UuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gYiBUaGUge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gdG8gdmFsaWRhdGUgdGhlIGNoZWNrc3VtXG4gICAgICovXG4gIHZhbGlkYXRlQ2hlY2tzdW0gPSAoYnVmZjpCdWZmZXIpOmJvb2xlYW4gPT4ge1xuICAgIGNvbnN0IGNoZWNrc2xpY2U6QnVmZmVyID0gYnVmZi5zbGljZShidWZmLmxlbmd0aCAtIDQpO1xuICAgIGNvbnN0IGhhc2hzbGljZTpCdWZmZXIgPSBCdWZmZXIuZnJvbShjcmVhdGVIYXNoKCdzaGEyNTYnKS51cGRhdGUoYnVmZi5zbGljZSgwLCBidWZmLmxlbmd0aCAtIDQpKS5kaWdlc3QoKS5zbGljZSgyOCkpO1xuICAgIHJldHVybiBjaGVja3NsaWNlLnRvU3RyaW5nKCdoZXgnKSA9PT0gaGFzaHNsaWNlLnRvU3RyaW5nKCdoZXgnKTtcbiAgfTtcblxuICAvKipcbiAgICAgKiBUYWtlcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGFuZCByZXR1cm5zIGEgYmFzZS01OCBzdHJpbmcgd2l0aFxuICAgICAqIGNoZWNrc3VtIGFzIHBlciB0aGUgY2I1OCBzdGFuZGFyZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBieXRlcyBBIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHRvIHNlcmlhbGl6ZVxuICAgICAqXG4gICAgICogQHJldHVybnMgQSBzZXJpYWxpemVkIGJhc2UtNTggc3RyaWcgb2YgdGhlIEJ1ZmZlci5cbiAgICAgKi9cbiAgY2I1OEVuY29kZSA9IChieXRlczpCdWZmZXIpOnN0cmluZyA9PiB7XG4gICAgY29uc3QgeDpCdWZmZXIgPSB0aGlzLmFkZENoZWNrc3VtKGJ5dGVzKTtcbiAgICByZXR1cm4gdGhpcy5idWZmZXJUb0I1OCh4KTtcbiAgfTtcblxuICAvKipcbiAgICAgKiBUYWtlcyBhIGNiNTggc2VyaWFsaXplZCB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBvciBiYXNlLTU4IHN0cmluZ1xuICAgICAqIGFuZCByZXR1cm5zIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gb2YgdGhlIG9yaWdpbmFsIGRhdGEuIFRocm93cyBvbiBlcnJvci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBieXRlcyBBIGNiNTggc2VyaWFsaXplZCB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBvciBiYXNlLTU4IHN0cmluZ1xuICAgICAqL1xuICBjYjU4RGVjb2RlID0gKGJ5dGVzOkJ1ZmZlciB8IHN0cmluZyk6QnVmZmVyID0+IHtcbiAgICBpZiAodHlwZW9mIGJ5dGVzID09PSAnc3RyaW5nJykge1xuICAgICAgYnl0ZXMgPSB0aGlzLmI1OFRvQnVmZmVyKGJ5dGVzKTtcbiAgICB9XG4gICAgaWYgKHRoaXMudmFsaWRhdGVDaGVja3N1bShieXRlcykpIHtcbiAgICAgIHJldHVybiB0aGlzLmNvcHlGcm9tKGJ5dGVzLCAwLCBieXRlcy5sZW5ndGggLSA0KTtcbiAgICB9XG4gICAgdGhyb3cgbmV3IEVycm9yKCdFcnJvciAtIEJpblRvb2xzLmNiNThEZWNvZGU6IGludmFsaWQgY2hlY2tzdW0nKTtcbiAgfTtcblxuICBhZGRyZXNzVG9TdHJpbmcgPSAoaHJwOnN0cmluZywgY2hhaW5pZDpzdHJpbmcsIGJ5dGVzOkJ1ZmZlcilcbiAgOnN0cmluZyA9PiBgJHtjaGFpbmlkfS0ke2JlY2gzMi5lbmNvZGUoaHJwLCBiZWNoMzIudG9Xb3JkcyhieXRlcykpfWA7XG5cbiAgc3RyaW5nVG9BZGRyZXNzID0gKGFkZHJlc3M6c3RyaW5nKTpCdWZmZXIgPT4ge1xuICAgIGNvbnN0IHBhcnRzOkFycmF5PHN0cmluZz4gPSBhZGRyZXNzLnRyaW0oKS5zcGxpdCgnLScpO1xuICAgIGlmKHBhcnRzWzFdLnN0YXJ0c1dpdGgoXCIweFwiKSB8fCBwYXJ0c1sxXS5tYXRjaCgvXlswLTlBLUZdKyQvaSkpe1xuICAgICAgcmV0dXJuIEJ1ZmZlci5mcm9tKHBhcnRzWzFdLnJlcGxhY2UoXCIweFwiLCBcIlwiKSwgXCJoZXhcIik7XG4gICAgfVxuICAgIHJldHVybiBCdWZmZXIuZnJvbShiZWNoMzIuZnJvbVdvcmRzKGJlY2gzMi5kZWNvZGUocGFydHNbMV0pLndvcmRzKSk7XG4gIH07XG5cbiAgLyoqXG4gICAqIFRha2VzIGFuIGFkZHJlc3MgYW5kIHJldHVybnMgaXRzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9XG4gICAqIHJlcHJlc2VudGF0aW9uIGlmIHZhbGlkLiBBIG1vcmUgc3RyaWN0IHZlcnNpb24gb2Ygc3RyaW5nVG9BZGRyZXNzLlxuICAgKlxuICAgKiBAcGFyYW0gYWRkciBBIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgYWRkcmVzc1xuICAgKiBAcGFyYW0gYmxvY2tjaGFpbklEIEEgY2I1OCBlbmNvZGVkIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgYmxvY2tjaGFpbklEXG4gICAqIEBwYXJhbSBhbGlhcyBBIGNoYWluSUQgYWxpYXMsIGlmIGFueSwgdGhhdCB0aGUgYWRkcmVzcyBjYW4gYWxzbyBwYXJzZSBmcm9tLlxuICAgKiBAcGFyYW0gYWRkcmxlbiBWTXMgY2FuIHVzZSBhbnkgYWRkcmVzc2luZyBzY2hlbWUgdGhhdCB0aGV5IGxpa2UsIHNvIHRoaXMgaXMgdGhlIGFwcHJvcHJpYXRlIG51bWJlciBvZiBhZGRyZXNzIGJ5dGVzLiBEZWZhdWx0IDIwLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGZvciB0aGUgYWRkcmVzcyBpZiB2YWxpZCxcbiAgICogdW5kZWZpbmVkIGlmIG5vdCB2YWxpZC5cbiAgICovXG4gIHBhcnNlQWRkcmVzcyA9IChhZGRyOnN0cmluZyxcbiAgICBibG9ja2NoYWluSUQ6c3RyaW5nLFxuICAgIGFsaWFzOnN0cmluZyA9IHVuZGVmaW5lZCxcbiAgICBhZGRybGVuOm51bWJlciA9IDIwKTpCdWZmZXIgPT4ge1xuICAgIGNvbnN0IGFiYzpBcnJheTxzdHJpbmc+ID0gYWRkci5zcGxpdCgnLScpO1xuICAgIGlmIChhYmMubGVuZ3RoID09PSAyICYmICgoYWxpYXMgJiYgYWJjWzBdID09PSBhbGlhcykgfHwgKGJsb2NrY2hhaW5JRCAmJiBhYmNbMF0gPT09IGJsb2NrY2hhaW5JRCkpKSB7XG4gICAgICAgIGNvbnN0IGFkZHJidWZmID0gdGhpcy5zdHJpbmdUb0FkZHJlc3MoYWRkcik7XG4gICAgICAgIGlmICgoYWRkcmxlbiAmJiBhZGRyYnVmZi5sZW5ndGggPT09IGFkZHJsZW4pIHx8ICEoYWRkcmxlbikpIHtcbiAgICAgICAgICByZXR1cm4gYWRkcmJ1ZmY7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfTtcbn1cbiJdfQ==