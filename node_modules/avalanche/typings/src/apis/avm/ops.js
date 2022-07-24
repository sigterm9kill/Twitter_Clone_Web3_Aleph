"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UTXOID = exports.NFTTransferOperation = exports.NFTMintOperation = exports.SECPMintOperation = exports.TransferableOperation = exports.Operation = exports.SelectOperationClass = void 0;
/**
 * @packageDocumentation
 * @module API-AVM-Operations
 */
const buffer_1 = require("buffer/");
const bintools_1 = __importDefault(require("../../utils/bintools"));
const constants_1 = require("./constants");
const outputs_1 = require("./outputs");
const nbytes_1 = require("../../common/nbytes");
const credentials_1 = require("../../common/credentials");
const output_1 = require("../../common/output");
const serialization_1 = require("../../utils/serialization");
const bintools = bintools_1.default.getInstance();
const serializer = serialization_1.Serialization.getInstance();
/**
 * Takes a buffer representing the output and returns the proper [[Operation]] instance.
 *
 * @param opid A number representing the operation ID parsed prior to the bytes passed in
 *
 * @returns An instance of an [[Operation]]-extended class.
 */
exports.SelectOperationClass = (opid, ...args) => {
    if (opid == constants_1.AVMConstants.SECPMINTOPID) {
        return new SECPMintOperation(...args);
    }
    else if (opid == constants_1.AVMConstants.NFTMINTOPID) {
        return new NFTMintOperation(...args);
    }
    else if (opid == constants_1.AVMConstants.NFTXFEROPID) {
        return new NFTTransferOperation(...args);
    }
    /* istanbul ignore next */
    throw new Error("Error - SelectOperationClass: unknown opid " + opid);
};
/**
 * A class representing an operation. All operation types must extend on this class.
 */
class Operation extends serialization_1.Serializable {
    constructor() {
        super(...arguments);
        this._typeName = "Operation";
        this._typeID = undefined;
        this.sigCount = buffer_1.Buffer.alloc(4);
        this.sigIdxs = []; // idxs of signers from utxo
        /**
           * Returns the array of [[SigIdx]] for this [[Operation]]
           */
        this.getSigIdxs = () => this.sigIdxs;
        /**
           * Creates and adds a [[SigIdx]] to the [[Operation]].
           *
           * @param addressIdx The index of the address to reference in the signatures
           * @param address The address of the source of the signature
           */
        this.addSignatureIdx = (addressIdx, address) => {
            const sigidx = new credentials_1.SigIdx();
            const b = buffer_1.Buffer.alloc(4);
            b.writeUInt32BE(addressIdx, 0);
            sigidx.fromBuffer(b);
            sigidx.setSource(address);
            this.sigIdxs.push(sigidx);
            this.sigCount.writeUInt32BE(this.sigIdxs.length, 0);
        };
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { "sigIdxs": this.sigIdxs.map((s) => s.serialize(encoding)) });
    }
    ;
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.sigIdxs = fields["sigIdxs"].map((s) => {
            let sidx = new credentials_1.SigIdx();
            sidx.deserialize(s, encoding);
            return sidx;
        });
        this.sigCount.writeUInt32BE(this.sigIdxs.length, 0);
    }
    fromBuffer(bytes, offset = 0) {
        this.sigCount = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        const sigCount = this.sigCount.readUInt32BE(0);
        this.sigIdxs = [];
        for (let i = 0; i < sigCount; i++) {
            const sigidx = new credentials_1.SigIdx();
            const sigbuff = bintools.copyFrom(bytes, offset, offset + 4);
            sigidx.fromBuffer(sigbuff);
            offset += 4;
            this.sigIdxs.push(sigidx);
        }
        return offset;
    }
    toBuffer() {
        this.sigCount.writeUInt32BE(this.sigIdxs.length, 0);
        let bsize = this.sigCount.length;
        const barr = [this.sigCount];
        for (let i = 0; i < this.sigIdxs.length; i++) {
            const b = this.sigIdxs[i].toBuffer();
            barr.push(b);
            bsize += b.length;
        }
        return buffer_1.Buffer.concat(barr, bsize);
    }
    /**
     * Returns a base-58 string representing the [[NFTMintOperation]].
     */
    toString() {
        return bintools.bufferToB58(this.toBuffer());
    }
}
exports.Operation = Operation;
Operation.comparator = () => (a, b) => {
    const aoutid = buffer_1.Buffer.alloc(4);
    aoutid.writeUInt32BE(a.getOperationID(), 0);
    const abuff = a.toBuffer();
    const boutid = buffer_1.Buffer.alloc(4);
    boutid.writeUInt32BE(b.getOperationID(), 0);
    const bbuff = b.toBuffer();
    const asort = buffer_1.Buffer.concat([aoutid, abuff], aoutid.length + abuff.length);
    const bsort = buffer_1.Buffer.concat([boutid, bbuff], boutid.length + bbuff.length);
    return buffer_1.Buffer.compare(asort, bsort);
};
/**
 * A class which contains an [[Operation]] for transfers.
 *
 */
class TransferableOperation extends serialization_1.Serializable {
    constructor(assetid = undefined, utxoids = undefined, operation = undefined) {
        super();
        this._typeName = "TransferableOperation";
        this._typeID = undefined;
        this.assetid = buffer_1.Buffer.alloc(32);
        this.utxoIDs = [];
        /**
         * Returns the assetID as a {@link https://github.com/feross/buffer|Buffer}.
         */
        this.getAssetID = () => this.assetid;
        /**
         * Returns an array of UTXOIDs in this operation.
         */
        this.getUTXOIDs = () => this.utxoIDs;
        /**
         * Returns the operation
         */
        this.getOperation = () => this.operation;
        if (typeof assetid !== 'undefined' && assetid.length === constants_1.AVMConstants.ASSETIDLEN
            && operation instanceof Operation && typeof utxoids !== 'undefined'
            && Array.isArray(utxoids)) {
            this.assetid = assetid;
            this.operation = operation;
            for (let i = 0; i < utxoids.length; i++) {
                const utxoid = new UTXOID();
                if (typeof utxoids[i] === 'string') {
                    utxoid.fromString(utxoids[i]);
                }
                else if (utxoids[i] instanceof buffer_1.Buffer) {
                    utxoid.fromBuffer(utxoids[i]);
                }
                else if (utxoids[i] instanceof UTXOID) {
                    utxoid.fromString(utxoids[i].toString()); // clone
                }
                this.utxoIDs.push(utxoid);
            }
        }
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { "assetid": serializer.encoder(this.assetid, encoding, "Buffer", "cb58", 32), "utxoIDs": this.utxoIDs.map((u) => u.serialize(encoding)), "operation": this.operation.serialize(encoding) });
    }
    ;
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.assetid = serializer.decoder(fields["assetid"], encoding, "cb58", "Buffer", 32);
        this.utxoIDs = fields["utxoIDs"].map((u) => {
            let utxoid = new UTXOID();
            utxoid.deserialize(u, encoding);
            return utxoid;
        });
        this.operation = exports.SelectOperationClass(fields["operation"]["_typeID"]);
        this.operation.deserialize(fields["operation"], encoding);
    }
    fromBuffer(bytes, offset = 0) {
        this.assetid = bintools.copyFrom(bytes, offset, offset + 32);
        offset += 32;
        const numutxoIDs = bintools.copyFrom(bytes, offset, offset + 4).readUInt32BE(0);
        offset += 4;
        this.utxoIDs = [];
        for (let i = 0; i < numutxoIDs; i++) {
            const utxoid = new UTXOID();
            offset = utxoid.fromBuffer(bytes, offset);
            this.utxoIDs.push(utxoid);
        }
        const opid = bintools.copyFrom(bytes, offset, offset + 4).readUInt32BE(0);
        offset += 4;
        this.operation = exports.SelectOperationClass(opid);
        return this.operation.fromBuffer(bytes, offset);
    }
    toBuffer() {
        const numutxoIDs = buffer_1.Buffer.alloc(4);
        numutxoIDs.writeUInt32BE(this.utxoIDs.length, 0);
        let bsize = this.assetid.length + numutxoIDs.length;
        const barr = [this.assetid, numutxoIDs];
        this.utxoIDs = this.utxoIDs.sort(UTXOID.comparator());
        for (let i = 0; i < this.utxoIDs.length; i++) {
            const b = this.utxoIDs[i].toBuffer();
            barr.push(b);
            bsize += b.length;
        }
        const opid = buffer_1.Buffer.alloc(4);
        opid.writeUInt32BE(this.operation.getOperationID(), 0);
        barr.push(opid);
        bsize += opid.length;
        const b = this.operation.toBuffer();
        bsize += b.length;
        barr.push(b);
        return buffer_1.Buffer.concat(barr, bsize);
    }
}
exports.TransferableOperation = TransferableOperation;
/**
 * Returns a function used to sort an array of [[TransferableOperation]]s
 */
TransferableOperation.comparator = () => {
    return function (a, b) {
        return buffer_1.Buffer.compare(a.toBuffer(), b.toBuffer());
    };
};
/**
 * An [[Operation]] class which specifies a SECP256k1 Mint Op.
 */
class SECPMintOperation extends Operation {
    /**
     * An [[Operation]] class which mints new tokens on an assetID.
     *
     * @param mintOutput The [[SECPMintOutput]] that will be produced by this transaction.
     * @param transferOutput A [[SECPTransferOutput]] that will be produced from this minting operation.
     */
    constructor(mintOutput = undefined, transferOutput = undefined) {
        super();
        this._typeName = "SECPMintOperation";
        this._typeID = constants_1.AVMConstants.SECPMINTOPID;
        this.mintOutput = undefined;
        this.transferOutput = undefined;
        if (typeof mintOutput !== 'undefined') {
            this.mintOutput = mintOutput;
        }
        if (typeof transferOutput !== 'undefined') {
            this.transferOutput = transferOutput;
        }
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { "mintOutput": this.mintOutput.serialize(encoding), "transferOutputs": this.transferOutput.serialize(encoding) });
    }
    ;
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.mintOutput = new outputs_1.SECPMintOutput();
        this.mintOutput.deserialize(fields["mintOutput"], encoding);
        this.transferOutput = new outputs_1.SECPTransferOutput();
        this.transferOutput.deserialize(fields["transferOutputs"], encoding);
    }
    /**
     * Returns the operation ID.
     */
    getOperationID() {
        return this._typeID;
    }
    /**
     * Returns the credential ID.
     */
    getCredentialID() {
        return constants_1.AVMConstants.SECPCREDENTIAL;
    }
    /**
     * Returns the [[SECPMintOutput]] to be produced by this operation.
     */
    getMintOutput() {
        return this.mintOutput;
    }
    /**
     * Returns [[SECPTransferOutput]] to be produced by this operation.
     */
    getTransferOutput() {
        return this.transferOutput;
    }
    /**
     * Popuates the instance from a {@link https://github.com/feross/buffer|Buffer} representing the [[SECPMintOperation]] and returns the updated offset.
     */
    fromBuffer(bytes, offset = 0) {
        offset = super.fromBuffer(bytes, offset);
        this.mintOutput = new outputs_1.SECPMintOutput();
        offset = this.mintOutput.fromBuffer(bytes, offset);
        this.transferOutput = new outputs_1.SECPTransferOutput();
        offset = this.transferOutput.fromBuffer(bytes, offset);
        return offset;
    }
    /**
     * Returns the buffer representing the [[SECPMintOperation]] instance.
     */
    toBuffer() {
        let superbuff = super.toBuffer();
        let mintoutBuff = this.mintOutput.toBuffer();
        let transferOutBuff = this.transferOutput.toBuffer();
        let bsize = superbuff.length +
            mintoutBuff.length +
            transferOutBuff.length;
        let barr = [
            superbuff,
            mintoutBuff,
            transferOutBuff
        ];
        return buffer_1.Buffer.concat(barr, bsize);
    }
}
exports.SECPMintOperation = SECPMintOperation;
/**
 * An [[Operation]] class which specifies a NFT Mint Op.
 */
class NFTMintOperation extends Operation {
    /**
     * An [[Operation]] class which contains an NFT on an assetID.
     *
     * @param groupID The group to which to issue the NFT Output
     * @param payload A {@link https://github.com/feross/buffer|Buffer} of the NFT payload
     * @param outputOwners An array of outputOwners
     */
    constructor(groupID = undefined, payload = undefined, outputOwners = undefined) {
        super();
        this._typeName = "NFTMintOperation";
        this._typeID = constants_1.AVMConstants.NFTMINTOPID;
        this.groupID = buffer_1.Buffer.alloc(4);
        this.outputOwners = [];
        /**
         * Returns the payload.
         */
        this.getPayload = () => {
            return bintools.copyFrom(this.payload, 0);
        };
        /**
         * Returns the payload's raw {@link https://github.com/feross/buffer|Buffer} with length prepended, for use with [[PayloadBase]]'s fromBuffer
         */
        this.getPayloadBuffer = () => {
            let payloadlen = buffer_1.Buffer.alloc(4);
            payloadlen.writeUInt32BE(this.payload.length, 0);
            return buffer_1.Buffer.concat([payloadlen, bintools.copyFrom(this.payload, 0)]);
        };
        /**
         * Returns the outputOwners.
         */
        this.getOutputOwners = () => {
            return this.outputOwners;
        };
        if (typeof groupID !== 'undefined' && typeof payload !== 'undefined' && outputOwners.length) {
            this.groupID.writeUInt32BE((groupID ? groupID : 0), 0);
            this.payload = payload;
            this.outputOwners = outputOwners;
        }
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { "groupID": serializer.encoder(this.groupID, encoding, "Buffer", "decimalString", 4), "payload": serializer.encoder(this.payload, encoding, "Buffer", "hex"), "outputOwners": this.outputOwners.map((o) => o.serialize(encoding)) });
    }
    ;
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.groupID = serializer.decoder(fields["groupID"], encoding, "decimalString", "Buffer", 4);
        this.payload = serializer.decoder(fields["payload"], encoding, "hex", "Buffer");
        this.outputOwners = fields["outputOwners"].map((o) => {
            let oo = new output_1.OutputOwners();
            oo.deserialize(o, encoding);
            return oo;
        });
    }
    /**
     * Returns the operation ID.
     */
    getOperationID() {
        return this._typeID;
    }
    /**
     * Returns the credential ID.
     */
    getCredentialID() {
        return constants_1.AVMConstants.NFTCREDENTIAL;
    }
    /**
     * Popuates the instance from a {@link https://github.com/feross/buffer|Buffer} representing the [[NFTMintOperation]] and returns the updated offset.
     */
    fromBuffer(bytes, offset = 0) {
        offset = super.fromBuffer(bytes, offset);
        this.groupID = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        let payloadLen = bintools.copyFrom(bytes, offset, offset + 4).readUInt32BE(0);
        offset += 4;
        this.payload = bintools.copyFrom(bytes, offset, offset + payloadLen);
        offset += payloadLen;
        let numoutputs = bintools.copyFrom(bytes, offset, offset + 4).readUInt32BE(0);
        offset += 4;
        this.outputOwners = [];
        for (let i = 0; i < numoutputs; i++) {
            let outputOwner = new output_1.OutputOwners();
            offset = outputOwner.fromBuffer(bytes, offset);
            this.outputOwners.push(outputOwner);
        }
        return offset;
    }
    /**
     * Returns the buffer representing the [[NFTMintOperation]] instance.
     */
    toBuffer() {
        let superbuff = super.toBuffer();
        let payloadlen = buffer_1.Buffer.alloc(4);
        payloadlen.writeUInt32BE(this.payload.length, 0);
        let outputownerslen = buffer_1.Buffer.alloc(4);
        outputownerslen.writeUInt32BE(this.outputOwners.length, 0);
        let bsize = superbuff.length +
            this.groupID.length +
            payloadlen.length +
            this.payload.length +
            outputownerslen.length;
        let barr = [
            superbuff,
            this.groupID,
            payloadlen,
            this.payload,
            outputownerslen
        ];
        for (let i = 0; i < this.outputOwners.length; i++) {
            let b = this.outputOwners[i].toBuffer();
            barr.push(b);
            bsize += b.length;
        }
        return buffer_1.Buffer.concat(barr, bsize);
    }
    /**
     * Returns a base-58 string representing the [[NFTMintOperation]].
     */
    toString() {
        return bintools.bufferToB58(this.toBuffer());
    }
}
exports.NFTMintOperation = NFTMintOperation;
/**
 * A [[Operation]] class which specifies a NFT Transfer Op.
 */
class NFTTransferOperation extends Operation {
    /**
       * An [[Operation]] class which contains an NFT on an assetID.
       *
       * @param output An [[NFTTransferOutput]]
       */
    constructor(output = undefined) {
        super();
        this._typeName = "NFTTransferOperation";
        this._typeID = constants_1.AVMConstants.NFTXFEROPID;
        this.getOutput = () => this.output;
        if (typeof output !== 'undefined') {
            this.output = output;
        }
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { "output": this.output.serialize(encoding) });
    }
    ;
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.output = new outputs_1.NFTTransferOutput();
        this.output.deserialize(fields["output"], encoding);
    }
    /**
     * Returns the operation ID.
     */
    getOperationID() {
        return this._typeID;
    }
    /**
     * Returns the credential ID.
     */
    getCredentialID() {
        return constants_1.AVMConstants.NFTCREDENTIAL;
    }
    /**
       * Popuates the instance from a {@link https://github.com/feross/buffer|Buffer} representing the [[NFTTransferOperation]] and returns the updated offset.
       */
    fromBuffer(bytes, offset = 0) {
        offset = super.fromBuffer(bytes, offset);
        this.output = new outputs_1.NFTTransferOutput();
        return this.output.fromBuffer(bytes, offset);
    }
    /**
       * Returns the buffer representing the [[NFTTransferOperation]] instance.
       */
    toBuffer() {
        const superbuff = super.toBuffer();
        const outbuff = this.output.toBuffer();
        const bsize = superbuff.length + outbuff.length;
        const barr = [superbuff, outbuff];
        return buffer_1.Buffer.concat(barr, bsize);
    }
    /**
       * Returns a base-58 string representing the [[NFTTransferOperation]].
       */
    toString() {
        return bintools.bufferToB58(this.toBuffer());
    }
}
exports.NFTTransferOperation = NFTTransferOperation;
/**
 * CKC - Make generic, use everywhere.
 */
/**
 * Class for representing a UTXOID used in [[TransferableOp]] types
 */
class UTXOID extends nbytes_1.NBytes {
    /**
       * Class for representing a UTXOID used in [[TransferableOp]] types
       */
    constructor() {
        super();
        this._typeName = "UTXOID";
        this._typeID = undefined;
        //serialize and deserialize both are inherited
        this.bytes = buffer_1.Buffer.alloc(36);
        this.bsize = 36;
    }
    /**
       * Returns a base-58 representation of the [[UTXOID]].
       */
    toString() {
        return bintools.cb58Encode(this.toBuffer());
    }
    /**
       * Takes a base-58 string containing an [[UTXOID]], parses it, populates the class, and returns the length of the UTXOID in bytes.
       *
       * @param bytes A base-58 string containing a raw [[UTXOID]]
       *
       * @returns The length of the raw [[UTXOID]]
       */
    fromString(utxoid) {
        const utxoidbuff = bintools.b58ToBuffer(utxoid);
        if (utxoidbuff.length === 40 && bintools.validateChecksum(utxoidbuff)) {
            const newbuff = bintools.copyFrom(utxoidbuff, 0, utxoidbuff.length - 4);
            if (newbuff.length === 36) {
                this.bytes = newbuff;
            }
        }
        else if (utxoidbuff.length === 40) {
            throw new Error('Error - UTXOID.fromString: invalid checksum on address');
        }
        else if (utxoidbuff.length === 36) {
            this.bytes = utxoidbuff;
        }
        else {
            /* istanbul ignore next */
            throw new Error('Error - UTXOID.fromString: invalid address');
        }
        return this.getSize();
    }
    clone() {
        let newbase = new UTXOID();
        newbase.fromBuffer(this.toBuffer());
        return newbase;
    }
    create(...args) {
        return new UTXOID();
    }
}
exports.UTXOID = UTXOID;
/**
   * Returns a function used to sort an array of [[UTXOID]]s
   */
UTXOID.comparator = () => (a, b) => buffer_1.Buffer.compare(a.toBuffer(), b.toBuffer());
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3BzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2FwaXMvYXZtL29wcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQTs7O0dBR0c7QUFDSCxvQ0FBaUM7QUFDakMsb0VBQTRDO0FBQzVDLDJDQUEyQztBQUMzQyx1Q0FBa0Y7QUFDbEYsZ0RBQTZDO0FBQzdDLDBEQUFrRDtBQUNsRCxnREFBbUQ7QUFDbkQsNkRBQTRGO0FBRzVGLE1BQU0sUUFBUSxHQUFHLGtCQUFRLENBQUMsV0FBVyxFQUFFLENBQUM7QUFDeEMsTUFBTSxVQUFVLEdBQUcsNkJBQWEsQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUUvQzs7Ozs7O0dBTUc7QUFDVSxRQUFBLG9CQUFvQixHQUFHLENBQUMsSUFBVyxFQUFFLEdBQUcsSUFBZSxFQUFZLEVBQUU7SUFDOUUsSUFBRyxJQUFJLElBQUksd0JBQVksQ0FBQyxZQUFZLEVBQUU7UUFDcEMsT0FBTyxJQUFJLGlCQUFpQixDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUM7S0FDdkM7U0FBTSxJQUFHLElBQUksSUFBSSx3QkFBWSxDQUFDLFdBQVcsRUFBQztRQUN6QyxPQUFPLElBQUksZ0JBQWdCLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQztLQUN0QztTQUFNLElBQUcsSUFBSSxJQUFJLHdCQUFZLENBQUMsV0FBVyxFQUFDO1FBQ3pDLE9BQU8sSUFBSSxvQkFBb0IsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDO0tBQzFDO0lBQ0QsMEJBQTBCO0lBQzFCLE1BQU0sSUFBSSxLQUFLLENBQUMsNkNBQTZDLEdBQUcsSUFBSSxDQUFDLENBQUM7QUFDMUUsQ0FBQyxDQUFBO0FBRUQ7O0dBRUc7QUFDSCxNQUFzQixTQUFVLFNBQVEsNEJBQVk7SUFBcEQ7O1FBQ1ksY0FBUyxHQUFHLFdBQVcsQ0FBQztRQUN4QixZQUFPLEdBQUcsU0FBUyxDQUFDO1FBbUJwQixhQUFRLEdBQVUsZUFBTSxDQUFDLEtBQUssQ0FB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Q0FBYSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAcGFja2FnZURvY3VtZW50YXRpb25cbiAqIEBtb2R1bGUgQVBJLUFWTS1PcGVyYXRpb25zXG4gKi9cbmltcG9ydCB7IEJ1ZmZlciB9IGZyb20gJ2J1ZmZlci8nO1xuaW1wb3J0IEJpblRvb2xzIGZyb20gJy4uLy4uL3V0aWxzL2JpbnRvb2xzJztcbmltcG9ydCB7IEFWTUNvbnN0YW50cyB9IGZyb20gJy4vY29uc3RhbnRzJztcbmltcG9ydCB7IE5GVFRyYW5zZmVyT3V0cHV0LCBTRUNQTWludE91dHB1dCwgU0VDUFRyYW5zZmVyT3V0cHV0IH0gZnJvbSAnLi9vdXRwdXRzJztcbmltcG9ydCB7IE5CeXRlcyB9IGZyb20gJy4uLy4uL2NvbW1vbi9uYnl0ZXMnO1xuaW1wb3J0IHsgU2lnSWR4IH0gZnJvbSAnLi4vLi4vY29tbW9uL2NyZWRlbnRpYWxzJztcbmltcG9ydCB7IE91dHB1dE93bmVycyB9IGZyb20gJy4uLy4uL2NvbW1vbi9vdXRwdXQnO1xuaW1wb3J0IHsgU2VyaWFsaXphYmxlLCBTZXJpYWxpemF0aW9uLCBTZXJpYWxpemVkRW5jb2RpbmcgfSBmcm9tICcuLi8uLi91dGlscy9zZXJpYWxpemF0aW9uJztcbmltcG9ydCB7IG9mZiB9IGZyb20gJ3Byb2Nlc3MnO1xuXG5jb25zdCBiaW50b29scyA9IEJpblRvb2xzLmdldEluc3RhbmNlKCk7XG5jb25zdCBzZXJpYWxpemVyID0gU2VyaWFsaXphdGlvbi5nZXRJbnN0YW5jZSgpO1xuXG4vKipcbiAqIFRha2VzIGEgYnVmZmVyIHJlcHJlc2VudGluZyB0aGUgb3V0cHV0IGFuZCByZXR1cm5zIHRoZSBwcm9wZXIgW1tPcGVyYXRpb25dXSBpbnN0YW5jZS5cbiAqXG4gKiBAcGFyYW0gb3BpZCBBIG51bWJlciByZXByZXNlbnRpbmcgdGhlIG9wZXJhdGlvbiBJRCBwYXJzZWQgcHJpb3IgdG8gdGhlIGJ5dGVzIHBhc3NlZCBpblxuICpcbiAqIEByZXR1cm5zIEFuIGluc3RhbmNlIG9mIGFuIFtbT3BlcmF0aW9uXV0tZXh0ZW5kZWQgY2xhc3MuXG4gKi9cbmV4cG9ydCBjb25zdCBTZWxlY3RPcGVyYXRpb25DbGFzcyA9IChvcGlkOm51bWJlciwgLi4uYXJnczpBcnJheTxhbnk+KTpPcGVyYXRpb24gPT4ge1xuICAgIGlmKG9waWQgPT0gQVZNQ29uc3RhbnRzLlNFQ1BNSU5UT1BJRCkge1xuICAgICAgcmV0dXJuIG5ldyBTRUNQTWludE9wZXJhdGlvbiguLi5hcmdzKTtcbiAgICB9IGVsc2UgaWYob3BpZCA9PSBBVk1Db25zdGFudHMuTkZUTUlOVE9QSUQpe1xuICAgICAgcmV0dXJuIG5ldyBORlRNaW50T3BlcmF0aW9uKC4uLmFyZ3MpO1xuICAgIH0gZWxzZSBpZihvcGlkID09IEFWTUNvbnN0YW50cy5ORlRYRkVST1BJRCl7XG4gICAgICByZXR1cm4gbmV3IE5GVFRyYW5zZmVyT3BlcmF0aW9uKC4uLmFyZ3MpO1xuICAgIH1cbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgIHRocm93IG5ldyBFcnJvcihcIkVycm9yIC0gU2VsZWN0T3BlcmF0aW9uQ2xhc3M6IHVua25vd24gb3BpZCBcIiArIG9waWQpO1xufVxuXG4vKipcbiAqIEEgY2xhc3MgcmVwcmVzZW50aW5nIGFuIG9wZXJhdGlvbi4gQWxsIG9wZXJhdGlvbiB0eXBlcyBtdXN0IGV4dGVuZCBvbiB0aGlzIGNsYXNzLlxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgT3BlcmF0aW9uIGV4dGVuZHMgU2VyaWFsaXphYmxle1xuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJPcGVyYXRpb25cIjtcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSB1bmRlZmluZWQ7XG5cbiAgc2VyaWFsaXplKGVuY29kaW5nOlNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpOm9iamVjdCB7XG4gICAgbGV0IGZpZWxkczpvYmplY3QgPSBzdXBlci5zZXJpYWxpemUoZW5jb2RpbmcpO1xuICAgIHJldHVybiB7XG4gICAgICAuLi5maWVsZHMsXG4gICAgICBcInNpZ0lkeHNcIjogdGhpcy5zaWdJZHhzLm1hcCgocykgPT4gcy5zZXJpYWxpemUoZW5jb2RpbmcpKVxuICAgIH1cbiAgfTtcbiAgZGVzZXJpYWxpemUoZmllbGRzOm9iamVjdCwgZW5jb2Rpbmc6U2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIikge1xuICAgIHN1cGVyLmRlc2VyaWFsaXplKGZpZWxkcywgZW5jb2RpbmcpO1xuICAgIHRoaXMuc2lnSWR4cyA9IGZpZWxkc1tcInNpZ0lkeHNcIl0ubWFwKChzOm9iamVjdCkgPT4ge1xuICAgICAgbGV0IHNpZHg6U2lnSWR4ID0gbmV3IFNpZ0lkeCgpO1xuICAgICAgc2lkeC5kZXNlcmlhbGl6ZShzLCBlbmNvZGluZyk7XG4gICAgICByZXR1cm4gc2lkeDtcbiAgICB9KTtcbiAgICB0aGlzLnNpZ0NvdW50LndyaXRlVUludDMyQkUodGhpcy5zaWdJZHhzLmxlbmd0aCwgMCk7XG4gIH1cblxuICBwcm90ZWN0ZWQgc2lnQ291bnQ6QnVmZmVyID0gQnVmZmVyLmFsbG9jKDQpO1xuICBwcm90ZWN0ZWQgc2lnSWR4czpBcnJheTxTaWdJZHg+ID0gW107IC8vIGlkeHMgb2Ygc2lnbmVycyBmcm9tIHV0eG9cblxuICBzdGF0aWMgY29tcGFyYXRvciA9ICgpOihhOk9wZXJhdGlvbiwgYjpPcGVyYXRpb24pID0+ICgxfC0xfDApID0+IChhOk9wZXJhdGlvbiwgYjpPcGVyYXRpb24pOigxfC0xfDApID0+IHtcbiAgICBjb25zdCBhb3V0aWQ6QnVmZmVyID0gQnVmZmVyLmFsbG9jKDQpO1xuICAgIGFvdXRpZC53cml0ZVVJbnQzMkJFKGEuZ2V0T3BlcmF0aW9uSUQoKSwgMCk7XG4gICAgY29uc3QgYWJ1ZmY6QnVmZmVyID0gYS50b0J1ZmZlcigpO1xuXG4gICAgY29uc3QgYm91dGlkOkJ1ZmZlciA9IEJ1ZmZlci5hbGxvYyg0KTtcbiAgICBib3V0aWQud3JpdGVVSW50MzJCRShiLmdldE9wZXJhdGlvbklEKCksIDApO1xuICAgIGNvbnN0IGJidWZmOkJ1ZmZlciA9IGIudG9CdWZmZXIoKTtcblxuICAgIGNvbnN0IGFzb3J0OkJ1ZmZlciA9IEJ1ZmZlci5jb25jYXQoW2FvdXRpZCwgYWJ1ZmZdLCBhb3V0aWQubGVuZ3RoICsgYWJ1ZmYubGVuZ3RoKTtcbiAgICBjb25zdCBic29ydDpCdWZmZXIgPSBCdWZmZXIuY29uY2F0KFtib3V0aWQsIGJidWZmXSwgYm91dGlkLmxlbmd0aCArIGJidWZmLmxlbmd0aCk7XG4gICAgcmV0dXJuIEJ1ZmZlci5jb21wYXJlKGFzb3J0LCBic29ydCkgYXMgKDF8LTF8MCk7XG4gIH07XG5cbiAgYWJzdHJhY3QgZ2V0T3BlcmF0aW9uSUQoKTpudW1iZXI7XG5cbiAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgYXJyYXkgb2YgW1tTaWdJZHhdXSBmb3IgdGhpcyBbW09wZXJhdGlvbl1dXG4gICAgICovXG4gIGdldFNpZ0lkeHMgPSAoKTpBcnJheTxTaWdJZHg+ID0+IHRoaXMuc2lnSWR4cztcblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgY3JlZGVudGlhbCBJRC5cbiAgICovXG4gIGFic3RyYWN0IGdldENyZWRlbnRpYWxJRCgpOm51bWJlcjtcblxuICAvKipcbiAgICAgKiBDcmVhdGVzIGFuZCBhZGRzIGEgW1tTaWdJZHhdXSB0byB0aGUgW1tPcGVyYXRpb25dXS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBhZGRyZXNzSWR4IFRoZSBpbmRleCBvZiB0aGUgYWRkcmVzcyB0byByZWZlcmVuY2UgaW4gdGhlIHNpZ25hdHVyZXNcbiAgICAgKiBAcGFyYW0gYWRkcmVzcyBUaGUgYWRkcmVzcyBvZiB0aGUgc291cmNlIG9mIHRoZSBzaWduYXR1cmVcbiAgICAgKi9cbiAgYWRkU2lnbmF0dXJlSWR4ID0gKGFkZHJlc3NJZHg6bnVtYmVyLCBhZGRyZXNzOkJ1ZmZlcikgPT4ge1xuICAgIGNvbnN0IHNpZ2lkeDpTaWdJZHggPSBuZXcgU2lnSWR4KCk7XG4gICAgY29uc3QgYjpCdWZmZXIgPSBCdWZmZXIuYWxsb2MoNCk7XG4gICAgYi53cml0ZVVJbnQzMkJFKGFkZHJlc3NJZHgsIDApO1xuICAgIHNpZ2lkeC5mcm9tQnVmZmVyKGIpO1xuICAgIHNpZ2lkeC5zZXRTb3VyY2UoYWRkcmVzcyk7XG4gICAgdGhpcy5zaWdJZHhzLnB1c2goc2lnaWR4KTtcbiAgICB0aGlzLnNpZ0NvdW50LndyaXRlVUludDMyQkUodGhpcy5zaWdJZHhzLmxlbmd0aCwgMCk7XG4gIH07XG5cbiAgZnJvbUJ1ZmZlcihieXRlczpCdWZmZXIsIG9mZnNldDpudW1iZXIgPSAwKTpudW1iZXIge1xuICAgIHRoaXMuc2lnQ291bnQgPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyA0KTtcbiAgICBvZmZzZXQgKz0gNDtcbiAgICBjb25zdCBzaWdDb3VudDpudW1iZXIgPSB0aGlzLnNpZ0NvdW50LnJlYWRVSW50MzJCRSgwKTtcbiAgICB0aGlzLnNpZ0lkeHMgPSBbXTtcbiAgICBmb3IgKGxldCBpOm51bWJlciA9IDA7IGkgPCBzaWdDb3VudDsgaSsrKSB7XG4gICAgICBjb25zdCBzaWdpZHg6U2lnSWR4ID0gbmV3IFNpZ0lkeCgpO1xuICAgICAgY29uc3Qgc2lnYnVmZjpCdWZmZXIgPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyA0KTtcbiAgICAgIHNpZ2lkeC5mcm9tQnVmZmVyKHNpZ2J1ZmYpO1xuICAgICAgb2Zmc2V0ICs9IDQ7XG4gICAgICB0aGlzLnNpZ0lkeHMucHVzaChzaWdpZHgpO1xuICAgIH1cbiAgICByZXR1cm4gb2Zmc2V0O1xuICB9XG5cbiAgdG9CdWZmZXIoKTpCdWZmZXIge1xuICAgIHRoaXMuc2lnQ291bnQud3JpdGVVSW50MzJCRSh0aGlzLnNpZ0lkeHMubGVuZ3RoLCAwKTtcbiAgICBsZXQgYnNpemU6bnVtYmVyID0gdGhpcy5zaWdDb3VudC5sZW5ndGg7XG4gICAgY29uc3QgYmFycjpBcnJheTxCdWZmZXI+ID0gW3RoaXMuc2lnQ291bnRdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5zaWdJZHhzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBiOkJ1ZmZlciA9IHRoaXMuc2lnSWR4c1tpXS50b0J1ZmZlcigpO1xuICAgICAgYmFyci5wdXNoKGIpO1xuICAgICAgYnNpemUgKz0gYi5sZW5ndGg7XG4gICAgfVxuICAgIHJldHVybiBCdWZmZXIuY29uY2F0KGJhcnIsIGJzaXplKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgYmFzZS01OCBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSBbW05GVE1pbnRPcGVyYXRpb25dXS5cbiAgICovXG4gIHRvU3RyaW5nKCk6c3RyaW5nIHtcbiAgICByZXR1cm4gYmludG9vbHMuYnVmZmVyVG9CNTgodGhpcy50b0J1ZmZlcigpKTtcbiAgfVxuXG59XG5cbi8qKlxuICogQSBjbGFzcyB3aGljaCBjb250YWlucyBhbiBbW09wZXJhdGlvbl1dIGZvciB0cmFuc2ZlcnMuXG4gKlxuICovXG5leHBvcnQgY2xhc3MgVHJhbnNmZXJhYmxlT3BlcmF0aW9uIGV4dGVuZHMgU2VyaWFsaXphYmxlIHtcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiVHJhbnNmZXJhYmxlT3BlcmF0aW9uXCI7XG4gIHByb3RlY3RlZCBfdHlwZUlEID0gdW5kZWZpbmVkO1xuXG4gIHNlcmlhbGl6ZShlbmNvZGluZzpTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKTpvYmplY3Qge1xuICAgIGxldCBmaWVsZHM6b2JqZWN0ID0gc3VwZXIuc2VyaWFsaXplKGVuY29kaW5nKTtcbiAgICByZXR1cm4ge1xuICAgICAgLi4uZmllbGRzLFxuICAgICAgXCJhc3NldGlkXCI6IHNlcmlhbGl6ZXIuZW5jb2Rlcih0aGlzLmFzc2V0aWQsIGVuY29kaW5nLCBcIkJ1ZmZlclwiLCBcImNiNThcIiwgMzIpLFxuICAgICAgXCJ1dHhvSURzXCI6IHRoaXMudXR4b0lEcy5tYXAoKHUpID0+IHUuc2VyaWFsaXplKGVuY29kaW5nKSksXG4gICAgICBcIm9wZXJhdGlvblwiOiB0aGlzLm9wZXJhdGlvbi5zZXJpYWxpemUoZW5jb2RpbmcpXG4gICAgfVxuICB9O1xuICBkZXNlcmlhbGl6ZShmaWVsZHM6b2JqZWN0LCBlbmNvZGluZzpTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKSB7XG4gICAgc3VwZXIuZGVzZXJpYWxpemUoZmllbGRzLCBlbmNvZGluZyk7XG4gICAgdGhpcy5hc3NldGlkID0gc2VyaWFsaXplci5kZWNvZGVyKGZpZWxkc1tcImFzc2V0aWRcIl0sIGVuY29kaW5nLCBcImNiNThcIiwgXCJCdWZmZXJcIiwgMzIpO1xuICAgIHRoaXMudXR4b0lEcyA9IGZpZWxkc1tcInV0eG9JRHNcIl0ubWFwKCh1Om9iamVjdCkgPT4ge1xuICAgICAgbGV0IHV0eG9pZDpVVFhPSUQgPSBuZXcgVVRYT0lEKCk7XG4gICAgICB1dHhvaWQuZGVzZXJpYWxpemUodSwgZW5jb2RpbmcpO1xuICAgICAgcmV0dXJuIHV0eG9pZDtcbiAgICB9KTtcbiAgICB0aGlzLm9wZXJhdGlvbiA9IFNlbGVjdE9wZXJhdGlvbkNsYXNzKGZpZWxkc1tcIm9wZXJhdGlvblwiXVtcIl90eXBlSURcIl0pO1xuICAgIHRoaXMub3BlcmF0aW9uLmRlc2VyaWFsaXplKGZpZWxkc1tcIm9wZXJhdGlvblwiXSwgZW5jb2RpbmcpO1xuICB9XG5cbiAgcHJvdGVjdGVkIGFzc2V0aWQ6QnVmZmVyID0gQnVmZmVyLmFsbG9jKDMyKTtcbiAgcHJvdGVjdGVkIHV0eG9JRHM6QXJyYXk8VVRYT0lEPiA9IFtdO1xuICBwcm90ZWN0ZWQgb3BlcmF0aW9uOk9wZXJhdGlvbjtcblxuICAvKipcbiAgICogUmV0dXJucyBhIGZ1bmN0aW9uIHVzZWQgdG8gc29ydCBhbiBhcnJheSBvZiBbW1RyYW5zZmVyYWJsZU9wZXJhdGlvbl1dc1xuICAgKi9cbiAgc3RhdGljIGNvbXBhcmF0b3IgPSAoKTooYTpUcmFuc2ZlcmFibGVPcGVyYXRpb24sIGI6VHJhbnNmZXJhYmxlT3BlcmF0aW9uKSA9PiAoMXwtMXwwKSA9PiB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24oYTpUcmFuc2ZlcmFibGVPcGVyYXRpb24sIGI6VHJhbnNmZXJhYmxlT3BlcmF0aW9uKTooMXwtMXwwKSB7IFxuICAgICAgICAgIHJldHVybiBCdWZmZXIuY29tcGFyZShhLnRvQnVmZmVyKCksIGIudG9CdWZmZXIoKSkgYXMgKDF8LTF8MCk7XG4gICAgICB9XG4gIH1cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGFzc2V0SUQgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfS5cbiAgICovXG4gIGdldEFzc2V0SUQgPSAoKTpCdWZmZXIgPT4gdGhpcy5hc3NldGlkO1xuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGFuIGFycmF5IG9mIFVUWE9JRHMgaW4gdGhpcyBvcGVyYXRpb24uXG4gICAqL1xuICBnZXRVVFhPSURzID0gKCk6QXJyYXk8VVRYT0lEPiA9PiB0aGlzLnV0eG9JRHM7XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIG9wZXJhdGlvblxuICAgKi9cbiAgZ2V0T3BlcmF0aW9uID0gKCk6T3BlcmF0aW9uID0+IHRoaXMub3BlcmF0aW9uO1xuXG4gIGZyb21CdWZmZXIoYnl0ZXM6QnVmZmVyLCBvZmZzZXQ6bnVtYmVyID0gMCk6bnVtYmVyIHtcbiAgICB0aGlzLmFzc2V0aWQgPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyAzMik7XG4gICAgb2Zmc2V0ICs9IDMyO1xuICAgIGNvbnN0IG51bXV0eG9JRHM6bnVtYmVyID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgNCkucmVhZFVJbnQzMkJFKDApO1xuICAgIG9mZnNldCArPSA0O1xuICAgIHRoaXMudXR4b0lEcyA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtdXR4b0lEczsgaSsrKSB7XG4gICAgICBjb25zdCB1dHhvaWQ6VVRYT0lEID0gbmV3IFVUWE9JRCgpO1xuICAgICAgb2Zmc2V0ID0gdXR4b2lkLmZyb21CdWZmZXIoYnl0ZXMsIG9mZnNldCk7XG4gICAgICB0aGlzLnV0eG9JRHMucHVzaCh1dHhvaWQpO1xuICAgIH1cbiAgICBjb25zdCBvcGlkOm51bWJlciA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDQpLnJlYWRVSW50MzJCRSgwKTtcbiAgICBvZmZzZXQgKz0gNDtcbiAgICB0aGlzLm9wZXJhdGlvbiA9IFNlbGVjdE9wZXJhdGlvbkNsYXNzKG9waWQpO1xuICAgIHJldHVybiB0aGlzLm9wZXJhdGlvbi5mcm9tQnVmZmVyKGJ5dGVzLCBvZmZzZXQpO1xuICB9XG5cbiAgdG9CdWZmZXIoKTpCdWZmZXIge1xuICAgIGNvbnN0IG51bXV0eG9JRHMgPSBCdWZmZXIuYWxsb2MoNCk7XG4gICAgbnVtdXR4b0lEcy53cml0ZVVJbnQzMkJFKHRoaXMudXR4b0lEcy5sZW5ndGgsIDApO1xuICAgIGxldCBic2l6ZTpudW1iZXIgPSB0aGlzLmFzc2V0aWQubGVuZ3RoICsgbnVtdXR4b0lEcy5sZW5ndGg7XG4gICAgY29uc3QgYmFycjpBcnJheTxCdWZmZXI+ID0gW3RoaXMuYXNzZXRpZCwgbnVtdXR4b0lEc107XG4gICAgdGhpcy51dHhvSURzID0gdGhpcy51dHhvSURzLnNvcnQoVVRYT0lELmNvbXBhcmF0b3IoKSk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnV0eG9JRHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGI6QnVmZmVyID0gdGhpcy51dHhvSURzW2ldLnRvQnVmZmVyKCk7XG4gICAgICBiYXJyLnB1c2goYik7XG4gICAgICBic2l6ZSArPSBiLmxlbmd0aDtcbiAgICB9XG4gICAgY29uc3Qgb3BpZDpCdWZmZXIgPSBCdWZmZXIuYWxsb2MoNCk7XG4gICAgb3BpZC53cml0ZVVJbnQzMkJFKHRoaXMub3BlcmF0aW9uLmdldE9wZXJhdGlvbklEKCksIDApO1xuICAgIGJhcnIucHVzaChvcGlkKTtcbiAgICBic2l6ZSArPSBvcGlkLmxlbmd0aDtcbiAgICBjb25zdCBiOkJ1ZmZlciA9IHRoaXMub3BlcmF0aW9uLnRvQnVmZmVyKCk7XG4gICAgYnNpemUgKz0gYi5sZW5ndGg7XG4gICAgYmFyci5wdXNoKGIpO1xuICAgIHJldHVybiBCdWZmZXIuY29uY2F0KGJhcnIsIGJzaXplKTtcbiAgfVxuXG4gIGNvbnN0cnVjdG9yKGFzc2V0aWQ6QnVmZmVyID0gdW5kZWZpbmVkLCB1dHhvaWRzOkFycmF5PFVUWE9JRHxzdHJpbmd8QnVmZmVyPiA9IHVuZGVmaW5lZCwgb3BlcmF0aW9uOk9wZXJhdGlvbiA9IHVuZGVmaW5lZCkge1xuICAgIHN1cGVyKCk7XG4gICAgaWYgKFxuICAgICAgdHlwZW9mIGFzc2V0aWQgIT09ICd1bmRlZmluZWQnICYmIGFzc2V0aWQubGVuZ3RoID09PSBBVk1Db25zdGFudHMuQVNTRVRJRExFTlxuICAgICAgICAgICAgJiYgb3BlcmF0aW9uIGluc3RhbmNlb2YgT3BlcmF0aW9uICYmIHR5cGVvZiB1dHhvaWRzICE9PSAndW5kZWZpbmVkJ1xuICAgICAgICAgICAgJiYgQXJyYXkuaXNBcnJheSh1dHhvaWRzKVxuICAgICkge1xuICAgICAgdGhpcy5hc3NldGlkID0gYXNzZXRpZDtcbiAgICAgIHRoaXMub3BlcmF0aW9uID0gb3BlcmF0aW9uO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB1dHhvaWRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IHV0eG9pZDpVVFhPSUQgPSBuZXcgVVRYT0lEKCk7XG4gICAgICAgIGlmICh0eXBlb2YgdXR4b2lkc1tpXSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICB1dHhvaWQuZnJvbVN0cmluZyh1dHhvaWRzW2ldIGFzIHN0cmluZyk7XG4gICAgICAgIH0gZWxzZSBpZiAodXR4b2lkc1tpXSBpbnN0YW5jZW9mIEJ1ZmZlcikge1xuICAgICAgICAgIHV0eG9pZC5mcm9tQnVmZmVyKHV0eG9pZHNbaV0gYXMgQnVmZmVyKTtcbiAgICAgICAgfSBlbHNlIGlmICh1dHhvaWRzW2ldIGluc3RhbmNlb2YgVVRYT0lEKSB7XG4gICAgICAgICAgdXR4b2lkLmZyb21TdHJpbmcodXR4b2lkc1tpXS50b1N0cmluZygpKTsgLy8gY2xvbmVcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnV0eG9JRHMucHVzaCh1dHhvaWQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEFuIFtbT3BlcmF0aW9uXV0gY2xhc3Mgd2hpY2ggc3BlY2lmaWVzIGEgU0VDUDI1NmsxIE1pbnQgT3AuXG4gKi9cbmV4cG9ydCBjbGFzcyBTRUNQTWludE9wZXJhdGlvbiBleHRlbmRzIE9wZXJhdGlvbiB7XG4gIHByb3RlY3RlZCBfdHlwZU5hbWUgPSBcIlNFQ1BNaW50T3BlcmF0aW9uXCI7XG4gIHByb3RlY3RlZCBfdHlwZUlEID0gQVZNQ29uc3RhbnRzLlNFQ1BNSU5UT1BJRDtcblxuICBzZXJpYWxpemUoZW5jb2Rpbmc6U2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIik6b2JqZWN0IHtcbiAgICBsZXQgZmllbGRzOm9iamVjdCA9IHN1cGVyLnNlcmlhbGl6ZShlbmNvZGluZyk7XG4gICAgcmV0dXJuIHtcbiAgICAgIC4uLmZpZWxkcyxcbiAgICAgIFwibWludE91dHB1dFwiOiB0aGlzLm1pbnRPdXRwdXQuc2VyaWFsaXplKGVuY29kaW5nKSxcbiAgICAgIFwidHJhbnNmZXJPdXRwdXRzXCI6IHRoaXMudHJhbnNmZXJPdXRwdXQuc2VyaWFsaXplKGVuY29kaW5nKVxuICAgIH1cbiAgfTtcbiAgZGVzZXJpYWxpemUoZmllbGRzOm9iamVjdCwgZW5jb2Rpbmc6U2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIikge1xuICAgIHN1cGVyLmRlc2VyaWFsaXplKGZpZWxkcywgZW5jb2RpbmcpO1xuICAgIHRoaXMubWludE91dHB1dCA9IG5ldyBTRUNQTWludE91dHB1dCgpO1xuICAgIHRoaXMubWludE91dHB1dC5kZXNlcmlhbGl6ZShmaWVsZHNbXCJtaW50T3V0cHV0XCJdLCBlbmNvZGluZyk7XG4gICAgdGhpcy50cmFuc2Zlck91dHB1dCA9IG5ldyBTRUNQVHJhbnNmZXJPdXRwdXQoKTtcbiAgICB0aGlzLnRyYW5zZmVyT3V0cHV0LmRlc2VyaWFsaXplKGZpZWxkc1tcInRyYW5zZmVyT3V0cHV0c1wiXSwgZW5jb2RpbmcpO1xuICB9XG5cbiAgcHJvdGVjdGVkIG1pbnRPdXRwdXQ6U0VDUE1pbnRPdXRwdXQgPSB1bmRlZmluZWQ7XG4gIHByb3RlY3RlZCB0cmFuc2Zlck91dHB1dDpTRUNQVHJhbnNmZXJPdXRwdXQgPSB1bmRlZmluZWQ7XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIG9wZXJhdGlvbiBJRC5cbiAgICovXG4gIGdldE9wZXJhdGlvbklEKCk6bnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fdHlwZUlEO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGNyZWRlbnRpYWwgSUQuXG4gICAqL1xuICBnZXRDcmVkZW50aWFsSUQoKTpudW1iZXIge1xuICAgIHJldHVybiBBVk1Db25zdGFudHMuU0VDUENSRURFTlRJQUw7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgW1tTRUNQTWludE91dHB1dF1dIHRvIGJlIHByb2R1Y2VkIGJ5IHRoaXMgb3BlcmF0aW9uLlxuICAgKi9cbiAgZ2V0TWludE91dHB1dCgpOlNFQ1BNaW50T3V0cHV0IHtcbiAgICByZXR1cm4gdGhpcy5taW50T3V0cHV0O1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgW1tTRUNQVHJhbnNmZXJPdXRwdXRdXSB0byBiZSBwcm9kdWNlZCBieSB0aGlzIG9wZXJhdGlvbi5cbiAgICovXG4gIGdldFRyYW5zZmVyT3V0cHV0KCk6U0VDUFRyYW5zZmVyT3V0cHV0IHtcbiAgICByZXR1cm4gdGhpcy50cmFuc2Zlck91dHB1dDtcbiAgfVxuXG4gIC8qKlxuICAgKiBQb3B1YXRlcyB0aGUgaW5zdGFuY2UgZnJvbSBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHJlcHJlc2VudGluZyB0aGUgW1tTRUNQTWludE9wZXJhdGlvbl1dIGFuZCByZXR1cm5zIHRoZSB1cGRhdGVkIG9mZnNldC5cbiAgICovXG4gIGZyb21CdWZmZXIoYnl0ZXM6QnVmZmVyLCBvZmZzZXQ6bnVtYmVyID0gMCk6bnVtYmVyIHtcbiAgICBvZmZzZXQgPSBzdXBlci5mcm9tQnVmZmVyKGJ5dGVzLCBvZmZzZXQpO1xuICAgIHRoaXMubWludE91dHB1dCA9IG5ldyBTRUNQTWludE91dHB1dCgpO1xuICAgIG9mZnNldCA9IHRoaXMubWludE91dHB1dC5mcm9tQnVmZmVyKGJ5dGVzLCBvZmZzZXQpO1xuICAgIHRoaXMudHJhbnNmZXJPdXRwdXQgPSBuZXcgU0VDUFRyYW5zZmVyT3V0cHV0KCk7XG4gICAgb2Zmc2V0ID0gdGhpcy50cmFuc2Zlck91dHB1dC5mcm9tQnVmZmVyKGJ5dGVzLCBvZmZzZXQpO1xuICAgIHJldHVybiBvZmZzZXQ7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgYnVmZmVyIHJlcHJlc2VudGluZyB0aGUgW1tTRUNQTWludE9wZXJhdGlvbl1dIGluc3RhbmNlLlxuICAgKi9cbiAgdG9CdWZmZXIoKTpCdWZmZXIge1xuICAgIGxldCBzdXBlcmJ1ZmY6QnVmZmVyID0gc3VwZXIudG9CdWZmZXIoKTtcbiAgICBsZXQgbWludG91dEJ1ZmY6QnVmZmVyID0gdGhpcy5taW50T3V0cHV0LnRvQnVmZmVyKCk7XG4gICAgbGV0IHRyYW5zZmVyT3V0QnVmZjpCdWZmZXIgPSB0aGlzLnRyYW5zZmVyT3V0cHV0LnRvQnVmZmVyKCk7XG4gICAgbGV0IGJzaXplOm51bWJlciA9IFxuICAgICAgc3VwZXJidWZmLmxlbmd0aCArIFxuICAgICAgbWludG91dEJ1ZmYubGVuZ3RoICsgXG4gICAgICB0cmFuc2Zlck91dEJ1ZmYubGVuZ3RoOyBcblxuICAgIGxldCBiYXJyOkFycmF5PEJ1ZmZlcj4gPSBbXG4gICAgICBzdXBlcmJ1ZmYsIFxuICAgICAgbWludG91dEJ1ZmYsXG4gICAgICB0cmFuc2Zlck91dEJ1ZmZcbiAgICBdO1xuXG4gICAgcmV0dXJuIEJ1ZmZlci5jb25jYXQoYmFycixic2l6ZSk7XG4gIH1cblxuICAvKipcbiAgICogQW4gW1tPcGVyYXRpb25dXSBjbGFzcyB3aGljaCBtaW50cyBuZXcgdG9rZW5zIG9uIGFuIGFzc2V0SUQuXG4gICAqIFxuICAgKiBAcGFyYW0gbWludE91dHB1dCBUaGUgW1tTRUNQTWludE91dHB1dF1dIHRoYXQgd2lsbCBiZSBwcm9kdWNlZCBieSB0aGlzIHRyYW5zYWN0aW9uLlxuICAgKiBAcGFyYW0gdHJhbnNmZXJPdXRwdXQgQSBbW1NFQ1BUcmFuc2Zlck91dHB1dF1dIHRoYXQgd2lsbCBiZSBwcm9kdWNlZCBmcm9tIHRoaXMgbWludGluZyBvcGVyYXRpb24uXG4gICAqL1xuICBjb25zdHJ1Y3RvcihtaW50T3V0cHV0OlNFQ1BNaW50T3V0cHV0ID0gdW5kZWZpbmVkLCB0cmFuc2Zlck91dHB1dDpTRUNQVHJhbnNmZXJPdXRwdXQgPSB1bmRlZmluZWQpe1xuICAgIHN1cGVyKCk7XG4gICAgaWYodHlwZW9mIG1pbnRPdXRwdXQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICB0aGlzLm1pbnRPdXRwdXQgPSBtaW50T3V0cHV0O1xuICAgIH0gXG4gICAgaWYodHlwZW9mIHRyYW5zZmVyT3V0cHV0ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICB0aGlzLnRyYW5zZmVyT3V0cHV0ID0gdHJhbnNmZXJPdXRwdXQ7XG4gICAgfVxuICB9XG5cbn1cblxuLyoqXG4gKiBBbiBbW09wZXJhdGlvbl1dIGNsYXNzIHdoaWNoIHNwZWNpZmllcyBhIE5GVCBNaW50IE9wLlxuICovXG5leHBvcnQgY2xhc3MgTkZUTWludE9wZXJhdGlvbiBleHRlbmRzIE9wZXJhdGlvbiB7XG4gIHByb3RlY3RlZCBfdHlwZU5hbWUgPSBcIk5GVE1pbnRPcGVyYXRpb25cIjtcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSBBVk1Db25zdGFudHMuTkZUTUlOVE9QSUQ7XG5cbiAgc2VyaWFsaXplKGVuY29kaW5nOlNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpOm9iamVjdCB7XG4gICAgbGV0IGZpZWxkczpvYmplY3QgPSBzdXBlci5zZXJpYWxpemUoZW5jb2RpbmcpO1xuICAgIHJldHVybiB7XG4gICAgICAuLi5maWVsZHMsXG4gICAgICBcImdyb3VwSURcIjogc2VyaWFsaXplci5lbmNvZGVyKHRoaXMuZ3JvdXBJRCwgZW5jb2RpbmcsIFwiQnVmZmVyXCIsIFwiZGVjaW1hbFN0cmluZ1wiLCA0KSxcbiAgICAgIFwicGF5bG9hZFwiOiBzZXJpYWxpemVyLmVuY29kZXIodGhpcy5wYXlsb2FkLCBlbmNvZGluZywgXCJCdWZmZXJcIiwgXCJoZXhcIiksXG4gICAgICBcIm91dHB1dE93bmVyc1wiOiB0aGlzLm91dHB1dE93bmVycy5tYXAoKG8pID0+IG8uc2VyaWFsaXplKGVuY29kaW5nKSlcbiAgICB9XG4gIH07XG4gIGRlc2VyaWFsaXplKGZpZWxkczpvYmplY3QsIGVuY29kaW5nOlNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpIHtcbiAgICBzdXBlci5kZXNlcmlhbGl6ZShmaWVsZHMsIGVuY29kaW5nKTtcbiAgICB0aGlzLmdyb3VwSUQgPSBzZXJpYWxpemVyLmRlY29kZXIoZmllbGRzW1wiZ3JvdXBJRFwiXSwgZW5jb2RpbmcsIFwiZGVjaW1hbFN0cmluZ1wiLCBcIkJ1ZmZlclwiLCA0KTtcbiAgICB0aGlzLnBheWxvYWQgPSBzZXJpYWxpemVyLmRlY29kZXIoZmllbGRzW1wicGF5bG9hZFwiXSwgZW5jb2RpbmcsIFwiaGV4XCIsIFwiQnVmZmVyXCIpO1xuICAgIHRoaXMub3V0cHV0T3duZXJzID0gZmllbGRzW1wib3V0cHV0T3duZXJzXCJdLm1hcCgobzpvYmplY3QpID0+IHtcbiAgICAgIGxldCBvbzpPdXRwdXRPd25lcnMgPSBuZXcgT3V0cHV0T3duZXJzKCk7XG4gICAgICBvby5kZXNlcmlhbGl6ZShvLCBlbmNvZGluZyk7XG4gICAgICByZXR1cm4gb287XG4gICAgfSk7XG4gIH1cblxuXG5cbiAgcHJvdGVjdGVkIGdyb3VwSUQ6QnVmZmVyID0gQnVmZmVyLmFsbG9jKDQpO1xuICBwcm90ZWN0ZWQgcGF5bG9hZDpCdWZmZXI7XG4gIHByb3RlY3RlZCBvdXRwdXRPd25lcnM6QXJyYXk8T3V0cHV0T3duZXJzPiA9IFtdO1xuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBvcGVyYXRpb24gSUQuXG4gICAqL1xuICBnZXRPcGVyYXRpb25JRCgpOm51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX3R5cGVJRDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBjcmVkZW50aWFsIElELlxuICAgKi9cbiAgZ2V0Q3JlZGVudGlhbElEKCk6bnVtYmVyIHtcbiAgICByZXR1cm4gQVZNQ29uc3RhbnRzLk5GVENSRURFTlRJQUw7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgcGF5bG9hZC5cbiAgICovXG4gIGdldFBheWxvYWQgPSAoKTpCdWZmZXIgPT4ge1xuICAgIHJldHVybiBiaW50b29scy5jb3B5RnJvbSh0aGlzLnBheWxvYWQsIDApO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIHBheWxvYWQncyByYXcge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gd2l0aCBsZW5ndGggcHJlcGVuZGVkLCBmb3IgdXNlIHdpdGggW1tQYXlsb2FkQmFzZV1dJ3MgZnJvbUJ1ZmZlclxuICAgKi9cbiAgZ2V0UGF5bG9hZEJ1ZmZlciA9ICgpOkJ1ZmZlciA9PiB7XG4gICAgbGV0IHBheWxvYWRsZW46QnVmZmVyID0gQnVmZmVyLmFsbG9jKDQpO1xuICAgIHBheWxvYWRsZW4ud3JpdGVVSW50MzJCRSh0aGlzLnBheWxvYWQubGVuZ3RoLCAwKTtcbiAgICByZXR1cm4gQnVmZmVyLmNvbmNhdChbcGF5bG9hZGxlbiwgYmludG9vbHMuY29weUZyb20odGhpcy5wYXlsb2FkLCAwKV0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIG91dHB1dE93bmVycy5cbiAgICovXG4gIGdldE91dHB1dE93bmVycyA9ICgpOkFycmF5PE91dHB1dE93bmVycz4gPT4ge1xuICAgIHJldHVybiB0aGlzLm91dHB1dE93bmVycztcbiAgfVxuXG4gIC8qKlxuICAgKiBQb3B1YXRlcyB0aGUgaW5zdGFuY2UgZnJvbSBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHJlcHJlc2VudGluZyB0aGUgW1tORlRNaW50T3BlcmF0aW9uXV0gYW5kIHJldHVybnMgdGhlIHVwZGF0ZWQgb2Zmc2V0LlxuICAgKi9cbiAgZnJvbUJ1ZmZlcihieXRlczpCdWZmZXIsIG9mZnNldDpudW1iZXIgPSAwKTpudW1iZXIge1xuICAgIG9mZnNldCA9IHN1cGVyLmZyb21CdWZmZXIoYnl0ZXMsIG9mZnNldCk7XG4gICAgdGhpcy5ncm91cElEID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgNCk7XG4gICAgb2Zmc2V0ICs9IDQ7XG4gICAgbGV0IHBheWxvYWRMZW46bnVtYmVyID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgNCkucmVhZFVJbnQzMkJFKDApO1xuICAgIG9mZnNldCArPSA0O1xuICAgIHRoaXMucGF5bG9hZCA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIHBheWxvYWRMZW4pO1xuICAgIG9mZnNldCArPSBwYXlsb2FkTGVuO1xuICAgIGxldCBudW1vdXRwdXRzOm51bWJlciA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDQpLnJlYWRVSW50MzJCRSgwKTtcbiAgICBvZmZzZXQgKz0gNDtcbiAgICB0aGlzLm91dHB1dE93bmVycyA9IFtdO1xuICAgIGZvcihsZXQgaTpudW1iZXIgPSAwOyBpIDwgbnVtb3V0cHV0czsgaSsrKSB7XG4gICAgICBsZXQgb3V0cHV0T3duZXI6T3V0cHV0T3duZXJzID0gbmV3IE91dHB1dE93bmVycygpO1xuICAgICAgb2Zmc2V0ID0gb3V0cHV0T3duZXIuZnJvbUJ1ZmZlcihieXRlcywgb2Zmc2V0KTtcbiAgICAgIHRoaXMub3V0cHV0T3duZXJzLnB1c2gob3V0cHV0T3duZXIpO1xuICAgIH1cbiAgICByZXR1cm4gb2Zmc2V0O1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGJ1ZmZlciByZXByZXNlbnRpbmcgdGhlIFtbTkZUTWludE9wZXJhdGlvbl1dIGluc3RhbmNlLlxuICAgKi9cbiAgdG9CdWZmZXIoKTpCdWZmZXIge1xuICAgIGxldCBzdXBlcmJ1ZmY6QnVmZmVyID0gc3VwZXIudG9CdWZmZXIoKTtcbiAgICBsZXQgcGF5bG9hZGxlbjpCdWZmZXIgPSBCdWZmZXIuYWxsb2MoNCk7XG4gICAgcGF5bG9hZGxlbi53cml0ZVVJbnQzMkJFKHRoaXMucGF5bG9hZC5sZW5ndGgsIDApO1xuXG4gICAgbGV0IG91dHB1dG93bmVyc2xlbjpCdWZmZXIgPSBCdWZmZXIuYWxsb2MoNCk7XG4gICAgb3V0cHV0b3duZXJzbGVuLndyaXRlVUludDMyQkUodGhpcy5vdXRwdXRPd25lcnMubGVuZ3RoLCAwKTtcblxuICAgIGxldCBic2l6ZTpudW1iZXIgPSBcbiAgICAgIHN1cGVyYnVmZi5sZW5ndGggKyBcbiAgICAgIHRoaXMuZ3JvdXBJRC5sZW5ndGggKyBcbiAgICAgIHBheWxvYWRsZW4ubGVuZ3RoICsgXG4gICAgICB0aGlzLnBheWxvYWQubGVuZ3RoICtcbiAgICAgIG91dHB1dG93bmVyc2xlbi5sZW5ndGg7IFxuXG4gICAgbGV0IGJhcnI6QXJyYXk8QnVmZmVyPiA9IFtcbiAgICAgIHN1cGVyYnVmZiwgXG4gICAgICB0aGlzLmdyb3VwSUQsXG4gICAgICBwYXlsb2FkbGVuLFxuICAgICAgdGhpcy5wYXlsb2FkLCBcbiAgICAgIG91dHB1dG93bmVyc2xlblxuICAgIF07XG5cbiAgICBmb3IobGV0IGkgPSAwOyBpIDwgdGhpcy5vdXRwdXRPd25lcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGxldCBiOkJ1ZmZlciA9IHRoaXMub3V0cHV0T3duZXJzW2ldLnRvQnVmZmVyKCk7XG4gICAgICBiYXJyLnB1c2goYik7XG4gICAgICBic2l6ZSArPSBiLmxlbmd0aDtcbiAgICB9XG5cbiAgICByZXR1cm4gQnVmZmVyLmNvbmNhdChiYXJyLGJzaXplKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgYmFzZS01OCBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSBbW05GVE1pbnRPcGVyYXRpb25dXS5cbiAgICovXG4gIHRvU3RyaW5nKCk6c3RyaW5nIHtcbiAgICByZXR1cm4gYmludG9vbHMuYnVmZmVyVG9CNTgodGhpcy50b0J1ZmZlcigpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBbiBbW09wZXJhdGlvbl1dIGNsYXNzIHdoaWNoIGNvbnRhaW5zIGFuIE5GVCBvbiBhbiBhc3NldElELlxuICAgKiBcbiAgICogQHBhcmFtIGdyb3VwSUQgVGhlIGdyb3VwIHRvIHdoaWNoIHRvIGlzc3VlIHRoZSBORlQgT3V0cHV0XG4gICAqIEBwYXJhbSBwYXlsb2FkIEEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gb2YgdGhlIE5GVCBwYXlsb2FkXG4gICAqIEBwYXJhbSBvdXRwdXRPd25lcnMgQW4gYXJyYXkgb2Ygb3V0cHV0T3duZXJzXG4gICAqL1xuICBjb25zdHJ1Y3Rvcihncm91cElEOm51bWJlciA9IHVuZGVmaW5lZCwgcGF5bG9hZDpCdWZmZXIgPSB1bmRlZmluZWQsIG91dHB1dE93bmVyczpBcnJheTxPdXRwdXRPd25lcnM+ID0gdW5kZWZpbmVkKXtcbiAgICBzdXBlcigpO1xuICAgIGlmKHR5cGVvZiBncm91cElEICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgcGF5bG9hZCAhPT0gJ3VuZGVmaW5lZCcgJiYgb3V0cHV0T3duZXJzLmxlbmd0aCkge1xuICAgICAgdGhpcy5ncm91cElELndyaXRlVUludDMyQkUoKGdyb3VwSUQgPyBncm91cElEIDogMCksIDApO1xuICAgICAgdGhpcy5wYXlsb2FkID0gcGF5bG9hZDtcbiAgICAgIHRoaXMub3V0cHV0T3duZXJzID0gb3V0cHV0T3duZXJzO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEEgW1tPcGVyYXRpb25dXSBjbGFzcyB3aGljaCBzcGVjaWZpZXMgYSBORlQgVHJhbnNmZXIgT3AuXG4gKi9cbmV4cG9ydCBjbGFzcyBORlRUcmFuc2Zlck9wZXJhdGlvbiBleHRlbmRzIE9wZXJhdGlvbiB7XG4gIHByb3RlY3RlZCBfdHlwZU5hbWUgPSBcIk5GVFRyYW5zZmVyT3BlcmF0aW9uXCI7XG4gIHByb3RlY3RlZCBfdHlwZUlEID0gQVZNQ29uc3RhbnRzLk5GVFhGRVJPUElEO1xuXG4gIHNlcmlhbGl6ZShlbmNvZGluZzpTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKTpvYmplY3Qge1xuICAgIGxldCBmaWVsZHM6b2JqZWN0ID0gc3VwZXIuc2VyaWFsaXplKGVuY29kaW5nKTtcbiAgICByZXR1cm4ge1xuICAgICAgLi4uZmllbGRzLFxuICAgICAgXCJvdXRwdXRcIjogdGhpcy5vdXRwdXQuc2VyaWFsaXplKGVuY29kaW5nKVxuICAgIH1cbiAgfTtcbiAgZGVzZXJpYWxpemUoZmllbGRzOm9iamVjdCwgZW5jb2Rpbmc6U2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIikge1xuICAgIHN1cGVyLmRlc2VyaWFsaXplKGZpZWxkcywgZW5jb2RpbmcpO1xuICAgIHRoaXMub3V0cHV0ID0gbmV3IE5GVFRyYW5zZmVyT3V0cHV0KCk7XG4gICAgdGhpcy5vdXRwdXQuZGVzZXJpYWxpemUoZmllbGRzW1wib3V0cHV0XCJdLCBlbmNvZGluZyk7XG4gIH1cblxuICBwcm90ZWN0ZWQgb3V0cHV0Ok5GVFRyYW5zZmVyT3V0cHV0O1xuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBvcGVyYXRpb24gSUQuXG4gICAqL1xuICBnZXRPcGVyYXRpb25JRCgpOm51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX3R5cGVJRDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBjcmVkZW50aWFsIElELlxuICAgKi9cbiAgZ2V0Q3JlZGVudGlhbElEKCk6bnVtYmVyIHtcbiAgICByZXR1cm4gQVZNQ29uc3RhbnRzLk5GVENSRURFTlRJQUw7XG4gIH1cblxuICBnZXRPdXRwdXQgPSAoKTpORlRUcmFuc2Zlck91dHB1dCA9PiB0aGlzLm91dHB1dDtcblxuICAvKipcbiAgICAgKiBQb3B1YXRlcyB0aGUgaW5zdGFuY2UgZnJvbSBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHJlcHJlc2VudGluZyB0aGUgW1tORlRUcmFuc2Zlck9wZXJhdGlvbl1dIGFuZCByZXR1cm5zIHRoZSB1cGRhdGVkIG9mZnNldC5cbiAgICAgKi9cbiAgZnJvbUJ1ZmZlcihieXRlczpCdWZmZXIsIG9mZnNldDpudW1iZXIgPSAwKTpudW1iZXIge1xuICAgIG9mZnNldCA9IHN1cGVyLmZyb21CdWZmZXIoYnl0ZXMsIG9mZnNldCk7XG4gICAgdGhpcy5vdXRwdXQgPSBuZXcgTkZUVHJhbnNmZXJPdXRwdXQoKTtcbiAgICByZXR1cm4gdGhpcy5vdXRwdXQuZnJvbUJ1ZmZlcihieXRlcywgb2Zmc2V0KTtcbiAgfVxuXG4gIC8qKlxuICAgICAqIFJldHVybnMgdGhlIGJ1ZmZlciByZXByZXNlbnRpbmcgdGhlIFtbTkZUVHJhbnNmZXJPcGVyYXRpb25dXSBpbnN0YW5jZS5cbiAgICAgKi9cbiAgdG9CdWZmZXIoKTpCdWZmZXIge1xuICAgIGNvbnN0IHN1cGVyYnVmZjpCdWZmZXIgPSBzdXBlci50b0J1ZmZlcigpO1xuICAgIGNvbnN0IG91dGJ1ZmY6QnVmZmVyID0gdGhpcy5vdXRwdXQudG9CdWZmZXIoKTtcbiAgICBjb25zdCBic2l6ZTpudW1iZXIgPSBzdXBlcmJ1ZmYubGVuZ3RoICsgb3V0YnVmZi5sZW5ndGg7XG4gICAgY29uc3QgYmFycjpBcnJheTxCdWZmZXI+ID0gW3N1cGVyYnVmZiwgb3V0YnVmZl07XG4gICAgcmV0dXJuIEJ1ZmZlci5jb25jYXQoYmFyciwgYnNpemUpO1xuICB9XG5cbiAgLyoqXG4gICAgICogUmV0dXJucyBhIGJhc2UtNTggc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgW1tORlRUcmFuc2Zlck9wZXJhdGlvbl1dLlxuICAgICAqL1xuICB0b1N0cmluZygpOnN0cmluZyB7XG4gICAgcmV0dXJuIGJpbnRvb2xzLmJ1ZmZlclRvQjU4KHRoaXMudG9CdWZmZXIoKSk7XG4gIH1cblxuICAvKipcbiAgICAgKiBBbiBbW09wZXJhdGlvbl1dIGNsYXNzIHdoaWNoIGNvbnRhaW5zIGFuIE5GVCBvbiBhbiBhc3NldElELlxuICAgICAqXG4gICAgICogQHBhcmFtIG91dHB1dCBBbiBbW05GVFRyYW5zZmVyT3V0cHV0XV1cbiAgICAgKi9cbiAgY29uc3RydWN0b3Iob3V0cHV0Ok5GVFRyYW5zZmVyT3V0cHV0ID0gdW5kZWZpbmVkKSB7XG4gICAgc3VwZXIoKTtcbiAgICBpZiAodHlwZW9mIG91dHB1dCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHRoaXMub3V0cHV0ID0gb3V0cHV0O1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIENLQyAtIE1ha2UgZ2VuZXJpYywgdXNlIGV2ZXJ5d2hlcmUuXG4gKi9cblxuLyoqXG4gKiBDbGFzcyBmb3IgcmVwcmVzZW50aW5nIGEgVVRYT0lEIHVzZWQgaW4gW1tUcmFuc2ZlcmFibGVPcF1dIHR5cGVzXG4gKi9cbmV4cG9ydCBjbGFzcyBVVFhPSUQgZXh0ZW5kcyBOQnl0ZXMge1xuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJVVFhPSURcIjtcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSB1bmRlZmluZWQ7XG5cbiAgLy9zZXJpYWxpemUgYW5kIGRlc2VyaWFsaXplIGJvdGggYXJlIGluaGVyaXRlZFxuXG4gIHByb3RlY3RlZCBieXRlcyA9IEJ1ZmZlci5hbGxvYygzNik7XG4gIHByb3RlY3RlZCBic2l6ZSA9IDM2O1xuXG4gIC8qKlxuICAgICAqIFJldHVybnMgYSBmdW5jdGlvbiB1c2VkIHRvIHNvcnQgYW4gYXJyYXkgb2YgW1tVVFhPSURdXXNcbiAgICAgKi9cbiAgc3RhdGljIGNvbXBhcmF0b3IgPSAoKTooYTpVVFhPSUQsIGI6VVRYT0lEKSA9PiAoMXwtMXwwKSA9PiAoYTpVVFhPSUQsIGI6VVRYT0lEKVxuICAgIDooMXwtMXwwKSA9PiBCdWZmZXIuY29tcGFyZShhLnRvQnVmZmVyKCksIGIudG9CdWZmZXIoKSkgYXMgKDF8LTF8MCk7XG5cbiAgLyoqXG4gICAgICogUmV0dXJucyBhIGJhc2UtNTggcmVwcmVzZW50YXRpb24gb2YgdGhlIFtbVVRYT0lEXV0uXG4gICAgICovXG4gIHRvU3RyaW5nKCk6c3RyaW5nIHtcbiAgICByZXR1cm4gYmludG9vbHMuY2I1OEVuY29kZSh0aGlzLnRvQnVmZmVyKCkpO1xuICB9XG5cbiAgLyoqXG4gICAgICogVGFrZXMgYSBiYXNlLTU4IHN0cmluZyBjb250YWluaW5nIGFuIFtbVVRYT0lEXV0sIHBhcnNlcyBpdCwgcG9wdWxhdGVzIHRoZSBjbGFzcywgYW5kIHJldHVybnMgdGhlIGxlbmd0aCBvZiB0aGUgVVRYT0lEIGluIGJ5dGVzLlxuICAgICAqXG4gICAgICogQHBhcmFtIGJ5dGVzIEEgYmFzZS01OCBzdHJpbmcgY29udGFpbmluZyBhIHJhdyBbW1VUWE9JRF1dXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBUaGUgbGVuZ3RoIG9mIHRoZSByYXcgW1tVVFhPSURdXVxuICAgICAqL1xuICBmcm9tU3RyaW5nKHV0eG9pZDpzdHJpbmcpOm51bWJlciB7XG4gICAgY29uc3QgdXR4b2lkYnVmZjpCdWZmZXIgPSBiaW50b29scy5iNThUb0J1ZmZlcih1dHhvaWQpO1xuICAgIGlmICh1dHhvaWRidWZmLmxlbmd0aCA9PT0gNDAgJiYgYmludG9vbHMudmFsaWRhdGVDaGVja3N1bSh1dHhvaWRidWZmKSkge1xuICAgICAgY29uc3QgbmV3YnVmZjpCdWZmZXIgPSBiaW50b29scy5jb3B5RnJvbSh1dHhvaWRidWZmLCAwLCB1dHhvaWRidWZmLmxlbmd0aCAtIDQpO1xuICAgICAgaWYgKG5ld2J1ZmYubGVuZ3RoID09PSAzNikge1xuICAgICAgICB0aGlzLmJ5dGVzID0gbmV3YnVmZjtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHV0eG9pZGJ1ZmYubGVuZ3RoID09PSA0MCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdFcnJvciAtIFVUWE9JRC5mcm9tU3RyaW5nOiBpbnZhbGlkIGNoZWNrc3VtIG9uIGFkZHJlc3MnKTtcbiAgICB9IGVsc2UgaWYgKHV0eG9pZGJ1ZmYubGVuZ3RoID09PSAzNikge1xuICAgICAgdGhpcy5ieXRlcyA9IHV0eG9pZGJ1ZmY7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Vycm9yIC0gVVRYT0lELmZyb21TdHJpbmc6IGludmFsaWQgYWRkcmVzcycpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5nZXRTaXplKCk7XG4gICAgXG4gIH1cblxuICBjbG9uZSgpOnRoaXMge1xuICAgIGxldCBuZXdiYXNlOlVUWE9JRCA9IG5ldyBVVFhPSUQoKTtcbiAgICBuZXdiYXNlLmZyb21CdWZmZXIodGhpcy50b0J1ZmZlcigpKTtcbiAgICByZXR1cm4gbmV3YmFzZSBhcyB0aGlzO1xuICB9XG5cbiAgY3JlYXRlKC4uLmFyZ3M6YW55W10pOnRoaXMge1xuICAgIHJldHVybiBuZXcgVVRYT0lEKCkgYXMgdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgICAqIENsYXNzIGZvciByZXByZXNlbnRpbmcgYSBVVFhPSUQgdXNlZCBpbiBbW1RyYW5zZmVyYWJsZU9wXV0gdHlwZXNcbiAgICAgKi9cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKTtcbiAgfVxufSJdfQ==