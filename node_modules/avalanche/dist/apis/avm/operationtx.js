"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperationTx = void 0;
/**
 * @packageDocumentation
 * @module API-AVM-OperationTx
 */
const buffer_1 = require("buffer/");
const bintools_1 = __importDefault(require("../../utils/bintools"));
const constants_1 = require("./constants");
const ops_1 = require("./ops");
const credentials_1 = require("./credentials");
const credentials_2 = require("../../common/credentials");
const basetx_1 = require("./basetx");
const constants_2 = require("../../utils/constants");
const serialization_1 = require("../../utils/serialization");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
const serializer = serialization_1.Serialization.getInstance();
/**
 * Class representing an unsigned Operation transaction.
 */
class OperationTx extends basetx_1.BaseTx {
    /**
     * Class representing an unsigned Operation transaction.
     *
     * @param networkid Optional networkid, [[DefaultNetworkID]]
     * @param blockchainid Optional blockchainid, default Buffer.alloc(32, 16)
     * @param outs Optional array of the [[TransferableOutput]]s
     * @param ins Optional array of the [[TransferableInput]]s
     * @param memo Optional {@link https://github.com/feross/buffer|Buffer} for the memo field
     * @param ops Array of [[Operation]]s used in the transaction
     */
    constructor(networkid = constants_2.DefaultNetworkID, blockchainid = buffer_1.Buffer.alloc(32, 16), outs = undefined, ins = undefined, memo = undefined, ops = undefined) {
        super(networkid, blockchainid, outs, ins, memo);
        this._typeName = "OperationTx";
        this._typeID = constants_1.AVMConstants.OPERATIONTX;
        this.numOps = buffer_1.Buffer.alloc(4);
        this.ops = [];
        /**
         * Returns the id of the [[OperationTx]]
         */
        this.getTxType = () => {
            return this._typeID;
        };
        if (typeof ops !== 'undefined' && Array.isArray(ops)) {
            for (let i = 0; i < ops.length; i++) {
                if (!(ops[i] instanceof ops_1.TransferableOperation)) {
                    throw new Error("Error - OperationTx.constructor: invalid op in array parameter 'ops'");
                }
            }
            this.ops = ops;
        }
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { "ops": this.ops.map((o) => o.serialize(encoding)) });
    }
    ;
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.ops = fields["ops"].map((o) => {
            let op = new ops_1.TransferableOperation();
            op.deserialize(o, encoding);
            return op;
        });
        this.numOps = buffer_1.Buffer.alloc(4);
        this.numOps.writeUInt32BE(this.ops.length, 0);
    }
    /**
     * Takes a {@link https://github.com/feross/buffer|Buffer} containing an [[OperationTx]], parses it, populates the class, and returns the length of the [[OperationTx]] in bytes.
     *
     * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[OperationTx]]
     *
     * @returns The length of the raw [[OperationTx]]
     *
     * @remarks assume not-checksummed
     */
    fromBuffer(bytes, offset = 0, codecid = constants_1.AVMConstants.LATESTCODEC) {
        offset = super.fromBuffer(bytes, offset);
        this.numOps = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        const numOps = this.numOps.readUInt32BE(0);
        for (let i = 0; i < numOps; i++) {
            const op = new ops_1.TransferableOperation();
            offset = op.fromBuffer(bytes, offset);
            this.ops.push(op);
        }
        return offset;
    }
    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[OperationTx]].
     */
    toBuffer() {
        this.numOps.writeUInt32BE(this.ops.length, 0);
        let barr = [super.toBuffer(), this.numOps];
        this.ops = this.ops.sort(ops_1.TransferableOperation.comparator());
        for (let i = 0; i < this.ops.length; i++) {
            barr.push(this.ops[i].toBuffer());
        }
        return buffer_1.Buffer.concat(barr);
    }
    /**
     * Returns an array of [[TransferableOperation]]s in this transaction.
     */
    getOperations() {
        return this.ops;
    }
    /**
     * Takes the bytes of an [[UnsignedTx]] and returns an array of [[Credential]]s
     *
     * @param msg A Buffer for the [[UnsignedTx]]
     * @param kc An [[KeyChain]] used in signing
     *
     * @returns An array of [[Credential]]s
     */
    sign(msg, kc) {
        const sigs = super.sign(msg, kc);
        for (let i = 0; i < this.ops.length; i++) {
            const cred = credentials_1.SelectCredentialClass(this.ops[i].getOperation().getCredentialID());
            const sigidxs = this.ops[i].getOperation().getSigIdxs();
            for (let j = 0; j < sigidxs.length; j++) {
                const keypair = kc.getKey(sigidxs[j].getSource());
                const signval = keypair.sign(msg);
                const sig = new credentials_2.Signature();
                sig.fromBuffer(signval);
                cred.addSignature(sig);
            }
            sigs.push(cred);
        }
        return sigs;
    }
    clone() {
        let newbase = new OperationTx();
        newbase.fromBuffer(this.toBuffer());
        return newbase;
    }
    create(...args) {
        return new OperationTx(...args);
    }
}
exports.OperationTx = OperationTx;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3BlcmF0aW9udHguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvYXBpcy9hdm0vb3BlcmF0aW9udHgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUE7OztHQUdHO0FBQ0gsb0NBQWlDO0FBQ2pDLG9FQUE0QztBQUM1QywyQ0FBMkM7QUFHM0MsK0JBQThDO0FBQzlDLCtDQUFzRDtBQUV0RCwwREFBeUU7QUFDekUscUNBQWtDO0FBQ2xDLHFEQUF5RDtBQUN6RCw2REFBOEU7QUFFOUU7O0dBRUc7QUFDSCxNQUFNLFFBQVEsR0FBRyxrQkFBUSxDQUFDLFdBQVcsRUFBRSxDQUFDO0FBQ3hDLE1BQU0sVUFBVSxHQUFHLDZCQUFhLENBQUMsV0FBVyxFQUFFLENBQUM7QUFFL0M7O0dBRUc7QUFDSCxNQUFhLFdBQVksU0FBUSxlQUFNO0lBNkdyQzs7Ozs7Ozs7O09BU0c7SUFDSCxZQUNFLFlBQW1CLDRCQUFnQixFQUFFLGVBQXNCLGVBQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUMvRSxPQUFpQyxTQUFTLEVBQUUsTUFBK0IsU0FBUyxFQUNwRixPQUFjLFNBQVMsRUFBRSxNQUFtQyxTQUFTO1FBRXJFLEtBQUssQ0FBQyxTQUFTLEVBQUUsWUFBWSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7UUEzSHhDLGNBQVMsR0FBRyxhQUFhLENBQUM7UUFDMUIsWUFBTyxHQUFHLHdCQUFZLENBQUMsV0FBVyxDQUFDO1FBb0JuQyxXQUFNLEdBQVUsZUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNoQyxRQUFHLEdBQWdDLEVBQUUsQ0FBQztRQUVoRDs7V0FFRztRQUNILGNBQVMsR0FBRyxHQUFVLEVBQUU7WUFDdEIsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDO1FBQ3RCLENBQUMsQ0FBQTtRQStGQyxJQUFJLE9BQU8sR0FBRyxLQUFLLFdBQVcsSUFBSSxL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LEdBQVUsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDekMsTUFBTSxHQUFHLEdBQWEsSUFBSSx1QkFBUyxFQUFFLENBQUM7Z0JBQ3RDLEdBQUcsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQ3hCLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLENBQUM7YUFDeEI7WUFDRCxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ2pCO1FBQ0QsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBRUQsS0FBSztRQUNELElBQUksT0FBTyxHQUFlLElBQUksV0FBVyxFQUFFLENBQUM7UUFDNUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztRQUNwQyxPQUFPLE9BQWUsQ0FBQztJQUMzQixDQUFDO0lBRUQsTUFBTSxDQUFDLEdBQUcsSUFBVTtRQUNoQixPQUFPLElBQUksV0FBVyxDQUFDLEdBQUcsSUFBSSxDQUFTLENBQUM7SUFDNUMsQ0FBQztDQTJCRjtBQXRJRCxrQ0FzSUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBwYWNrYWdlRG9jdW1lbnRhdGlvblxuICogQG1vZHVsZSBBUEktQVZNLU9wZXJhdGlvblR4XG4gKi9cbmltcG9ydCB7IEJ1ZmZlciB9IGZyb20gJ2J1ZmZlci8nO1xuaW1wb3J0IEJpblRvb2xzIGZyb20gJy4uLy4uL3V0aWxzL2JpbnRvb2xzJztcbmltcG9ydCB7IEFWTUNvbnN0YW50cyB9IGZyb20gJy4vY29uc3RhbnRzJztcbmltcG9ydCB7IFRyYW5zZmVyYWJsZU91dHB1dCB9IGZyb20gJy4vb3V0cHV0cyc7XG5pbXBvcnQgeyBUcmFuc2ZlcmFibGVJbnB1dCB9IGZyb20gJy4vaW5wdXRzJztcbmltcG9ydCB7IFRyYW5zZmVyYWJsZU9wZXJhdGlvbiB9IGZyb20gJy4vb3BzJztcbmltcG9ydCB7IFNlbGVjdENyZWRlbnRpYWxDbGFzcyB9IGZyb20gJy4vY3JlZGVudGlhbHMnO1xuaW1wb3J0IHsgS2V5Q2hhaW4sIEtleVBhaXIgfSBmcm9tICcuL2tleWNoYWluJztcbmltcG9ydCB7IFNpZ25hdHVyZSwgU2lnSWR4LCBDcmVkZW50aWFsIH0gZnJvbSAnLi4vLi4vY29tbW9uL2NyZWRlbnRpYWxzJztcbmltcG9ydCB7IEJhc2VUeCB9IGZyb20gJy4vYmFzZXR4JztcbmltcG9ydCB7IERlZmF1bHROZXR3b3JrSUQgfSBmcm9tICcuLi8uLi91dGlscy9jb25zdGFudHMnO1xuaW1wb3J0IHsgU2VyaWFsaXphdGlvbiwgU2VyaWFsaXplZEVuY29kaW5nIH0gZnJvbSAnLi4vLi4vdXRpbHMvc2VyaWFsaXphdGlvbic7XG5cbi8qKlxuICogQGlnbm9yZVxuICovXG5jb25zdCBiaW50b29scyA9IEJpblRvb2xzLmdldEluc3RhbmNlKCk7XG5jb25zdCBzZXJpYWxpemVyID0gU2VyaWFsaXphdGlvbi5nZXRJbnN0YW5jZSgpO1xuXG4vKipcbiAqIENsYXNzIHJlcHJlc2VudGluZyBhbiB1bnNpZ25lZCBPcGVyYXRpb24gdHJhbnNhY3Rpb24uXG4gKi9cbmV4cG9ydCBjbGFzcyBPcGVyYXRpb25UeCBleHRlbmRzIEJhc2VUeCB7XG4gIHByb3RlY3RlZCBfdHlwZU5hbWUgPSBcIk9wZXJhdGlvblR4XCI7XG4gIHByb3RlY3RlZCBfdHlwZUlEID0gQVZNQ29uc3RhbnRzLk9QRVJBVElPTlRYO1xuXG4gIHNlcmlhbGl6ZShlbmNvZGluZzpTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKTpvYmplY3Qge1xuICAgIGxldCBmaWVsZHM6b2JqZWN0ID0gc3VwZXIuc2VyaWFsaXplKGVuY29kaW5nKTtcbiAgICByZXR1cm4ge1xuICAgICAgLi4uZmllbGRzLFxuICAgICAgXCJvcHNcIjogdGhpcy5vcHMubWFwKChvKSA9PiBvLnNlcmlhbGl6ZShlbmNvZGluZykpXG4gICAgfVxuICB9O1xuICBkZXNlcmlhbGl6ZShmaWVsZHM6b2JqZWN0LCBlbmNvZGluZzpTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKSB7XG4gICAgc3VwZXIuZGVzZXJpYWxpemUoZmllbGRzLCBlbmNvZGluZyk7XG4gICAgdGhpcy5vcHMgPSBmaWVsZHNbXCJvcHNcIl0ubWFwKChvOm9iamVjdCkgPT4ge1xuICAgICAgbGV0IG9wOlRyYW5zZmVyYWJsZU9wZXJhdGlvbiA9IG5ldyBUcmFuc2ZlcmFibGVPcGVyYXRpb24oKTtcbiAgICAgIG9wLmRlc2VyaWFsaXplKG8sIGVuY29kaW5nKTtcbiAgICAgIHJldHVybiBvcDtcbiAgICB9KTtcbiAgICB0aGlzLm51bU9wcyA9IEJ1ZmZlci5hbGxvYyg0KTtcbiAgICB0aGlzLm51bU9wcy53cml0ZVVJbnQzMkJFKHRoaXMub3BzLmxlbmd0aCwwKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBudW1PcHM6QnVmZmVyID0gQnVmZmVyLmFsbG9jKDQpO1xuICBwcm90ZWN0ZWQgb3BzOkFycmF5PFRyYW5zZmVyYWJsZU9wZXJhdGlvbj4gPSBbXTtcblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgaWQgb2YgdGhlIFtbT3BlcmF0aW9uVHhdXVxuICAgKi9cbiAgZ2V0VHhUeXBlID0gKCk6bnVtYmVyID0+IHtcbiAgICByZXR1cm4gdGhpcy5fdHlwZUlEO1xuICB9XG5cbiAgLyoqXG4gICAqIFRha2VzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gY29udGFpbmluZyBhbiBbW09wZXJhdGlvblR4XV0sIHBhcnNlcyBpdCwgcG9wdWxhdGVzIHRoZSBjbGFzcywgYW5kIHJldHVybnMgdGhlIGxlbmd0aCBvZiB0aGUgW1tPcGVyYXRpb25UeF1dIGluIGJ5dGVzLlxuICAgKlxuICAgKiBAcGFyYW0gYnl0ZXMgQSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBjb250YWluaW5nIGEgcmF3IFtbT3BlcmF0aW9uVHhdXVxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgbGVuZ3RoIG9mIHRoZSByYXcgW1tPcGVyYXRpb25UeF1dXG4gICAqXG4gICAqIEByZW1hcmtzIGFzc3VtZSBub3QtY2hlY2tzdW1tZWRcbiAgICovXG4gIGZyb21CdWZmZXIoYnl0ZXM6QnVmZmVyLCBvZmZzZXQ6bnVtYmVyID0gMCwgY29kZWNpZDpudW1iZXIgPSBBVk1Db25zdGFudHMuTEFURVNUQ09ERUMpOm51bWJlciB7XG4gICAgb2Zmc2V0ID0gc3VwZXIuZnJvbUJ1ZmZlcihieXRlcywgb2Zmc2V0KTtcbiAgICB0aGlzLm51bU9wcyA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDQpO1xuICAgIG9mZnNldCArPSA0O1xuICAgIGNvbnN0IG51bU9wczpudW1iZXIgPSB0aGlzLm51bU9wcy5yZWFkVUludDMyQkUoMCk7XG4gICAgZm9yIChsZXQgaTpudW1iZXIgPSAwOyBpIDwgbnVtT3BzOyBpKyspIHtcbiAgICAgIGNvbnN0IG9wOlRyYW5zZmVyYWJsZU9wZXJhdGlvbiA9IG5ldyBUcmFuc2ZlcmFibGVPcGVyYXRpb24oKTtcbiAgICAgIG9mZnNldCA9IG9wLmZyb21CdWZmZXIoYnl0ZXMsIG9mZnNldCk7XG4gICAgICB0aGlzLm9wcy5wdXNoKG9wKTtcbiAgICB9XG4gICAgcmV0dXJuIG9mZnNldDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gcmVwcmVzZW50YXRpb24gb2YgdGhlIFtbT3BlcmF0aW9uVHhdXS5cbiAgICovXG4gIHRvQnVmZmVyKCk6QnVmZmVyIHtcbiAgICAgIHRoaXMubnVtT3BzLndyaXRlVUludDMyQkUodGhpcy5vcHMubGVuZ3RoLCAwKTtcbiAgICAgIGxldCBiYXJyOkFycmF5PEJ1ZmZlcj4gPSBbc3VwZXIudG9CdWZmZXIoKSwgdGhpcy5udW1PcHNdO1xuICAgICAgdGhpcy5vcHMgPSB0aGlzLm9wcy5zb3J0KFRyYW5zZmVyYWJsZU9wZXJhdGlvbi5jb21wYXJhdG9yKCkpO1xuICAgICAgZm9yKGxldCBpID0gMDsgaSA8IHRoaXMub3BzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgYmFyci5wdXNoKHRoaXMub3BzW2ldLnRvQnVmZmVyKCkpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIEJ1ZmZlci5jb25jYXQoYmFycik7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhbiBhcnJheSBvZiBbW1RyYW5zZmVyYWJsZU9wZXJhdGlvbl1dcyBpbiB0aGlzIHRyYW5zYWN0aW9uLlxuICAgKi9cbiAgZ2V0T3BlcmF0aW9ucygpOkFycmF5PFRyYW5zZmVyYWJsZU9wZXJhdGlvbj4ge1xuICAgIHJldHVybiB0aGlzLm9wcztcbiAgfVxuXG4gIC8qKlxuICAgKiBUYWtlcyB0aGUgYnl0ZXMgb2YgYW4gW1tVbnNpZ25lZFR4XV0gYW5kIHJldHVybnMgYW4gYXJyYXkgb2YgW1tDcmVkZW50aWFsXV1zXG4gICAqXG4gICAqIEBwYXJhbSBtc2cgQSBCdWZmZXIgZm9yIHRoZSBbW1Vuc2lnbmVkVHhdXVxuICAgKiBAcGFyYW0ga2MgQW4gW1tLZXlDaGFpbl1dIHVzZWQgaW4gc2lnbmluZ1xuICAgKlxuICAgKiBAcmV0dXJucyBBbiBhcnJheSBvZiBbW0NyZWRlbnRpYWxdXXNcbiAgICovXG4gIHNpZ24obXNnOkJ1ZmZlciwga2M6S2V5Q2hhaW4pOkFycmF5PENyZWRlbnRpYWw+IHtcbiAgICBjb25zdCBzaWdzOkFycmF5PENyZWRlbnRpYWw+ID0gc3VwZXIuc2lnbihtc2csIGtjKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMub3BzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBjcmVkOkNyZWRlbnRpYWwgPSBTZWxlY3RDcmVkZW50aWFsQ2xhc3ModGhpcy5vcHNbaV0uZ2V0T3BlcmF0aW9uKCkuZ2V0Q3JlZGVudGlhbElEKCkpO1xuICAgICAgY29uc3Qgc2lnaWR4czpBcnJheTxTaWdJZHg+ID0gdGhpcy5vcHNbaV0uZ2V0T3BlcmF0aW9uKCkuZ2V0U2lnSWR4cygpO1xuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBzaWdpZHhzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgIGNvbnN0IGtleXBhaXI6S2V5UGFpciA9IGtjLmdldEtleShzaWdpZHhzW2pdLmdldFNvdXJjZSgpKTtcbiAgICAgICAgY29uc3Qgc2lnbnZhbDpCdWZmZXIgPSBrZXlwYWlyLnNpZ24obXNnKTtcbiAgICAgICAgY29uc3Qgc2lnOlNpZ25hdHVyZSA9IG5ldyBTaWduYXR1cmUoKTtcbiAgICAgICAgc2lnLmZyb21CdWZmZXIoc2lnbnZhbCk7XG4gICAgICAgIGNyZWQuYWRkU2lnbmF0dXJlKHNpZyk7XG4gICAgICB9XG4gICAgICBzaWdzLnB1c2goY3JlZCk7XG4gICAgfVxuICAgIHJldHVybiBzaWdzO1xuICB9XG5cbiAgY2xvbmUoKTp0aGlzIHtcbiAgICAgIGxldCBuZXdiYXNlOk9wZXJhdGlvblR4ID0gbmV3IE9wZXJhdGlvblR4KCk7XG4gICAgICBuZXdiYXNlLmZyb21CdWZmZXIodGhpcy50b0J1ZmZlcigpKTtcbiAgICAgIHJldHVybiBuZXdiYXNlIGFzIHRoaXM7XG4gIH1cblxuICBjcmVhdGUoLi4uYXJnczphbnlbXSk6dGhpcyB7XG4gICAgICByZXR1cm4gbmV3IE9wZXJhdGlvblR4KC4uLmFyZ3MpIGFzIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQ2xhc3MgcmVwcmVzZW50aW5nIGFuIHVuc2lnbmVkIE9wZXJhdGlvbiB0cmFuc2FjdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIG5ldHdvcmtpZCBPcHRpb25hbCBuZXR3b3JraWQsIFtbRGVmYXVsdE5ldHdvcmtJRF1dXG4gICAqIEBwYXJhbSBibG9ja2NoYWluaWQgT3B0aW9uYWwgYmxvY2tjaGFpbmlkLCBkZWZhdWx0IEJ1ZmZlci5hbGxvYygzMiwgMTYpXG4gICAqIEBwYXJhbSBvdXRzIE9wdGlvbmFsIGFycmF5IG9mIHRoZSBbW1RyYW5zZmVyYWJsZU91dHB1dF1dc1xuICAgKiBAcGFyYW0gaW5zIE9wdGlvbmFsIGFycmF5IG9mIHRoZSBbW1RyYW5zZmVyYWJsZUlucHV0XV1zXG4gICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGZvciB0aGUgbWVtbyBmaWVsZFxuICAgKiBAcGFyYW0gb3BzIEFycmF5IG9mIFtbT3BlcmF0aW9uXV1zIHVzZWQgaW4gdGhlIHRyYW5zYWN0aW9uXG4gICAqL1xuICBjb25zdHJ1Y3RvcihcbiAgICBuZXR3b3JraWQ6bnVtYmVyID0gRGVmYXVsdE5ldHdvcmtJRCwgYmxvY2tjaGFpbmlkOkJ1ZmZlciA9IEJ1ZmZlci5hbGxvYygzMiwgMTYpLFxuICAgIG91dHM6QXJyYXk8VHJhbnNmZXJhYmxlT3V0cHV0PiA9IHVuZGVmaW5lZCwgaW5zOkFycmF5PFRyYW5zZmVyYWJsZUlucHV0PiA9IHVuZGVmaW5lZCxcbiAgICBtZW1vOkJ1ZmZlciA9IHVuZGVmaW5lZCwgb3BzOkFycmF5PFRyYW5zZmVyYWJsZU9wZXJhdGlvbj4gPSB1bmRlZmluZWRcbiAgKSB7XG4gICAgc3VwZXIobmV0d29ya2lkLCBibG9ja2NoYWluaWQsIG91dHMsIGlucywgbWVtbyk7XG4gICAgaWYgKHR5cGVvZiBvcHMgIT09ICd1bmRlZmluZWQnICYmIEFycmF5LmlzQXJyYXkob3BzKSkge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBvcHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKCEob3BzW2ldIGluc3RhbmNlb2YgVHJhbnNmZXJhYmxlT3BlcmF0aW9uKSkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkVycm9yIC0gT3BlcmF0aW9uVHguY29uc3RydWN0b3I6IGludmFsaWQgb3AgaW4gYXJyYXkgcGFyYW1ldGVyICdvcHMnXCIpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB0aGlzLm9wcyA9IG9wcztcbiAgICB9XG4gIH1cbn0iXX0=