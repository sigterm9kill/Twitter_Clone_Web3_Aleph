"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportTx = void 0;
/**
 * @packageDocumentation
 * @module API-AVM-ExportTx
 */
const buffer_1 = require("buffer/");
const bintools_1 = __importDefault(require("../../utils/bintools"));
const constants_1 = require("./constants");
const outputs_1 = require("./outputs");
const basetx_1 = require("./basetx");
const constants_2 = require("../../utils/constants");
const bn_js_1 = __importDefault(require("bn.js"));
const serialization_1 = require("../../utils/serialization");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
const serializer = serialization_1.Serialization.getInstance();
/**
 * Class representing an unsigned Export transaction.
 */
class ExportTx extends basetx_1.BaseTx {
    /**
       * Class representing an unsigned Export transaction.
       *
       * @param networkid Optional networkid, [[DefaultNetworkID]]
       * @param blockchainid Optional blockchainid, default Buffer.alloc(32, 16)
       * @param outs Optional array of the [[TransferableOutput]]s
       * @param ins Optional array of the [[TransferableInput]]s
       * @param memo Optional {@link https://github.com/feross/buffer|Buffer} for the memo field
       * @param destinationChain Optional chainid which identifies where the funds will sent to
       * @param exportOuts Array of [[TransferableOutputs]]s used in the transaction
       */
    constructor(networkid = constants_2.DefaultNetworkID, blockchainid = buffer_1.Buffer.alloc(32, 16), outs = undefined, ins = undefined, memo = undefined, destinationChain = undefined, exportOuts = undefined) {
        super(networkid, blockchainid, outs, ins, memo);
        this._typeName = "ExportTx";
        this._typeID = constants_1.AVMConstants.EXPORTTX;
        this.destinationChain = undefined;
        this.numOuts = buffer_1.Buffer.alloc(4);
        this.exportOuts = [];
        /**
           * Returns the id of the [[ExportTx]]
           */
        this.getTxType = () => {
            return this._typeID;
        };
        /**
         * Returns a {@link https://github.com/feross/buffer|Buffer} for the destination chainid.
         */
        this.getDestinationChain = () => {
            return this.destinationChain;
        };
        this.destinationChain = destinationChain; // no correction, if they don't pass a chainid here, it will BOMB on toBuffer
        if (typeof exportOuts !== 'undefined' && Array.isArray(exportOuts)) {
            for (let i = 0; i < exportOuts.length; i++) {
                if (!(exportOuts[i] instanceof outputs_1.TransferableOutput)) {
                    throw new Error("Error - ExportTx.constructor: invalid TransferableOutput in array parameter 'exportOuts'");
                }
            }
            this.exportOuts = exportOuts;
        }
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { "destinationChain": serializer.encoder(this.destinationChain, encoding, "Buffer", "cb58"), "exportOuts": this.exportOuts.map((e) => e.serialize(encoding)) });
    }
    ;
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.destinationChain = serializer.decoder(fields["destinationChain"], encoding, "cb58", "Buffer", 32);
        this.exportOuts = fields["exportOuts"].map((e) => {
            let eo = new outputs_1.TransferableOutput();
            eo.deserialize(e, encoding);
            return eo;
        });
        this.numOuts = buffer_1.Buffer.alloc(4);
        this.numOuts.writeUInt32BE(this.exportOuts.length, 0);
    }
    /**
     * Returns an array of [[TransferableOutput]]s in this transaction.
     */
    getExportOutputs() {
        return this.exportOuts;
    }
    /**
     * Returns the totall exported amount as a {@link https://github.com/indutny/bn.js/|BN}.
     */
    getExportTotal() {
        let val = new bn_js_1.default(0);
        for (let i = 0; i < this.exportOuts.length; i++) {
            val = val.add(this.exportOuts[i].getOutput().getAmount());
        }
        return val;
    }
    getTotalOuts() {
        return [...this.getOuts(), ...this.getExportOutputs()];
    }
    /**
       * Takes a {@link https://github.com/feross/buffer|Buffer} containing an [[ExportTx]], parses it, populates the class, and returns the length of the [[ExportTx]] in bytes.
       *
       * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[ExportTx]]
       *
       * @returns The length of the raw [[ExportTx]]
       *
       * @remarks assume not-checksummed
       */
    fromBuffer(bytes, offset = 0) {
        offset = super.fromBuffer(bytes, offset);
        this.destinationChain = bintools.copyFrom(bytes, offset, offset + 32);
        offset += 32;
        this.numOuts = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        const numOuts = this.numOuts.readUInt32BE(0);
        for (let i = 0; i < numOuts; i++) {
            const anOut = new outputs_1.TransferableOutput();
            offset = anOut.fromBuffer(bytes, offset);
            this.exportOuts.push(anOut);
        }
        return offset;
    }
    /**
       * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[ExportTx]].
       */
    toBuffer() {
        if (typeof this.destinationChain === "undefined") {
            throw new Error("ExportTx.toBuffer -- this.destinationChain is undefined");
        }
        this.numOuts.writeUInt32BE(this.exportOuts.length, 0);
        let barr = [super.toBuffer(), this.destinationChain, this.numOuts];
        this.exportOuts = this.exportOuts.sort(outputs_1.TransferableOutput.comparator());
        for (let i = 0; i < this.exportOuts.length; i++) {
            barr.push(this.exportOuts[i].toBuffer());
        }
        return buffer_1.Buffer.concat(barr);
    }
    clone() {
        let newbase = new ExportTx();
        newbase.fromBuffer(this.toBuffer());
        return newbase;
    }
    create(...args) {
        return new ExportTx(...args);
    }
}
exports.ExportTx = ExportTx;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhwb3J0dHguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvYXBpcy9hdm0vZXhwb3J0dHgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUE7OztHQUdHO0FBQ0gsb0NBQWlDO0FBQ2pDLG9FQUE0QztBQUM1QywyQ0FBMkM7QUFDM0MsdUNBQTZEO0FBRTdELHFDQUFrQztBQUNsQyxxREFBeUQ7QUFDekQsa0RBQXVCO0FBQ3ZCLDZEQUE4RTtBQUc5RTs7R0FFRztBQUNILE1BQU0sUUFBUSxHQUFHLGtCQUFRLENBQUMsV0FBVyxFQUFFLENBQUM7QUFDeEMsTUFBTSxVQUFVLEdBQUcsNkJBQWEsQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUUvQzs7R0FFRztBQUNILE1BQWEsUUFBUyxTQUFRLGVBQU07SUFrSGxDOzs7Ozs7Ozs7O1NBVUs7SUFDTCxZQUNFLFlBQW1CLDRCQUFnQixFQUFFLGVBQXNCLGVBQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUMvRSxPQUFpQyxTQUFTLEVBQUUsTUFBK0IsU0FBUyxFQUNwRixPQUFjLFNBQVMsRUFBRSxtQkFBMEIsU0FBUyxFQUFFLGFBQXVDLFNBQVM7UUFFOUcsS0FBSyxDQUFDLFNBQVMsRUFBRSxZQUFZLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQztRQWpJeEMsY0FBUyxHQUFHLFVBQVUsQ0FBQztRQUN2QixZQUFPLEdBQUcsd0JBQVksQ0FBQyxRQUFRLENBQUM7UUFzQmhDLHFCQUFnQixHQUFVLFNBQVMsQ0FBQztRQUNwQyxZQUFPLEdBQVUsZUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNqQyxlQUFVLEdBQTZCLEVBQUUsQ0FBQztRQUVwRDs7YUFFSztRQUNMLGNBQVMsR0FBRyxHQUFVLEVBQUU7WUFDdEIsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDO1FBQ3RCLENBQUMsQ0FBQTtRQXdCRDs7V0FF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Q3RELElBQUksSUFBSSxHQUFpQixDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsRUFBRSxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ2pGLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsNEJBQWtCLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQztRQUN4RSxLQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDNUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7U0FDNUM7UUFDRCxPQUFPLGVBQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDN0IsQ0FBQztJQUVELEtBQUs7UUFDSCxJQUFJLE9BQU8sR0FBWSxJQUFJLFFBQVEsRUFBRSxDQUFDO1FBQ3RDLE9BQU8sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7UUFDcEMsT0FBTyxPQUFlLENBQUM7SUFDekIsQ0FBQztJQUVELE1BQU0sQ0FBQyxHQUFHLElBQVU7UUFDaEIsT0FBTyxJQUFJLFFBQVEsQ0FBQyxHQUFHLElBQUksQ0FBUyxDQUFDO0lBQ3pDLENBQUM7Q0E2QkY7QUE3SUQsNEJBNklDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAcGFja2FnZURvY3VtZW50YXRpb25cbiAqIEBtb2R1bGUgQVBJLUFWTS1FeHBvcnRUeFxuICovXG5pbXBvcnQgeyBCdWZmZXIgfSBmcm9tICdidWZmZXIvJztcbmltcG9ydCBCaW5Ub29scyBmcm9tICcuLi8uLi91dGlscy9iaW50b29scyc7XG5pbXBvcnQgeyBBVk1Db25zdGFudHMgfSBmcm9tICcuL2NvbnN0YW50cyc7XG5pbXBvcnQgeyBUcmFuc2ZlcmFibGVPdXRwdXQsIEFtb3VudE91dHB1dCB9IGZyb20gJy4vb3V0cHV0cyc7XG5pbXBvcnQgeyBUcmFuc2ZlcmFibGVJbnB1dCB9IGZyb20gJy4vaW5wdXRzJztcbmltcG9ydCB7IEJhc2VUeCB9IGZyb20gJy4vYmFzZXR4JztcbmltcG9ydCB7IERlZmF1bHROZXR3b3JrSUQgfSBmcm9tICcuLi8uLi91dGlscy9jb25zdGFudHMnO1xuaW1wb3J0IEJOIGZyb20gJ2JuLmpzJztcbmltcG9ydCB7IFNlcmlhbGl6YXRpb24sIFNlcmlhbGl6ZWRFbmNvZGluZyB9IGZyb20gJy4uLy4uL3V0aWxzL3NlcmlhbGl6YXRpb24nO1xuXG5cbi8qKlxuICogQGlnbm9yZVxuICovXG5jb25zdCBiaW50b29scyA9IEJpblRvb2xzLmdldEluc3RhbmNlKCk7XG5jb25zdCBzZXJpYWxpemVyID0gU2VyaWFsaXphdGlvbi5nZXRJbnN0YW5jZSgpO1xuXG4vKipcbiAqIENsYXNzIHJlcHJlc2VudGluZyBhbiB1bnNpZ25lZCBFeHBvcnQgdHJhbnNhY3Rpb24uXG4gKi9cbmV4cG9ydCBjbGFzcyBFeHBvcnRUeCBleHRlbmRzIEJhc2VUeCB7XG4gIHByb3RlY3RlZCBfdHlwZU5hbWUgPSBcIkV4cG9ydFR4XCI7XG4gIHByb3RlY3RlZCBfdHlwZUlEID0gQVZNQ29uc3RhbnRzLkVYUE9SVFRYO1xuXG4gIHNlcmlhbGl6ZShlbmNvZGluZzpTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKTpvYmplY3Qge1xuICAgIGxldCBmaWVsZHM6b2JqZWN0ID0gc3VwZXIuc2VyaWFsaXplKGVuY29kaW5nKTtcbiAgICByZXR1cm4ge1xuICAgICAgLi4uZmllbGRzLFxuICAgICAgXCJkZXN0aW5hdGlvbkNoYWluXCI6IHNlcmlhbGl6ZXIuZW5jb2Rlcih0aGlzLmRlc3RpbmF0aW9uQ2hhaW4sIGVuY29kaW5nLCBcIkJ1ZmZlclwiLCBcImNiNThcIiksXG4gICAgICBcImV4cG9ydE91dHNcIjogdGhpcy5leHBvcnRPdXRzLm1hcCgoZSkgPT4gZS5zZXJpYWxpemUoZW5jb2RpbmcpKVxuICAgIH1cbiAgfTtcbiAgZGVzZXJpYWxpemUoZmllbGRzOm9iamVjdCwgZW5jb2Rpbmc6U2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIikge1xuICAgIHN1cGVyLmRlc2VyaWFsaXplKGZpZWxkcywgZW5jb2RpbmcpO1xuICAgIHRoaXMuZGVzdGluYXRpb25DaGFpbiA9IHNlcmlhbGl6ZXIuZGVjb2RlcihmaWVsZHNbXCJkZXN0aW5hdGlvbkNoYWluXCJdLCBlbmNvZGluZywgXCJjYjU4XCIsIFwiQnVmZmVyXCIsIDMyKTtcbiAgICB0aGlzLmV4cG9ydE91dHMgPSBmaWVsZHNbXCJleHBvcnRPdXRzXCJdLm1hcCgoZTpvYmplY3QpID0+IHtcbiAgICAgIGxldCBlbzpUcmFuc2ZlcmFibGVPdXRwdXQgPSBuZXcgVHJhbnNmZXJhYmxlT3V0cHV0KCk7XG4gICAgICBlby5kZXNlcmlhbGl6ZShlLCBlbmNvZGluZyk7XG4gICAgICByZXR1cm4gZW87XG4gICAgfSk7XG4gICAgdGhpcy5udW1PdXRzID0gQnVmZmVyLmFsbG9jKDQpO1xuICAgIHRoaXMubnVtT3V0cy53cml0ZVVJbnQzMkJFKHRoaXMuZXhwb3J0T3V0cy5sZW5ndGgsIDApO1xuICB9XG5cbiAgcHJvdGVjdGVkIGRlc3RpbmF0aW9uQ2hhaW46QnVmZmVyID0gdW5kZWZpbmVkO1xuICBwcm90ZWN0ZWQgbnVtT3V0czpCdWZmZXIgPSBCdWZmZXIuYWxsb2MoNCk7XG4gIHByb3RlY3RlZCBleHBvcnRPdXRzOkFycmF5PFRyYW5zZmVyYWJsZU91dHB1dD4gPSBbXTtcblxuICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBpZCBvZiB0aGUgW1tFeHBvcnRUeF1dXG4gICAgICovXG4gIGdldFR4VHlwZSA9ICgpOm51bWJlciA9PiB7XG4gICAgcmV0dXJuIHRoaXMuX3R5cGVJRDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGFuIGFycmF5IG9mIFtbVHJhbnNmZXJhYmxlT3V0cHV0XV1zIGluIHRoaXMgdHJhbnNhY3Rpb24uXG4gICAqL1xuICBnZXRFeHBvcnRPdXRwdXRzKCk6QXJyYXk8VHJhbnNmZXJhYmxlT3V0cHV0PiB7XG4gICAgcmV0dXJuIHRoaXMuZXhwb3J0T3V0cztcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSB0b3RhbGwgZXhwb3J0ZWQgYW1vdW50IGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn0uXG4gICAqL1xuICBnZXRFeHBvcnRUb3RhbCgpOkJOIHtcbiAgICBsZXQgdmFsOkJOID0gbmV3IEJOKDApO1xuICAgIGZvcihsZXQgaSA9IDA7IGkgPCB0aGlzLmV4cG9ydE91dHMubGVuZ3RoOyBpKyspe1xuICAgICAgdmFsID0gdmFsLmFkZCgodGhpcy5leHBvcnRPdXRzW2ldLmdldE91dHB1dCgpIGFzIEFtb3VudE91dHB1dCkuZ2V0QW1vdW50KCkpO1xuICAgIH1cbiAgICByZXR1cm4gdmFsO1xuICB9XG5cbiAgZ2V0VG90YWxPdXRzKCk6QXJyYXk8VHJhbnNmZXJhYmxlT3V0cHV0PiB7XG4gICAgcmV0dXJuIFsuLi50aGlzLmdldE91dHMoKSBhcyBBcnJheTxUcmFuc2ZlcmFibGVPdXRwdXQ+LCAuLi50aGlzLmdldEV4cG9ydE91dHB1dHMoKV07XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGZvciB0aGUgZGVzdGluYXRpb24gY2hhaW5pZC5cbiAgICovXG4gIGdldERlc3RpbmF0aW9uQ2hhaW4gPSAoKTpCdWZmZXIgPT4ge1xuICAgIHJldHVybiB0aGlzLmRlc3RpbmF0aW9uQ2hhaW47XG4gIH1cblxuICAvKipcbiAgICAgKiBUYWtlcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGNvbnRhaW5pbmcgYW4gW1tFeHBvcnRUeF1dLCBwYXJzZXMgaXQsIHBvcHVsYXRlcyB0aGUgY2xhc3MsIGFuZCByZXR1cm5zIHRoZSBsZW5ndGggb2YgdGhlIFtbRXhwb3J0VHhdXSBpbiBieXRlcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBieXRlcyBBIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGNvbnRhaW5pbmcgYSByYXcgW1tFeHBvcnRUeF1dXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBUaGUgbGVuZ3RoIG9mIHRoZSByYXcgW1tFeHBvcnRUeF1dXG4gICAgICpcbiAgICAgKiBAcmVtYXJrcyBhc3N1bWUgbm90LWNoZWNrc3VtbWVkXG4gICAgICovXG4gIGZyb21CdWZmZXIoYnl0ZXM6QnVmZmVyLCBvZmZzZXQ6bnVtYmVyID0gMCk6bnVtYmVyIHtcbiAgICBvZmZzZXQgPSBzdXBlci5mcm9tQnVmZmVyKGJ5dGVzLCBvZmZzZXQpO1xuICAgIHRoaXMuZGVzdGluYXRpb25DaGFpbiA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDMyKTtcbiAgICBvZmZzZXQgKz0gMzI7XG4gICAgdGhpcy5udW1PdXRzID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgNCk7XG4gICAgb2Zmc2V0ICs9IDQ7XG4gICAgY29uc3QgbnVtT3V0czpudW1iZXIgPSB0aGlzLm51bU91dHMucmVhZFVJbnQzMkJFKDApO1xuICAgIGZvciAobGV0IGk6bnVtYmVyID0gMDsgaSA8IG51bU91dHM7IGkrKykge1xuICAgICAgY29uc3QgYW5PdXQ6VHJhbnNmZXJhYmxlT3V0cHV0ID0gbmV3IFRyYW5zZmVyYWJsZU91dHB1dCgpO1xuICAgICAgb2Zmc2V0ID0gYW5PdXQuZnJvbUJ1ZmZlcihieXRlcywgb2Zmc2V0KTtcbiAgICAgIHRoaXMuZXhwb3J0T3V0cy5wdXNoKGFuT3V0KTtcbiAgICB9XG4gICAgcmV0dXJuIG9mZnNldDtcbiAgfVxuXG4gIC8qKlxuICAgICAqIFJldHVybnMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSByZXByZXNlbnRhdGlvbiBvZiB0aGUgW1tFeHBvcnRUeF1dLlxuICAgICAqL1xuICB0b0J1ZmZlcigpOkJ1ZmZlciB7XG4gICAgaWYodHlwZW9mIHRoaXMuZGVzdGluYXRpb25DaGFpbiA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRXhwb3J0VHgudG9CdWZmZXIgLS0gdGhpcy5kZXN0aW5hdGlvbkNoYWluIGlzIHVuZGVmaW5lZFwiKTtcbiAgICB9XG4gICAgdGhpcy5udW1PdXRzLndyaXRlVUludDMyQkUodGhpcy5leHBvcnRPdXRzLmxlbmd0aCwgMCk7XG4gICAgbGV0IGJhcnI6QXJyYXk8QnVmZmVyPiA9IFtzdXBlci50b0J1ZmZlcigpLCB0aGlzLmRlc3RpbmF0aW9uQ2hhaW4sIHRoaXMubnVtT3V0c107XG4gICAgdGhpcy5leHBvcnRPdXRzID0gdGhpcy5leHBvcnRPdXRzLnNvcnQoVHJhbnNmZXJhYmxlT3V0cHV0LmNvbXBhcmF0b3IoKSk7XG4gICAgZm9yKGxldCBpID0gMDsgaSA8IHRoaXMuZXhwb3J0T3V0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBiYXJyLnB1c2godGhpcy5leHBvcnRPdXRzW2ldLnRvQnVmZmVyKCkpO1xuICAgIH1cbiAgICByZXR1cm4gQnVmZmVyLmNvbmNhdChiYXJyKTtcbiAgfVxuXG4gIGNsb25lKCk6dGhpcyB7XG4gICAgbGV0IG5ld2Jhc2U6RXhwb3J0VHggPSBuZXcgRXhwb3J0VHgoKTtcbiAgICBuZXdiYXNlLmZyb21CdWZmZXIodGhpcy50b0J1ZmZlcigpKTtcbiAgICByZXR1cm4gbmV3YmFzZSBhcyB0aGlzO1xuICB9XG5cbiAgY3JlYXRlKC4uLmFyZ3M6YW55W10pOnRoaXMge1xuICAgICAgcmV0dXJuIG5ldyBFeHBvcnRUeCguLi5hcmdzKSBhcyB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAgICogQ2xhc3MgcmVwcmVzZW50aW5nIGFuIHVuc2lnbmVkIEV4cG9ydCB0cmFuc2FjdGlvbi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBuZXR3b3JraWQgT3B0aW9uYWwgbmV0d29ya2lkLCBbW0RlZmF1bHROZXR3b3JrSURdXVxuICAgICAqIEBwYXJhbSBibG9ja2NoYWluaWQgT3B0aW9uYWwgYmxvY2tjaGFpbmlkLCBkZWZhdWx0IEJ1ZmZlci5hbGxvYygzMiwgMTYpXG4gICAgICogQHBhcmFtIG91dHMgT3B0aW9uYWwgYXJyYXkgb2YgdGhlIFtbVHJhbnNmZXJhYmxlT3V0cHV0XV1zXG4gICAgICogQHBhcmFtIGlucyBPcHRpb25hbCBhcnJheSBvZiB0aGUgW1tUcmFuc2ZlcmFibGVJbnB1dF1dc1xuICAgICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGZvciB0aGUgbWVtbyBmaWVsZFxuICAgICAqIEBwYXJhbSBkZXN0aW5hdGlvbkNoYWluIE9wdGlvbmFsIGNoYWluaWQgd2hpY2ggaWRlbnRpZmllcyB3aGVyZSB0aGUgZnVuZHMgd2lsbCBzZW50IHRvXG4gICAgICogQHBhcmFtIGV4cG9ydE91dHMgQXJyYXkgb2YgW1tUcmFuc2ZlcmFibGVPdXRwdXRzXV1zIHVzZWQgaW4gdGhlIHRyYW5zYWN0aW9uXG4gICAgICovXG4gIGNvbnN0cnVjdG9yKFxuICAgIG5ldHdvcmtpZDpudW1iZXIgPSBEZWZhdWx0TmV0d29ya0lELCBibG9ja2NoYWluaWQ6QnVmZmVyID0gQnVmZmVyLmFsbG9jKDMyLCAxNiksIFxuICAgIG91dHM6QXJyYXk8VHJhbnNmZXJhYmxlT3V0cHV0PiA9IHVuZGVmaW5lZCwgaW5zOkFycmF5PFRyYW5zZmVyYWJsZUlucHV0PiA9IHVuZGVmaW5lZCxcbiAgICBtZW1vOkJ1ZmZlciA9IHVuZGVmaW5lZCwgZGVzdGluYXRpb25DaGFpbjpCdWZmZXIgPSB1bmRlZmluZWQsIGV4cG9ydE91dHM6QXJyYXk8VHJhbnNmZXJhYmxlT3V0cHV0PiA9IHVuZGVmaW5lZFxuICApIHtcbiAgICBzdXBlcihuZXR3b3JraWQsIGJsb2NrY2hhaW5pZCwgb3V0cywgaW5zLCBtZW1vKTtcbiAgICB0aGlzLmRlc3RpbmF0aW9uQ2hhaW4gPSBkZXN0aW5hdGlvbkNoYWluOyAvLyBubyBjb3JyZWN0aW9uLCBpZiB0aGV5IGRvbid0IHBhc3MgYSBjaGFpbmlkIGhlcmUsIGl0IHdpbGwgQk9NQiBvbiB0b0J1ZmZlclxuICAgIGlmICh0eXBlb2YgZXhwb3J0T3V0cyAhPT0gJ3VuZGVmaW5lZCcgJiYgQXJyYXkuaXNBcnJheShleHBvcnRPdXRzKSkge1xuICAgICAgZm9yIChsZXQgaTpudW1iZXIgPSAwOyBpIDwgZXhwb3J0T3V0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoIShleHBvcnRPdXRzW2ldIGluc3RhbmNlb2YgVHJhbnNmZXJhYmxlT3V0cHV0KSkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkVycm9yIC0gRXhwb3J0VHguY29uc3RydWN0b3I6IGludmFsaWQgVHJhbnNmZXJhYmxlT3V0cHV0IGluIGFycmF5IHBhcmFtZXRlciAnZXhwb3J0T3V0cydcIik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRoaXMuZXhwb3J0T3V0cyA9IGV4cG9ydE91dHM7XG4gICAgfVxuICB9XG59Il19