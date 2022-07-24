"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NFTTransferOutput = exports.NFTMintOutput = exports.SECPMintOutput = exports.SECPTransferOutput = exports.NFTOutput = exports.AmountOutput = exports.TransferableOutput = exports.SelectOutputClass = void 0;
/**
 * @packageDocumentation
 * @module API-AVM-Outputs
 */
const buffer_1 = require("buffer/");
const bintools_1 = __importDefault(require("../../utils/bintools"));
const constants_1 = require("./constants");
const output_1 = require("../../common/output");
const serialization_1 = require("../../utils/serialization");
const bintools = bintools_1.default.getInstance();
const serializer = serialization_1.Serialization.getInstance();
/**
 * Takes a buffer representing the output and returns the proper Output instance.
 *
 * @param outputid A number representing the inputID parsed prior to the bytes passed in
 *
 * @returns An instance of an [[Output]]-extended class.
 */
exports.SelectOutputClass = (outputid, ...args) => {
    if (outputid == constants_1.AVMConstants.SECPXFEROUTPUTID) {
        return new SECPTransferOutput(...args);
    }
    else if (outputid == constants_1.AVMConstants.SECPMINTOUTPUTID) {
        return new SECPMintOutput(...args);
    }
    else if (outputid == constants_1.AVMConstants.NFTMINTOUTPUTID) {
        return new NFTMintOutput(...args);
    }
    else if (outputid == constants_1.AVMConstants.NFTXFEROUTPUTID) {
        return new NFTTransferOutput(...args);
    }
    throw new Error("Error - SelectOutputClass: unknown outputid " + outputid);
};
class TransferableOutput extends output_1.StandardTransferableOutput {
    constructor() {
        super(...arguments);
        this._typeName = "TransferableOutput";
        this._typeID = undefined;
    }
    //serialize is inherited
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.output = exports.SelectOutputClass(fields["output"]["_typeID"]);
        this.output.deserialize(fields["output"], encoding);
    }
    fromBuffer(bytes, offset = 0) {
        this.assetID = bintools.copyFrom(bytes, offset, offset + constants_1.AVMConstants.ASSETIDLEN);
        offset += constants_1.AVMConstants.ASSETIDLEN;
        const outputid = bintools.copyFrom(bytes, offset, offset + 4).readUInt32BE(0);
        offset += 4;
        this.output = exports.SelectOutputClass(outputid);
        return this.output.fromBuffer(bytes, offset);
    }
}
exports.TransferableOutput = TransferableOutput;
class AmountOutput extends output_1.StandardAmountOutput {
    constructor() {
        super(...arguments);
        this._typeName = "AmountOutput";
        this._typeID = undefined;
    }
    //serialize and deserialize both are inherited
    /**
     *
     * @param assetID An assetID which is wrapped around the Buffer of the Output
     */
    makeTransferable(assetID) {
        return new TransferableOutput(assetID, this);
    }
    select(id, ...args) {
        return exports.SelectOutputClass(id, ...args);
    }
}
exports.AmountOutput = AmountOutput;
class NFTOutput extends output_1.BaseNFTOutput {
    constructor() {
        super(...arguments);
        this._typeName = "NFTOutput";
        this._typeID = undefined;
    }
    //serialize and deserialize both are inherited
    /**
     *
     * @param assetID An assetID which is wrapped around the Buffer of the Output
     */
    makeTransferable(assetID) {
        return new TransferableOutput(assetID, this);
    }
    select(id, ...args) {
        return exports.SelectOutputClass(id, ...args);
    }
}
exports.NFTOutput = NFTOutput;
/**
 * An [[Output]] class which specifies an Output that carries an ammount for an assetID and uses secp256k1 signature scheme.
 */
class SECPTransferOutput extends AmountOutput {
    constructor() {
        super(...arguments);
        this._typeName = "SECPTransferOutput";
        this._typeID = constants_1.AVMConstants.SECPXFEROUTPUTID;
    }
    //serialize and deserialize both are inherited
    /**
       * Returns the outputID for this output
       */
    getOutputID() {
        return this._typeID;
    }
    create(...args) {
        return new SECPTransferOutput(...args);
    }
    clone() {
        const newout = this.create();
        newout.fromBuffer(this.toBuffer());
        return newout;
    }
}
exports.SECPTransferOutput = SECPTransferOutput;
/**
 * An [[Output]] class which specifies an Output that carries an ammount for an assetID and uses secp256k1 signature scheme.
 */
class SECPMintOutput extends output_1.Output {
    constructor() {
        super(...arguments);
        this._typeName = "SECPMintOutput";
        this._typeID = constants_1.AVMConstants.SECPMINTOUTPUTID;
    }
    //serialize and deserialize both are inherited
    /**
     * Returns the outputID for this output
     */
    getOutputID() {
        return this._typeID;
    }
    /**
     *
     * @param assetID An assetID which is wrapped around the Buffer of the Output
     */
    makeTransferable(assetID) {
        return new TransferableOutput(assetID, this);
    }
    create(...args) {
        return new SECPMintOutput(...args);
    }
    clone() {
        const newout = this.create();
        newout.fromBuffer(this.toBuffer());
        return newout;
    }
    select(id, ...args) {
        return exports.SelectOutputClass(id, ...args);
    }
}
exports.SECPMintOutput = SECPMintOutput;
/**
 * An [[Output]] class which specifies an Output that carries an NFT Mint and uses secp256k1 signature scheme.
 */
class NFTMintOutput extends NFTOutput {
    /**
     * An [[Output]] class which contains an NFT mint for an assetID.
     *
     * @param groupID A number specifies the group this NFT is issued to
     * @param locktime A {@link https://github.com/indutny/bn.js/|BN} representing the locktime
     * @param threshold A number representing the the threshold number of signers required to sign the transaction
     * @param addresses An array of {@link https://github.com/feross/buffer|Buffer}s representing addresses
     */
    constructor(groupID = undefined, addresses = undefined, locktime = undefined, threshold = undefined) {
        super(addresses, locktime, threshold);
        this._typeName = "NFTMintOutput";
        this._typeID = constants_1.AVMConstants.NFTMINTOUTPUTID;
        if (typeof groupID !== 'undefined') {
            this.groupID.writeUInt32BE(groupID, 0);
        }
    }
    //serialize and deserialize both are inherited
    /**
     * Returns the outputID for this output
     */
    getOutputID() {
        return this._typeID;
    }
    /**
     * Popuates the instance from a {@link https://github.com/feross/buffer|Buffer} representing the [[NFTMintOutput]] and returns the size of the output.
     */
    fromBuffer(utxobuff, offset = 0) {
        this.groupID = bintools.copyFrom(utxobuff, offset, offset + 4);
        offset += 4;
        return super.fromBuffer(utxobuff, offset);
    }
    /**
     * Returns the buffer representing the [[NFTMintOutput]] instance.
     */
    toBuffer() {
        let superbuff = super.toBuffer();
        let bsize = this.groupID.length + superbuff.length;
        let barr = [this.groupID, superbuff];
        return buffer_1.Buffer.concat(barr, bsize);
    }
    create(...args) {
        return new NFTMintOutput(...args);
    }
    clone() {
        const newout = this.create();
        newout.fromBuffer(this.toBuffer());
        return newout;
    }
}
exports.NFTMintOutput = NFTMintOutput;
/**
 * An [[Output]] class which specifies an Output that carries an NFT and uses secp256k1 signature scheme.
 */
class NFTTransferOutput extends NFTOutput {
    /**
       * An [[Output]] class which contains an NFT on an assetID.
       *
       * @param groupID A number representing the amount in the output
       * @param payload A {@link https://github.com/feross/buffer|Buffer} of max length 1024
       * @param addresses An array of {@link https://github.com/feross/buffer|Buffer}s representing addresses
       * @param locktime A {@link https://github.com/indutny/bn.js/|BN} representing the locktime
       * @param threshold A number representing the the threshold number of signers required to sign the transaction
  
       */
    constructor(groupID = undefined, payload = undefined, addresses = undefined, locktime = undefined, threshold = undefined) {
        super(addresses, locktime, threshold);
        this._typeName = "NFTTransferOutput";
        this._typeID = constants_1.AVMConstants.NFTXFEROUTPUTID;
        this.sizePayload = buffer_1.Buffer.alloc(4);
        /**
         * Returns the payload as a {@link https://github.com/feross/buffer|Buffer} with content only.
         */
        this.getPayload = () => bintools.copyFrom(this.payload);
        /**
         * Returns the payload as a {@link https://github.com/feross/buffer|Buffer} with length of payload prepended.
         */
        this.getPayloadBuffer = () => buffer_1.Buffer.concat([bintools.copyFrom(this.sizePayload), bintools.copyFrom(this.payload)]);
        if (typeof groupID !== 'undefined' && typeof payload !== 'undefined') {
            this.groupID.writeUInt32BE(groupID, 0);
            this.sizePayload.writeUInt32BE(payload.length, 0);
            this.payload = bintools.copyFrom(payload, 0, payload.length);
        }
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { "payload": serializer.encoder(this.payload, encoding, "Buffer", "hex", this.payload.length) });
    }
    ;
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.payload = serializer.decoder(fields["payload"], encoding, "hex", "Buffer");
        this.sizePayload = buffer_1.Buffer.alloc(4);
        this.sizePayload.writeUInt32BE(this.payload.length, 0);
    }
    /**
     * Returns the outputID for this output
     */
    getOutputID() {
        return this._typeID;
    }
    /**
     * Popuates the instance from a {@link https://github.com/feross/buffer|Buffer} representing the [[NFTTransferOutput]] and returns the size of the output.
     */
    fromBuffer(utxobuff, offset = 0) {
        this.groupID = bintools.copyFrom(utxobuff, offset, offset + 4);
        offset += 4;
        this.sizePayload = bintools.copyFrom(utxobuff, offset, offset + 4);
        let psize = this.sizePayload.readUInt32BE(0);
        offset += 4;
        this.payload = bintools.copyFrom(utxobuff, offset, offset + psize);
        offset = offset + psize;
        return super.fromBuffer(utxobuff, offset);
    }
    /**
     * Returns the buffer representing the [[NFTTransferOutput]] instance.
     */
    toBuffer() {
        const superbuff = super.toBuffer();
        const bsize = this.groupID.length + this.sizePayload.length + this.payload.length + superbuff.length;
        this.sizePayload.writeUInt32BE(this.payload.length, 0);
        const barr = [this.groupID, this.sizePayload, this.payload, superbuff];
        return buffer_1.Buffer.concat(barr, bsize);
    }
    create(...args) {
        return new NFTTransferOutput(...args);
    }
    clone() {
        const newout = this.create();
        newout.fromBuffer(this.toBuffer());
        return newout;
    }
}
exports.NFTTransferOutput = NFTTransferOutput;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3V0cHV0cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9hcGlzL2F2bS9vdXRwdXRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBOzs7R0FHRztBQUNILG9DQUFpQztBQUVqQyxvRUFBNEM7QUFDNUMsMkNBQTJDO0FBQzNDLGdEQUE4RztBQUM5Ryw2REFBOEU7QUFFOUUsTUFBTSxRQUFRLEdBQUcsa0JBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUN4QyxNQUFNLFVBQVUsR0FBRyw2QkFBYSxDQUFDLFdBQVcsRUFBRSxDQUFDO0FBRS9DOzs7Ozs7R0FNRztBQUNVLFFBQUEsaUJBQWlCLEdBQUcsQ0FBQyxRQUFlLEVBQUUsR0FBRyxJQUFlLEVBQVMsRUFBRTtJQUM1RSxJQUFHLFFBQVEsSUFBSSx3QkFBWSxDQUFDLGdCQUFnQixFQUFDO1FBQ3pDLE9BQU8sSUFBSSxrQkFBa0IsQ0FBRSxHQUFHLElBQUksQ0FBQyxDQUFDO0tBQzNDO1NBQU0sSUFBRyxRQUFRLElBQUksd0JBQVksQ0FBQyxnQkFBZ0IsRUFBQztRQUNoRCxPQUFPLElBQUksY0FBYyxDQUFFLEdBQUcsSUFBSSxDQUFDLENBQUM7S0FDdkM7U0FBTSxJQUFHLFFBQVEsSUFBSSx3QkFBWSxDQUFDLGVBQWUsRUFBQztRQUMvQyxPQUFPLElBQUksYUFBYSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUM7S0FDckM7U0FBTSxJQUFHLFFBQVEsSUFBSSx3QkFBWSxDQUFDLGVBQWUsRUFBQztRQUMvQyxPQUFPLElBQUksaUJBQWlCLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQztLQUN6QztJQUNELE1BQU0sSUFBSSxLQUFLLENBQUMsOENBQThDLEdBQUcsUUFBUSxDQUFDLENBQUM7QUFDL0UsQ0FBQyxDQUFBO0FBRUQsTUFBYSxrQkFBbUIsU0FBUSxtQ0FBMEI7SUFBbEU7O1FBQ1ksY0FBUyxHQUFHLG9CQUFvQixDQUFDO1FBQ2pDLFlBQU8sR0FBRyxT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QyxNQUFNLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBQ25DLE9BQU8sTUFBYyxDQUFDO0lBQ3hCLENBQUM7Q0FvQkY7QUE3RkQsOENBNkZDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAcGFja2FnZURvY3VtZW50YXRpb25cbiAqIEBtb2R1bGUgQVBJLUFWTS1PdXRwdXRzXG4gKi9cbmltcG9ydCB7IEJ1ZmZlciB9IGZyb20gJ2J1ZmZlci8nO1xuaW1wb3J0IEJOIGZyb20gJ2JuLmpzJztcbmltcG9ydCBCaW5Ub29scyBmcm9tICcuLi8uLi91dGlscy9iaW50b29scyc7XG5pbXBvcnQgeyBBVk1Db25zdGFudHMgfSBmcm9tICcuL2NvbnN0YW50cyc7XG5pbXBvcnQgeyBPdXRwdXQsIFN0YW5kYXJkQW1vdW50T3V0cHV0LCBTdGFuZGFyZFRyYW5zZmVyYWJsZU91dHB1dCwgQmFzZU5GVE91dHB1dCB9IGZyb20gJy4uLy4uL2NvbW1vbi9vdXRwdXQnO1xuaW1wb3J0IHsgU2VyaWFsaXphdGlvbiwgU2VyaWFsaXplZEVuY29kaW5nIH0gZnJvbSAnLi4vLi4vdXRpbHMvc2VyaWFsaXphdGlvbic7XG5cbmNvbnN0IGJpbnRvb2xzID0gQmluVG9vbHMuZ2V0SW5zdGFuY2UoKTtcbmNvbnN0IHNlcmlhbGl6ZXIgPSBTZXJpYWxpemF0aW9uLmdldEluc3RhbmNlKCk7XG5cbi8qKlxuICogVGFrZXMgYSBidWZmZXIgcmVwcmVzZW50aW5nIHRoZSBvdXRwdXQgYW5kIHJldHVybnMgdGhlIHByb3BlciBPdXRwdXQgaW5zdGFuY2UuXG4gKlxuICogQHBhcmFtIG91dHB1dGlkIEEgbnVtYmVyIHJlcHJlc2VudGluZyB0aGUgaW5wdXRJRCBwYXJzZWQgcHJpb3IgdG8gdGhlIGJ5dGVzIHBhc3NlZCBpblxuICpcbiAqIEByZXR1cm5zIEFuIGluc3RhbmNlIG9mIGFuIFtbT3V0cHV0XV0tZXh0ZW5kZWQgY2xhc3MuXG4gKi9cbmV4cG9ydCBjb25zdCBTZWxlY3RPdXRwdXRDbGFzcyA9IChvdXRwdXRpZDpudW1iZXIsIC4uLmFyZ3M6QXJyYXk8YW55Pik6T3V0cHV0ID0+IHtcbiAgICBpZihvdXRwdXRpZCA9PSBBVk1Db25zdGFudHMuU0VDUFhGRVJPVVRQVVRJRCl7XG4gICAgICAgIHJldHVybiBuZXcgU0VDUFRyYW5zZmVyT3V0cHV0KCAuLi5hcmdzKTtcbiAgICB9IGVsc2UgaWYob3V0cHV0aWQgPT0gQVZNQ29uc3RhbnRzLlNFQ1BNSU5UT1VUUFVUSUQpe1xuICAgICAgICByZXR1cm4gbmV3IFNFQ1BNaW50T3V0cHV0KCAuLi5hcmdzKTtcbiAgICB9IGVsc2UgaWYob3V0cHV0aWQgPT0gQVZNQ29uc3RhbnRzLk5GVE1JTlRPVVRQVVRJRCl7XG4gICAgICAgIHJldHVybiBuZXcgTkZUTWludE91dHB1dCguLi5hcmdzKTtcbiAgICB9IGVsc2UgaWYob3V0cHV0aWQgPT0gQVZNQ29uc3RhbnRzLk5GVFhGRVJPVVRQVVRJRCl7XG4gICAgICAgIHJldHVybiBuZXcgTkZUVHJhbnNmZXJPdXRwdXQoLi4uYXJncyk7XG4gICAgfVxuICAgIHRocm93IG5ldyBFcnJvcihcIkVycm9yIC0gU2VsZWN0T3V0cHV0Q2xhc3M6IHVua25vd24gb3V0cHV0aWQgXCIgKyBvdXRwdXRpZCk7XG59XG5cbmV4cG9ydCBjbGFzcyBUcmFuc2ZlcmFibGVPdXRwdXQgZXh0ZW5kcyBTdGFuZGFyZFRyYW5zZmVyYWJsZU91dHB1dHtcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiVHJhbnNmZXJhYmxlT3V0cHV0XCI7XG4gIHByb3RlY3RlZCBfdHlwZUlEID0gdW5kZWZpbmVkO1xuXG4gIC8vc2VyaWFsaXplIGlzIGluaGVyaXRlZFxuXG4gIGRlc2VyaWFsaXplKGZpZWxkczpvYmplY3QsIGVuY29kaW5nOlNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpIHtcbiAgICBzdXBlci5kZXNlcmlhbGl6ZShmaWVsZHMsIGVuY29kaW5nKTtcbiAgICB0aGlzLm91dHB1dCA9IFNlbGVjdE91dHB1dENsYXNzKGZpZWxkc1tcIm91dHB1dFwiXVtcIl90eXBlSURcIl0pO1xuICAgIHRoaXMub3V0cHV0LmRlc2VyaWFsaXplKGZpZWxkc1tcIm91dHB1dFwiXSwgZW5jb2RpbmcpO1xuICB9XG5cbiAgZnJvbUJ1ZmZlcihieXRlczpCdWZmZXIsIG9mZnNldDpudW1iZXIgPSAwKTpudW1iZXIge1xuICAgIHRoaXMuYXNzZXRJRCA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIEFWTUNvbnN0YW50cy5BU1NFVElETEVOKTtcbiAgICBvZmZzZXQgKz0gQVZNQ29uc3RhbnRzLkFTU0VUSURMRU47XG4gICAgY29uc3Qgb3V0cHV0aWQ6bnVtYmVyID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgNCkucmVhZFVJbnQzMkJFKDApO1xuICAgIG9mZnNldCArPSA0O1xuICAgIHRoaXMub3V0cHV0ID0gU2VsZWN0T3V0cHV0Q2xhc3Mob3V0cHV0aWQpO1xuICAgIHJldHVybiB0aGlzLm91dHB1dC5mcm9tQnVmZmVyKGJ5dGVzLCBvZmZzZXQpO1xuICB9XG5cbn1cblxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIEFtb3VudE91dHB1dCBleHRlbmRzIFN0YW5kYXJkQW1vdW50T3V0cHV0IHtcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiQW1vdW50T3V0cHV0XCI7XG4gIHByb3RlY3RlZCBfdHlwZUlEID0gdW5kZWZpbmVkO1xuXG4gIC8vc2VyaWFsaXplIGFuZCBkZXNlcmlhbGl6ZSBib3RoIGFyZSBpbmhlcml0ZWRcbiAgXG4gIC8qKlxuICAgKiBcbiAgICogQHBhcmFtIGFzc2V0SUQgQW4gYXNzZXRJRCB3aGljaCBpcyB3cmFwcGVkIGFyb3VuZCB0aGUgQnVmZmVyIG9mIHRoZSBPdXRwdXRcbiAgICovXG4gIG1ha2VUcmFuc2ZlcmFibGUoYXNzZXRJRDpCdWZmZXIpOlRyYW5zZmVyYWJsZU91dHB1dCB7XG4gICAgICByZXR1cm4gbmV3IFRyYW5zZmVyYWJsZU91dHB1dChhc3NldElELCB0aGlzKTtcbiAgfVxuXG4gIHNlbGVjdChpZDpudW1iZXIsIC4uLmFyZ3M6IGFueVtdKTpPdXRwdXQge1xuICAgICAgcmV0dXJuIFNlbGVjdE91dHB1dENsYXNzKGlkLCAuLi5hcmdzKTtcbiAgfVxuXG59XG5cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBORlRPdXRwdXQgZXh0ZW5kcyBCYXNlTkZUT3V0cHV0IHtcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiTkZUT3V0cHV0XCI7XG4gIHByb3RlY3RlZCBfdHlwZUlEID0gdW5kZWZpbmVkO1xuXG4gIC8vc2VyaWFsaXplIGFuZCBkZXNlcmlhbGl6ZSBib3RoIGFyZSBpbmhlcml0ZWRcblxuICAvKipcbiAgICogXG4gICAqIEBwYXJhbSBhc3NldElEIEFuIGFzc2V0SUQgd2hpY2ggaXMgd3JhcHBlZCBhcm91bmQgdGhlIEJ1ZmZlciBvZiB0aGUgT3V0cHV0XG4gICAqL1xuICBtYWtlVHJhbnNmZXJhYmxlKGFzc2V0SUQ6QnVmZmVyKTpUcmFuc2ZlcmFibGVPdXRwdXQge1xuICAgICAgcmV0dXJuIG5ldyBUcmFuc2ZlcmFibGVPdXRwdXQoYXNzZXRJRCwgdGhpcyk7XG4gIH1cblxuICBzZWxlY3QoaWQ6bnVtYmVyLCAuLi5hcmdzOiBhbnlbXSk6T3V0cHV0IHtcbiAgICAgIHJldHVybiBTZWxlY3RPdXRwdXRDbGFzcyhpZCwgLi4uYXJncyk7XG4gIH1cbn1cblxuLyoqXG4gKiBBbiBbW091dHB1dF1dIGNsYXNzIHdoaWNoIHNwZWNpZmllcyBhbiBPdXRwdXQgdGhhdCBjYXJyaWVzIGFuIGFtbW91bnQgZm9yIGFuIGFzc2V0SUQgYW5kIHVzZXMgc2VjcDI1NmsxIHNpZ25hdHVyZSBzY2hlbWUuXG4gKi9cbmV4cG9ydCBjbGFzcyBTRUNQVHJhbnNmZXJPdXRwdXQgZXh0ZW5kcyBBbW91bnRPdXRwdXQge1xuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJTRUNQVHJhbnNmZXJPdXRwdXRcIjtcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSBBVk1Db25zdGFudHMuU0VDUFhGRVJPVVRQVVRJRDtcblxuICAvL3NlcmlhbGl6ZSBhbmQgZGVzZXJpYWxpemUgYm90aCBhcmUgaW5oZXJpdGVkXG5cbiAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgb3V0cHV0SUQgZm9yIHRoaXMgb3V0cHV0XG4gICAgICovXG4gIGdldE91dHB1dElEKCk6bnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fdHlwZUlEO1xuICB9XG5cbiAgY3JlYXRlKC4uLmFyZ3M6YW55W10pOnRoaXN7XG4gICAgcmV0dXJuIG5ldyBTRUNQVHJhbnNmZXJPdXRwdXQoLi4uYXJncykgYXMgdGhpcztcbiAgfVxuXG4gIGNsb25lKCk6dGhpcyB7XG4gICAgY29uc3QgbmV3b3V0OlNFQ1BUcmFuc2Zlck91dHB1dCA9IHRoaXMuY3JlYXRlKClcbiAgICBuZXdvdXQuZnJvbUJ1ZmZlcih0aGlzLnRvQnVmZmVyKCkpO1xuICAgIHJldHVybiBuZXdvdXQgYXMgdGhpcztcbiAgfVxuXG59XG5cbi8qKlxuICogQW4gW1tPdXRwdXRdXSBjbGFzcyB3aGljaCBzcGVjaWZpZXMgYW4gT3V0cHV0IHRoYXQgY2FycmllcyBhbiBhbW1vdW50IGZvciBhbiBhc3NldElEIGFuZCB1c2VzIHNlY3AyNTZrMSBzaWduYXR1cmUgc2NoZW1lLlxuICovXG5leHBvcnQgY2xhc3MgU0VDUE1pbnRPdXRwdXQgZXh0ZW5kcyBPdXRwdXQge1xuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJTRUNQTWludE91dHB1dFwiO1xuICBwcm90ZWN0ZWQgX3R5cGVJRCA9IEFWTUNvbnN0YW50cy5TRUNQTUlOVE9VVFBVVElEO1xuXG4gIC8vc2VyaWFsaXplIGFuZCBkZXNlcmlhbGl6ZSBib3RoIGFyZSBpbmhlcml0ZWRcblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgb3V0cHV0SUQgZm9yIHRoaXMgb3V0cHV0XG4gICAqL1xuICBnZXRPdXRwdXRJRCgpOm51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX3R5cGVJRDtcbiAgfVxuXG4gIC8qKlxuICAgKiBcbiAgICogQHBhcmFtIGFzc2V0SUQgQW4gYXNzZXRJRCB3aGljaCBpcyB3cmFwcGVkIGFyb3VuZCB0aGUgQnVmZmVyIG9mIHRoZSBPdXRwdXRcbiAgICovXG4gIG1ha2VUcmFuc2ZlcmFibGUoYXNzZXRJRDpCdWZmZXIpOlRyYW5zZmVyYWJsZU91dHB1dCB7XG4gICAgcmV0dXJuIG5ldyBUcmFuc2ZlcmFibGVPdXRwdXQoYXNzZXRJRCwgdGhpcyk7XG4gIH1cblxuICBjcmVhdGUoLi4uYXJnczphbnlbXSk6dGhpc3tcbiAgICByZXR1cm4gbmV3IFNFQ1BNaW50T3V0cHV0KC4uLmFyZ3MpIGFzIHRoaXM7XG4gIH1cblxuICBjbG9uZSgpOnRoaXMge1xuICAgIGNvbnN0IG5ld291dDpTRUNQTWludE91dHB1dCA9IHRoaXMuY3JlYXRlKClcbiAgICBuZXdvdXQuZnJvbUJ1ZmZlcih0aGlzLnRvQnVmZmVyKCkpO1xuICAgIHJldHVybiBuZXdvdXQgYXMgdGhpcztcbiAgfVxuXG4gIHNlbGVjdChpZDpudW1iZXIsIC4uLmFyZ3M6IGFueVtdKTpPdXRwdXQge1xuICAgIHJldHVybiBTZWxlY3RPdXRwdXRDbGFzcyhpZCwgLi4uYXJncyk7XG4gIH1cblxufVxuXG4vKipcbiAqIEFuIFtbT3V0cHV0XV0gY2xhc3Mgd2hpY2ggc3BlY2lmaWVzIGFuIE91dHB1dCB0aGF0IGNhcnJpZXMgYW4gTkZUIE1pbnQgYW5kIHVzZXMgc2VjcDI1NmsxIHNpZ25hdHVyZSBzY2hlbWUuXG4gKi9cbmV4cG9ydCBjbGFzcyBORlRNaW50T3V0cHV0IGV4dGVuZHMgTkZUT3V0cHV0IHtcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiTkZUTWludE91dHB1dFwiO1xuICBwcm90ZWN0ZWQgX3R5cGVJRCA9IEFWTUNvbnN0YW50cy5ORlRNSU5UT1VUUFVUSUQ7XG5cbiAgLy9zZXJpYWxpemUgYW5kIGRlc2VyaWFsaXplIGJvdGggYXJlIGluaGVyaXRlZFxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBvdXRwdXRJRCBmb3IgdGhpcyBvdXRwdXRcbiAgICovXG4gIGdldE91dHB1dElEKCk6bnVtYmVyIHtcbiAgICAgIHJldHVybiB0aGlzLl90eXBlSUQ7XG4gIH1cblxuICAvKipcbiAgICogUG9wdWF0ZXMgdGhlIGluc3RhbmNlIGZyb20gYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSByZXByZXNlbnRpbmcgdGhlIFtbTkZUTWludE91dHB1dF1dIGFuZCByZXR1cm5zIHRoZSBzaXplIG9mIHRoZSBvdXRwdXQuXG4gICAqL1xuICBmcm9tQnVmZmVyKHV0eG9idWZmOkJ1ZmZlciwgb2Zmc2V0Om51bWJlciA9IDApOm51bWJlciB7XG4gICAgICB0aGlzLmdyb3VwSUQgPSBiaW50b29scy5jb3B5RnJvbSh1dHhvYnVmZiwgb2Zmc2V0LCBvZmZzZXQgKyA0KTtcbiAgICAgIG9mZnNldCArPSA0O1xuICAgICAgcmV0dXJuIHN1cGVyLmZyb21CdWZmZXIodXR4b2J1ZmYsIG9mZnNldCk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgYnVmZmVyIHJlcHJlc2VudGluZyB0aGUgW1tORlRNaW50T3V0cHV0XV0gaW5zdGFuY2UuXG4gICAqL1xuICB0b0J1ZmZlcigpOkJ1ZmZlciB7XG4gICAgICBsZXQgc3VwZXJidWZmOkJ1ZmZlciA9IHN1cGVyLnRvQnVmZmVyKCk7XG4gICAgICBsZXQgYnNpemU6bnVtYmVyID0gdGhpcy5ncm91cElELmxlbmd0aCArIHN1cGVyYnVmZi5sZW5ndGg7XG4gICAgICBsZXQgYmFycjpBcnJheTxCdWZmZXI+ID0gW3RoaXMuZ3JvdXBJRCwgc3VwZXJidWZmXTtcbiAgICAgIHJldHVybiBCdWZmZXIuY29uY2F0KGJhcnIsYnNpemUpO1xuICB9XG5cbiAgY3JlYXRlKC4uLmFyZ3M6YW55W10pOnRoaXN7XG4gICAgICByZXR1cm4gbmV3IE5GVE1pbnRPdXRwdXQoLi4uYXJncykgYXMgdGhpcztcbiAgfVxuXG4gIGNsb25lKCk6dGhpcyB7XG4gICAgICBjb25zdCBuZXdvdXQ6TkZUTWludE91dHB1dCA9IHRoaXMuY3JlYXRlKCk7XG4gICAgICBuZXdvdXQuZnJvbUJ1ZmZlcih0aGlzLnRvQnVmZmVyKCkpO1xuICAgICAgcmV0dXJuIG5ld291dCBhcyB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIEFuIFtbT3V0cHV0XV0gY2xhc3Mgd2hpY2ggY29udGFpbnMgYW4gTkZUIG1pbnQgZm9yIGFuIGFzc2V0SUQuXG4gICAqIFxuICAgKiBAcGFyYW0gZ3JvdXBJRCBBIG51bWJlciBzcGVjaWZpZXMgdGhlIGdyb3VwIHRoaXMgTkZUIGlzIGlzc3VlZCB0b1xuICAgKiBAcGFyYW0gbG9ja3RpbWUgQSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfSByZXByZXNlbnRpbmcgdGhlIGxvY2t0aW1lXG4gICAqIEBwYXJhbSB0aHJlc2hvbGQgQSBudW1iZXIgcmVwcmVzZW50aW5nIHRoZSB0aGUgdGhyZXNob2xkIG51bWJlciBvZiBzaWduZXJzIHJlcXVpcmVkIHRvIHNpZ24gdGhlIHRyYW5zYWN0aW9uXG4gICAqIEBwYXJhbSBhZGRyZXNzZXMgQW4gYXJyYXkgb2Yge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn1zIHJlcHJlc2VudGluZyBhZGRyZXNzZXNcbiAgICovXG4gIGNvbnN0cnVjdG9yKGdyb3VwSUQ6bnVtYmVyID0gdW5kZWZpbmVkLCBhZGRyZXNzZXM6QXJyYXk8QnVmZmVyPiA9IHVuZGVmaW5lZCwgbG9ja3RpbWU6Qk4gPSB1bmRlZmluZWQsIHRocmVzaG9sZDpudW1iZXIgPSB1bmRlZmluZWQpe1xuICAgICAgc3VwZXIoYWRkcmVzc2VzLCBsb2NrdGltZSwgdGhyZXNob2xkKTtcbiAgICAgIGlmKHR5cGVvZiBncm91cElEICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgIHRoaXMuZ3JvdXBJRC53cml0ZVVJbnQzMkJFKGdyb3VwSUQsIDApO1xuICAgICAgfVxuICB9XG59XG5cbi8qKlxuICogQW4gW1tPdXRwdXRdXSBjbGFzcyB3aGljaCBzcGVjaWZpZXMgYW4gT3V0cHV0IHRoYXQgY2FycmllcyBhbiBORlQgYW5kIHVzZXMgc2VjcDI1NmsxIHNpZ25hdHVyZSBzY2hlbWUuXG4gKi9cbmV4cG9ydCBjbGFzcyBORlRUcmFuc2Zlck91dHB1dCBleHRlbmRzIE5GVE91dHB1dCB7XG4gIHByb3RlY3RlZCBfdHlwZU5hbWUgPSBcIk5GVFRyYW5zZmVyT3V0cHV0XCI7XG4gIHByb3RlY3RlZCBfdHlwZUlEID0gQVZNQ29uc3RhbnRzLk5GVFhGRVJPVVRQVVRJRDtcblxuICBzZXJpYWxpemUoZW5jb2Rpbmc6U2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIik6b2JqZWN0IHtcbiAgICBsZXQgZmllbGRzOm9iamVjdCA9IHN1cGVyLnNlcmlhbGl6ZShlbmNvZGluZyk7XG4gICAgcmV0dXJuIHtcbiAgICAgIC4uLmZpZWxkcyxcbiAgICAgIFwicGF5bG9hZFwiOiBzZXJpYWxpemVyLmVuY29kZXIodGhpcy5wYXlsb2FkLCBlbmNvZGluZywgXCJCdWZmZXJcIiwgXCJoZXhcIiwgdGhpcy5wYXlsb2FkLmxlbmd0aClcbiAgICB9XG4gIH07XG4gIGRlc2VyaWFsaXplKGZpZWxkczpvYmplY3QsIGVuY29kaW5nOlNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpIHtcbiAgICBzdXBlci5kZXNlcmlhbGl6ZShmaWVsZHMsIGVuY29kaW5nKTtcbiAgICB0aGlzLnBheWxvYWQgPSBzZXJpYWxpemVyLmRlY29kZXIoZmllbGRzW1wicGF5bG9hZFwiXSwgZW5jb2RpbmcsIFwiaGV4XCIsIFwiQnVmZmVyXCIpO1xuICAgIHRoaXMuc2l6ZVBheWxvYWQgPSBCdWZmZXIuYWxsb2MoNCk7XG4gICAgdGhpcy5zaXplUGF5bG9hZC53cml0ZVVJbnQzMkJFKHRoaXMucGF5bG9hZC5sZW5ndGgsIDApO1xuICB9XG5cbiAgcHJvdGVjdGVkIHNpemVQYXlsb2FkOkJ1ZmZlciA9IEJ1ZmZlci5hbGxvYyg0KTtcbiAgcHJvdGVjdGVkIHBheWxvYWQ6QnVmZmVyO1xuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBvdXRwdXRJRCBmb3IgdGhpcyBvdXRwdXRcbiAgICovXG4gIGdldE91dHB1dElEKCk6bnVtYmVyIHtcbiAgICAgIHJldHVybiB0aGlzLl90eXBlSUQ7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgcGF5bG9hZCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHdpdGggY29udGVudCBvbmx5LlxuICAgKi9cbiAgZ2V0UGF5bG9hZCA9ICgpOkJ1ZmZlciA9PiAgYmludG9vbHMuY29weUZyb20odGhpcy5wYXlsb2FkKTtcblxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBwYXlsb2FkIGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gd2l0aCBsZW5ndGggb2YgcGF5bG9hZCBwcmVwZW5kZWQuXG4gICAqL1xuICBnZXRQYXlsb2FkQnVmZmVyID0gKCk6QnVmZmVyID0+IEJ1ZmZlci5jb25jYXQoW2JpbnRvb2xzLmNvcHlGcm9tKHRoaXMuc2l6ZVBheWxvYWQpLCBiaW50b29scy5jb3B5RnJvbSh0aGlzLnBheWxvYWQpXSk7XG5cblxuICAvKipcbiAgICogUG9wdWF0ZXMgdGhlIGluc3RhbmNlIGZyb20gYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSByZXByZXNlbnRpbmcgdGhlIFtbTkZUVHJhbnNmZXJPdXRwdXRdXSBhbmQgcmV0dXJucyB0aGUgc2l6ZSBvZiB0aGUgb3V0cHV0LlxuICAgKi9cbiAgZnJvbUJ1ZmZlcih1dHhvYnVmZjpCdWZmZXIsIG9mZnNldDpudW1iZXIgPSAwKTpudW1iZXIge1xuICAgICAgdGhpcy5ncm91cElEID0gYmludG9vbHMuY29weUZyb20odXR4b2J1ZmYsIG9mZnNldCwgb2Zmc2V0ICsgNCk7XG4gICAgICBvZmZzZXQgKz0gNDtcbiAgICAgIHRoaXMuc2l6ZVBheWxvYWQgPSBiaW50b29scy5jb3B5RnJvbSh1dHhvYnVmZiwgb2Zmc2V0LCBvZmZzZXQgKyA0KTtcbiAgICAgIGxldCBwc2l6ZTpudW1iZXIgPSB0aGlzLnNpemVQYXlsb2FkLnJlYWRVSW50MzJCRSgwKTtcbiAgICAgIG9mZnNldCArPSA0O1xuICAgICAgdGhpcy5wYXlsb2FkID0gYmludG9vbHMuY29weUZyb20odXR4b2J1ZmYsIG9mZnNldCwgb2Zmc2V0ICsgcHNpemUpO1xuICAgICAgb2Zmc2V0ID0gb2Zmc2V0ICsgcHNpemU7XG4gICAgICByZXR1cm4gc3VwZXIuZnJvbUJ1ZmZlcih1dHhvYnVmZiwgb2Zmc2V0KTtcbiAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgYnVmZmVyIHJlcHJlc2VudGluZyB0aGUgW1tORlRUcmFuc2Zlck91dHB1dF1dIGluc3RhbmNlLlxuICAgICAqL1xuICB0b0J1ZmZlcigpOkJ1ZmZlciB7XG4gICAgY29uc3Qgc3VwZXJidWZmOkJ1ZmZlciA9IHN1cGVyLnRvQnVmZmVyKCk7XG4gICAgY29uc3QgYnNpemU6bnVtYmVyID0gdGhpcy5ncm91cElELmxlbmd0aCArIHRoaXMuc2l6ZVBheWxvYWQubGVuZ3RoICsgdGhpcy5wYXlsb2FkLmxlbmd0aCArIHN1cGVyYnVmZi5sZW5ndGg7XG4gICAgdGhpcy5zaXplUGF5bG9hZC53cml0ZVVJbnQzMkJFKHRoaXMucGF5bG9hZC5sZW5ndGgsIDApO1xuICAgIGNvbnN0IGJhcnI6QXJyYXk8QnVmZmVyPiA9IFt0aGlzLmdyb3VwSUQsIHRoaXMuc2l6ZVBheWxvYWQsIHRoaXMucGF5bG9hZCwgc3VwZXJidWZmXTtcbiAgICByZXR1cm4gQnVmZmVyLmNvbmNhdChiYXJyLCBic2l6ZSk7XG4gIH1cblxuICBjcmVhdGUoLi4uYXJnczphbnlbXSk6dGhpc3tcbiAgICByZXR1cm4gbmV3IE5GVFRyYW5zZmVyT3V0cHV0KC4uLmFyZ3MpIGFzIHRoaXM7XG4gIH1cblxuICBjbG9uZSgpOnRoaXMge1xuICAgIGNvbnN0IG5ld291dDpORlRUcmFuc2Zlck91dHB1dCA9IHRoaXMuY3JlYXRlKClcbiAgICBuZXdvdXQuZnJvbUJ1ZmZlcih0aGlzLnRvQnVmZmVyKCkpO1xuICAgIHJldHVybiBuZXdvdXQgYXMgdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgICAqIEFuIFtbT3V0cHV0XV0gY2xhc3Mgd2hpY2ggY29udGFpbnMgYW4gTkZUIG9uIGFuIGFzc2V0SUQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZ3JvdXBJRCBBIG51bWJlciByZXByZXNlbnRpbmcgdGhlIGFtb3VudCBpbiB0aGUgb3V0cHV0XG4gICAgICogQHBhcmFtIHBheWxvYWQgQSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBvZiBtYXggbGVuZ3RoIDEwMjQgXG4gICAgICogQHBhcmFtIGFkZHJlc3NlcyBBbiBhcnJheSBvZiB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfXMgcmVwcmVzZW50aW5nIGFkZHJlc3Nlc1xuICAgICAqIEBwYXJhbSBsb2NrdGltZSBBIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59IHJlcHJlc2VudGluZyB0aGUgbG9ja3RpbWVcbiAgICAgKiBAcGFyYW0gdGhyZXNob2xkIEEgbnVtYmVyIHJlcHJlc2VudGluZyB0aGUgdGhlIHRocmVzaG9sZCBudW1iZXIgb2Ygc2lnbmVycyByZXF1aXJlZCB0byBzaWduIHRoZSB0cmFuc2FjdGlvblxuXG4gICAgICovXG4gIGNvbnN0cnVjdG9yKGdyb3VwSUQ6bnVtYmVyID0gdW5kZWZpbmVkLCBwYXlsb2FkOkJ1ZmZlciA9IHVuZGVmaW5lZCwgYWRkcmVzc2VzOkFycmF5PEJ1ZmZlcj4gPSB1bmRlZmluZWQsIGxvY2t0aW1lOkJOID0gdW5kZWZpbmVkLCB0aHJlc2hvbGQ6bnVtYmVyID0gdW5kZWZpbmVkLCApIHtcbiAgICBzdXBlcihhZGRyZXNzZXMsIGxvY2t0aW1lLCB0aHJlc2hvbGQpO1xuICAgIGlmICh0eXBlb2YgZ3JvdXBJRCAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIHBheWxvYWQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICB0aGlzLmdyb3VwSUQud3JpdGVVSW50MzJCRShncm91cElELCAwKTtcbiAgICAgIHRoaXMuc2l6ZVBheWxvYWQud3JpdGVVSW50MzJCRShwYXlsb2FkLmxlbmd0aCwgMCk7XG4gICAgICB0aGlzLnBheWxvYWQgPSBiaW50b29scy5jb3B5RnJvbShwYXlsb2FkLCAwLCBwYXlsb2FkLmxlbmd0aCk7XG4gICAgfVxuICB9XG59XG4iXX0=