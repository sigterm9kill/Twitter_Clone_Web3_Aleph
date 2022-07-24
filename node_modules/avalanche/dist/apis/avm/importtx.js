"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportTx = void 0;
/**
 * @packageDocumentation
 * @module API-AVM-ImportTx
 */
const buffer_1 = require("buffer/");
const bintools_1 = __importDefault(require("../../utils/bintools"));
const constants_1 = require("./constants");
const inputs_1 = require("./inputs");
const basetx_1 = require("./basetx");
const credentials_1 = require("./credentials");
const credentials_2 = require("../../common/credentials");
const constants_2 = require("../../utils/constants");
const serialization_1 = require("../../utils/serialization");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
const serializer = serialization_1.Serialization.getInstance();
/**
 * Class representing an unsigned Import transaction.
 */
class ImportTx extends basetx_1.BaseTx {
    /**
     * Class representing an unsigned Import transaction.
     *
     * @param networkid Optional networkid, [[DefaultNetworkID]]
     * @param blockchainid Optional blockchainid, default Buffer.alloc(32, 16)
     * @param outs Optional array of the [[TransferableOutput]]s
     * @param ins Optional array of the [[TransferableInput]]s
     * @param memo Optional {@link https://github.com/feross/buffer|Buffer} for the memo field
     * @param sourceChain Optional chainid for the source inputs to import. Default platform chainid.
     * @param importIns Array of [[TransferableInput]]s used in the transaction
     */
    constructor(networkid = constants_2.DefaultNetworkID, blockchainid = buffer_1.Buffer.alloc(32, 16), outs = undefined, ins = undefined, memo = undefined, sourceChain = undefined, importIns = undefined) {
        super(networkid, blockchainid, outs, ins, memo);
        this._typeName = "ImportTx";
        this._typeID = constants_1.AVMConstants.IMPORTTX;
        this.sourceChain = buffer_1.Buffer.alloc(32);
        this.numIns = buffer_1.Buffer.alloc(4);
        this.importIns = [];
        /**
           * Returns the id of the [[ImportTx]]
           */
        this.getTxType = () => {
            return this._typeID;
        };
        /**
         * Returns a {@link https://github.com/feross/buffer|Buffer} for the source chainid.
         */
        this.getSourceChain = () => {
            return this.sourceChain;
        };
        this.sourceChain = sourceChain; // do not correct, if it's wrong it'll bomb on toBuffer
        if (typeof importIns !== 'undefined' && Array.isArray(importIns)) {
            for (let i = 0; i < importIns.length; i++) {
                if (!(importIns[i] instanceof inputs_1.TransferableInput)) {
                    throw new Error("Error - ImportTx.constructor: invalid TransferableInput in array parameter 'importIns'");
                }
            }
            this.importIns = importIns;
        }
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { "sourceChain": serializer.encoder(this.sourceChain, encoding, "Buffer", "cb58"), "importIns": this.importIns.map((i) => i.serialize(encoding)) });
    }
    ;
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.sourceChain = serializer.decoder(fields["sourceChain"], encoding, "cb58", "Buffer", 32);
        this.importIns = fields["importIns"].map((i) => {
            let ii = new inputs_1.TransferableInput();
            ii.deserialize(i, encoding);
            return ii;
        });
        this.numIns = buffer_1.Buffer.alloc(4);
        this.numIns.writeUInt32BE(this.importIns.length, 0);
    }
    /**
       * Takes a {@link https://github.com/feross/buffer|Buffer} containing an [[ImportTx]], parses it, populates the class, and returns the length of the [[ImportTx]] in bytes.
       *
       * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[ImportTx]]
       *
       * @returns The length of the raw [[ImportTx]]
       *
       * @remarks assume not-checksummed
       */
    fromBuffer(bytes, offset = 0) {
        offset = super.fromBuffer(bytes, offset);
        this.sourceChain = bintools.copyFrom(bytes, offset, offset + 32);
        offset += 32;
        this.numIns = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        const numIns = this.numIns.readUInt32BE(0);
        for (let i = 0; i < numIns; i++) {
            const anIn = new inputs_1.TransferableInput();
            offset = anIn.fromBuffer(bytes, offset);
            this.importIns.push(anIn);
        }
        return offset;
    }
    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[ImportTx]].
     */
    toBuffer() {
        if (typeof this.sourceChain === "undefined") {
            throw new Error("ImportTx.toBuffer -- this.sourceChain is undefined");
        }
        this.numIns.writeUInt32BE(this.importIns.length, 0);
        let barr = [super.toBuffer(), this.sourceChain, this.numIns];
        this.importIns = this.importIns.sort(inputs_1.TransferableInput.comparator());
        for (let i = 0; i < this.importIns.length; i++) {
            barr.push(this.importIns[i].toBuffer());
        }
        return buffer_1.Buffer.concat(barr);
    }
    /**
       * Returns an array of [[TransferableInput]]s in this transaction.
       */
    getImportInputs() {
        return this.importIns;
    }
    clone() {
        let newbase = new ImportTx();
        newbase.fromBuffer(this.toBuffer());
        return newbase;
    }
    create(...args) {
        return new ImportTx(...args);
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
        for (let i = 0; i < this.importIns.length; i++) {
            const cred = credentials_1.SelectCredentialClass(this.importIns[i].getInput().getCredentialID());
            const sigidxs = this.importIns[i].getInput().getSigIdxs();
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
}
exports.ImportTx = ImportTx;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1wb3J0dHguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvYXBpcy9hdm0vaW1wb3J0dHgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUE7OztHQUdHO0FBQ0gsb0NBQWlDO0FBQ2pDLG9FQUE0QztBQUM1QywyQ0FBMkM7QUFFM0MscUNBQTZDO0FBQzdDLHFDQUFrQztBQUNsQywrQ0FBc0Q7QUFDdEQsMERBQXlFO0FBRXpFLHFEQUF5RDtBQUN6RCw2REFBOEU7QUFFOUU7O0dBRUc7QUFDSCxNQUFNLFFBQVEsR0FBRyxrQkFBUSxDQUFDLFdBQVcsRUFBRSxDQUFDO0FBQ3hDLE1BQU0sVUFBVSxHQUFHLDZCQUFhLENBQUMsV0FBVyxFQUFFLENBQUM7QUFFL0M7O0dBRUc7QUFDSCxNQUFhLFFBQVMsU0FBUSxlQUFNO0lBMkhsQzs7Ozs7Ozs7OztPQVVHO0lBQ0gsWUFDRSxZQUFtQiw0QkFBZ0IsRUFBRSxlQUFzQixlQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFDL0UsT0FBaUMsU0FBUyxFQUFFLE1BQStCLFNBQVMsRUFDcEYsT0FBYyxTQUFTLEVBQUUsY0FBcUIsU0FBUyxFQUFFLFlBQXFDLFNBQVM7UUFFdkcsS0FBSyxDQUFDLFNBQVMsRUFBRSxZQUFZLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQztRQTFJeEMsY0FBUyxHQUFHLFVBQVUsQ0FBQztRQUN2QixZQUFPLEdBQUcsd0JBQVksQ0FBQyxRQUFRLENBQUM7UUFzQmhDLGdCQUFXLEdBQVUsZUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUN0QyxXQUFNLEdBQVUsZUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNoQyxjQUFTLEdBQTRCLEVBQUUsQ0FBQztRQUVsRDs7YUFFSztRQUNMLGNBQVMsR0FBRyxHQUFVLEVBQUU7WUFDdEIsT0FBTyxJQUFJLENBQUMs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Q0FBQztnQkFDdEMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDeEIsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsQ0FBQzthQUN4QjtZQUNELElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDakI7UUFDRCxPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7Q0E2QkY7QUF0SkQsNEJBc0pDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAcGFja2FnZURvY3VtZW50YXRpb25cbiAqIEBtb2R1bGUgQVBJLUFWTS1JbXBvcnRUeFxuICovXG5pbXBvcnQgeyBCdWZmZXIgfSBmcm9tICdidWZmZXIvJztcbmltcG9ydCBCaW5Ub29scyBmcm9tICcuLi8uLi91dGlscy9iaW50b29scyc7XG5pbXBvcnQgeyBBVk1Db25zdGFudHMgfSBmcm9tICcuL2NvbnN0YW50cyc7XG5pbXBvcnQgeyBUcmFuc2ZlcmFibGVPdXRwdXQgfSBmcm9tICcuL291dHB1dHMnO1xuaW1wb3J0IHsgVHJhbnNmZXJhYmxlSW5wdXQgfSBmcm9tICcuL2lucHV0cyc7XG5pbXBvcnQgeyBCYXNlVHggfSBmcm9tICcuL2Jhc2V0eCc7XG5pbXBvcnQgeyBTZWxlY3RDcmVkZW50aWFsQ2xhc3MgfSBmcm9tICcuL2NyZWRlbnRpYWxzJztcbmltcG9ydCB7IFNpZ25hdHVyZSwgU2lnSWR4LCBDcmVkZW50aWFsIH0gZnJvbSAnLi4vLi4vY29tbW9uL2NyZWRlbnRpYWxzJztcbmltcG9ydCB7IEtleUNoYWluLCBLZXlQYWlyIH0gZnJvbSAnLi9rZXljaGFpbic7XG5pbXBvcnQgeyBEZWZhdWx0TmV0d29ya0lEIH0gZnJvbSAnLi4vLi4vdXRpbHMvY29uc3RhbnRzJztcbmltcG9ydCB7IFNlcmlhbGl6YXRpb24sIFNlcmlhbGl6ZWRFbmNvZGluZyB9IGZyb20gJy4uLy4uL3V0aWxzL3NlcmlhbGl6YXRpb24nO1xuXG4vKipcbiAqIEBpZ25vcmVcbiAqL1xuY29uc3QgYmludG9vbHMgPSBCaW5Ub29scy5nZXRJbnN0YW5jZSgpO1xuY29uc3Qgc2VyaWFsaXplciA9IFNlcmlhbGl6YXRpb24uZ2V0SW5zdGFuY2UoKTtcblxuLyoqXG4gKiBDbGFzcyByZXByZXNlbnRpbmcgYW4gdW5zaWduZWQgSW1wb3J0IHRyYW5zYWN0aW9uLlxuICovXG5leHBvcnQgY2xhc3MgSW1wb3J0VHggZXh0ZW5kcyBCYXNlVHgge1xuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJJbXBvcnRUeFwiO1xuICBwcm90ZWN0ZWQgX3R5cGVJRCA9IEFWTUNvbnN0YW50cy5JTVBPUlRUWDtcblxuICBzZXJpYWxpemUoZW5jb2Rpbmc6U2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIik6b2JqZWN0IHtcbiAgICBsZXQgZmllbGRzOm9iamVjdCA9IHN1cGVyLnNlcmlhbGl6ZShlbmNvZGluZyk7XG4gICAgcmV0dXJuIHtcbiAgICAgIC4uLmZpZWxkcyxcbiAgICAgIFwic291cmNlQ2hhaW5cIjogc2VyaWFsaXplci5lbmNvZGVyKHRoaXMuc291cmNlQ2hhaW4sIGVuY29kaW5nLCBcIkJ1ZmZlclwiLCBcImNiNThcIiksXG4gICAgICBcImltcG9ydEluc1wiOiB0aGlzLmltcG9ydElucy5tYXAoKGkpID0+IGkuc2VyaWFsaXplKGVuY29kaW5nKSlcbiAgICB9XG4gIH07XG4gIGRlc2VyaWFsaXplKGZpZWxkczpvYmplY3QsIGVuY29kaW5nOlNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpIHtcbiAgICBzdXBlci5kZXNlcmlhbGl6ZShmaWVsZHMsIGVuY29kaW5nKTtcbiAgICB0aGlzLnNvdXJjZUNoYWluID0gc2VyaWFsaXplci5kZWNvZGVyKGZpZWxkc1tcInNvdXJjZUNoYWluXCJdLCBlbmNvZGluZywgXCJjYjU4XCIsIFwiQnVmZmVyXCIsIDMyKTtcbiAgICB0aGlzLmltcG9ydElucyA9IGZpZWxkc1tcImltcG9ydEluc1wiXS5tYXAoKGk6b2JqZWN0KSA9PiB7XG4gICAgICBsZXQgaWk6VHJhbnNmZXJhYmxlSW5wdXQgPSBuZXcgVHJhbnNmZXJhYmxlSW5wdXQoKTtcbiAgICAgIGlpLmRlc2VyaWFsaXplKGksIGVuY29kaW5nKTtcbiAgICAgIHJldHVybiBpaTtcbiAgICB9KTtcbiAgICB0aGlzLm51bUlucyA9IEJ1ZmZlci5hbGxvYyg0KTtcbiAgICB0aGlzLm51bUlucy53cml0ZVVJbnQzMkJFKHRoaXMuaW1wb3J0SW5zLmxlbmd0aCwgMCk7XG4gIH1cblxuICBwcm90ZWN0ZWQgc291cmNlQ2hhaW46QnVmZmVyID0gQnVmZmVyLmFsbG9jKDMyKTtcbiAgcHJvdGVjdGVkIG51bUluczpCdWZmZXIgPSBCdWZmZXIuYWxsb2MoNCk7XG4gIHByb3RlY3RlZCBpbXBvcnRJbnM6QXJyYXk8VHJhbnNmZXJhYmxlSW5wdXQ+ID0gW107XG5cbiAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgaWQgb2YgdGhlIFtbSW1wb3J0VHhdXVxuICAgICAqL1xuICBnZXRUeFR5cGUgPSAoKTpudW1iZXIgPT4ge1xuICAgIHJldHVybiB0aGlzLl90eXBlSUQ7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGZvciB0aGUgc291cmNlIGNoYWluaWQuXG4gICAqL1xuICBnZXRTb3VyY2VDaGFpbiA9ICgpOkJ1ZmZlciA9PiB7XG4gICAgcmV0dXJuIHRoaXMuc291cmNlQ2hhaW47XG4gIH1cblxuICAvKipcbiAgICAgKiBUYWtlcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGNvbnRhaW5pbmcgYW4gW1tJbXBvcnRUeF1dLCBwYXJzZXMgaXQsIHBvcHVsYXRlcyB0aGUgY2xhc3MsIGFuZCByZXR1cm5zIHRoZSBsZW5ndGggb2YgdGhlIFtbSW1wb3J0VHhdXSBpbiBieXRlcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBieXRlcyBBIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGNvbnRhaW5pbmcgYSByYXcgW1tJbXBvcnRUeF1dXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBUaGUgbGVuZ3RoIG9mIHRoZSByYXcgW1tJbXBvcnRUeF1dXG4gICAgICpcbiAgICAgKiBAcmVtYXJrcyBhc3N1bWUgbm90LWNoZWNrc3VtbWVkXG4gICAgICovXG4gIGZyb21CdWZmZXIoYnl0ZXM6QnVmZmVyLCBvZmZzZXQ6bnVtYmVyID0gMCk6bnVtYmVyIHtcbiAgICBvZmZzZXQgPSBzdXBlci5mcm9tQnVmZmVyKGJ5dGVzLCBvZmZzZXQpO1xuICAgIHRoaXMuc291cmNlQ2hhaW4gPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyAzMik7XG4gICAgb2Zmc2V0ICs9IDMyO1xuICAgIHRoaXMubnVtSW5zID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgNCk7XG4gICAgb2Zmc2V0ICs9IDQ7XG4gICAgY29uc3QgbnVtSW5zOm51bWJlciA9IHRoaXMubnVtSW5zLnJlYWRVSW50MzJCRSgwKTtcbiAgICBmb3IgKGxldCBpOm51bWJlciA9IDA7IGkgPCBudW1JbnM7IGkrKykge1xuICAgICAgY29uc3QgYW5JbjpUcmFuc2ZlcmFibGVJbnB1dCA9IG5ldyBUcmFuc2ZlcmFibGVJbnB1dCgpO1xuICAgICAgb2Zmc2V0ID0gYW5Jbi5mcm9tQnVmZmVyKGJ5dGVzLCBvZmZzZXQpO1xuICAgICAgdGhpcy5pbXBvcnRJbnMucHVzaChhbkluKTtcbiAgICB9XG4gICAgcmV0dXJuIG9mZnNldDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gcmVwcmVzZW50YXRpb24gb2YgdGhlIFtbSW1wb3J0VHhdXS5cbiAgICovXG4gIHRvQnVmZmVyKCk6QnVmZmVyIHtcbiAgICBpZih0eXBlb2YgdGhpcy5zb3VyY2VDaGFpbiA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSW1wb3J0VHgudG9CdWZmZXIgLS0gdGhpcy5zb3VyY2VDaGFpbiBpcyB1bmRlZmluZWRcIik7XG4gICAgfVxuICAgIHRoaXMubnVtSW5zLndyaXRlVUludDMyQkUodGhpcy5pbXBvcnRJbnMubGVuZ3RoLCAwKTtcbiAgICBsZXQgYmFycjpBcnJheTxCdWZmZXI+ID0gW3N1cGVyLnRvQnVmZmVyKCksIHRoaXMuc291cmNlQ2hhaW4sIHRoaXMubnVtSW5zXTtcbiAgICB0aGlzLmltcG9ydElucyA9IHRoaXMuaW1wb3J0SW5zLnNvcnQoVHJhbnNmZXJhYmxlSW5wdXQuY29tcGFyYXRvcigpKTtcbiAgICBmb3IobGV0IGkgPSAwOyBpIDwgdGhpcy5pbXBvcnRJbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgYmFyci5wdXNoKHRoaXMuaW1wb3J0SW5zW2ldLnRvQnVmZmVyKCkpO1xuICAgIH1cbiAgICByZXR1cm4gQnVmZmVyLmNvbmNhdChiYXJyKTtcbiAgfVxuICAvKipcbiAgICAgKiBSZXR1cm5zIGFuIGFycmF5IG9mIFtbVHJhbnNmZXJhYmxlSW5wdXRdXXMgaW4gdGhpcyB0cmFuc2FjdGlvbi5cbiAgICAgKi9cbiAgZ2V0SW1wb3J0SW5wdXRzKCk6QXJyYXk8VHJhbnNmZXJhYmxlSW5wdXQ+IHtcbiAgICByZXR1cm4gdGhpcy5pbXBvcnRJbnM7XG4gIH1cblxuICBjbG9uZSgpOnRoaXMge1xuICAgIGxldCBuZXdiYXNlOkltcG9ydFR4ID0gbmV3IEltcG9ydFR4KCk7XG4gICAgbmV3YmFzZS5mcm9tQnVmZmVyKHRoaXMudG9CdWZmZXIoKSk7XG4gICAgcmV0dXJuIG5ld2Jhc2UgYXMgdGhpcztcbiAgfVxuXG4gIGNyZWF0ZSguLi5hcmdzOmFueVtdKTp0aGlzIHtcbiAgICAgIHJldHVybiBuZXcgSW1wb3J0VHgoLi4uYXJncykgYXMgdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgICAqIFRha2VzIHRoZSBieXRlcyBvZiBhbiBbW1Vuc2lnbmVkVHhdXSBhbmQgcmV0dXJucyBhbiBhcnJheSBvZiBbW0NyZWRlbnRpYWxdXXNcbiAgICAgKlxuICAgICAqIEBwYXJhbSBtc2cgQSBCdWZmZXIgZm9yIHRoZSBbW1Vuc2lnbmVkVHhdXVxuICAgICAqIEBwYXJhbSBrYyBBbiBbW0tleUNoYWluXV0gdXNlZCBpbiBzaWduaW5nXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBBbiBhcnJheSBvZiBbW0NyZWRlbnRpYWxdXXNcbiAgICAgKi9cbiAgc2lnbihtc2c6QnVmZmVyLCBrYzpLZXlDaGFpbik6QXJyYXk8Q3JlZGVudGlhbD4ge1xuICAgIGNvbnN0IHNpZ3M6QXJyYXk8Q3JlZGVudGlhbD4gPSBzdXBlci5zaWduKG1zZywga2MpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5pbXBvcnRJbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGNyZWQ6Q3JlZGVudGlhbCA9IFNlbGVjdENyZWRlbnRpYWxDbGFzcyh0aGlzLmltcG9ydEluc1tpXS5nZXRJbnB1dCgpLmdldENyZWRlbnRpYWxJRCgpKTtcbiAgICAgIGNvbnN0IHNpZ2lkeHM6QXJyYXk8U2lnSWR4PiA9IHRoaXMuaW1wb3J0SW5zW2ldLmdldElucHV0KCkuZ2V0U2lnSWR4cygpO1xuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBzaWdpZHhzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgIGNvbnN0IGtleXBhaXI6S2V5UGFpciA9IGtjLmdldEtleShzaWdpZHhzW2pdLmdldFNvdXJjZSgpKTtcbiAgICAgICAgY29uc3Qgc2lnbnZhbDpCdWZmZXIgPSBrZXlwYWlyLnNpZ24obXNnKTtcbiAgICAgICAgY29uc3Qgc2lnOlNpZ25hdHVyZSA9IG5ldyBTaWduYXR1cmUoKTtcbiAgICAgICAgc2lnLmZyb21CdWZmZXIoc2lnbnZhbCk7XG4gICAgICAgIGNyZWQuYWRkU2lnbmF0dXJlKHNpZyk7XG4gICAgICB9XG4gICAgICBzaWdzLnB1c2goY3JlZCk7XG4gICAgfVxuICAgIHJldHVybiBzaWdzO1xuICB9XG5cbiAgLyoqXG4gICAqIENsYXNzIHJlcHJlc2VudGluZyBhbiB1bnNpZ25lZCBJbXBvcnQgdHJhbnNhY3Rpb24uXG4gICAqXG4gICAqIEBwYXJhbSBuZXR3b3JraWQgT3B0aW9uYWwgbmV0d29ya2lkLCBbW0RlZmF1bHROZXR3b3JrSURdXVxuICAgKiBAcGFyYW0gYmxvY2tjaGFpbmlkIE9wdGlvbmFsIGJsb2NrY2hhaW5pZCwgZGVmYXVsdCBCdWZmZXIuYWxsb2MoMzIsIDE2KVxuICAgKiBAcGFyYW0gb3V0cyBPcHRpb25hbCBhcnJheSBvZiB0aGUgW1tUcmFuc2ZlcmFibGVPdXRwdXRdXXNcbiAgICogQHBhcmFtIGlucyBPcHRpb25hbCBhcnJheSBvZiB0aGUgW1tUcmFuc2ZlcmFibGVJbnB1dF1dc1xuICAgKiBAcGFyYW0gbWVtbyBPcHRpb25hbCB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBmb3IgdGhlIG1lbW8gZmllbGRcbiAgICogQHBhcmFtIHNvdXJjZUNoYWluIE9wdGlvbmFsIGNoYWluaWQgZm9yIHRoZSBzb3VyY2UgaW5wdXRzIHRvIGltcG9ydC4gRGVmYXVsdCBwbGF0Zm9ybSBjaGFpbmlkLlxuICAgKiBAcGFyYW0gaW1wb3J0SW5zIEFycmF5IG9mIFtbVHJhbnNmZXJhYmxlSW5wdXRdXXMgdXNlZCBpbiB0aGUgdHJhbnNhY3Rpb25cbiAgICovXG4gIGNvbnN0cnVjdG9yKFxuICAgIG5ldHdvcmtpZDpudW1iZXIgPSBEZWZhdWx0TmV0d29ya0lELCBibG9ja2NoYWluaWQ6QnVmZmVyID0gQnVmZmVyLmFsbG9jKDMyLCAxNiksIFxuICAgIG91dHM6QXJyYXk8VHJhbnNmZXJhYmxlT3V0cHV0PiA9IHVuZGVmaW5lZCwgaW5zOkFycmF5PFRyYW5zZmVyYWJsZUlucHV0PiA9IHVuZGVmaW5lZCxcbiAgICBtZW1vOkJ1ZmZlciA9IHVuZGVmaW5lZCwgc291cmNlQ2hhaW46QnVmZmVyID0gdW5kZWZpbmVkLCBpbXBvcnRJbnM6QXJyYXk8VHJhbnNmZXJhYmxlSW5wdXQ+ID0gdW5kZWZpbmVkXG4gICkge1xuICAgIHN1cGVyKG5ldHdvcmtpZCwgYmxvY2tjaGFpbmlkLCBvdXRzLCBpbnMsIG1lbW8pO1xuICAgIHRoaXMuc291cmNlQ2hhaW4gPSBzb3VyY2VDaGFpbjsgLy8gZG8gbm90IGNvcnJlY3QsIGlmIGl0J3Mgd3JvbmcgaXQnbGwgYm9tYiBvbiB0b0J1ZmZlclxuICAgIGlmICh0eXBlb2YgaW1wb3J0SW5zICE9PSAndW5kZWZpbmVkJyAmJiBBcnJheS5pc0FycmF5KGltcG9ydElucykpIHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaW1wb3J0SW5zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmICghKGltcG9ydEluc1tpXSBpbnN0YW5jZW9mIFRyYW5zZmVyYWJsZUlucHV0KSkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkVycm9yIC0gSW1wb3J0VHguY29uc3RydWN0b3I6IGludmFsaWQgVHJhbnNmZXJhYmxlSW5wdXQgaW4gYXJyYXkgcGFyYW1ldGVyICdpbXBvcnRJbnMnXCIpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB0aGlzLmltcG9ydElucyA9IGltcG9ydElucztcbiAgICB9XG4gIH1cbn0iXX0=