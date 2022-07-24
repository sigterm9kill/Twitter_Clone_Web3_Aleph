"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Credential = exports.Signature = exports.SigIdx = void 0;
/**
 * @packageDocumentation
 * @module Common-Signature
 */
const nbytes_1 = require("./nbytes");
const buffer_1 = require("buffer/");
const bintools_1 = __importDefault(require("../utils/bintools"));
const serialization_1 = require("../utils/serialization");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
const serializer = serialization_1.Serialization.getInstance();
/**
 * Type representing a [[Signature]] index used in [[Input]]
 */
class SigIdx extends nbytes_1.NBytes {
    /**
     * Type representing a [[Signature]] index used in [[Input]]
     */
    constructor() {
        super();
        this._typeName = "SigIdx";
        this._typeID = undefined;
        this.source = buffer_1.Buffer.alloc(20);
        this.bytes = buffer_1.Buffer.alloc(4);
        this.bsize = 4;
        /**
         * Sets the source address for the signature
         */
        this.setSource = (address) => {
            this.source = address;
        };
        /**
         * Retrieves the source address for the signature
         */
        this.getSource = () => this.source;
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { "source": serializer.encoder(this.source, encoding, "Buffer", "hex") });
    }
    ;
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.source = serializer.decoder(fields["source"], encoding, "hex", "Buffer");
    }
    clone() {
        let newbase = new SigIdx();
        newbase.fromBuffer(this.toBuffer());
        return newbase;
    }
    create(...args) {
        return new SigIdx();
    }
}
exports.SigIdx = SigIdx;
/**
 * Signature for a [[Tx]]
 */
class Signature extends nbytes_1.NBytes {
    /**
     * Signature for a [[Tx]]
     */
    constructor() {
        super();
        this._typeName = "Signature";
        this._typeID = undefined;
        //serialize and deserialize both are inherited
        this.bytes = buffer_1.Buffer.alloc(65);
        this.bsize = 65;
    }
    clone() {
        let newbase = new Signature();
        newbase.fromBuffer(this.toBuffer());
        return newbase;
    }
    create(...args) {
        return new Signature();
    }
}
exports.Signature = Signature;
class Credential extends serialization_1.Serializable {
    constructor(sigarray = undefined) {
        super();
        this._typeName = "Credential";
        this._typeID = undefined;
        this.sigArray = [];
        /**
           * Adds a signature to the credentials and returns the index off the added signature.
           */
        this.addSignature = (sig) => {
            this.sigArray.push(sig);
            return this.sigArray.length - 1;
        };
        if (typeof sigarray !== 'undefined') {
            /* istanbul ignore next */
            this.sigArray = sigarray;
        }
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { "sigArray": this.sigArray.map((s) => s.serialize(encoding)) });
    }
    ;
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.sigArray = fields["sigArray"].map((s) => {
            let sig = new Signature();
            sig.deserialize(s, encoding);
            return sig;
        });
    }
    fromBuffer(bytes, offset = 0) {
        const siglen = bintools.copyFrom(bytes, offset, offset + 4).readUInt32BE(0);
        offset += 4;
        this.sigArray = [];
        for (let i = 0; i < siglen; i++) {
            const sig = new Signature();
            offset = sig.fromBuffer(bytes, offset);
            this.sigArray.push(sig);
        }
        return offset;
    }
    toBuffer() {
        const siglen = buffer_1.Buffer.alloc(4);
        siglen.writeInt32BE(this.sigArray.length, 0);
        const barr = [siglen];
        let bsize = siglen.length;
        for (let i = 0; i < this.sigArray.length; i++) {
            const sigbuff = this.sigArray[i].toBuffer();
            bsize += sigbuff.length;
            barr.push(sigbuff);
        }
        return buffer_1.Buffer.concat(barr, bsize);
    }
}
exports.Credential = Credential;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlZGVudGlhbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvY29tbW9uL2NyZWRlbnRpYWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBOzs7R0FHRztBQUNILHFDQUFrQztBQUNsQyxvQ0FBaUM7QUFDakMsaUVBQXlDO0FBQ3pDLDBEQUF5RjtBQUd6Rjs7R0FFRztBQUNILE1BQU0sUUFBUSxHQUFZLGtCQUFRLENBQUMsV0FBVyxFQUFFLENBQUM7QUFDakQsTUFBTSxVQUFVLEdBQUcsNkJBQWEsQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUUvQzs7R0FFRztBQUNILE1BQWEsTUFBTyxTQUFRLGVBQU07SUEyQ2hDOztPQUVHO0lBQ0g7UUFDSSxLQUFLLEVBQUUsQ0FBQztRQTlDRixjQUFTLEdBQUcsUUFBUSxDQUFDO1FBQ3JCLFlBQU8sR0FBRyxTQUFTLENBQUM7UUFjcEIsV0FBTSxHQUFVLGVBQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDakMsVUFBSyxHQUFHLGVBQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDeEIsVUFBSyxHQUFHLENBQUMsQ0FBQztRQUVwQjs7V0FFRztRQUNILGNBQVMsR0FBRyxDQUFDLE9BQWMsRUFBRSxFQUFFO1lBQzNCLElBQUksQ0FBQyxNQUFNLEdBQUcsT0FBTyxDQUFDO1FBQzFCLENBQUMsQ0FBQztRQUVGOztXQUVHO1FBQ0gsY0FBUyxHQUFHLEdBQVUsRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7SUFrQnJDLENBQUM7SUE1Q0QsU0FBUyxDQUFDLFdBQThCLEtBQUs7UUFDM0MsSUFBSSxNQUFNLEdBQVUsS0FBSyxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUM5Qyx1Q0FDSyxNQUFNLEtBQ1QsUUFBUSxFQUFFLFVBQVUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFF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LENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNuRCxLQUFLLElBQUksT0FBTyxDQUFDLE1BQU0sQ0FBQztZQUN4QixJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1NBQ3BCO1FBQ0QsT0FBTyxlQUFNLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztJQUNwQyxDQUFDO0NBZUY7QUF0RUQsZ0NBc0VDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAcGFja2FnZURvY3VtZW50YXRpb25cbiAqIEBtb2R1bGUgQ29tbW9uLVNpZ25hdHVyZVxuICovXG5pbXBvcnQgeyBOQnl0ZXMgfSBmcm9tICcuL25ieXRlcyc7XG5pbXBvcnQgeyBCdWZmZXIgfSBmcm9tICdidWZmZXIvJztcbmltcG9ydCBCaW5Ub29scyBmcm9tICcuLi91dGlscy9iaW50b29scyc7XG5pbXBvcnQgeyBTZXJpYWxpemFibGUsIFNlcmlhbGl6YXRpb24sIFNlcmlhbGl6ZWRFbmNvZGluZyB9IGZyb20gJy4uL3V0aWxzL3NlcmlhbGl6YXRpb24nO1xuXG5cbi8qKlxuICogQGlnbm9yZVxuICovXG5jb25zdCBiaW50b29sczpCaW5Ub29scyA9IEJpblRvb2xzLmdldEluc3RhbmNlKCk7XG5jb25zdCBzZXJpYWxpemVyID0gU2VyaWFsaXphdGlvbi5nZXRJbnN0YW5jZSgpO1xuXG4vKipcbiAqIFR5cGUgcmVwcmVzZW50aW5nIGEgW1tTaWduYXR1cmVdXSBpbmRleCB1c2VkIGluIFtbSW5wdXRdXVxuICovXG5leHBvcnQgY2xhc3MgU2lnSWR4IGV4dGVuZHMgTkJ5dGVzIHtcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiU2lnSWR4XCI7XG4gIHByb3RlY3RlZCBfdHlwZUlEID0gdW5kZWZpbmVkO1xuXG4gIHNlcmlhbGl6ZShlbmNvZGluZzpTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKTpvYmplY3Qge1xuICAgIGxldCBmaWVsZHM6b2JqZWN0ID0gc3VwZXIuc2VyaWFsaXplKGVuY29kaW5nKTtcbiAgICByZXR1cm4ge1xuICAgICAgLi4uZmllbGRzLFxuICAgICAgXCJzb3VyY2VcIjogc2VyaWFsaXplci5lbmNvZGVyKHRoaXMuc291cmNlLCBlbmNvZGluZywgXCJCdWZmZXJcIiwgXCJoZXhcIilcbiAgICB9XG4gIH07XG4gIGRlc2VyaWFsaXplKGZpZWxkczpvYmplY3QsIGVuY29kaW5nOlNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpIHtcbiAgICBzdXBlci5kZXNlcmlhbGl6ZShmaWVsZHMsIGVuY29kaW5nKTtcbiAgICB0aGlzLnNvdXJjZSA9IHNlcmlhbGl6ZXIuZGVjb2RlcihmaWVsZHNbXCJzb3VyY2VcIl0sIGVuY29kaW5nLCBcImhleFwiLCBcIkJ1ZmZlclwiKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBzb3VyY2U6QnVmZmVyID0gQnVmZmVyLmFsbG9jKDIwKTtcbiAgcHJvdGVjdGVkIGJ5dGVzID0gQnVmZmVyLmFsbG9jKDQpO1xuICBwcm90ZWN0ZWQgYnNpemUgPSA0O1xuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBzb3VyY2UgYWRkcmVzcyBmb3IgdGhlIHNpZ25hdHVyZVxuICAgKi9cbiAgc2V0U291cmNlID0gKGFkZHJlc3M6QnVmZmVyKSA9PiB7XG4gICAgICB0aGlzLnNvdXJjZSA9IGFkZHJlc3M7XG4gIH07XG5cbiAgLyoqXG4gICAqIFJldHJpZXZlcyB0aGUgc291cmNlIGFkZHJlc3MgZm9yIHRoZSBzaWduYXR1cmVcbiAgICovXG4gIGdldFNvdXJjZSA9ICgpOkJ1ZmZlciA9PiB0aGlzLnNvdXJjZTtcblxuICBjbG9uZSgpOnRoaXMge1xuICAgIGxldCBuZXdiYXNlOlNpZ0lkeCA9IG5ldyBTaWdJZHgoKTtcbiAgICBuZXdiYXNlLmZyb21CdWZmZXIodGhpcy50b0J1ZmZlcigpKTtcbiAgICByZXR1cm4gbmV3YmFzZSBhcyB0aGlzO1xuICB9XG5cbiAgY3JlYXRlKC4uLmFyZ3M6YW55W10pOnRoaXMge1xuICAgIHJldHVybiBuZXcgU2lnSWR4KCkgYXMgdGhpcztcbiAgfVxuXG5cbiAgLyoqXG4gICAqIFR5cGUgcmVwcmVzZW50aW5nIGEgW1tTaWduYXR1cmVdXSBpbmRleCB1c2VkIGluIFtbSW5wdXRdXVxuICAgKi9cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgICBzdXBlcigpO1xuICB9XG59XG5cbi8qKlxuICogU2lnbmF0dXJlIGZvciBhIFtbVHhdXVxuICovXG5leHBvcnQgY2xhc3MgU2lnbmF0dXJlIGV4dGVuZHMgTkJ5dGVzIHtcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiU2lnbmF0dXJlXCI7XG4gIHByb3RlY3RlZCBfdHlwZUlEID0gdW5kZWZpbmVkO1xuXG4gIC8vc2VyaWFsaXplIGFuZCBkZXNlcmlhbGl6ZSBib3RoIGFyZSBpbmhlcml0ZWRcblxuICBwcm90ZWN0ZWQgYnl0ZXMgPSBCdWZmZXIuYWxsb2MoNjUpO1xuICBwcm90ZWN0ZWQgYnNpemUgPSA2NTtcblxuICBjbG9uZSgpOnRoaXMge1xuICAgIGxldCBuZXdiYXNlOlNpZ25hdHVyZSA9IG5ldyBTaWduYXR1cmUoKTtcbiAgICBuZXdiYXNlLmZyb21CdWZmZXIodGhpcy50b0J1ZmZlcigpKTtcbiAgICByZXR1cm4gbmV3YmFzZSBhcyB0aGlzO1xuICB9XG5cbiAgY3JlYXRlKC4uLmFyZ3M6YW55W10pOnRoaXMge1xuICAgIHJldHVybiBuZXcgU2lnbmF0dXJlKCkgYXMgdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduYXR1cmUgZm9yIGEgW1tUeF1dXG4gICAqL1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgIHN1cGVyKCk7XG4gIH1cbn1cblxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIENyZWRlbnRpYWwgZXh0ZW5kcyBTZXJpYWxpemFibGV7XG4gIHByb3RlY3RlZCBfdHlwZU5hbWUgPSBcIkNyZWRlbnRpYWxcIjtcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSB1bmRlZmluZWQ7XG5cbiAgc2VyaWFsaXplKGVuY29kaW5nOlNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpOm9iamVjdCB7XG4gICAgbGV0IGZpZWxkczpvYmplY3QgPSBzdXBlci5zZXJpYWxpemUoZW5jb2RpbmcpO1xuICAgIHJldHVybiB7XG4gICAgICAuLi5maWVsZHMsXG4gICAgICBcInNpZ0FycmF5XCI6IHRoaXMuc2lnQXJyYXkubWFwKChzKSA9PiBzLnNlcmlhbGl6ZShlbmNvZGluZykpXG4gICAgfVxuICB9O1xuICBkZXNlcmlhbGl6ZShmaWVsZHM6b2JqZWN0LCBlbmNvZGluZzpTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKSB7XG4gICAgc3VwZXIuZGVzZXJpYWxpemUoZmllbGRzLCBlbmNvZGluZyk7XG4gICAgdGhpcy5zaWdBcnJheSA9IGZpZWxkc1tcInNpZ0FycmF5XCJdLm1hcCgoczpvYmplY3QpID0+IHtcbiAgICAgIGxldCBzaWc6U2lnbmF0dXJlID0gbmV3IFNpZ25hdHVyZSgpO1xuICAgICAgc2lnLmRlc2VyaWFsaXplKHMsIGVuY29kaW5nKTtcbiAgICAgIHJldHVybiBzaWc7XG4gICAgfSk7XG4gIH1cblxuICBwcm90ZWN0ZWQgc2lnQXJyYXk6QXJyYXk8U2lnbmF0dXJlPiA9IFtdO1xuXG4gIGFic3RyYWN0IGdldENyZWRlbnRpYWxJRCgpOm51bWJlcjtcblxuICAvKipcbiAgICAgKiBBZGRzIGEgc2lnbmF0dXJlIHRvIHRoZSBjcmVkZW50aWFscyBhbmQgcmV0dXJucyB0aGUgaW5kZXggb2ZmIHRoZSBhZGRlZCBzaWduYXR1cmUuXG4gICAgICovXG4gIGFkZFNpZ25hdHVyZSA9IChzaWc6U2lnbmF0dXJlKTpudW1iZXIgPT4ge1xuICAgIHRoaXMuc2lnQXJyYXkucHVzaChzaWcpO1xuICAgIHJldHVybiB0aGlzLnNpZ0FycmF5Lmxlbmd0aCAtIDE7XG4gIH07XG5cbiAgZnJvbUJ1ZmZlcihieXRlcywgb2Zmc2V0Om51bWJlciA9IDApOm51bWJlciB7XG4gICAgY29uc3Qgc2lnbGVuOm51bWJlciA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDQpLnJlYWRVSW50MzJCRSgwKTtcbiAgICBvZmZzZXQgKz0gNDtcbiAgICB0aGlzLnNpZ0FycmF5ID0gW107XG4gICAgZm9yIChsZXQgaTpudW1iZXIgPSAwOyBpIDwgc2lnbGVuOyBpKyspIHtcbiAgICAgIGNvbnN0IHNpZzpTaWduYXR1cmUgPSBuZXcgU2lnbmF0dXJlKCk7XG4gICAgICBvZmZzZXQgPSBzaWcuZnJvbUJ1ZmZlcihieXRlcywgb2Zmc2V0KTtcbiAgICAgIHRoaXMuc2lnQXJyYXkucHVzaChzaWcpO1xuICAgIH1cbiAgICByZXR1cm4gb2Zmc2V0O1xuICB9XG5cbiAgdG9CdWZmZXIoKTpCdWZmZXIge1xuICAgIGNvbnN0IHNpZ2xlbjpCdWZmZXIgPSBCdWZmZXIuYWxsb2MoNCk7XG4gICAgc2lnbGVuLndyaXRlSW50MzJCRSh0aGlzLnNpZ0FycmF5Lmxlbmd0aCwgMCk7XG4gICAgY29uc3QgYmFycjpBcnJheTxCdWZmZXI+ID0gW3NpZ2xlbl07XG4gICAgbGV0IGJzaXplOm51bWJlciA9IHNpZ2xlbi5sZW5ndGg7XG4gICAgZm9yIChsZXQgaTpudW1iZXIgPSAwOyBpIDwgdGhpcy5zaWdBcnJheS5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3Qgc2lnYnVmZjpCdWZmZXIgPSB0aGlzLnNpZ0FycmF5W2ldLnRvQnVmZmVyKCk7XG4gICAgICBic2l6ZSArPSBzaWdidWZmLmxlbmd0aDtcbiAgICAgIGJhcnIucHVzaChzaWdidWZmKTtcbiAgICB9XG4gICAgcmV0dXJuIEJ1ZmZlci5jb25jYXQoYmFyciwgYnNpemUpO1xuICB9XG5cbiAgYWJzdHJhY3QgY2xvbmUoKTp0aGlzO1xuXG4gIGFic3RyYWN0IGNyZWF0ZSguLi5hcmdzOmFueVtdKTp0aGlzO1xuXG4gIGFic3RyYWN0IHNlbGVjdChpZDpudW1iZXIsIC4uLmFyZ3M6YW55W10pOkNyZWRlbnRpYWw7XG5cbiAgY29uc3RydWN0b3Ioc2lnYXJyYXk6QXJyYXk8U2lnbmF0dXJlPiA9IHVuZGVmaW5lZCkge1xuICAgIHN1cGVyKCk7XG4gICAgaWYgKHR5cGVvZiBzaWdhcnJheSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICB0aGlzLnNpZ0FycmF5ID0gc2lnYXJyYXk7XG4gICAgfVxuICB9XG59Il19