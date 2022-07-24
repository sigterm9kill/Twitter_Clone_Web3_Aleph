"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateAssetTx = void 0;
/**
 * @packageDocumentation
 * @module API-AVM-CreateAssetTx
 */
const buffer_1 = require("buffer/");
const bintools_1 = __importDefault(require("../../utils/bintools"));
const constants_1 = require("./constants");
const initialstates_1 = require("./initialstates");
const basetx_1 = require("./basetx");
const constants_2 = require("../../utils/constants");
const serialization_1 = require("../../utils/serialization");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
const serializer = serialization_1.Serialization.getInstance();
class CreateAssetTx extends basetx_1.BaseTx {
    /**
     * Class representing an unsigned Create Asset transaction.
     *
     * @param networkid Optional networkid, [[DefaultNetworkID]]
     * @param blockchainid Optional blockchainid, default Buffer.alloc(32, 16)
     * @param outs Optional array of the [[TransferableOutput]]s
     * @param ins Optional array of the [[TransferableInput]]s
     * @param memo Optional {@link https://github.com/feross/buffer|Buffer} for the memo field
     * @param name String for the descriptive name of the asset
     * @param symbol String for the ticker symbol of the asset
     * @param denomination Optional number for the denomination which is 10^D. D must be >= 0 and <= 32. Ex: $1 AVAX = 10^9 $nAVAX
     * @param initialstate Optional [[InitialStates]] that represent the intial state of a created asset
     */
    constructor(networkid = constants_2.DefaultNetworkID, blockchainid = buffer_1.Buffer.alloc(32, 16), outs = undefined, ins = undefined, memo = undefined, name = undefined, symbol = undefined, denomination = undefined, initialstate = undefined) {
        super(networkid, blockchainid, outs, ins, memo);
        this._typeName = "CreateAssetTx";
        this._typeID = constants_1.AVMConstants.CREATEASSETTX;
        this.name = '';
        this.symbol = '';
        this.denomination = buffer_1.Buffer.alloc(1);
        this.initialstate = new initialstates_1.InitialStates();
        /**
         * Returns the id of the [[CreateAssetTx]]
         */
        this.getTxType = () => {
            return this._typeID;
        };
        /**
         * Returns the array of array of [[Output]]s for the initial state
         */
        this.getInitialStates = () => this.initialstate;
        /**
         * Returns the string representation of the name
         */
        this.getName = () => this.name;
        /**
         * Returns the string representation of the symbol
         */
        this.getSymbol = () => this.symbol;
        /**
         * Returns the numeric representation of the denomination
         */
        this.getDenomination = () => this.denomination.readUInt8(0);
        /**
         * Returns the {@link https://github.com/feross/buffer|Buffer} representation of the denomination
         */
        this.getDenominationBuffer = () => {
            return this.denomination;
        };
        if (typeof name === 'string' && typeof symbol === 'string' && typeof denomination === 'number'
            && denomination >= 0 && denomination <= 32 && typeof initialstate !== 'undefined') {
            this.initialstate = initialstate;
            this.name = name;
            this.symbol = symbol;
            this.denomination.writeUInt8(denomination, 0);
        }
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { "name": serializer.encoder(this.name, encoding, "utf8", "utf8"), "symbol": serializer.encoder(this.symbol, encoding, "utf8", "utf8"), "denomination": serializer.encoder(this.denomination, encoding, "Buffer", "decimalString", 1), "initialstate": this.initialstate.serialize(encoding) });
    }
    ;
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.name = serializer.decoder(fields["name"], encoding, "utf8", "utf8");
        this.symbol = serializer.decoder(fields["symbol"], encoding, "utf8", "utf8");
        this.denomination = serializer.decoder(fields["denomination"], encoding, "decimalString", "Buffer", 1);
        this.initialstate = new initialstates_1.InitialStates();
        this.initialstate.deserialize(fields["initialstate"], encoding);
    }
    /**
     * Takes a {@link https://github.com/feross/buffer|Buffer} containing an [[CreateAssetTx]], parses it, populates the class, and returns the length of the [[CreateAssetTx]] in bytes.
     *
     * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[CreateAssetTx]]
     *
     * @returns The length of the raw [[CreateAssetTx]]
     *
     * @remarks assume not-checksummed
     */
    fromBuffer(bytes, offset = 0) {
        offset = super.fromBuffer(bytes, offset);
        const namesize = bintools.copyFrom(bytes, offset, offset + 2).readUInt16BE(0);
        offset += 2;
        this.name = bintools.copyFrom(bytes, offset, offset + namesize).toString('utf8');
        offset += namesize;
        const symsize = bintools.copyFrom(bytes, offset, offset + 2).readUInt16BE(0);
        offset += 2;
        this.symbol = bintools.copyFrom(bytes, offset, offset + symsize).toString('utf8');
        offset += symsize;
        this.denomination = bintools.copyFrom(bytes, offset, offset + 1);
        offset += 1;
        const inits = new initialstates_1.InitialStates();
        offset = inits.fromBuffer(bytes, offset);
        this.initialstate = inits;
        return offset;
    }
    /**
       * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[CreateAssetTx]].
       */
    toBuffer() {
        const superbuff = super.toBuffer();
        const initstatebuff = this.initialstate.toBuffer();
        const namebuff = buffer_1.Buffer.alloc(this.name.length);
        namebuff.write(this.name, 0, this.name.length, 'utf8');
        const namesize = buffer_1.Buffer.alloc(2);
        namesize.writeUInt16BE(this.name.length, 0);
        const symbuff = buffer_1.Buffer.alloc(this.symbol.length);
        symbuff.write(this.symbol, 0, this.symbol.length, 'utf8');
        const symsize = buffer_1.Buffer.alloc(2);
        symsize.writeUInt16BE(this.symbol.length, 0);
        const bsize = superbuff.length + namesize.length + namebuff.length + symsize.length + symbuff.length + this.denomination.length + initstatebuff.length;
        const barr = [superbuff, namesize, namebuff, symsize, symbuff, this.denomination, initstatebuff];
        return buffer_1.Buffer.concat(barr, bsize);
    }
    clone() {
        let newbase = new CreateAssetTx();
        newbase.fromBuffer(this.toBuffer());
        return newbase;
    }
    create(...args) {
        return new CreateAssetTx(...args);
    }
}
exports.CreateAssetTx = CreateAssetTx;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlYXRlYXNzZXR0eC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9hcGlzL2F2bS9jcmVhdGVhc3NldHR4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBOzs7R0FHRztBQUNILG9DQUFpQztBQUNqQyxvRUFBNEM7QUFDNUMsMkNBQTJDO0FBRzNDLG1EQUFnRDtBQUNoRCxxQ0FBa0M7QUFDbEMscURBQXlEO0FBQ3pELDZEQUE4RTtBQUU5RTs7R0FFRztBQUNILE1BQU0sUUFBUSxHQUFHLGtCQUFRLENBQUMsV0FBVyxFQUFFLENBQUM7QUFDeEMsTUFBTSxVQUFVLEdBQUcsNkJBQWEsQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUUvQyxNQUFhLGFBQWMsU0FBUSxlQUFNO0lBOEh2Qzs7Ozs7Ozs7Ozs7O09BWUc7SUFDSCxZQUNFLFlBQW1CLDRCQUFnQixFQUFFLGVBQXNCLGVBQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUMvRSxPQUFpQyxTQUFTLEVBQUUsTUFBK0IsU0FBUyxFQUNwRixPQUFjLFNBQVMsRUFBRSxPQUFjLFNBQVMsRUFBRSxTQUFnQixTQUFTLEVBQUUsZUFBc0IsU0FBUyxFQUM1RyxlQUE2QixTQUFTO1FBRXRDLEtBQUssQ0FBQyxTQUFTLEVBQUUsWUFBWSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFoSnhDLGNBQVMsR0FBRyxlQUFlLENBQUM7UUFDNUIsWUFBTyxHQUFHLHdCQUFZLENBQUMsYUFBYSxDQUFDO1FBcUJyQyxTQUFJLEdBQVUsRUFBRSxDQUFDO1FBQ2pCLFdBQU0sR0FBVSxFQUFFLENBQUM7UUFDbkIsaUJBQVksR0FBVSxlQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3RDLGlCQUFZLEdBQWlCLElBQUksNkJBQWEsRUFBRSxDQUFDO1FBRTNEOztXQUVHO1FBQ0gsY0FBUyxHQUFHLEdBQVUsRUFBRTtZ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QUM7UUFDOUosTUFBTSxJQUFJLEdBQWlCLENBQUMsU0FBUyxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsWUFBWSxFQUFFLGFBQWEsQ0FBQyxDQUFDO1FBQy9HLE9BQU8sZUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDcEMsQ0FBQztJQUVELEtBQUs7UUFDSCxJQUFJLE9BQU8sR0FBaUIsSUFBSSxhQUFhLEVBQUUsQ0FBQztRQUNoRCxPQUFPLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBQ3BDLE9BQU8sT0FBZSxDQUFDO0lBQ3pCLENBQUM7SUFFRCxNQUFNLENBQUMsR0FBRyxJQUFVO1FBQ2hCLE9BQU8sSUFBSSxhQUFhLENBQUMsR0FBRyxJQUFJLENBQVMsQ0FBQztJQUM5QyxDQUFDO0NBZ0NGO0FBNUpELHNDQTRKQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQHBhY2thZ2VEb2N1bWVudGF0aW9uXG4gKiBAbW9kdWxlIEFQSS1BVk0tQ3JlYXRlQXNzZXRUeFxuICovXG5pbXBvcnQgeyBCdWZmZXIgfSBmcm9tICdidWZmZXIvJztcbmltcG9ydCBCaW5Ub29scyBmcm9tICcuLi8uLi91dGlscy9iaW50b29scyc7XG5pbXBvcnQgeyBBVk1Db25zdGFudHMgfSBmcm9tICcuL2NvbnN0YW50cyc7XG5pbXBvcnQgeyBUcmFuc2ZlcmFibGVPdXRwdXQgfSBmcm9tICcuL291dHB1dHMnO1xuaW1wb3J0IHsgVHJhbnNmZXJhYmxlSW5wdXQgfSBmcm9tICcuL2lucHV0cyc7XG5pbXBvcnQgeyBJbml0aWFsU3RhdGVzIH0gZnJvbSAnLi9pbml0aWFsc3RhdGVzJztcbmltcG9ydCB7IEJhc2VUeCB9IGZyb20gJy4vYmFzZXR4JztcbmltcG9ydCB7IERlZmF1bHROZXR3b3JrSUQgfSBmcm9tICcuLi8uLi91dGlscy9jb25zdGFudHMnO1xuaW1wb3J0IHsgU2VyaWFsaXphdGlvbiwgU2VyaWFsaXplZEVuY29kaW5nIH0gZnJvbSAnLi4vLi4vdXRpbHMvc2VyaWFsaXphdGlvbic7XG5cbi8qKlxuICogQGlnbm9yZVxuICovXG5jb25zdCBiaW50b29scyA9IEJpblRvb2xzLmdldEluc3RhbmNlKCk7XG5jb25zdCBzZXJpYWxpemVyID0gU2VyaWFsaXphdGlvbi5nZXRJbnN0YW5jZSgpO1xuXG5leHBvcnQgY2xhc3MgQ3JlYXRlQXNzZXRUeCBleHRlbmRzIEJhc2VUeCB7XG4gIHByb3RlY3RlZCBfdHlwZU5hbWUgPSBcIkNyZWF0ZUFzc2V0VHhcIjtcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSBBVk1Db25zdGFudHMuQ1JFQVRFQVNTRVRUWDtcblxuICBzZXJpYWxpemUoZW5jb2Rpbmc6U2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIik6b2JqZWN0IHtcbiAgICBsZXQgZmllbGRzOm9iamVjdCA9IHN1cGVyLnNlcmlhbGl6ZShlbmNvZGluZyk7XG4gICAgcmV0dXJuIHtcbiAgICAgIC4uLmZpZWxkcyxcbiAgICAgIFwibmFtZVwiOiBzZXJpYWxpemVyLmVuY29kZXIodGhpcy5uYW1lLCBlbmNvZGluZywgXCJ1dGY4XCIsIFwidXRmOFwiKSxcbiAgICAgIFwic3ltYm9sXCI6IHNlcmlhbGl6ZXIuZW5jb2Rlcih0aGlzLnN5bWJvbCwgZW5jb2RpbmcsIFwidXRmOFwiLCBcInV0ZjhcIiksXG4gICAgICBcImRlbm9taW5hdGlvblwiOiBzZXJpYWxpemVyLmVuY29kZXIodGhpcy5kZW5vbWluYXRpb24sIGVuY29kaW5nLCBcIkJ1ZmZlclwiLCBcImRlY2ltYWxTdHJpbmdcIiwgMSksXG4gICAgICBcImluaXRpYWxzdGF0ZVwiOiB0aGlzLmluaXRpYWxzdGF0ZS5zZXJpYWxpemUoZW5jb2RpbmcpXG4gICAgfVxuICB9O1xuICBkZXNlcmlhbGl6ZShmaWVsZHM6b2JqZWN0LCBlbmNvZGluZzpTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKSB7XG4gICAgc3VwZXIuZGVzZXJpYWxpemUoZmllbGRzLCBlbmNvZGluZyk7XG4gICAgdGhpcy5uYW1lID0gc2VyaWFsaXplci5kZWNvZGVyKGZpZWxkc1tcIm5hbWVcIl0sIGVuY29kaW5nLCBcInV0ZjhcIiwgXCJ1dGY4XCIpO1xuICAgIHRoaXMuc3ltYm9sID0gc2VyaWFsaXplci5kZWNvZGVyKGZpZWxkc1tcInN5bWJvbFwiXSwgZW5jb2RpbmcsIFwidXRmOFwiLCBcInV0ZjhcIik7XG4gICAgdGhpcy5kZW5vbWluYXRpb24gPSBzZXJpYWxpemVyLmRlY29kZXIoZmllbGRzW1wiZGVub21pbmF0aW9uXCJdLCBlbmNvZGluZywgXCJkZWNpbWFsU3RyaW5nXCIsIFwiQnVmZmVyXCIsIDEpO1xuICAgIHRoaXMuaW5pdGlhbHN0YXRlID0gbmV3IEluaXRpYWxTdGF0ZXMoKTtcbiAgICB0aGlzLmluaXRpYWxzdGF0ZS5kZXNlcmlhbGl6ZShmaWVsZHNbXCJpbml0aWFsc3RhdGVcIl0sIGVuY29kaW5nKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBuYW1lOnN0cmluZyA9ICcnO1xuICBwcm90ZWN0ZWQgc3ltYm9sOnN0cmluZyA9ICcnO1xuICBwcm90ZWN0ZWQgZGVub21pbmF0aW9uOkJ1ZmZlciA9IEJ1ZmZlci5hbGxvYygxKTtcbiAgcHJvdGVjdGVkIGluaXRpYWxzdGF0ZTpJbml0aWFsU3RhdGVzID0gbmV3IEluaXRpYWxTdGF0ZXMoKTtcblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgaWQgb2YgdGhlIFtbQ3JlYXRlQXNzZXRUeF1dXG4gICAqL1xuICBnZXRUeFR5cGUgPSAoKTpudW1iZXIgPT4ge1xuICAgIHJldHVybiB0aGlzLl90eXBlSUQ7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgYXJyYXkgb2YgYXJyYXkgb2YgW1tPdXRwdXRdXXMgZm9yIHRoZSBpbml0aWFsIHN0YXRlXG4gICAqL1xuICBnZXRJbml0aWFsU3RhdGVzID0gKCk6SW5pdGlhbFN0YXRlcyA9PiB0aGlzLmluaXRpYWxzdGF0ZTtcblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBuYW1lXG4gICAqL1xuICBnZXROYW1lID0gKCk6c3RyaW5nID0+IHRoaXMubmFtZTtcblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBzeW1ib2xcbiAgICovXG4gIGdldFN5bWJvbCA9ICgpOnN0cmluZyA9PiB0aGlzLnN5bWJvbDtcblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgbnVtZXJpYyByZXByZXNlbnRhdGlvbiBvZiB0aGUgZGVub21pbmF0aW9uXG4gICAqL1xuICBnZXREZW5vbWluYXRpb24gPSAoKTpudW1iZXIgPT4gdGhpcy5kZW5vbWluYXRpb24ucmVhZFVJbnQ4KDApO1xuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSByZXByZXNlbnRhdGlvbiBvZiB0aGUgZGVub21pbmF0aW9uXG4gICAqL1xuICBnZXREZW5vbWluYXRpb25CdWZmZXIgPSAoKTpCdWZmZXIgPT4ge1xuICAgICAgcmV0dXJuIHRoaXMuZGVub21pbmF0aW9uO1xuICB9XG5cbiAgLyoqXG4gICAqIFRha2VzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gY29udGFpbmluZyBhbiBbW0NyZWF0ZUFzc2V0VHhdXSwgcGFyc2VzIGl0LCBwb3B1bGF0ZXMgdGhlIGNsYXNzLCBhbmQgcmV0dXJucyB0aGUgbGVuZ3RoIG9mIHRoZSBbW0NyZWF0ZUFzc2V0VHhdXSBpbiBieXRlcy5cbiAgICpcbiAgICogQHBhcmFtIGJ5dGVzIEEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gY29udGFpbmluZyBhIHJhdyBbW0NyZWF0ZUFzc2V0VHhdXVxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgbGVuZ3RoIG9mIHRoZSByYXcgW1tDcmVhdGVBc3NldFR4XV1cbiAgICpcbiAgICogQHJlbWFya3MgYXNzdW1lIG5vdC1jaGVja3N1bW1lZFxuICAgKi9cbiAgZnJvbUJ1ZmZlcihieXRlczpCdWZmZXIsIG9mZnNldDpudW1iZXIgPSAwKTpudW1iZXIge1xuICAgIG9mZnNldCA9IHN1cGVyLmZyb21CdWZmZXIoYnl0ZXMsIG9mZnNldCk7XG5cbiAgICBjb25zdCBuYW1lc2l6ZTpudW1iZXIgPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyAyKS5yZWFkVUludDE2QkUoMCk7XG4gICAgb2Zmc2V0ICs9IDI7XG4gICAgdGhpcy5uYW1lID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgbmFtZXNpemUpLnRvU3RyaW5nKCd1dGY4Jyk7XG4gICAgb2Zmc2V0ICs9IG5hbWVzaXplO1xuXG4gICAgY29uc3Qgc3ltc2l6ZTpudW1iZXIgPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyAyKS5yZWFkVUludDE2QkUoMCk7XG4gICAgb2Zmc2V0ICs9IDI7XG4gICAgdGhpcy5zeW1ib2wgPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyBzeW1zaXplKS50b1N0cmluZygndXRmOCcpO1xuICAgIG9mZnNldCArPSBzeW1zaXplO1xuXG4gICAgdGhpcy5kZW5vbWluYXRpb24gPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyAxKTtcbiAgICBvZmZzZXQgKz0gMTtcblxuICAgIGNvbnN0IGluaXRzOkluaXRpYWxTdGF0ZXMgPSBuZXcgSW5pdGlhbFN0YXRlcygpO1xuICAgIG9mZnNldCA9IGluaXRzLmZyb21CdWZmZXIoYnl0ZXMsIG9mZnNldCk7XG4gICAgdGhpcy5pbml0aWFsc3RhdGUgPSBpbml0cztcblxuICAgIHJldHVybiBvZmZzZXQ7XG4gIH1cblxuICAvKipcbiAgICAgKiBSZXR1cm5zIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gcmVwcmVzZW50YXRpb24gb2YgdGhlIFtbQ3JlYXRlQXNzZXRUeF1dLlxuICAgICAqL1xuICB0b0J1ZmZlcigpOkJ1ZmZlciB7XG4gICAgY29uc3Qgc3VwZXJidWZmOkJ1ZmZlciA9IHN1cGVyLnRvQnVmZmVyKCk7XG4gICAgY29uc3QgaW5pdHN0YXRlYnVmZjpCdWZmZXIgPSB0aGlzLmluaXRpYWxzdGF0ZS50b0J1ZmZlcigpO1xuXG4gICAgY29uc3QgbmFtZWJ1ZmY6QnVmZmVyID0gQnVmZmVyLmFsbG9jKHRoaXMubmFtZS5sZW5ndGgpO1xuICAgIG5hbWVidWZmLndyaXRlKHRoaXMubmFtZSwgMCwgdGhpcy5uYW1lLmxlbmd0aCwgJ3V0ZjgnKTtcbiAgICBjb25zdCBuYW1lc2l6ZTpCdWZmZXIgPSBCdWZmZXIuYWxsb2MoMik7XG4gICAgbmFtZXNpemUud3JpdGVVSW50MTZCRSh0aGlzLm5hbWUubGVuZ3RoLCAwKTtcblxuICAgIGNvbnN0IHN5bWJ1ZmY6QnVmZmVyID0gQnVmZmVyLmFsbG9jKHRoaXMuc3ltYm9sLmxlbmd0aCk7XG4gICAgc3ltYnVmZi53cml0ZSh0aGlzLnN5bWJvbCwgMCwgdGhpcy5zeW1ib2wubGVuZ3RoLCAndXRmOCcpO1xuICAgIGNvbnN0IHN5bXNpemU6QnVmZmVyID0gQnVmZmVyLmFsbG9jKDIpO1xuICAgIHN5bXNpemUud3JpdGVVSW50MTZCRSh0aGlzLnN5bWJvbC5sZW5ndGgsIDApO1xuXG4gICAgY29uc3QgYnNpemU6bnVtYmVyID0gc3VwZXJidWZmLmxlbmd0aCArIG5hbWVzaXplLmxlbmd0aCArIG5hbWVidWZmLmxlbmd0aCArIHN5bXNpemUubGVuZ3RoICsgc3ltYnVmZi5sZW5ndGggKyB0aGlzLmRlbm9taW5hdGlvbi5sZW5ndGggKyBpbml0c3RhdGVidWZmLmxlbmd0aDtcbiAgICBjb25zdCBiYXJyOkFycmF5PEJ1ZmZlcj4gPSBbc3VwZXJidWZmLCBuYW1lc2l6ZSwgbmFtZWJ1ZmYsIHN5bXNpemUsIHN5bWJ1ZmYsIHRoaXMuZGVub21pbmF0aW9uLCBpbml0c3RhdGVidWZmXTtcbiAgICByZXR1cm4gQnVmZmVyLmNvbmNhdChiYXJyLCBic2l6ZSk7XG4gIH1cblxuICBjbG9uZSgpOnRoaXMge1xuICAgIGxldCBuZXdiYXNlOkNyZWF0ZUFzc2V0VHggPSBuZXcgQ3JlYXRlQXNzZXRUeCgpO1xuICAgIG5ld2Jhc2UuZnJvbUJ1ZmZlcih0aGlzLnRvQnVmZmVyKCkpO1xuICAgIHJldHVybiBuZXdiYXNlIGFzIHRoaXM7XG4gIH1cblxuICBjcmVhdGUoLi4uYXJnczphbnlbXSk6dGhpcyB7XG4gICAgICByZXR1cm4gbmV3IENyZWF0ZUFzc2V0VHgoLi4uYXJncykgYXMgdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBDbGFzcyByZXByZXNlbnRpbmcgYW4gdW5zaWduZWQgQ3JlYXRlIEFzc2V0IHRyYW5zYWN0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gbmV0d29ya2lkIE9wdGlvbmFsIG5ldHdvcmtpZCwgW1tEZWZhdWx0TmV0d29ya0lEXV1cbiAgICogQHBhcmFtIGJsb2NrY2hhaW5pZCBPcHRpb25hbCBibG9ja2NoYWluaWQsIGRlZmF1bHQgQnVmZmVyLmFsbG9jKDMyLCAxNilcbiAgICogQHBhcmFtIG91dHMgT3B0aW9uYWwgYXJyYXkgb2YgdGhlIFtbVHJhbnNmZXJhYmxlT3V0cHV0XV1zXG4gICAqIEBwYXJhbSBpbnMgT3B0aW9uYWwgYXJyYXkgb2YgdGhlIFtbVHJhbnNmZXJhYmxlSW5wdXRdXXNcbiAgICogQHBhcmFtIG1lbW8gT3B0aW9uYWwge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gZm9yIHRoZSBtZW1vIGZpZWxkXG4gICAqIEBwYXJhbSBuYW1lIFN0cmluZyBmb3IgdGhlIGRlc2NyaXB0aXZlIG5hbWUgb2YgdGhlIGFzc2V0XG4gICAqIEBwYXJhbSBzeW1ib2wgU3RyaW5nIGZvciB0aGUgdGlja2VyIHN5bWJvbCBvZiB0aGUgYXNzZXRcbiAgICogQHBhcmFtIGRlbm9taW5hdGlvbiBPcHRpb25hbCBudW1iZXIgZm9yIHRoZSBkZW5vbWluYXRpb24gd2hpY2ggaXMgMTBeRC4gRCBtdXN0IGJlID49IDAgYW5kIDw9IDMyLiBFeDogJDEgQVZBWCA9IDEwXjkgJG5BVkFYXG4gICAqIEBwYXJhbSBpbml0aWFsc3RhdGUgT3B0aW9uYWwgW1tJbml0aWFsU3RhdGVzXV0gdGhhdCByZXByZXNlbnQgdGhlIGludGlhbCBzdGF0ZSBvZiBhIGNyZWF0ZWQgYXNzZXRcbiAgICovXG4gIGNvbnN0cnVjdG9yKFxuICAgIG5ldHdvcmtpZDpudW1iZXIgPSBEZWZhdWx0TmV0d29ya0lELCBibG9ja2NoYWluaWQ6QnVmZmVyID0gQnVmZmVyLmFsbG9jKDMyLCAxNiksXG4gICAgb3V0czpBcnJheTxUcmFuc2ZlcmFibGVPdXRwdXQ+ID0gdW5kZWZpbmVkLCBpbnM6QXJyYXk8VHJhbnNmZXJhYmxlSW5wdXQ+ID0gdW5kZWZpbmVkLFxuICAgIG1lbW86QnVmZmVyID0gdW5kZWZpbmVkLCBuYW1lOnN0cmluZyA9IHVuZGVmaW5lZCwgc3ltYm9sOnN0cmluZyA9IHVuZGVmaW5lZCwgZGVub21pbmF0aW9uOm51bWJlciA9IHVuZGVmaW5lZCxcbiAgICBpbml0aWFsc3RhdGU6SW5pdGlhbFN0YXRlcyA9IHVuZGVmaW5lZFxuICApIHtcbiAgICBzdXBlcihuZXR3b3JraWQsIGJsb2NrY2hhaW5pZCwgb3V0cywgaW5zLCBtZW1vKTtcbiAgICBpZiAoXG4gICAgICB0eXBlb2YgbmFtZSA9PT0gJ3N0cmluZycgJiYgdHlwZW9mIHN5bWJvbCA9PT0gJ3N0cmluZycgJiYgdHlwZW9mIGRlbm9taW5hdGlvbiA9PT0gJ251bWJlcidcbiAgICAgICAgICAgICYmIGRlbm9taW5hdGlvbiA+PSAwICYmIGRlbm9taW5hdGlvbiA8PSAzMiAmJiB0eXBlb2YgaW5pdGlhbHN0YXRlICE9PSAndW5kZWZpbmVkJ1xuICAgICkge1xuICAgICAgdGhpcy5pbml0aWFsc3RhdGUgPSBpbml0aWFsc3RhdGU7XG4gICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgICAgdGhpcy5zeW1ib2wgPSBzeW1ib2w7XG4gICAgICB0aGlzLmRlbm9taW5hdGlvbi53cml0ZVVJbnQ4KGRlbm9taW5hdGlvbiwgMCk7XG4gICAgfVxuICB9XG59Il19