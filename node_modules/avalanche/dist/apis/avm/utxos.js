"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UTXOSet = exports.AssetAmountDestination = exports.UTXO = void 0;
/**
 * @packageDocumentation
 * @module API-AVM-UTXOs
  */
const buffer_1 = require("buffer/");
const bintools_1 = __importDefault(require("../../utils/bintools"));
const bn_js_1 = __importDefault(require("bn.js"));
const outputs_1 = require("./outputs");
const constants_1 = require("./constants");
const tx_1 = require("./tx");
const inputs_1 = require("./inputs");
const ops_1 = require("./ops");
const helperfunctions_1 = require("../../utils/helperfunctions");
const initialstates_1 = require("./initialstates");
const utxos_1 = require("../../common/utxos");
const createassettx_1 = require("./createassettx");
const operationtx_1 = require("./operationtx");
const basetx_1 = require("./basetx");
const exporttx_1 = require("./exporttx");
const importtx_1 = require("./importtx");
const constants_2 = require("../../utils/constants");
const assetamount_1 = require("../../common/assetamount");
const serialization_1 = require("../../utils/serialization");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
const serializer = serialization_1.Serialization.getInstance();
/**
 * Class for representing a single UTXO.
 */
class UTXO extends utxos_1.StandardUTXO {
    constructor() {
        super(...arguments);
        this._typeName = "UTXO";
        this._typeID = undefined;
    }
    //serialize is inherited
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.output = outputs_1.SelectOutputClass(fields["output"]["_typeID"]);
        this.output.deserialize(fields["output"], encoding);
    }
    fromBuffer(bytes, offset = 0) {
        this.codecid = bintools.copyFrom(bytes, offset, offset + 2);
        offset += 2;
        this.txid = bintools.copyFrom(bytes, offset, offset + 32);
        offset += 32;
        this.outputidx = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        this.assetid = bintools.copyFrom(bytes, offset, offset + 32);
        offset += 32;
        const outputid = bintools.copyFrom(bytes, offset, offset + 4).readUInt32BE(0);
        offset += 4;
        this.output = outputs_1.SelectOutputClass(outputid);
        return this.output.fromBuffer(bytes, offset);
    }
    /**
     * Takes a base-58 string containing a [[UTXO]], parses it, populates the class, and returns the length of the StandardUTXO in bytes.
     *
     * @param serialized A base-58 string containing a raw [[UTXO]]
     *
     * @returns The length of the raw [[UTXO]]
     *
     * @remarks
     * unlike most fromStrings, it expects the string to be serialized in cb58 format
     */
    fromString(serialized) {
        /* istanbul ignore next */
        return this.fromBuffer(bintools.cb58Decode(serialized));
    }
    /**
     * Returns a base-58 representation of the [[UTXO]].
     *
     * @remarks
     * unlike most toStrings, this returns in cb58 serialization format
     */
    toString() {
        /* istanbul ignore next */
        return bintools.cb58Encode(this.toBuffer());
    }
    clone() {
        const utxo = new UTXO();
        utxo.fromBuffer(this.toBuffer());
        return utxo;
    }
    create(codecID = constants_1.AVMConstants.LATESTCODEC, txid = undefined, outputidx = undefined, assetid = undefined, output = undefined) {
        return new UTXO(codecID, txid, outputidx, assetid, output);
    }
}
exports.UTXO = UTXO;
class AssetAmountDestination extends assetamount_1.StandardAssetAmountDestination {
}
exports.AssetAmountDestination = AssetAmountDestination;
/**
 * Class representing a set of [[UTXO]]s.
 */
class UTXOSet extends utxos_1.StandardUTXOSet {
    constructor() {
        super(...arguments);
        this._typeName = "UTXOSet";
        this._typeID = undefined;
        this.getMinimumSpendable = (aad, asOf = helperfunctions_1.UnixNow(), locktime = new bn_js_1.default(0), threshold = 1) => {
            const utxoArray = this.getAllUTXOs();
            const outids = {};
            for (let i = 0; i < utxoArray.length && !aad.canComplete(); i++) {
                const u = utxoArray[i];
                const assetKey = u.getAssetID().toString("hex");
                const fromAddresses = aad.getSenders();
                if (u.getOutput() instanceof outputs_1.AmountOutput && aad.assetExists(assetKey) && u.getOutput().meetsThreshold(fromAddresses, asOf)) {
                    const am = aad.getAssetAmount(assetKey);
                    if (!am.isFinished()) {
                        const uout = u.getOutput();
                        outids[assetKey] = uout.getOutputID();
                        const amount = uout.getAmount();
                        am.spendAmount(amount);
                        const txid = u.getTxID();
                        const outputidx = u.getOutputIdx();
                        const input = new inputs_1.SECPTransferInput(amount);
                        const xferin = new inputs_1.TransferableInput(txid, outputidx, u.getAssetID(), input);
                        const spenders = uout.getSpenders(fromAddresses, asOf);
                        for (let j = 0; j < spenders.length; j++) {
                            const idx = uout.getAddressIdx(spenders[j]);
                            if (idx === -1) {
                                /* istanbul ignore next */
                                throw new Error('Error - UTXOSet.getMinimumSpendable: no such '
                                    + `address in output: ${spenders[j]}`);
                            }
                            xferin.getInput().addSignatureIdx(idx, spenders[j]);
                        }
                        aad.addInput(xferin);
                    }
                    else if (aad.assetExists(assetKey) && !(u.getOutput() instanceof outputs_1.AmountOutput)) {
                        /**
                         * Leaving the below lines, not simply for posterity, but for clarification.
                         * AssetIDs may have mixed OutputTypes.
                         * Some of those OutputTypes may implement AmountOutput.
                         * Others may not.
                         * Simply continue in this condition.
                         */
                        /*return new Error('Error - UTXOSet.getMinimumSpendable: outputID does not '
                          + `implement AmountOutput: ${u.getOutput().getOutputID}`);*/
                        continue;
                    }
                }
            }
            if (!aad.canComplete()) {
                return new Error('Error - UTXOSet.getMinimumSpendable: insufficient '
                    + 'funds to create the transaction');
            }
            const amounts = aad.getAmounts();
            const zero = new bn_js_1.default(0);
            for (let i = 0; i < amounts.length; i++) {
                const assetKey = amounts[i].getAssetIDString();
                const amount = amounts[i].getAmount();
                if (amount.gt(zero)) {
                    const spendout = outputs_1.SelectOutputClass(outids[assetKey], amount, aad.getDestinations(), locktime, threshold);
                    const xferout = new outputs_1.TransferableOutput(amounts[i].getAssetID(), spendout);
                    aad.addOutput(xferout);
                }
                const change = amounts[i].getChange();
                if (change.gt(zero)) {
                    const changeout = outputs_1.SelectOutputClass(outids[assetKey], change, aad.getChangeAddresses());
                    const chgxferout = new outputs_1.TransferableOutput(amounts[i].getAssetID(), changeout);
                    aad.addChange(chgxferout);
                }
            }
            return undefined;
        };
        /**
         * Creates an [[UnsignedTx]] wrapping a [[BaseTx]]. For more granular control, you may create your own
         * [[UnsignedTx]] wrapping a [[BaseTx]] manually (with their corresponding [[TransferableInput]]s and [[TransferableOutput]]s).
         *
         * @param networkid The number representing NetworkID of the node
         * @param blockchainid The {@link https://github.com/feross/buffer|Buffer} representing the BlockchainID for the transaction
         * @param amount The amount of the asset to be spent in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}.
         * @param assetID {@link https://github.com/feross/buffer|Buffer} of the asset ID for the UTXO
         * @param toAddresses The addresses to send the funds
         * @param fromAddresses The addresses being used to send the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
         * @param changeAddresses Optional. The addresses that can spend the change remaining from the spent UTXOs. Default: toAddresses
         * @param fee Optional. The amount of fees to burn in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}
         * @param feeAssetID Optional. The assetID of the fees being burned. Default: assetID
         * @param memo Optional. Contains arbitrary data, up to 256 bytes
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         * @param locktime Optional. The locktime field created in the resulting outputs
         * @param threshold Optional. The number of signatures required to spend the funds in the resultant UTXO
         *
         * @returns An unsigned transaction created from the passed in parameters.
         *
         */
        this.buildBaseTx = (networkid, blockchainid, amount, assetID, toAddresses, fromAddresses, changeAddresses = undefined, fee = undefined, feeAssetID = undefined, memo = undefined, asOf = helperfunctions_1.UnixNow(), locktime = new bn_js_1.default(0), threshold = 1) => {
            if (threshold > toAddresses.length) {
                /* istanbul ignore next */
                throw new Error(`Error - UTXOSet.buildBaseTx: threshold is greater than number of addresses`);
            }
            if (typeof changeAddresses === "undefined") {
                changeAddresses = toAddresses;
            }
            if (typeof feeAssetID === "undefined") {
                feeAssetID = assetID;
            }
            const zero = new bn_js_1.default(0);
            if (amount.eq(zero)) {
                return undefined;
            }
            const aad = new AssetAmountDestination(toAddresses, fromAddresses, changeAddresses);
            if (assetID.toString("hex") === feeAssetID.toString("hex")) {
                aad.addAssetAmount(assetID, amount, fee);
            }
            else {
                aad.addAssetAmount(assetID, amount, zero);
                if (this._feeCheck(fee, feeAssetID)) {
                    aad.addAssetAmount(feeAssetID, zero, fee);
                }
            }
            let ins = [];
            let outs = [];
            const success = this.getMinimumSpendable(aad, asOf, locktime, threshold);
            if (typeof success === "undefined") {
                ins = aad.getInputs();
                outs = aad.getAllOutputs();
            }
            else {
                throw success;
            }
            const baseTx = new basetx_1.BaseTx(networkid, blockchainid, outs, ins, memo);
            return new tx_1.UnsignedTx(baseTx);
        };
        /**
         * Creates an unsigned Create Asset transaction. For more granular control, you may create your own
         * [[CreateAssetTX]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s).
         *
         * @param networkid The number representing NetworkID of the node
         * @param blockchainid The {@link https://github.com/feross/buffer|Buffer} representing the BlockchainID for the transaction
         * @param fromAddresses The addresses being used to send the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
         * @param changeAddresses Optional. The addresses that can spend the change remaining from the spent UTXOs
         * @param initialState The [[InitialStates]] that represent the intial state of a created asset
         * @param name String for the descriptive name of the asset
         * @param symbol String for the ticker symbol of the asset
         * @param denomination Optional number for the denomination which is 10^D. D must be >= 0 and <= 32. Ex: $1 AVAX = 10^9 $nAVAX
         * @param mintOutputs Optional. Array of [[SECPMintOutput]]s to be included in the transaction. These outputs can be spent to mint more tokens.
         * @param fee Optional. The amount of fees to burn in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}
         * @param feeAssetID Optional. The assetID of the fees being burned.
         * @param memo Optional contains arbitrary bytes, up to 256 bytes
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         *
         * @returns An unsigned transaction created from the passed in parameters.
         *
         */
        this.buildCreateAssetTx = (networkid, blockchainid, fromAddresses, changeAddresses, initialState, name, symbol, denomination, mintOutputs = undefined, fee = undefined, feeAssetID = undefined, memo = undefined, asOf = helperfunctions_1.UnixNow()) => {
            const zero = new bn_js_1.default(0);
            let ins = [];
            let outs = [];
            if (this._feeCheck(fee, feeAssetID)) {
                const aad = new AssetAmountDestination(fromAddresses, fromAddresses, changeAddresses);
                aad.addAssetAmount(feeAssetID, zero, fee);
                const success = this.getMinimumSpendable(aad, asOf);
                if (typeof success === "undefined") {
                    ins = aad.getInputs();
                    outs = aad.getAllOutputs();
                }
                else {
                    throw success;
                }
            }
            if (typeof mintOutputs !== "undefined") {
                for (let i = 0; i < mintOutputs.length; i++) {
                    if (mintOutputs[i] instanceof outputs_1.SECPMintOutput) {
                        initialState.addOutput(mintOutputs[i]);
                    }
                    else {
                        throw new Error("Error - UTXOSet.buildCreateAssetTx: A submitted mintOutput was not of type SECPMintOutput");
                    }
                }
            }
            let CAtx = new createassettx_1.CreateAssetTx(networkid, blockchainid, outs, ins, memo, name, symbol, denomination, initialState);
            return new tx_1.UnsignedTx(CAtx);
        };
        /**
         * Creates an unsigned Secp mint transaction. For more granular control, you may create your own
         * [[OperationTx]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s, and [[TransferOperation]]s).
         *
         * @param networkid The number representing NetworkID of the node
         * @param blockchainid The {@link https://github.com/feross/buffer|Buffer} representing the BlockchainID for the transaction
         * @param mintOwner A [[SECPMintOutput]] which specifies the new set of minters
         * @param transferOwner A [[SECPTransferOutput]] which specifies where the minted tokens will go
         * @param fromAddresses The addresses being used to send the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
         * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs
         * @param mintUTXOID The UTXOID for the [[SCPMintOutput]] being spent to produce more tokens
         * @param fee Optional. The amount of fees to burn in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}
         * @param feeAssetID Optional. The assetID of the fees being burned.
         * @param memo Optional contains arbitrary bytes, up to 256 bytes
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         */
        this.buildSECPMintTx = (networkid, blockchainid, mintOwner, transferOwner, fromAddresses, changeAddresses, mintUTXOID, fee = undefined, feeAssetID = undefined, memo = undefined, asOf = helperfunctions_1.UnixNow()) => {
            const zero = new bn_js_1.default(0);
            let ins = [];
            let outs = [];
            if (this._feeCheck(fee, feeAssetID)) {
                const aad = new AssetAmountDestination(fromAddresses, fromAddresses, changeAddresses);
                aad.addAssetAmount(feeAssetID, zero, fee);
                const success = this.getMinimumSpendable(aad, asOf);
                if (typeof success === "undefined") {
                    ins = aad.getInputs();
                    outs = aad.getAllOutputs();
                }
                else {
                    throw success;
                }
            }
            let ops = [];
            let mintOp = new ops_1.SECPMintOperation(mintOwner, transferOwner);
            let utxo = this.getUTXO(mintUTXOID);
            if (typeof utxo === "undefined") {
                throw new Error("Error - UTXOSet.buildSECPMintTx: UTXOID not found");
            }
            if (utxo.getOutput().getOutputID() !== constants_1.AVMConstants.SECPMINTOUTPUTID) {
                throw new Error("Error - UTXOSet.buildSECPMintTx: UTXO is not a SECPMINTOUTPUTID");
            }
            let out = utxo.getOutput();
            let spenders = out.getSpenders(fromAddresses, asOf);
            for (let j = 0; j < spenders.length; j++) {
                let idx = out.getAddressIdx(spenders[j]);
                if (idx == -1) {
                    /* istanbul ignore next */
                    throw new Error(`Error - UTXOSet.buildSECPMintTx: no such address in output: ${spenders[j]}`);
                }
                mintOp.addSignatureIdx(idx, spenders[j]);
            }
            let transferableOperation = new ops_1.TransferableOperation(utxo.getAssetID(), [mintUTXOID], mintOp);
            ops.push(transferableOperation);
            let operationTx = new operationtx_1.OperationTx(networkid, blockchainid, outs, ins, memo, ops);
            return new tx_1.UnsignedTx(operationTx);
        };
        /**
        * Creates an unsigned Create Asset transaction. For more granular control, you may create your own
        * [[CreateAssetTX]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s).
        *
        * @param networkid The number representing NetworkID of the node
        * @param blockchainid The {@link https://github.com/feross/buffer|Buffer} representing the BlockchainID for the transaction
        * @param fromAddresses The addresses being used to send the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
        * @param changeAddresses Optional. The addresses that can spend the change remaining from the spent UTXOs.
        * @param minterSets The minters and thresholds required to mint this nft asset
        * @param name String for the descriptive name of the nft asset
        * @param symbol String for the ticker symbol of the nft asset
        * @param fee Optional. The amount of fees to burn in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}
        * @param feeAssetID Optional. The assetID of the fees being burned.
        * @param memo Optional contains arbitrary bytes, up to 256 bytes
        * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
        * @param locktime Optional. The locktime field created in the resulting mint output
        *
        * @returns An unsigned transaction created from the passed in parameters.
        *
        */
        this.buildCreateNFTAssetTx = (networkid, blockchainid, fromAddresses, changeAddresses, minterSets, name, symbol, fee = undefined, feeAssetID = undefined, memo = undefined, asOf = helperfunctions_1.UnixNow(), locktime = undefined) => {
            const zero = new bn_js_1.default(0);
            let ins = [];
            let outs = [];
            if (this._feeCheck(fee, feeAssetID)) {
                const aad = new AssetAmountDestination(fromAddresses, fromAddresses, changeAddresses);
                aad.addAssetAmount(feeAssetID, zero, fee);
                const success = this.getMinimumSpendable(aad, asOf);
                if (typeof success === "undefined") {
                    ins = aad.getInputs();
                    outs = aad.getAllOutputs();
                }
                else {
                    throw success;
                }
            }
            let initialState = new initialstates_1.InitialStates();
            for (let i = 0; i < minterSets.length; i++) {
                let nftMintOutput = new outputs_1.NFTMintOutput(i, minterSets[i].getMinters(), locktime, minterSets[i].getThreshold());
                initialState.addOutput(nftMintOutput, constants_1.AVMConstants.NFTFXID);
            }
            let denomination = 0; // NFTs are non-fungible
            let CAtx = new createassettx_1.CreateAssetTx(networkid, blockchainid, outs, ins, memo, name, symbol, denomination, initialState);
            return new tx_1.UnsignedTx(CAtx);
        };
        /**
        * Creates an unsigned NFT mint transaction. For more granular control, you may create your own
        * [[OperationTx]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s, and [[TransferOperation]]s).
        *
        * @param networkid The number representing NetworkID of the node
        * @param blockchainid The {@link https://github.com/feross/buffer|Buffer} representing the BlockchainID for the transaction
        * @param owners An array of [[OutputOwners]] who will be given the NFTs.
        * @param fromAddresses The addresses being used to send the funds from the UTXOs
        * @param changeAddresses Optional. The addresses that can spend the change remaining from the spent UTXOs.
        * @param utxoids An array of strings for the NFTs being transferred
        * @param groupID Optional. The group this NFT is issued to.
        * @param payload Optional. Data for NFT Payload.
        * @param fee Optional. The amount of fees to burn in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}
        * @param feeAssetID Optional. The assetID of the fees being burned.
        * @param memo Optional contains arbitrary bytes, up to 256 bytes
        * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
        *
        * @returns An unsigned transaction created from the passed in parameters.
        *
        */
        this.buildCreateNFTMintTx = (networkid, blockchainid, owners, fromAddresses, changeAddresses, utxoids, groupID = 0, payload = undefined, fee = undefined, feeAssetID = undefined, memo = undefined, asOf = helperfunctions_1.UnixNow()) => {
            const zero = new bn_js_1.default(0);
            let ins = [];
            let outs = [];
            if (this._feeCheck(fee, feeAssetID)) {
                const aad = new AssetAmountDestination(fromAddresses, fromAddresses, changeAddresses);
                aad.addAssetAmount(feeAssetID, zero, fee);
                const success = this.getMinimumSpendable(aad, asOf);
                if (typeof success === "undefined") {
                    ins = aad.getInputs();
                    outs = aad.getAllOutputs();
                }
                else {
                    throw success;
                }
            }
            let ops = [];
            let nftMintOperation = new ops_1.NFTMintOperation(groupID, payload, owners);
            for (let i = 0; i < utxoids.length; i++) {
                let utxo = this.getUTXO(utxoids[i]);
                let out = utxo.getOutput();
                let spenders = out.getSpenders(fromAddresses, asOf);
                for (let j = 0; j < spenders.length; j++) {
                    let idx;
                    idx = out.getAddressIdx(spenders[j]);
                    if (idx == -1) {
                        /* istanbul ignore next */
                        throw new Error(`Error - UTXOSet.buildCreateNFTMintTx: no such address in output: ${spenders[j]}`);
                    }
                    nftMintOperation.addSignatureIdx(idx, spenders[j]);
                }
                let transferableOperation = new ops_1.TransferableOperation(utxo.getAssetID(), utxoids, nftMintOperation);
                ops.push(transferableOperation);
            }
            let operationTx = new operationtx_1.OperationTx(networkid, blockchainid, outs, ins, memo, ops);
            return new tx_1.UnsignedTx(operationTx);
        };
        /**
        * Creates an unsigned NFT transfer transaction. For more granular control, you may create your own
        * [[OperationTx]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s, and [[TransferOperation]]s).
        *
        * @param networkid The number representing NetworkID of the node
        * @param blockchainid The {@link https://github.com/feross/buffer|Buffer} representing the BlockchainID for the transaction
        * @param toAddresses An array of {@link https://github.com/feross/buffer|Buffer}s which indicate who recieves the NFT
        * @param fromAddresses An array for {@link https://github.com/feross/buffer|Buffer} who owns the NFT
        * @param changeAddresses Optional. The addresses that can spend the change remaining from the spent UTXOs.
        * @param utxoids An array of strings for the NFTs being transferred
        * @param fee Optional. The amount of fees to burn in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}
        * @param feeAssetID Optional. The assetID of the fees being burned.
        * @param memo Optional contains arbitrary bytes, up to 256 bytes
        * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
        * @param locktime Optional. The locktime field created in the resulting outputs
        * @param threshold Optional. The number of signatures required to spend the funds in the resultant UTXO
        *
        * @returns An unsigned transaction created from the passed in parameters.
        *
        */
        this.buildNFTTransferTx = (networkid, blockchainid, toAddresses, fromAddresses, changeAddresses, utxoids, fee = undefined, feeAssetID = undefined, memo = undefined, asOf = helperfunctions_1.UnixNow(), locktime = new bn_js_1.default(0), threshold = 1) => {
            const zero = new bn_js_1.default(0);
            let ins = [];
            let outs = [];
            if (this._feeCheck(fee, feeAssetID)) {
                const aad = new AssetAmountDestination(fromAddresses, fromAddresses, changeAddresses);
                aad.addAssetAmount(feeAssetID, zero, fee);
                const success = this.getMinimumSpendable(aad, asOf);
                if (typeof success === "undefined") {
                    ins = aad.getInputs();
                    outs = aad.getAllOutputs();
                }
                else {
                    throw success;
                }
            }
            const ops = [];
            for (let i = 0; i < utxoids.length; i++) {
                const utxo = this.getUTXO(utxoids[i]);
                const out = utxo.getOutput();
                const spenders = out.getSpenders(fromAddresses, asOf);
                const outbound = new outputs_1.NFTTransferOutput(out.getGroupID(), out.getPayload(), toAddresses, locktime, threshold);
                const op = new ops_1.NFTTransferOperation(outbound);
                for (let j = 0; j < spenders.length; j++) {
                    const idx = out.getAddressIdx(spenders[j]);
                    if (idx === -1) {
                        /* istanbul ignore next */
                        throw new Error('Error - UTXOSet.buildNFTTransferTx: '
                            + `no such address in output: ${spenders[j]}`);
                    }
                    op.addSignatureIdx(idx, spenders[j]);
                }
                const xferop = new ops_1.TransferableOperation(utxo.getAssetID(), [utxoids[i]], op);
                ops.push(xferop);
            }
            const OpTx = new operationtx_1.OperationTx(networkid, blockchainid, outs, ins, memo, ops);
            return new tx_1.UnsignedTx(OpTx);
        };
        /**
          * Creates an unsigned ImportTx transaction.
          *
          * @param networkid The number representing NetworkID of the node
          * @param blockchainid The {@link https://github.com/feross/buffer|Buffer} representing the BlockchainID for the transaction
          * @param toAddresses The addresses to send the funds
          * @param fromAddresses The addresses being used to send the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
          * @param changeAddresses Optional. The addresses that can spend the change remaining from the spent UTXOs.
          * @param importIns An array of [[TransferableInput]]s being imported
          * @param sourceChain A {@link https://github.com/feross/buffer|Buffer} for the chainid where the imports are coming from.
          * @param fee Optional. The amount of fees to burn in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}. Fee will come from the inputs first, if they can.
          * @param feeAssetID Optional. The assetID of the fees being burned.
          * @param memo Optional contains arbitrary bytes, up to 256 bytes
          * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
          * @param locktime Optional. The locktime field created in the resulting outputs
          * @param threshold Optional. The number of signatures required to spend the funds in the resultant UTXO
          * @returns An unsigned transaction created from the passed in parameters.
          *
          */
        this.buildImportTx = (networkid, blockchainid, toAddresses, fromAddresses, changeAddresses, atomics, sourceChain = undefined, fee = undefined, feeAssetID = undefined, memo = undefined, asOf = helperfunctions_1.UnixNow(), locktime = new bn_js_1.default(0), threshold = 1) => {
            const zero = new bn_js_1.default(0);
            let ins = [];
            let outs = [];
            if (typeof fee === "undefined") {
                fee = zero.clone();
            }
            const importIns = [];
            let feepaid = new bn_js_1.default(0);
            let feeAssetStr = feeAssetID.toString("hex");
            for (let i = 0; i < atomics.length; i++) {
                const utxo = atomics[i];
                const assetID = utxo.getAssetID();
                const output = utxo.getOutput();
                let amt = output.getAmount().clone();
                let infeeamount = amt.clone();
                let assetStr = assetID.toString("hex");
                if (typeof feeAssetID !== "undefined" &&
                    fee.gt(zero) &&
                    feepaid.lt(fee) &&
                    assetStr === feeAssetStr) {
                    feepaid = feepaid.add(infeeamount);
                    if (feepaid.gt(fee)) {
                        infeeamount = feepaid.sub(fee);
                        feepaid = fee.clone();
                    }
                    else {
                        infeeamount = zero.clone();
                    }
                }
                const txid = utxo.getTxID();
                const outputidx = utxo.getOutputIdx();
                const input = new inputs_1.SECPTransferInput(amt);
                const xferin = new inputs_1.TransferableInput(txid, outputidx, assetID, input);
                const from = output.getAddresses();
                const spenders = output.getSpenders(from, asOf);
                for (let j = 0; j < spenders.length; j++) {
                    const idx = output.getAddressIdx(spenders[j]);
                    if (idx === -1) {
                        /* istanbul ignore next */
                        throw new Error('Error - UTXOSet.buildImportTx: no such '
                            + `address in output: ${spenders[j]}`);
                    }
                    xferin.getInput().addSignatureIdx(idx, spenders[j]);
                }
                importIns.push(xferin);
                //add extra outputs for each amount (calculated from the imported inputs), minus fees
                if (infeeamount.gt(zero)) {
                    const spendout = outputs_1.SelectOutputClass(output.getOutputID(), infeeamount, toAddresses, locktime, threshold);
                    const xferout = new outputs_1.TransferableOutput(assetID, spendout);
                    outs.push(xferout);
                }
            }
            // get remaining fees from the provided addresses
            let feeRemaining = fee.sub(feepaid);
            if (feeRemaining.gt(zero) && this._feeCheck(feeRemaining, feeAssetID)) {
                const aad = new AssetAmountDestination(toAddresses, fromAddresses, changeAddresses);
                aad.addAssetAmount(feeAssetID, zero, feeRemaining);
                const success = this.getMinimumSpendable(aad, asOf, locktime, threshold);
                if (typeof success === "undefined") {
                    ins = aad.getInputs();
                    outs = aad.getAllOutputs();
                }
                else {
                    throw success;
                }
            }
            const importTx = new importtx_1.ImportTx(networkid, blockchainid, outs, ins, memo, sourceChain, importIns);
            return new tx_1.UnsignedTx(importTx);
        };
        /**
        * Creates an unsigned ExportTx transaction.
        *
        * @param networkid The number representing NetworkID of the node
        * @param blockchainid The {@link https://github.com/feross/buffer|Buffer} representing the BlockchainID for the transaction
        * @param amount The amount being exported as a {@link https://github.com/indutny/bn.js/|BN}
        * @param avaxAssetID {@link https://github.com/feross/buffer|Buffer} of the asset ID for AVAX
        * @param toAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who recieves the AVAX
        * @param fromAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who owns the AVAX
        * @param changeAddresses Optional. The addresses that can spend the change remaining from the spent UTXOs.
        * @param fee Optional. The amount of fees to burn in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}
        * @param destinationChain Optional. A {@link https://github.com/feross/buffer|Buffer} for the chainid where to send the asset.
        * @param feeAssetID Optional. The assetID of the fees being burned.
        * @param memo Optional contains arbitrary bytes, up to 256 bytes
        * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
        * @param locktime Optional. The locktime field created in the resulting outputs
        * @param threshold Optional. The number of signatures required to spend the funds in the resultant UTXO
        * @returns An unsigned transaction created from the passed in parameters.
        *
        */
        this.buildExportTx = (networkid, blockchainid, amount, avaxAssetID, toAddresses, fromAddresses, changeAddresses = undefined, destinationChain = undefined, fee = undefined, feeAssetID = undefined, memo = undefined, asOf = helperfunctions_1.UnixNow(), locktime = new bn_js_1.default(0), threshold = 1) => {
            let ins = [];
            let outs = [];
            let exportouts = [];
            if (typeof changeAddresses === "undefined") {
                changeAddresses = toAddresses;
            }
            const zero = new bn_js_1.default(0);
            if (amount.eq(zero)) {
                return undefined;
            }
            if (typeof feeAssetID === "undefined") {
                feeAssetID = avaxAssetID;
            }
            else if (feeAssetID.toString("hex") !== avaxAssetID.toString("hex")) {
                /* istanbul ignore next */
                throw new Error('Error - UTXOSet.buildExportTx: '
                    + `feeAssetID must match avaxAssetID`);
            }
            if (typeof destinationChain === "undefined") {
                destinationChain = bintools.cb58Decode(constants_2.PlatformChainID);
            }
            const aad = new AssetAmountDestination(toAddresses, fromAddresses, changeAddresses);
            if (avaxAssetID.toString("hex") === feeAssetID.toString("hex")) {
                aad.addAssetAmount(avaxAssetID, amount, fee);
            }
            else {
                aad.addAssetAmount(avaxAssetID, amount, zero);
                if (this._feeCheck(fee, feeAssetID)) {
                    aad.addAssetAmount(feeAssetID, zero, fee);
                }
            }
            const success = this.getMinimumSpendable(aad, asOf, locktime, threshold);
            if (typeof success === "undefined") {
                ins = aad.getInputs();
                outs = aad.getChangeOutputs();
                exportouts = aad.getOutputs();
            }
            else {
                throw success;
            }
            const exportTx = new exporttx_1.ExportTx(networkid, blockchainid, outs, ins, memo, destinationChain, exportouts);
            return new tx_1.UnsignedTx(exportTx);
        };
    }
    //serialize is inherited
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        let utxos = {};
        for (let utxoid in fields["utxos"]) {
            let utxoidCleaned = serializer.decoder(utxoid, encoding, "base58", "base58");
            utxos[utxoidCleaned] = new UTXO();
            utxos[utxoidCleaned].deserialize(fields["utxos"][utxoid], encoding);
        }
        let addressUTXOs = {};
        for (let address in fields["addressUTXOs"]) {
            let addressCleaned = serializer.decoder(address, encoding, "cb58", "hex");
            let utxobalance = {};
            for (let utxoid in fields["addressUTXOs"][address]) {
                let utxoidCleaned = serializer.decoder(utxoid, encoding, "base58", "base58");
                utxobalance[utxoidCleaned] = serializer.decoder(fields["addressUTXOs"][address][utxoid], encoding, "decimalString", "BN");
            }
            addressUTXOs[addressCleaned] = utxobalance;
        }
        this.utxos = utxos;
        this.addressUTXOs = addressUTXOs;
    }
    parseUTXO(utxo) {
        const utxovar = new UTXO();
        // force a copy
        if (typeof utxo === 'string') {
            utxovar.fromBuffer(bintools.cb58Decode(utxo));
        }
        else if (utxo instanceof UTXO) {
            utxovar.fromBuffer(utxo.toBuffer()); // forces a copy
        }
        else {
            /* istanbul ignore next */
            throw new Error(`Error - UTXO.parseUTXO: utxo parameter is not a UTXO or string: ${utxo}`);
        }
        return utxovar;
    }
    create(...args) {
        return new UTXOSet();
    }
    clone() {
        const newset = this.create();
        const allUTXOs = this.getAllUTXOs();
        newset.addArray(allUTXOs);
        return newset;
    }
    _feeCheck(fee, feeAssetID) {
        return (typeof fee !== "undefined" &&
            typeof feeAssetID !== "undefined" &&
            fee.gt(new bn_js_1.default(0)) && feeAssetID instanceof buffer_1.Buffer);
    }
}
exports.UTXOSet = UTXOSet;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXR4b3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvYXBpcy9hdm0vdXR4b3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUE7OztJQUdJO0FBQ0osb0NBQWlDO0FBQ2pDLG9FQUE0QztBQUM1QyxrREFBdUI7QUFDdkIsdUNBQXNKO0FBQ3RKLDJDQUEyQztBQUMzQyw2QkFBa0M7QUFDbEMscUNBQWdFO0FBQ2hFLCtCQUF5RztBQUV6RyxpRUFBc0Q7QUFDdEQsbURBQWdEO0FBRWhELDhDQUFtRTtBQUNuRSxtREFBZ0Q7QUFDaEQsK0NBQTRDO0FBQzVDLHFDQUFrQztBQUNsQyx5Q0FBc0M7QUFDdEMseUNBQXNDO0FBQ3RDLHFEQUF3RDtBQUN4RCwwREFBdUY7QUFDdkYsNkRBQThFO0FBRTlFOztHQUVHO0FBQ0gsTUFBTSxRQUFRLEdBQUcsa0JBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUN4QyxNQUFNLFVBQVUsR0FBRyw2QkFBYSxDQUFDLFdBQVcsRUFBRSxDQUFDO0FBRS9DOztHQUVHO0FBQ0gsTUFBYSxJQUFLLFNBQVEsb0JBQVk7SUFBdEM7O1FBQ1ksY0FBUyxHQUFHLE1BQU0sQ0FBQztRQUNuQixZQUFPLEdBQUcsU0FBUyxDQUFDO0lBbUVoQyxDQUFDO0lBakVDLHdCQUF3QjtJQUV4QixXQUFXLENBQUMsTUFBYSxFQUFFLFdBQThCLEtBQUs7UUFDNUQsS0FBSyxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDcEMsSUFBSSxDQUFDLE1BQU0sR0FBRywyQkFBaUIsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztRQUM3RCxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDdEQsQ0FBQztJQUVELFVBQVUsQ0FBQyxLQUFZLEVBQUUsU0FBZ0IsQ0FB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LFdBQVcsRUFBRSxDQUFDO1FBQ2hELE1BQU0sQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUE7UUFDekIsT0FBTyxNQUFjLENBQUM7SUFDeEIsQ0FBQztJQUVELFNBQVMsQ0FBQyxHQUFNLEVBQUUsVUFBaUI7UUFDakMsT0FBTyxDQUFDLE9BQU8sR0FBRyxLQUFLLFdBQVc7WUFDbEMsT0FBTyxVQUFVLEtBQUssV0FBVztZQUNqQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksZUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksVUFBVSxZQUFZLGVBQU0sQ0FBQyxDQUFDO0lBQ3JELENBQUM7Q0Fvc0JGO0FBN3ZCRCwwQkE2dkJDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAcGFja2FnZURvY3VtZW50YXRpb25cbiAqIEBtb2R1bGUgQVBJLUFWTS1VVFhPc1xuICAqL1xuaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSAnYnVmZmVyLyc7XG5pbXBvcnQgQmluVG9vbHMgZnJvbSAnLi4vLi4vdXRpbHMvYmludG9vbHMnO1xuaW1wb3J0IEJOIGZyb20gXCJibi5qc1wiO1xuaW1wb3J0IHsgQW1vdW50T3V0cHV0LCBTZWxlY3RPdXRwdXRDbGFzcywgVHJhbnNmZXJhYmxlT3V0cHV0LCBORlRUcmFuc2Zlck91dHB1dCwgTkZUTWludE91dHB1dCwgU0VDUE1pbnRPdXRwdXQsIFNFQ1BUcmFuc2Zlck91dHB1dCB9IGZyb20gJy4vb3V0cHV0cyc7XG5pbXBvcnQgeyBBVk1Db25zdGFudHMgfSBmcm9tICcuL2NvbnN0YW50cyc7XG5pbXBvcnQgeyBVbnNpZ25lZFR4IH0gZnJvbSAnLi90eCc7XG5pbXBvcnQgeyBTRUNQVHJhbnNmZXJJbnB1dCwgVHJhbnNmZXJhYmxlSW5wdXQgfSBmcm9tICcuL2lucHV0cyc7XG5pbXBvcnQgeyBORlRUcmFuc2Zlck9wZXJhdGlvbiwgVHJhbnNmZXJhYmxlT3BlcmF0aW9uLCBORlRNaW50T3BlcmF0aW9uLCBTRUNQTWludE9wZXJhdGlvbiB9IGZyb20gJy4vb3BzJztcbmltcG9ydCB7IE91dHB1dCwgT3V0cHV0T3duZXJzIH0gZnJvbSAnLi4vLi4vY29tbW9uL291dHB1dCc7XG5pbXBvcnQgeyBVbml4Tm93IH0gZnJvbSAnLi4vLi4vdXRpbHMvaGVscGVyZnVuY3Rpb25zJztcbmltcG9ydCB7IEluaXRpYWxTdGF0ZXMgfSBmcm9tICcuL2luaXRpYWxzdGF0ZXMnO1xuaW1wb3J0IHsgTWludGVyU2V0IH0gZnJvbSAnLi9taW50ZXJzZXQnO1xuaW1wb3J0IHsgU3RhbmRhcmRVVFhPLCBTdGFuZGFyZFVUWE9TZXQgfSBmcm9tICcuLi8uLi9jb21tb24vdXR4b3MnO1xuaW1wb3J0IHsgQ3JlYXRlQXNzZXRUeCB9IGZyb20gJy4vY3JlYXRlYXNzZXR0eCc7XG5pbXBvcnQgeyBPcGVyYXRpb25UeCB9IGZyb20gJy4vb3BlcmF0aW9udHgnO1xuaW1wb3J0IHsgQmFzZVR4IH0gZnJvbSAnLi9iYXNldHgnO1xuaW1wb3J0IHsgRXhwb3J0VHggfSBmcm9tICcuL2V4cG9ydHR4JztcbmltcG9ydCB7IEltcG9ydFR4IH0gZnJvbSAnLi9pbXBvcnR0eCc7XG5pbXBvcnQgeyBQbGF0Zm9ybUNoYWluSUQgfSBmcm9tICcuLi8uLi91dGlscy9jb25zdGFudHMnO1xuaW1wb3J0IHsgU3RhbmRhcmRBc3NldEFtb3VudERlc3RpbmF0aW9uLCBBc3NldEFtb3VudCB9IGZyb20gJy4uLy4uL2NvbW1vbi9hc3NldGFtb3VudCc7XG5pbXBvcnQgeyBTZXJpYWxpemF0aW9uLCBTZXJpYWxpemVkRW5jb2RpbmcgfSBmcm9tICcuLi8uLi91dGlscy9zZXJpYWxpemF0aW9uJztcblxuLyoqXG4gKiBAaWdub3JlXG4gKi9cbmNvbnN0IGJpbnRvb2xzID0gQmluVG9vbHMuZ2V0SW5zdGFuY2UoKTtcbmNvbnN0IHNlcmlhbGl6ZXIgPSBTZXJpYWxpemF0aW9uLmdldEluc3RhbmNlKCk7XG5cbi8qKlxuICogQ2xhc3MgZm9yIHJlcHJlc2VudGluZyBhIHNpbmdsZSBVVFhPLlxuICovXG5leHBvcnQgY2xhc3MgVVRYTyBleHRlbmRzIFN0YW5kYXJkVVRYTyB7XG4gIHByb3RlY3RlZCBfdHlwZU5hbWUgPSBcIlVUWE9cIjtcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSB1bmRlZmluZWQ7XG5cbiAgLy9zZXJpYWxpemUgaXMgaW5oZXJpdGVkXG5cbiAgZGVzZXJpYWxpemUoZmllbGRzOm9iamVjdCwgZW5jb2Rpbmc6U2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIikge1xuICAgIHN1cGVyLmRlc2VyaWFsaXplKGZpZWxkcywgZW5jb2RpbmcpO1xuICAgIHRoaXMub3V0cHV0ID0gU2VsZWN0T3V0cHV0Q2xhc3MoZmllbGRzW1wib3V0cHV0XCJdW1wiX3R5cGVJRFwiXSk7XG4gICAgdGhpcy5vdXRwdXQuZGVzZXJpYWxpemUoZmllbGRzW1wib3V0cHV0XCJdLCBlbmNvZGluZyk7XG4gIH1cblxuICBmcm9tQnVmZmVyKGJ5dGVzOkJ1ZmZlciwgb2Zmc2V0Om51bWJlciA9IDApOm51bWJlciB7XG4gICAgdGhpcy5jb2RlY2lkID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgMik7XG4gICAgb2Zmc2V0ICs9IDI7XG4gICAgdGhpcy50eGlkID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgMzIpO1xuICAgIG9mZnNldCArPSAzMjtcbiAgICB0aGlzLm91dHB1dGlkeCA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDQpO1xuICAgIG9mZnNldCArPSA0O1xuICAgIHRoaXMuYXNzZXRpZCA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDMyKTtcbiAgICBvZmZzZXQgKz0gMzI7XG4gICAgY29uc3Qgb3V0cHV0aWQ6bnVtYmVyID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgNCkucmVhZFVJbnQzMkJFKDApO1xuICAgIG9mZnNldCArPSA0O1xuICAgIHRoaXMub3V0cHV0ID0gU2VsZWN0T3V0cHV0Q2xhc3Mob3V0cHV0aWQpO1xuICAgIHJldHVybiB0aGlzLm91dHB1dC5mcm9tQnVmZmVyKGJ5dGVzLCBvZmZzZXQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFRha2VzIGEgYmFzZS01OCBzdHJpbmcgY29udGFpbmluZyBhIFtbVVRYT11dLCBwYXJzZXMgaXQsIHBvcHVsYXRlcyB0aGUgY2xhc3MsIGFuZCByZXR1cm5zIHRoZSBsZW5ndGggb2YgdGhlIFN0YW5kYXJkVVRYTyBpbiBieXRlcy5cbiAgICpcbiAgICogQHBhcmFtIHNlcmlhbGl6ZWQgQSBiYXNlLTU4IHN0cmluZyBjb250YWluaW5nIGEgcmF3IFtbVVRYT11dXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBsZW5ndGggb2YgdGhlIHJhdyBbW1VUWE9dXVxuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiB1bmxpa2UgbW9zdCBmcm9tU3RyaW5ncywgaXQgZXhwZWN0cyB0aGUgc3RyaW5nIHRvIGJlIHNlcmlhbGl6ZWQgaW4gY2I1OCBmb3JtYXRcbiAgICovXG4gIGZyb21TdHJpbmcoc2VyaWFsaXplZDpzdHJpbmcpOm51bWJlciB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgcmV0dXJuIHRoaXMuZnJvbUJ1ZmZlcihiaW50b29scy5jYjU4RGVjb2RlKHNlcmlhbGl6ZWQpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgYmFzZS01OCByZXByZXNlbnRhdGlvbiBvZiB0aGUgW1tVVFhPXV0uXG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIHVubGlrZSBtb3N0IHRvU3RyaW5ncywgdGhpcyByZXR1cm5zIGluIGNiNTggc2VyaWFsaXphdGlvbiBmb3JtYXRcbiAgICovXG4gIHRvU3RyaW5nKCk6c3RyaW5nIHtcbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgIHJldHVybiBiaW50b29scy5jYjU4RW5jb2RlKHRoaXMudG9CdWZmZXIoKSk7XG4gIH1cblxuICBjbG9uZSgpOnRoaXMge1xuICAgIGNvbnN0IHV0eG86VVRYTyA9IG5ldyBVVFhPKCk7XG4gICAgdXR4by5mcm9tQnVmZmVyKHRoaXMudG9CdWZmZXIoKSk7XG4gICAgcmV0dXJuIHV0eG8gYXMgdGhpcztcbiAgfVxuXG4gIGNyZWF0ZShcbiAgICBjb2RlY0lEOm51bWJlciA9IEFWTUNvbnN0YW50cy5MQVRFU1RDT0RFQywgXG4gICAgdHhpZDpCdWZmZXIgPSB1bmRlZmluZWQsXG4gICAgb3V0cHV0aWR4OkJ1ZmZlciB8IG51bWJlciA9IHVuZGVmaW5lZCxcbiAgICBhc3NldGlkOkJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICBvdXRwdXQ6T3V0cHV0ID0gdW5kZWZpbmVkKTp0aGlzIFxuICB7XG4gICAgcmV0dXJuIG5ldyBVVFhPKGNvZGVjSUQsIHR4aWQsIG91dHB1dGlkeCwgYXNzZXRpZCwgb3V0cHV0KSBhcyB0aGlzO1xuICB9XG5cbn1cblxuZXhwb3J0IGNsYXNzIEFzc2V0QW1vdW50RGVzdGluYXRpb24gZXh0ZW5kcyBTdGFuZGFyZEFzc2V0QW1vdW50RGVzdGluYXRpb248VHJhbnNmZXJhYmxlT3V0cHV0LCBUcmFuc2ZlcmFibGVJbnB1dD4ge31cblxuLyoqXG4gKiBDbGFzcyByZXByZXNlbnRpbmcgYSBzZXQgb2YgW1tVVFhPXV1zLlxuICovXG5leHBvcnQgY2xhc3MgVVRYT1NldCBleHRlbmRzIFN0YW5kYXJkVVRYT1NldDxVVFhPPntcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiVVRYT1NldFwiO1xuICBwcm90ZWN0ZWQgX3R5cGVJRCA9IHVuZGVmaW5lZDtcbiAgXG4gIC8vc2VyaWFsaXplIGlzIGluaGVyaXRlZFxuXG4gIGRlc2VyaWFsaXplKGZpZWxkczpvYmplY3QsIGVuY29kaW5nOlNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpIHtcbiAgICBzdXBlci5kZXNlcmlhbGl6ZShmaWVsZHMsIGVuY29kaW5nKTtcbiAgICBsZXQgdXR4b3MgPSB7fTtcbiAgICBmb3IobGV0IHV0eG9pZCBpbiBmaWVsZHNbXCJ1dHhvc1wiXSl7XG4gICAgICBsZXQgdXR4b2lkQ2xlYW5lZDpzdHJpbmcgPSBzZXJpYWxpemVyLmRlY29kZXIodXR4b2lkLCBlbmNvZGluZywgXCJiYXNlNThcIiwgXCJiYXNlNThcIik7XG4gICAgICB1dHhvc1t1dHhvaWRDbGVhbmVkXSA9IG5ldyBVVFhPKCk7XG4gICAgICB1dHhvc1t1dHhvaWRDbGVhbmVkXS5kZXNlcmlhbGl6ZShmaWVsZHNbXCJ1dHhvc1wiXVt1dHhvaWRdLCBlbmNvZGluZyk7XG4gICAgfVxuICAgIGxldCBhZGRyZXNzVVRYT3MgPSB7fTtcbiAgICBmb3IobGV0IGFkZHJlc3MgaW4gZmllbGRzW1wiYWRkcmVzc1VUWE9zXCJdKXtcbiAgICAgIGxldCBhZGRyZXNzQ2xlYW5lZDpzdHJpbmcgPSBzZXJpYWxpemVyLmRlY29kZXIoYWRkcmVzcywgZW5jb2RpbmcsIFwiY2I1OFwiLCBcImhleFwiKTtcbiAgICAgIGxldCB1dHhvYmFsYW5jZSA9IHt9O1xuICAgICAgZm9yKGxldCB1dHhvaWQgaW4gZmllbGRzW1wiYWRkcmVzc1VUWE9zXCJdW2FkZHJlc3NdKXtcbiAgICAgICAgbGV0IHV0eG9pZENsZWFuZWQ6c3RyaW5nID0gc2VyaWFsaXplci5kZWNvZGVyKHV0eG9pZCwgZW5jb2RpbmcsIFwiYmFzZTU4XCIsIFwiYmFzZTU4XCIpO1xuICAgICAgICB1dHhvYmFsYW5jZVt1dHhvaWRDbGVhbmVkXSA9IHNlcmlhbGl6ZXIuZGVjb2RlcihmaWVsZHNbXCJhZGRyZXNzVVRYT3NcIl1bYWRkcmVzc11bdXR4b2lkXSwgZW5jb2RpbmcsIFwiZGVjaW1hbFN0cmluZ1wiLCBcIkJOXCIpO1xuICAgICAgfVxuICAgICAgYWRkcmVzc1VUWE9zW2FkZHJlc3NDbGVhbmVkXSA9IHV0eG9iYWxhbmNlO1xuICAgIH1cbiAgICB0aGlzLnV0eG9zID0gdXR4b3M7XG4gICAgdGhpcy5hZGRyZXNzVVRYT3MgPSBhZGRyZXNzVVRYT3M7XG4gIH1cblxuICBwYXJzZVVUWE8odXR4bzpVVFhPIHwgc3RyaW5nKTpVVFhPIHtcbiAgICBjb25zdCB1dHhvdmFyOlVUWE8gPSBuZXcgVVRYTygpO1xuICAgIC8vIGZvcmNlIGEgY29weVxuICAgIGlmICh0eXBlb2YgdXR4byA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHV0eG92YXIuZnJvbUJ1ZmZlcihiaW50b29scy5jYjU4RGVjb2RlKHV0eG8pKTtcbiAgICB9IGVsc2UgaWYgKHV0eG8gaW5zdGFuY2VvZiBVVFhPKSB7XG4gICAgICB1dHhvdmFyLmZyb21CdWZmZXIodXR4by50b0J1ZmZlcigpKTsgLy8gZm9yY2VzIGEgY29weVxuICAgIH0gZWxzZSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBFcnJvciAtIFVUWE8ucGFyc2VVVFhPOiB1dHhvIHBhcmFtZXRlciBpcyBub3QgYSBVVFhPIG9yIHN0cmluZzogJHt1dHhvfWApO1xuICAgIH1cbiAgICByZXR1cm4gdXR4b3ZhclxuICB9XG5cbiAgY3JlYXRlKC4uLmFyZ3M6YW55W10pOnRoaXN7XG4gICAgcmV0dXJuIG5ldyBVVFhPU2V0KCkgYXMgdGhpcztcbiAgfVxuXG4gIGNsb25lKCk6dGhpcyB7XG4gICAgY29uc3QgbmV3c2V0OlVUWE9TZXQgPSB0aGlzLmNyZWF0ZSgpO1xuICAgIGNvbnN0IGFsbFVUWE9zOkFycmF5PFVUWE8+ID0gdGhpcy5nZXRBbGxVVFhPcygpO1xuICAgIG5ld3NldC5hZGRBcnJheShhbGxVVFhPcylcbiAgICByZXR1cm4gbmV3c2V0IGFzIHRoaXM7XG4gIH1cblxuICBfZmVlQ2hlY2soZmVlOkJOLCBmZWVBc3NldElEOkJ1ZmZlcik6Ym9vbGVhbiB7XG4gICAgcmV0dXJuICh0eXBlb2YgZmVlICE9PSBcInVuZGVmaW5lZFwiICYmIFxuICAgIHR5cGVvZiBmZWVBc3NldElEICE9PSBcInVuZGVmaW5lZFwiICYmXG4gICAgZmVlLmd0KG5ldyBCTigwKSkgJiYgZmVlQXNzZXRJRCBpbnN0YW5jZW9mIEJ1ZmZlcik7XG4gIH1cblxuICBnZXRNaW5pbXVtU3BlbmRhYmxlID0gKGFhZDpBc3NldEFtb3VudERlc3RpbmF0aW9uLCBhc09mOkJOID0gVW5peE5vdygpLCBsb2NrdGltZTpCTiA9IG5ldyBCTigwKSwgdGhyZXNob2xkOm51bWJlciA9IDEpOkVycm9yID0+IHtcbiAgICBjb25zdCB1dHhvQXJyYXk6QXJyYXk8VVRYTz4gPSB0aGlzLmdldEFsbFVUWE9zKCk7XG4gICAgY29uc3Qgb3V0aWRzOm9iamVjdCA9IHt9O1xuICAgIGZvcihsZXQgaSA9IDA7IGkgPCB1dHhvQXJyYXkubGVuZ3RoICYmICFhYWQuY2FuQ29tcGxldGUoKTsgaSsrKSB7XG4gICAgICBjb25zdCB1OlVUWE8gPSB1dHhvQXJyYXlbaV07XG4gICAgICBjb25zdCBhc3NldEtleTpzdHJpbmcgPSB1LmdldEFzc2V0SUQoKS50b1N0cmluZyhcImhleFwiKTtcbiAgICAgIGNvbnN0IGZyb21BZGRyZXNzZXM6QXJyYXk8QnVmZmVyPiA9IGFhZC5nZXRTZW5kZXJzKCk7XG4gICAgICBpZih1LmdldE91dHB1dCgpIGluc3RhbmNlb2YgQW1vdW50T3V0cHV0ICYmIGFhZC5hc3NldEV4aXN0cyhhc3NldEtleSkgJiYgdS5nZXRPdXRwdXQoKS5tZWV0c1RocmVzaG9sZChmcm9tQWRkcmVzc2VzLCBhc09mKSkge1xuICAgICAgICBjb25zdCBhbTpBc3NldEFtb3VudCA9IGFhZC5nZXRBc3NldEFtb3VudChhc3NldEtleSk7XG4gICAgICAgIGlmKCFhbS5pc0ZpbmlzaGVkKCkpe1xuICAgICAgICAgIGNvbnN0IHVvdXQ6QW1vdW50T3V0cHV0ID0gdS5nZXRPdXRwdXQoKSBhcyBBbW91bnRPdXRwdXQ7XG4gICAgICAgICAgb3V0aWRzW2Fzc2V0S2V5XSA9IHVvdXQuZ2V0T3V0cHV0SUQoKTtcbiAgICAgICAgICBjb25zdCBhbW91bnQgPSB1b3V0LmdldEFtb3VudCgpO1xuICAgICAgICAgIGFtLnNwZW5kQW1vdW50KGFtb3VudCk7XG4gICAgICAgICAgY29uc3QgdHhpZDpCdWZmZXIgPSB1LmdldFR4SUQoKTtcbiAgICAgICAgICBjb25zdCBvdXRwdXRpZHg6QnVmZmVyID0gdS5nZXRPdXRwdXRJZHgoKTtcbiAgICAgICAgICBjb25zdCBpbnB1dDpTRUNQVHJhbnNmZXJJbnB1dCA9IG5ldyBTRUNQVHJhbnNmZXJJbnB1dChhbW91bnQpO1xuICAgICAgICAgIGNvbnN0IHhmZXJpbjpUcmFuc2ZlcmFibGVJbnB1dCA9IG5ldyBUcmFuc2ZlcmFibGVJbnB1dCh0eGlkLCBvdXRwdXRpZHgsIHUuZ2V0QXNzZXRJRCgpLCBpbnB1dCk7XG4gICAgICAgICAgY29uc3Qgc3BlbmRlcnM6QXJyYXk8QnVmZmVyPiA9IHVvdXQuZ2V0U3BlbmRlcnMoZnJvbUFkZHJlc3NlcywgYXNPZik7XG4gICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBzcGVuZGVycy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgY29uc3QgaWR4Om51bWJlciA9IHVvdXQuZ2V0QWRkcmVzc0lkeChzcGVuZGVyc1tqXSk7XG4gICAgICAgICAgICBpZiAoaWR4ID09PSAtMSkge1xuICAgICAgICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Vycm9yIC0gVVRYT1NldC5nZXRNaW5pbXVtU3BlbmRhYmxlOiBubyBzdWNoICdcbiAgICAgICAgICAgICAgKyBgYWRkcmVzcyBpbiBvdXRwdXQ6ICR7c3BlbmRlcnNbal19YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB4ZmVyaW4uZ2V0SW5wdXQoKS5hZGRTaWduYXR1cmVJZHgoaWR4LCBzcGVuZGVyc1tqXSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGFhZC5hZGRJbnB1dCh4ZmVyaW4pO1xuICAgICAgICB9IGVsc2UgaWYoYWFkLmFzc2V0RXhpc3RzKGFzc2V0S2V5KSAmJiAhKHUuZ2V0T3V0cHV0KCkgaW5zdGFuY2VvZiBBbW91bnRPdXRwdXQpKXtcbiAgICAgICAgICAvKipcbiAgICAgICAgICAgKiBMZWF2aW5nIHRoZSBiZWxvdyBsaW5lcywgbm90IHNpbXBseSBmb3IgcG9zdGVyaXR5LCBidXQgZm9yIGNsYXJpZmljYXRpb24uXG4gICAgICAgICAgICogQXNzZXRJRHMgbWF5IGhhdmUgbWl4ZWQgT3V0cHV0VHlwZXMuIFxuICAgICAgICAgICAqIFNvbWUgb2YgdGhvc2UgT3V0cHV0VHlwZXMgbWF5IGltcGxlbWVudCBBbW91bnRPdXRwdXQuXG4gICAgICAgICAgICogT3RoZXJzIG1heSBub3QuXG4gICAgICAgICAgICogU2ltcGx5IGNvbnRpbnVlIGluIHRoaXMgY29uZGl0aW9uLlxuICAgICAgICAgICAqL1xuICAgICAgICAgIC8qcmV0dXJuIG5ldyBFcnJvcignRXJyb3IgLSBVVFhPU2V0LmdldE1pbmltdW1TcGVuZGFibGU6IG91dHB1dElEIGRvZXMgbm90ICdcbiAgICAgICAgICAgICsgYGltcGxlbWVudCBBbW91bnRPdXRwdXQ6ICR7dS5nZXRPdXRwdXQoKS5nZXRPdXRwdXRJRH1gKTsqL1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgaWYoIWFhZC5jYW5Db21wbGV0ZSgpKSB7XG4gICAgICByZXR1cm4gbmV3IEVycm9yKCdFcnJvciAtIFVUWE9TZXQuZ2V0TWluaW11bVNwZW5kYWJsZTogaW5zdWZmaWNpZW50ICdcbiAgICAgICsgJ2Z1bmRzIHRvIGNyZWF0ZSB0aGUgdHJhbnNhY3Rpb24nKTtcbiAgICB9XG4gICAgY29uc3QgYW1vdW50czpBcnJheTxBc3NldEFtb3VudD4gPSBhYWQuZ2V0QW1vdW50cygpO1xuICAgIGNvbnN0IHplcm86Qk4gPSBuZXcgQk4oMCk7XG4gICAgZm9yKGxldCBpID0gMDsgaSA8IGFtb3VudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGFzc2V0S2V5OnN0cmluZyA9IGFtb3VudHNbaV0uZ2V0QXNzZXRJRFN0cmluZygpO1xuICAgICAgY29uc3QgYW1vdW50OkJOID0gYW1vdW50c1tpXS5nZXRBbW91bnQoKTtcbiAgICAgIGlmIChhbW91bnQuZ3QoemVybykpIHtcbiAgICAgICAgY29uc3Qgc3BlbmRvdXQ6QW1vdW50T3V0cHV0ID0gU2VsZWN0T3V0cHV0Q2xhc3Mob3V0aWRzW2Fzc2V0S2V5XSxcbiAgICAgICAgICBhbW91bnQsIGFhZC5nZXREZXN0aW5hdGlvbnMoKSwgbG9ja3RpbWUsIHRocmVzaG9sZCkgYXMgQW1vdW50T3V0cHV0O1xuICAgICAgICBjb25zdCB4ZmVyb3V0OlRyYW5zZmVyYWJsZU91dHB1dCA9IG5ldyBUcmFuc2ZlcmFibGVPdXRwdXQoYW1vdW50c1tpXS5nZXRBc3NldElEKCksIHNwZW5kb3V0KTtcbiAgICAgICAgYWFkLmFkZE91dHB1dCh4ZmVyb3V0KTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGNoYW5nZTpCTiA9IGFtb3VudHNbaV0uZ2V0Q2hhbmdlKCk7XG4gICAgICBpZiAoY2hhbmdlLmd0KHplcm8pKSB7XG4gICAgICAgIGNvbnN0IGNoYW5nZW91dDpBbW91bnRPdXRwdXQgPSBTZWxlY3RPdXRwdXRDbGFzcyhvdXRpZHNbYXNzZXRLZXldLFxuICAgICAgICAgIGNoYW5nZSwgYWFkLmdldENoYW5nZUFkZHJlc3NlcygpKSBhcyBBbW91bnRPdXRwdXQ7XG4gICAgICAgIGNvbnN0IGNoZ3hmZXJvdXQ6VHJhbnNmZXJhYmxlT3V0cHV0ID0gbmV3IFRyYW5zZmVyYWJsZU91dHB1dChhbW91bnRzW2ldLmdldEFzc2V0SUQoKSwgY2hhbmdlb3V0KTtcbiAgICAgICAgYWFkLmFkZENoYW5nZShjaGd4ZmVyb3V0KTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGFuIFtbVW5zaWduZWRUeF1dIHdyYXBwaW5nIGEgW1tCYXNlVHhdXS4gRm9yIG1vcmUgZ3JhbnVsYXIgY29udHJvbCwgeW91IG1heSBjcmVhdGUgeW91ciBvd25cbiAgICogW1tVbnNpZ25lZFR4XV0gd3JhcHBpbmcgYSBbW0Jhc2VUeF1dIG1hbnVhbGx5ICh3aXRoIHRoZWlyIGNvcnJlc3BvbmRpbmcgW1tUcmFuc2ZlcmFibGVJbnB1dF1dcyBhbmQgW1tUcmFuc2ZlcmFibGVPdXRwdXRdXXMpLlxuICAgKlxuICAgKiBAcGFyYW0gbmV0d29ya2lkIFRoZSBudW1iZXIgcmVwcmVzZW50aW5nIE5ldHdvcmtJRCBvZiB0aGUgbm9kZVxuICAgKiBAcGFyYW0gYmxvY2tjaGFpbmlkIFRoZSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSByZXByZXNlbnRpbmcgdGhlIEJsb2NrY2hhaW5JRCBmb3IgdGhlIHRyYW5zYWN0aW9uXG4gICAqIEBwYXJhbSBhbW91bnQgVGhlIGFtb3VudCBvZiB0aGUgYXNzZXQgdG8gYmUgc3BlbnQgaW4gaXRzIHNtYWxsZXN0IGRlbm9taW5hdGlvbiwgcmVwcmVzZW50ZWQgYXMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn0uXG4gICAqIEBwYXJhbSBhc3NldElEIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IG9mIHRoZSBhc3NldCBJRCBmb3IgdGhlIFVUWE9cbiAgICogQHBhcmFtIHRvQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgdG8gc2VuZCB0aGUgZnVuZHNcbiAgICogQHBhcmFtIGZyb21BZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyBiZWluZyB1c2VkIHRvIHNlbmQgdGhlIGZ1bmRzIGZyb20gdGhlIFVUWE9zIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9XG4gICAqIEBwYXJhbSBjaGFuZ2VBZGRyZXNzZXMgT3B0aW9uYWwuIFRoZSBhZGRyZXNzZXMgdGhhdCBjYW4gc3BlbmQgdGhlIGNoYW5nZSByZW1haW5pbmcgZnJvbSB0aGUgc3BlbnQgVVRYT3MuIERlZmF1bHQ6IHRvQWRkcmVzc2VzXG4gICAqIEBwYXJhbSBmZWUgT3B0aW9uYWwuIFRoZSBhbW91bnQgb2YgZmVlcyB0byBidXJuIGluIGl0cyBzbWFsbGVzdCBkZW5vbWluYXRpb24sIHJlcHJlc2VudGVkIGFzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqIEBwYXJhbSBmZWVBc3NldElEIE9wdGlvbmFsLiBUaGUgYXNzZXRJRCBvZiB0aGUgZmVlcyBiZWluZyBidXJuZWQuIERlZmF1bHQ6IGFzc2V0SURcbiAgICogQHBhcmFtIG1lbW8gT3B0aW9uYWwuIENvbnRhaW5zIGFyYml0cmFyeSBkYXRhLCB1cCB0byAyNTYgYnl0ZXNcbiAgICogQHBhcmFtIGFzT2YgT3B0aW9uYWwuIFRoZSB0aW1lc3RhbXAgdG8gdmVyaWZ5IHRoZSB0cmFuc2FjdGlvbiBhZ2FpbnN0IGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICogQHBhcmFtIGxvY2t0aW1lIE9wdGlvbmFsLiBUaGUgbG9ja3RpbWUgZmllbGQgY3JlYXRlZCBpbiB0aGUgcmVzdWx0aW5nIG91dHB1dHNcbiAgICogQHBhcmFtIHRocmVzaG9sZCBPcHRpb25hbC4gVGhlIG51bWJlciBvZiBzaWduYXR1cmVzIHJlcXVpcmVkIHRvIHNwZW5kIHRoZSBmdW5kcyBpbiB0aGUgcmVzdWx0YW50IFVUWE9cbiAgICogXG4gICAqIEByZXR1cm5zIEFuIHVuc2lnbmVkIHRyYW5zYWN0aW9uIGNyZWF0ZWQgZnJvbSB0aGUgcGFzc2VkIGluIHBhcmFtZXRlcnMuXG4gICAqXG4gICAqL1xuICBidWlsZEJhc2VUeCA9IChcbiAgICBuZXR3b3JraWQ6bnVtYmVyLFxuICAgIGJsb2NrY2hhaW5pZDpCdWZmZXIsXG4gICAgYW1vdW50OkJOLFxuICAgIGFzc2V0SUQ6QnVmZmVyLFxuICAgIHRvQWRkcmVzc2VzOkFycmF5PEJ1ZmZlcj4sXG4gICAgZnJvbUFkZHJlc3NlczpBcnJheTxCdWZmZXI+LFxuICAgIGNoYW5nZUFkZHJlc3NlczpBcnJheTxCdWZmZXI+ID0gdW5kZWZpbmVkLFxuICAgIGZlZTpCTiA9IHVuZGVmaW5lZCxcbiAgICBmZWVBc3NldElEOkJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICBtZW1vOkJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICBhc09mOkJOID0gVW5peE5vdygpLFxuICAgIGxvY2t0aW1lOkJOID0gbmV3IEJOKDApLFxuICAgIHRocmVzaG9sZDpudW1iZXIgPSAxXG4gICk6VW5zaWduZWRUeCA9PiB7XG5cbiAgICBpZih0aHJlc2hvbGQgPiB0b0FkZHJlc3Nlcy5sZW5ndGgpIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEVycm9yIC0gVVRYT1NldC5idWlsZEJhc2VUeDogdGhyZXNob2xkIGlzIGdyZWF0ZXIgdGhhbiBudW1iZXIgb2YgYWRkcmVzc2VzYCk7XG4gICAgfVxuXG4gICAgaWYodHlwZW9mIGNoYW5nZUFkZHJlc3NlcyA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgY2hhbmdlQWRkcmVzc2VzID0gdG9BZGRyZXNzZXM7XG4gICAgfVxuXG4gICAgaWYodHlwZW9mIGZlZUFzc2V0SUQgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIGZlZUFzc2V0SUQgPSBhc3NldElEO1xuICAgIH1cblxuICAgIGNvbnN0IHplcm86Qk4gPSBuZXcgQk4oMCk7XG4gICAgXG4gICAgaWYgKGFtb3VudC5lcSh6ZXJvKSkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICBjb25zdCBhYWQ6QXNzZXRBbW91bnREZXN0aW5hdGlvbiA9IG5ldyBBc3NldEFtb3VudERlc3RpbmF0aW9uKHRvQWRkcmVzc2VzLCBmcm9tQWRkcmVzc2VzLCBjaGFuZ2VBZGRyZXNzZXMpO1xuICAgIGlmKGFzc2V0SUQudG9TdHJpbmcoXCJoZXhcIikgPT09IGZlZUFzc2V0SUQudG9TdHJpbmcoXCJoZXhcIikpe1xuICAgICAgYWFkLmFkZEFzc2V0QW1vdW50KGFzc2V0SUQsIGFtb3VudCwgZmVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgYWFkLmFkZEFzc2V0QW1vdW50KGFzc2V0SUQsIGFtb3VudCwgemVybyk7XG4gICAgICBpZih0aGlzLl9mZWVDaGVjayhmZWUsIGZlZUFzc2V0SUQpKSB7XG4gICAgICAgIGFhZC5hZGRBc3NldEFtb3VudChmZWVBc3NldElELCB6ZXJvLCBmZWUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGxldCBpbnM6QXJyYXk8VHJhbnNmZXJhYmxlSW5wdXQ+ID0gW107XG4gICAgbGV0IG91dHM6QXJyYXk8VHJhbnNmZXJhYmxlT3V0cHV0PiA9IFtdO1xuICAgIFxuICAgIGNvbnN0IHN1Y2Nlc3M6RXJyb3IgPSB0aGlzLmdldE1pbmltdW1TcGVuZGFibGUoYWFkLCBhc09mLCBsb2NrdGltZSwgdGhyZXNob2xkKTtcbiAgICBpZih0eXBlb2Ygc3VjY2VzcyA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgaW5zID0gYWFkLmdldElucHV0cygpO1xuICAgICAgb3V0cyA9IGFhZC5nZXRBbGxPdXRwdXRzKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IHN1Y2Nlc3M7XG4gICAgfVxuXG4gICAgY29uc3QgYmFzZVR4OkJhc2VUeCA9IG5ldyBCYXNlVHgobmV0d29ya2lkLCBibG9ja2NoYWluaWQsIG91dHMsIGlucywgbWVtbyk7XG4gICAgcmV0dXJuIG5ldyBVbnNpZ25lZFR4KGJhc2VUeCk7XG5cbiAgfTtcblxuICAvKipcbiAgICogQ3JlYXRlcyBhbiB1bnNpZ25lZCBDcmVhdGUgQXNzZXQgdHJhbnNhY3Rpb24uIEZvciBtb3JlIGdyYW51bGFyIGNvbnRyb2wsIHlvdSBtYXkgY3JlYXRlIHlvdXIgb3duXG4gICAqIFtbQ3JlYXRlQXNzZXRUWF1dIG1hbnVhbGx5ICh3aXRoIHRoZWlyIGNvcnJlc3BvbmRpbmcgW1tUcmFuc2ZlcmFibGVJbnB1dF1dcywgW1tUcmFuc2ZlcmFibGVPdXRwdXRdXXMpLlxuICAgKiBcbiAgICogQHBhcmFtIG5ldHdvcmtpZCBUaGUgbnVtYmVyIHJlcHJlc2VudGluZyBOZXR3b3JrSUQgb2YgdGhlIG5vZGVcbiAgICogQHBhcmFtIGJsb2NrY2hhaW5pZCBUaGUge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gcmVwcmVzZW50aW5nIHRoZSBCbG9ja2NoYWluSUQgZm9yIHRoZSB0cmFuc2FjdGlvblxuICAgKiBAcGFyYW0gZnJvbUFkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIGJlaW5nIHVzZWQgdG8gc2VuZCB0aGUgZnVuZHMgZnJvbSB0aGUgVVRYT3Mge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn1cbiAgICogQHBhcmFtIGNoYW5nZUFkZHJlc3NlcyBPcHRpb25hbC4gVGhlIGFkZHJlc3NlcyB0aGF0IGNhbiBzcGVuZCB0aGUgY2hhbmdlIHJlbWFpbmluZyBmcm9tIHRoZSBzcGVudCBVVFhPc1xuICAgKiBAcGFyYW0gaW5pdGlhbFN0YXRlIFRoZSBbW0luaXRpYWxTdGF0ZXNdXSB0aGF0IHJlcHJlc2VudCB0aGUgaW50aWFsIHN0YXRlIG9mIGEgY3JlYXRlZCBhc3NldFxuICAgKiBAcGFyYW0gbmFtZSBTdHJpbmcgZm9yIHRoZSBkZXNjcmlwdGl2ZSBuYW1lIG9mIHRoZSBhc3NldFxuICAgKiBAcGFyYW0gc3ltYm9sIFN0cmluZyBmb3IgdGhlIHRpY2tlciBzeW1ib2wgb2YgdGhlIGFzc2V0XG4gICAqIEBwYXJhbSBkZW5vbWluYXRpb24gT3B0aW9uYWwgbnVtYmVyIGZvciB0aGUgZGVub21pbmF0aW9uIHdoaWNoIGlzIDEwXkQuIEQgbXVzdCBiZSA+PSAwIGFuZCA8PSAzMi4gRXg6ICQxIEFWQVggPSAxMF45ICRuQVZBWFxuICAgKiBAcGFyYW0gbWludE91dHB1dHMgT3B0aW9uYWwuIEFycmF5IG9mIFtbU0VDUE1pbnRPdXRwdXRdXXMgdG8gYmUgaW5jbHVkZWQgaW4gdGhlIHRyYW5zYWN0aW9uLiBUaGVzZSBvdXRwdXRzIGNhbiBiZSBzcGVudCB0byBtaW50IG1vcmUgdG9rZW5zLlxuICAgKiBAcGFyYW0gZmVlIE9wdGlvbmFsLiBUaGUgYW1vdW50IG9mIGZlZXMgdG8gYnVybiBpbiBpdHMgc21hbGxlc3QgZGVub21pbmF0aW9uLCByZXByZXNlbnRlZCBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKiBAcGFyYW0gZmVlQXNzZXRJRCBPcHRpb25hbC4gVGhlIGFzc2V0SUQgb2YgdGhlIGZlZXMgYmVpbmcgYnVybmVkLlxuICAgKiBAcGFyYW0gbWVtbyBPcHRpb25hbCBjb250YWlucyBhcmJpdHJhcnkgYnl0ZXMsIHVwIHRvIDI1NiBieXRlc1xuICAgKiBAcGFyYW0gYXNPZiBPcHRpb25hbC4gVGhlIHRpbWVzdGFtcCB0byB2ZXJpZnkgdGhlIHRyYW5zYWN0aW9uIGFnYWluc3QgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKlxuICAgKiBAcmV0dXJucyBBbiB1bnNpZ25lZCB0cmFuc2FjdGlvbiBjcmVhdGVkIGZyb20gdGhlIHBhc3NlZCBpbiBwYXJhbWV0ZXJzLlxuICAgKlxuICAgKi9cbiAgYnVpbGRDcmVhdGVBc3NldFR4ID0gKFxuICAgICAgbmV0d29ya2lkOm51bWJlciwgXG4gICAgICBibG9ja2NoYWluaWQ6QnVmZmVyLCBcbiAgICAgIGZyb21BZGRyZXNzZXM6QXJyYXk8QnVmZmVyPixcbiAgICAgIGNoYW5nZUFkZHJlc3NlczpBcnJheTxCdWZmZXI+LFxuICAgICAgaW5pdGlhbFN0YXRlOkluaXRpYWxTdGF0ZXMsIFxuICAgICAgbmFtZTpzdHJpbmcsIFxuICAgICAgc3ltYm9sOnN0cmluZywgXG4gICAgICBkZW5vbWluYXRpb246bnVtYmVyLCBcbiAgICAgIG1pbnRPdXRwdXRzOkFycmF5PFNFQ1BNaW50T3V0cHV0PiA9IHVuZGVmaW5lZCxcbiAgICAgIGZlZTpCTiA9IHVuZGVmaW5lZCxcbiAgICAgIGZlZUFzc2V0SUQ6QnVmZmVyID0gdW5kZWZpbmVkLCBcbiAgICAgIG1lbW86QnVmZmVyID0gdW5kZWZpbmVkLCBcbiAgICAgIGFzT2Y6Qk4gPSBVbml4Tm93KClcbiAgKTpVbnNpZ25lZFR4ID0+IHtcbiAgICBjb25zdCB6ZXJvOkJOID0gbmV3IEJOKDApO1xuICAgIGxldCBpbnM6QXJyYXk8VHJhbnNmZXJhYmxlSW5wdXQ+ID0gW107XG4gICAgbGV0IG91dHM6QXJyYXk8VHJhbnNmZXJhYmxlT3V0cHV0PiA9IFtdO1xuICAgIFxuICAgIGlmKHRoaXMuX2ZlZUNoZWNrKGZlZSwgZmVlQXNzZXRJRCkpe1xuICAgICAgY29uc3QgYWFkOkFzc2V0QW1vdW50RGVzdGluYXRpb24gPSBuZXcgQXNzZXRBbW91bnREZXN0aW5hdGlvbihmcm9tQWRkcmVzc2VzLCBmcm9tQWRkcmVzc2VzLCBjaGFuZ2VBZGRyZXNzZXMpO1xuICAgICAgYWFkLmFkZEFzc2V0QW1vdW50KGZlZUFzc2V0SUQsIHplcm8sIGZlZSk7XG4gICAgICBjb25zdCBzdWNjZXNzOkVycm9yID0gdGhpcy5nZXRNaW5pbXVtU3BlbmRhYmxlKGFhZCwgYXNPZik7XG4gICAgICBpZih0eXBlb2Ygc3VjY2VzcyA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICBpbnMgPSBhYWQuZ2V0SW5wdXRzKCk7XG4gICAgICAgIG91dHMgPSBhYWQuZ2V0QWxsT3V0cHV0cygpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgc3VjY2VzcztcbiAgICAgIH1cbiAgICB9XG4gICAgaWYodHlwZW9mIG1pbnRPdXRwdXRzICE9PSBcInVuZGVmaW5lZFwiKXtcbiAgICAgIGZvcihsZXQgaSA9IDA7IGkgPCBtaW50T3V0cHV0cy5sZW5ndGg7IGkrKyl7XG4gICAgICAgIGlmKG1pbnRPdXRwdXRzW2ldIGluc3RhbmNlb2YgU0VDUE1pbnRPdXRwdXQpe1xuICAgICAgICAgIGluaXRpYWxTdGF0ZS5hZGRPdXRwdXQobWludE91dHB1dHNbaV0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkVycm9yIC0gVVRYT1NldC5idWlsZENyZWF0ZUFzc2V0VHg6IEEgc3VibWl0dGVkIG1pbnRPdXRwdXQgd2FzIG5vdCBvZiB0eXBlIFNFQ1BNaW50T3V0cHV0XCIpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgbGV0IENBdHg6Q3JlYXRlQXNzZXRUeCA9IG5ldyBDcmVhdGVBc3NldFR4KG5ldHdvcmtpZCwgYmxvY2tjaGFpbmlkLCBvdXRzLCBpbnMsIG1lbW8sIG5hbWUsIHN5bWJvbCwgZGVub21pbmF0aW9uLCBpbml0aWFsU3RhdGUpO1xuICAgIHJldHVybiBuZXcgVW5zaWduZWRUeChDQXR4KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGFuIHVuc2lnbmVkIFNlY3AgbWludCB0cmFuc2FjdGlvbi4gRm9yIG1vcmUgZ3JhbnVsYXIgY29udHJvbCwgeW91IG1heSBjcmVhdGUgeW91ciBvd25cbiAgICogW1tPcGVyYXRpb25UeF1dIG1hbnVhbGx5ICh3aXRoIHRoZWlyIGNvcnJlc3BvbmRpbmcgW1tUcmFuc2ZlcmFibGVJbnB1dF1dcywgW1tUcmFuc2ZlcmFibGVPdXRwdXRdXXMsIGFuZCBbW1RyYW5zZmVyT3BlcmF0aW9uXV1zKS5cbiAgICogXG4gICAqIEBwYXJhbSBuZXR3b3JraWQgVGhlIG51bWJlciByZXByZXNlbnRpbmcgTmV0d29ya0lEIG9mIHRoZSBub2RlXG4gICAqIEBwYXJhbSBibG9ja2NoYWluaWQgVGhlIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHJlcHJlc2VudGluZyB0aGUgQmxvY2tjaGFpbklEIGZvciB0aGUgdHJhbnNhY3Rpb25cbiAgICogQHBhcmFtIG1pbnRPd25lciBBIFtbU0VDUE1pbnRPdXRwdXRdXSB3aGljaCBzcGVjaWZpZXMgdGhlIG5ldyBzZXQgb2YgbWludGVyc1xuICAgKiBAcGFyYW0gdHJhbnNmZXJPd25lciBBIFtbU0VDUFRyYW5zZmVyT3V0cHV0XV0gd2hpY2ggc3BlY2lmaWVzIHdoZXJlIHRoZSBtaW50ZWQgdG9rZW5zIHdpbGwgZ29cbiAgICogQHBhcmFtIGZyb21BZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyBiZWluZyB1c2VkIHRvIHNlbmQgdGhlIGZ1bmRzIGZyb20gdGhlIFVUWE9zIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9XG4gICAqIEBwYXJhbSBjaGFuZ2VBZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyB0aGF0IGNhbiBzcGVuZCB0aGUgY2hhbmdlIHJlbWFpbmluZyBmcm9tIHRoZSBzcGVudCBVVFhPc1xuICAgKiBAcGFyYW0gbWludFVUWE9JRCBUaGUgVVRYT0lEIGZvciB0aGUgW1tTQ1BNaW50T3V0cHV0XV0gYmVpbmcgc3BlbnQgdG8gcHJvZHVjZSBtb3JlIHRva2Vuc1xuICAgKiBAcGFyYW0gZmVlIE9wdGlvbmFsLiBUaGUgYW1vdW50IG9mIGZlZXMgdG8gYnVybiBpbiBpdHMgc21hbGxlc3QgZGVub21pbmF0aW9uLCByZXByZXNlbnRlZCBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKiBAcGFyYW0gZmVlQXNzZXRJRCBPcHRpb25hbC4gVGhlIGFzc2V0SUQgb2YgdGhlIGZlZXMgYmVpbmcgYnVybmVkLlxuICAgKiBAcGFyYW0gbWVtbyBPcHRpb25hbCBjb250YWlucyBhcmJpdHJhcnkgYnl0ZXMsIHVwIHRvIDI1NiBieXRlc1xuICAgKiBAcGFyYW0gYXNPZiBPcHRpb25hbC4gVGhlIHRpbWVzdGFtcCB0byB2ZXJpZnkgdGhlIHRyYW5zYWN0aW9uIGFnYWluc3QgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKi9cbiAgYnVpbGRTRUNQTWludFR4ID0gKFxuICAgIG5ldHdvcmtpZDpudW1iZXIsIFxuICAgIGJsb2NrY2hhaW5pZDpCdWZmZXIsXG4gICAgbWludE93bmVyOlNFQ1BNaW50T3V0cHV0LFxuICAgIHRyYW5zZmVyT3duZXI6U0VDUFRyYW5zZmVyT3V0cHV0LFxuICAgIGZyb21BZGRyZXNzZXM6QXJyYXk8QnVmZmVyPixcbiAgICBjaGFuZ2VBZGRyZXNzZXM6QXJyYXk8QnVmZmVyPixcbiAgICBtaW50VVRYT0lEOnN0cmluZyxcbiAgICBmZWU6Qk4gPSB1bmRlZmluZWQsXG4gICAgZmVlQXNzZXRJRDpCdWZmZXIgPSB1bmRlZmluZWQsICBcbiAgICBtZW1vOkJ1ZmZlciA9IHVuZGVmaW5lZCwgXG4gICAgYXNPZjpCTiA9IFVuaXhOb3coKVxuICApOlVuc2lnbmVkVHggPT4ge1xuICAgIGNvbnN0IHplcm86Qk4gPSBuZXcgQk4oMCk7XG4gICAgbGV0IGluczpBcnJheTxUcmFuc2ZlcmFibGVJbnB1dD4gPSBbXTtcbiAgICBsZXQgb3V0czpBcnJheTxUcmFuc2ZlcmFibGVPdXRwdXQ+ID0gW107XG5cbiAgICBpZih0aGlzLl9mZWVDaGVjayhmZWUsIGZlZUFzc2V0SUQpKSB7XG4gICAgICBjb25zdCBhYWQ6QXNzZXRBbW91bnREZXN0aW5hdGlvbiA9IG5ldyBBc3NldEFtb3VudERlc3RpbmF0aW9uKGZyb21BZGRyZXNzZXMsIGZyb21BZGRyZXNzZXMsIGNoYW5nZUFkZHJlc3Nlcyk7XG4gICAgICBhYWQuYWRkQXNzZXRBbW91bnQoZmVlQXNzZXRJRCwgemVybywgZmVlKTtcbiAgICAgIGNvbnN0IHN1Y2Nlc3M6RXJyb3IgPSB0aGlzLmdldE1pbmltdW1TcGVuZGFibGUoYWFkLCBhc09mKTtcbiAgICAgIGlmKHR5cGVvZiBzdWNjZXNzID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIGlucyA9IGFhZC5nZXRJbnB1dHMoKTtcbiAgICAgICAgb3V0cyA9IGFhZC5nZXRBbGxPdXRwdXRzKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBzdWNjZXNzO1xuICAgICAgfVxuICAgIH1cblxuICAgIGxldCBvcHM6QXJyYXk8VHJhbnNmZXJhYmxlT3BlcmF0aW9uPiA9IFtdO1xuICAgIGxldCBtaW50T3A6U0VDUE1pbnRPcGVyYXRpb24gPSAgbmV3IFNFQ1BNaW50T3BlcmF0aW9uKG1pbnRPd25lciwgdHJhbnNmZXJPd25lcik7XG4gICAgXG4gICAgbGV0IHV0eG86VVRYTyA9IHRoaXMuZ2V0VVRYTyhtaW50VVRYT0lEKTtcbiAgICBpZih0eXBlb2YgdXR4byA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRXJyb3IgLSBVVFhPU2V0LmJ1aWxkU0VDUE1pbnRUeDogVVRYT0lEIG5vdCBmb3VuZFwiKTtcbiAgICB9XG4gICAgaWYodXR4by5nZXRPdXRwdXQoKS5nZXRPdXRwdXRJRCgpICE9PSBBVk1Db25zdGFudHMuU0VDUE1JTlRPVVRQVVRJRCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRXJyb3IgLSBVVFhPU2V0LmJ1aWxkU0VDUE1pbnRUeDogVVRYTyBpcyBub3QgYSBTRUNQTUlOVE9VVFBVVElEXCIpO1xuICAgIH1cbiAgICBsZXQgb3V0OlNFQ1BNaW50T3V0cHV0ID0gdXR4by5nZXRPdXRwdXQoKSBhcyBTRUNQTWludE91dHB1dDtcbiAgICBsZXQgc3BlbmRlcnM6QXJyYXk8QnVmZmVyPiA9IG91dC5nZXRTcGVuZGVycyhmcm9tQWRkcmVzc2VzLCBhc09mKTtcblxuICAgIGZvcihsZXQgajpudW1iZXIgPSAwOyBqIDwgc3BlbmRlcnMubGVuZ3RoOyBqKyspIHtcbiAgICAgIGxldCBpZHg6bnVtYmVyID0gb3V0LmdldEFkZHJlc3NJZHgoc3BlbmRlcnNbal0pO1xuICAgICAgaWYoaWR4ID09IC0xKSB7XG4gICAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEVycm9yIC0gVVRYT1NldC5idWlsZFNFQ1BNaW50VHg6IG5vIHN1Y2ggYWRkcmVzcyBpbiBvdXRwdXQ6ICR7c3BlbmRlcnNbal19YCk7XG4gICAgICB9XG4gICAgICBtaW50T3AuYWRkU2lnbmF0dXJlSWR4KGlkeCwgc3BlbmRlcnNbal0pO1xuICAgIH1cbiAgICAgIFxuICAgIGxldCB0cmFuc2ZlcmFibGVPcGVyYXRpb246VHJhbnNmZXJhYmxlT3BlcmF0aW9uID0gbmV3IFRyYW5zZmVyYWJsZU9wZXJhdGlvbih1dHhvLmdldEFzc2V0SUQoKSwgW21pbnRVVFhPSURdLCBtaW50T3ApO1xuICAgIG9wcy5wdXNoKHRyYW5zZmVyYWJsZU9wZXJhdGlvbik7XG5cbiAgICBsZXQgb3BlcmF0aW9uVHg6T3BlcmF0aW9uVHggPSBuZXcgT3BlcmF0aW9uVHgobmV0d29ya2lkLCBibG9ja2NoYWluaWQsIG91dHMsIGlucywgbWVtbywgb3BzKTtcbiAgICByZXR1cm4gbmV3IFVuc2lnbmVkVHgob3BlcmF0aW9uVHgpO1xuICB9XG5cbiAgLyoqXG4gICogQ3JlYXRlcyBhbiB1bnNpZ25lZCBDcmVhdGUgQXNzZXQgdHJhbnNhY3Rpb24uIEZvciBtb3JlIGdyYW51bGFyIGNvbnRyb2wsIHlvdSBtYXkgY3JlYXRlIHlvdXIgb3duXG4gICogW1tDcmVhdGVBc3NldFRYXV0gbWFudWFsbHkgKHdpdGggdGhlaXIgY29ycmVzcG9uZGluZyBbW1RyYW5zZmVyYWJsZUlucHV0XV1zLCBbW1RyYW5zZmVyYWJsZU91dHB1dF1dcykuXG4gICogXG4gICogQHBhcmFtIG5ldHdvcmtpZCBUaGUgbnVtYmVyIHJlcHJlc2VudGluZyBOZXR3b3JrSUQgb2YgdGhlIG5vZGVcbiAgKiBAcGFyYW0gYmxvY2tjaGFpbmlkIFRoZSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSByZXByZXNlbnRpbmcgdGhlIEJsb2NrY2hhaW5JRCBmb3IgdGhlIHRyYW5zYWN0aW9uXG4gICogQHBhcmFtIGZyb21BZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyBiZWluZyB1c2VkIHRvIHNlbmQgdGhlIGZ1bmRzIGZyb20gdGhlIFVUWE9zIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9XG4gICogQHBhcmFtIGNoYW5nZUFkZHJlc3NlcyBPcHRpb25hbC4gVGhlIGFkZHJlc3NlcyB0aGF0IGNhbiBzcGVuZCB0aGUgY2hhbmdlIHJlbWFpbmluZyBmcm9tIHRoZSBzcGVudCBVVFhPcy5cbiAgKiBAcGFyYW0gbWludGVyU2V0cyBUaGUgbWludGVycyBhbmQgdGhyZXNob2xkcyByZXF1aXJlZCB0byBtaW50IHRoaXMgbmZ0IGFzc2V0XG4gICogQHBhcmFtIG5hbWUgU3RyaW5nIGZvciB0aGUgZGVzY3JpcHRpdmUgbmFtZSBvZiB0aGUgbmZ0IGFzc2V0XG4gICogQHBhcmFtIHN5bWJvbCBTdHJpbmcgZm9yIHRoZSB0aWNrZXIgc3ltYm9sIG9mIHRoZSBuZnQgYXNzZXRcbiAgKiBAcGFyYW0gZmVlIE9wdGlvbmFsLiBUaGUgYW1vdW50IG9mIGZlZXMgdG8gYnVybiBpbiBpdHMgc21hbGxlc3QgZGVub21pbmF0aW9uLCByZXByZXNlbnRlZCBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAqIEBwYXJhbSBmZWVBc3NldElEIE9wdGlvbmFsLiBUaGUgYXNzZXRJRCBvZiB0aGUgZmVlcyBiZWluZyBidXJuZWQuXG4gICogQHBhcmFtIG1lbW8gT3B0aW9uYWwgY29udGFpbnMgYXJiaXRyYXJ5IGJ5dGVzLCB1cCB0byAyNTYgYnl0ZXNcbiAgKiBAcGFyYW0gYXNPZiBPcHRpb25hbC4gVGhlIHRpbWVzdGFtcCB0byB2ZXJpZnkgdGhlIHRyYW5zYWN0aW9uIGFnYWluc3QgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAqIEBwYXJhbSBsb2NrdGltZSBPcHRpb25hbC4gVGhlIGxvY2t0aW1lIGZpZWxkIGNyZWF0ZWQgaW4gdGhlIHJlc3VsdGluZyBtaW50IG91dHB1dFxuICAqIFxuICAqIEByZXR1cm5zIEFuIHVuc2lnbmVkIHRyYW5zYWN0aW9uIGNyZWF0ZWQgZnJvbSB0aGUgcGFzc2VkIGluIHBhcmFtZXRlcnMuXG4gICogXG4gICovXG4gIGJ1aWxkQ3JlYXRlTkZUQXNzZXRUeCA9IChcbiAgICAgIG5ldHdvcmtpZDpudW1iZXIsIFxuICAgICAgYmxvY2tjaGFpbmlkOkJ1ZmZlciwgXG4gICAgICBmcm9tQWRkcmVzc2VzOkFycmF5PEJ1ZmZlcj4sXG4gICAgICBjaGFuZ2VBZGRyZXNzZXM6QXJyYXk8QnVmZmVyPixcbiAgICAgIG1pbnRlclNldHM6QXJyYXk8TWludGVyU2V0PixcbiAgICAgIG5hbWU6c3RyaW5nLCBcbiAgICAgIHN5bWJvbDpzdHJpbmcsXG4gICAgICBmZWU6Qk4gPSB1bmRlZmluZWQsXG4gICAgICBmZWVBc3NldElEOkJ1ZmZlciA9IHVuZGVmaW5lZCwgIFxuICAgICAgbWVtbzpCdWZmZXIgPSB1bmRlZmluZWQsIFxuICAgICAgYXNPZjpCTiA9IFVuaXhOb3coKSxcbiAgICAgIGxvY2t0aW1lOkJOID0gdW5kZWZpbmVkXG4gICk6VW5zaWduZWRUeCA9PiB7XG4gICAgY29uc3QgemVybzpCTiA9IG5ldyBCTigwKTtcbiAgICBsZXQgaW5zOkFycmF5PFRyYW5zZmVyYWJsZUlucHV0PiA9IFtdO1xuICAgIGxldCBvdXRzOkFycmF5PFRyYW5zZmVyYWJsZU91dHB1dD4gPSBbXTtcbiAgICBcbiAgICBpZih0aGlzLl9mZWVDaGVjayhmZWUsIGZlZUFzc2V0SUQpKSB7XG4gICAgICBjb25zdCBhYWQ6QXNzZXRBbW91bnREZXN0aW5hdGlvbiA9IG5ldyBBc3NldEFtb3VudERlc3RpbmF0aW9uKGZyb21BZGRyZXNzZXMsIGZyb21BZGRyZXNzZXMsIGNoYW5nZUFkZHJlc3Nlcyk7XG4gICAgICBhYWQuYWRkQXNzZXRBbW91bnQoZmVlQXNzZXRJRCwgemVybywgZmVlKTtcbiAgICAgIGNvbnN0IHN1Y2Nlc3M6RXJyb3IgPSB0aGlzLmdldE1pbmltdW1TcGVuZGFibGUoYWFkLCBhc09mKTtcbiAgICAgIGlmKHR5cGVvZiBzdWNjZXNzID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIGlucyA9IGFhZC5nZXRJbnB1dHMoKTtcbiAgICAgICAgb3V0cyA9IGFhZC5nZXRBbGxPdXRwdXRzKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBzdWNjZXNzO1xuICAgICAgfVxuICAgIH1cbiAgICBsZXQgaW5pdGlhbFN0YXRlOkluaXRpYWxTdGF0ZXMgPSBuZXcgSW5pdGlhbFN0YXRlcygpO1xuICAgIGZvcihsZXQgaTpudW1iZXIgPSAwOyBpIDwgbWludGVyU2V0cy5sZW5ndGg7IGkrKykge1xuICAgICAgbGV0IG5mdE1pbnRPdXRwdXQ6TkZUTWludE91dHB1dCA9IG5ldyBORlRNaW50T3V0cHV0KFxuICAgICAgICBpLFxuICAgICAgICBtaW50ZXJTZXRzW2ldLmdldE1pbnRlcnMoKSxcbiAgICAgICAgbG9ja3RpbWUsIFxuICAgICAgICBtaW50ZXJTZXRzW2ldLmdldFRocmVzaG9sZCgpXG4gICAgICAgICk7XG4gICAgICBpbml0aWFsU3RhdGUuYWRkT3V0cHV0KG5mdE1pbnRPdXRwdXQsIEFWTUNvbnN0YW50cy5ORlRGWElEKTtcbiAgICB9XG4gICAgbGV0IGRlbm9taW5hdGlvbjpudW1iZXIgPSAwOyAvLyBORlRzIGFyZSBub24tZnVuZ2libGVcbiAgICBsZXQgQ0F0eDpDcmVhdGVBc3NldFR4ID0gbmV3IENyZWF0ZUFzc2V0VHgobmV0d29ya2lkLCBibG9ja2NoYWluaWQsIG91dHMsIGlucywgbWVtbywgbmFtZSwgc3ltYm9sLCBkZW5vbWluYXRpb24sIGluaXRpYWxTdGF0ZSk7XG4gICAgcmV0dXJuIG5ldyBVbnNpZ25lZFR4KENBdHgpO1xuICB9XG5cbiAgLyoqXG4gICogQ3JlYXRlcyBhbiB1bnNpZ25lZCBORlQgbWludCB0cmFuc2FjdGlvbi4gRm9yIG1vcmUgZ3JhbnVsYXIgY29udHJvbCwgeW91IG1heSBjcmVhdGUgeW91ciBvd25cbiAgKiBbW09wZXJhdGlvblR4XV0gbWFudWFsbHkgKHdpdGggdGhlaXIgY29ycmVzcG9uZGluZyBbW1RyYW5zZmVyYWJsZUlucHV0XV1zLCBbW1RyYW5zZmVyYWJsZU91dHB1dF1dcywgYW5kIFtbVHJhbnNmZXJPcGVyYXRpb25dXXMpLlxuICAqIFxuICAqIEBwYXJhbSBuZXR3b3JraWQgVGhlIG51bWJlciByZXByZXNlbnRpbmcgTmV0d29ya0lEIG9mIHRoZSBub2RlXG4gICogQHBhcmFtIGJsb2NrY2hhaW5pZCBUaGUge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gcmVwcmVzZW50aW5nIHRoZSBCbG9ja2NoYWluSUQgZm9yIHRoZSB0cmFuc2FjdGlvblxuICAqIEBwYXJhbSBvd25lcnMgQW4gYXJyYXkgb2YgW1tPdXRwdXRPd25lcnNdXSB3aG8gd2lsbCBiZSBnaXZlbiB0aGUgTkZUcy5cbiAgKiBAcGFyYW0gZnJvbUFkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIGJlaW5nIHVzZWQgdG8gc2VuZCB0aGUgZnVuZHMgZnJvbSB0aGUgVVRYT3NcbiAgKiBAcGFyYW0gY2hhbmdlQWRkcmVzc2VzIE9wdGlvbmFsLiBUaGUgYWRkcmVzc2VzIHRoYXQgY2FuIHNwZW5kIHRoZSBjaGFuZ2UgcmVtYWluaW5nIGZyb20gdGhlIHNwZW50IFVUWE9zLlxuICAqIEBwYXJhbSB1dHhvaWRzIEFuIGFycmF5IG9mIHN0cmluZ3MgZm9yIHRoZSBORlRzIGJlaW5nIHRyYW5zZmVycmVkXG4gICogQHBhcmFtIGdyb3VwSUQgT3B0aW9uYWwuIFRoZSBncm91cCB0aGlzIE5GVCBpcyBpc3N1ZWQgdG8uXG4gICogQHBhcmFtIHBheWxvYWQgT3B0aW9uYWwuIERhdGEgZm9yIE5GVCBQYXlsb2FkLlxuICAqIEBwYXJhbSBmZWUgT3B0aW9uYWwuIFRoZSBhbW91bnQgb2YgZmVlcyB0byBidXJuIGluIGl0cyBzbWFsbGVzdCBkZW5vbWluYXRpb24sIHJlcHJlc2VudGVkIGFzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICogQHBhcmFtIGZlZUFzc2V0SUQgT3B0aW9uYWwuIFRoZSBhc3NldElEIG9mIHRoZSBmZWVzIGJlaW5nIGJ1cm5lZC4gXG4gICogQHBhcmFtIG1lbW8gT3B0aW9uYWwgY29udGFpbnMgYXJiaXRyYXJ5IGJ5dGVzLCB1cCB0byAyNTYgYnl0ZXNcbiAgKiBAcGFyYW0gYXNPZiBPcHRpb25hbC4gVGhlIHRpbWVzdGFtcCB0byB2ZXJpZnkgdGhlIHRyYW5zYWN0aW9uIGFnYWluc3QgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAqIFxuICAqIEByZXR1cm5zIEFuIHVuc2lnbmVkIHRyYW5zYWN0aW9uIGNyZWF0ZWQgZnJvbSB0aGUgcGFzc2VkIGluIHBhcmFtZXRlcnMuXG4gICogXG4gICovXG4gIGJ1aWxkQ3JlYXRlTkZUTWludFR4ID0gKFxuICAgIG5ldHdvcmtpZDpudW1iZXIsIFxuICAgIGJsb2NrY2hhaW5pZDpCdWZmZXIsIFxuICAgIG93bmVyczpBcnJheTxPdXRwdXRPd25lcnM+LFxuICAgIGZyb21BZGRyZXNzZXM6QXJyYXk8QnVmZmVyPixcbiAgICBjaGFuZ2VBZGRyZXNzZXM6QXJyYXk8QnVmZmVyPixcbiAgICB1dHhvaWRzOkFycmF5PHN0cmluZz4sIFxuICAgIGdyb3VwSUQ6bnVtYmVyID0gMCwgXG4gICAgcGF5bG9hZDpCdWZmZXIgPSB1bmRlZmluZWQsIFxuICAgIGZlZTpCTiA9IHVuZGVmaW5lZCxcbiAgICBmZWVBc3NldElEOkJ1ZmZlciA9IHVuZGVmaW5lZCwgIFxuICAgIG1lbW86QnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIGFzT2Y6Qk4gPSBVbml4Tm93KClcbiAgKTpVbnNpZ25lZFR4ID0+IHtcblxuICAgIGNvbnN0IHplcm86Qk4gPSBuZXcgQk4oMCk7XG4gICAgbGV0IGluczpBcnJheTxUcmFuc2ZlcmFibGVJbnB1dD4gPSBbXTtcbiAgICBsZXQgb3V0czpBcnJheTxUcmFuc2ZlcmFibGVPdXRwdXQ+ID0gW107XG4gICAgXG4gICAgaWYodGhpcy5fZmVlQ2hlY2soZmVlLCBmZWVBc3NldElEKSkge1xuICAgICAgY29uc3QgYWFkOkFzc2V0QW1vdW50RGVzdGluYXRpb24gPSBuZXcgQXNzZXRBbW91bnREZXN0aW5hdGlvbihmcm9tQWRkcmVzc2VzLCBmcm9tQWRkcmVzc2VzLCBjaGFuZ2VBZGRyZXNzZXMpO1xuICAgICAgYWFkLmFkZEFzc2V0QW1vdW50KGZlZUFzc2V0SUQsIHplcm8sIGZlZSk7XG4gICAgICBjb25zdCBzdWNjZXNzOkVycm9yID0gdGhpcy5nZXRNaW5pbXVtU3BlbmRhYmxlKGFhZCwgYXNPZik7XG4gICAgICBpZih0eXBlb2Ygc3VjY2VzcyA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICBpbnMgPSBhYWQuZ2V0SW5wdXRzKCk7XG4gICAgICAgIG91dHMgPSBhYWQuZ2V0QWxsT3V0cHV0cygpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgc3VjY2VzcztcbiAgICAgIH1cbiAgICB9XG4gICAgbGV0IG9wczpBcnJheTxUcmFuc2ZlcmFibGVPcGVyYXRpb24+ID0gW107XG5cbiAgICBsZXQgbmZ0TWludE9wZXJhdGlvbjogTkZUTWludE9wZXJhdGlvbiA9IG5ldyBORlRNaW50T3BlcmF0aW9uKGdyb3VwSUQsIHBheWxvYWQsIG93bmVycyk7XG5cbiAgICBmb3IobGV0IGk6bnVtYmVyID0gMDsgaSA8IHV0eG9pZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgbGV0IHV0eG86VVRYTyA9IHRoaXMuZ2V0VVRYTyh1dHhvaWRzW2ldKTtcbiAgICAgICAgbGV0IG91dDpORlRUcmFuc2Zlck91dHB1dCA9IHV0eG8uZ2V0T3V0cHV0KCkgYXMgTkZUVHJhbnNmZXJPdXRwdXQ7XG4gICAgICAgIGxldCBzcGVuZGVyczpBcnJheTxCdWZmZXI+ID0gb3V0LmdldFNwZW5kZXJzKGZyb21BZGRyZXNzZXMsIGFzT2YpO1xuXG4gICAgICAgIGZvcihsZXQgajpudW1iZXIgPSAwOyBqIDwgc3BlbmRlcnMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIGxldCBpZHg6bnVtYmVyO1xuICAgICAgICAgICAgaWR4ID0gb3V0LmdldEFkZHJlc3NJZHgoc3BlbmRlcnNbal0pO1xuICAgICAgICAgICAgaWYoaWR4ID09IC0xKXtcbiAgICAgICAgICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgRXJyb3IgLSBVVFhPU2V0LmJ1aWxkQ3JlYXRlTkZUTWludFR4OiBubyBzdWNoIGFkZHJlc3MgaW4gb3V0cHV0OiAke3NwZW5kZXJzW2pdfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbmZ0TWludE9wZXJhdGlvbi5hZGRTaWduYXR1cmVJZHgoaWR4LCBzcGVuZGVyc1tqXSk7XG4gICAgICAgIH1cbiAgICAgICAgICBcbiAgICAgICAgbGV0IHRyYW5zZmVyYWJsZU9wZXJhdGlvbjpUcmFuc2ZlcmFibGVPcGVyYXRpb24gPSBuZXcgVHJhbnNmZXJhYmxlT3BlcmF0aW9uKHV0eG8uZ2V0QXNzZXRJRCgpLCB1dHhvaWRzLCBuZnRNaW50T3BlcmF0aW9uKTtcbiAgICAgICAgb3BzLnB1c2godHJhbnNmZXJhYmxlT3BlcmF0aW9uKTtcbiAgICB9XG5cbiAgICBsZXQgb3BlcmF0aW9uVHg6T3BlcmF0aW9uVHggPSBuZXcgT3BlcmF0aW9uVHgobmV0d29ya2lkLCBibG9ja2NoYWluaWQsIG91dHMsIGlucywgbWVtbywgb3BzKTtcbiAgICByZXR1cm4gbmV3IFVuc2lnbmVkVHgob3BlcmF0aW9uVHgpO1xuICB9XG5cbiAgLyoqXG4gICogQ3JlYXRlcyBhbiB1bnNpZ25lZCBORlQgdHJhbnNmZXIgdHJhbnNhY3Rpb24uIEZvciBtb3JlIGdyYW51bGFyIGNvbnRyb2wsIHlvdSBtYXkgY3JlYXRlIHlvdXIgb3duXG4gICogW1tPcGVyYXRpb25UeF1dIG1hbnVhbGx5ICh3aXRoIHRoZWlyIGNvcnJlc3BvbmRpbmcgW1tUcmFuc2ZlcmFibGVJbnB1dF1dcywgW1tUcmFuc2ZlcmFibGVPdXRwdXRdXXMsIGFuZCBbW1RyYW5zZmVyT3BlcmF0aW9uXV1zKS5cbiAgKlxuICAqIEBwYXJhbSBuZXR3b3JraWQgVGhlIG51bWJlciByZXByZXNlbnRpbmcgTmV0d29ya0lEIG9mIHRoZSBub2RlXG4gICogQHBhcmFtIGJsb2NrY2hhaW5pZCBUaGUge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gcmVwcmVzZW50aW5nIHRoZSBCbG9ja2NoYWluSUQgZm9yIHRoZSB0cmFuc2FjdGlvblxuICAqIEBwYXJhbSB0b0FkZHJlc3NlcyBBbiBhcnJheSBvZiB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfXMgd2hpY2ggaW5kaWNhdGUgd2hvIHJlY2lldmVzIHRoZSBORlRcbiAgKiBAcGFyYW0gZnJvbUFkZHJlc3NlcyBBbiBhcnJheSBmb3Ige0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gd2hvIG93bnMgdGhlIE5GVFxuICAqIEBwYXJhbSBjaGFuZ2VBZGRyZXNzZXMgT3B0aW9uYWwuIFRoZSBhZGRyZXNzZXMgdGhhdCBjYW4gc3BlbmQgdGhlIGNoYW5nZSByZW1haW5pbmcgZnJvbSB0aGUgc3BlbnQgVVRYT3MuXG4gICogQHBhcmFtIHV0eG9pZHMgQW4gYXJyYXkgb2Ygc3RyaW5ncyBmb3IgdGhlIE5GVHMgYmVpbmcgdHJhbnNmZXJyZWRcbiAgKiBAcGFyYW0gZmVlIE9wdGlvbmFsLiBUaGUgYW1vdW50IG9mIGZlZXMgdG8gYnVybiBpbiBpdHMgc21hbGxlc3QgZGVub21pbmF0aW9uLCByZXByZXNlbnRlZCBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAqIEBwYXJhbSBmZWVBc3NldElEIE9wdGlvbmFsLiBUaGUgYXNzZXRJRCBvZiB0aGUgZmVlcyBiZWluZyBidXJuZWQuIFxuICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsIGNvbnRhaW5zIGFyYml0cmFyeSBieXRlcywgdXAgdG8gMjU2IGJ5dGVzXG4gICogQHBhcmFtIGFzT2YgT3B0aW9uYWwuIFRoZSB0aW1lc3RhbXAgdG8gdmVyaWZ5IHRoZSB0cmFuc2FjdGlvbiBhZ2FpbnN0IGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgKiBAcGFyYW0gbG9ja3RpbWUgT3B0aW9uYWwuIFRoZSBsb2NrdGltZSBmaWVsZCBjcmVhdGVkIGluIHRoZSByZXN1bHRpbmcgb3V0cHV0c1xuICAqIEBwYXJhbSB0aHJlc2hvbGQgT3B0aW9uYWwuIFRoZSBudW1iZXIgb2Ygc2lnbmF0dXJlcyByZXF1aXJlZCB0byBzcGVuZCB0aGUgZnVuZHMgaW4gdGhlIHJlc3VsdGFudCBVVFhPXG4gICogXG4gICogQHJldHVybnMgQW4gdW5zaWduZWQgdHJhbnNhY3Rpb24gY3JlYXRlZCBmcm9tIHRoZSBwYXNzZWQgaW4gcGFyYW1ldGVycy5cbiAgKlxuICAqL1xuICBidWlsZE5GVFRyYW5zZmVyVHggPSAoXG4gICAgbmV0d29ya2lkOm51bWJlciwgXG4gICAgYmxvY2tjaGFpbmlkOkJ1ZmZlciwgXG4gICAgdG9BZGRyZXNzZXM6QXJyYXk8QnVmZmVyPiwgXG4gICAgZnJvbUFkZHJlc3NlczpBcnJheTxCdWZmZXI+LFxuICAgIGNoYW5nZUFkZHJlc3NlczpBcnJheTxCdWZmZXI+LFxuICAgIHV0eG9pZHM6QXJyYXk8c3RyaW5nPixcbiAgICBmZWU6Qk4gPSB1bmRlZmluZWQsXG4gICAgZmVlQXNzZXRJRDpCdWZmZXIgPSB1bmRlZmluZWQsIFxuICAgIG1lbW86QnVmZmVyID0gdW5kZWZpbmVkLCBcbiAgICBhc09mOkJOID0gVW5peE5vdygpLFxuICAgIGxvY2t0aW1lOkJOID0gbmV3IEJOKDApLCBcbiAgICB0aHJlc2hvbGQ6bnVtYmVyID0gMSxcbiAgKTpVbnNpZ25lZFR4ID0+IHtcbiAgICBjb25zdCB6ZXJvOkJOID0gbmV3IEJOKDApO1xuICAgIGxldCBpbnM6QXJyYXk8VHJhbnNmZXJhYmxlSW5wdXQ+ID0gW107XG4gICAgbGV0IG91dHM6QXJyYXk8VHJhbnNmZXJhYmxlT3V0cHV0PiA9IFtdO1xuICAgIFxuICAgIGlmKHRoaXMuX2ZlZUNoZWNrKGZlZSwgZmVlQXNzZXRJRCkpIHtcbiAgICAgIGNvbnN0IGFhZDpBc3NldEFtb3VudERlc3RpbmF0aW9uID0gbmV3IEFzc2V0QW1vdW50RGVzdGluYXRpb24oZnJvbUFkZHJlc3NlcywgZnJvbUFkZHJlc3NlcywgY2hhbmdlQWRkcmVzc2VzKTtcbiAgICAgIGFhZC5hZGRBc3NldEFtb3VudChmZWVBc3NldElELCB6ZXJvLCBmZWUpO1xuICAgICAgY29uc3Qgc3VjY2VzczpFcnJvciA9IHRoaXMuZ2V0TWluaW11bVNwZW5kYWJsZShhYWQsIGFzT2YpO1xuICAgICAgaWYodHlwZW9mIHN1Y2Nlc3MgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgaW5zID0gYWFkLmdldElucHV0cygpO1xuICAgICAgICBvdXRzID0gYWFkLmdldEFsbE91dHB1dHMoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IHN1Y2Nlc3M7XG4gICAgICB9XG4gICAgfVxuICAgIGNvbnN0IG9wczpBcnJheTxUcmFuc2ZlcmFibGVPcGVyYXRpb24+ID0gW107XG4gICAgZm9yIChsZXQgaTpudW1iZXIgPSAwOyBpIDwgdXR4b2lkcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgdXR4bzpVVFhPID0gdGhpcy5nZXRVVFhPKHV0eG9pZHNbaV0pO1xuICBcbiAgICAgIGNvbnN0IG91dDpORlRUcmFuc2Zlck91dHB1dCA9IHV0eG8uZ2V0T3V0cHV0KCkgYXMgTkZUVHJhbnNmZXJPdXRwdXQ7XG4gICAgICBjb25zdCBzcGVuZGVyczpBcnJheTxCdWZmZXI+ID0gb3V0LmdldFNwZW5kZXJzKGZyb21BZGRyZXNzZXMsIGFzT2YpO1xuICBcbiAgICAgIGNvbnN0IG91dGJvdW5kOk5GVFRyYW5zZmVyT3V0cHV0ID0gbmV3IE5GVFRyYW5zZmVyT3V0cHV0KFxuICAgICAgICBvdXQuZ2V0R3JvdXBJRCgpLCBvdXQuZ2V0UGF5bG9hZCgpLCB0b0FkZHJlc3NlcywgbG9ja3RpbWUsIHRocmVzaG9sZCwgXG4gICAgICApO1xuICAgICAgY29uc3Qgb3A6TkZUVHJhbnNmZXJPcGVyYXRpb24gPSBuZXcgTkZUVHJhbnNmZXJPcGVyYXRpb24ob3V0Ym91bmQpO1xuICBcbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgc3BlbmRlcnMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgY29uc3QgaWR4Om51bWJlciA9IG91dC5nZXRBZGRyZXNzSWR4KHNwZW5kZXJzW2pdKTtcbiAgICAgICAgaWYgKGlkeCA9PT0gLTEpIHtcbiAgICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignRXJyb3IgLSBVVFhPU2V0LmJ1aWxkTkZUVHJhbnNmZXJUeDogJ1xuICAgICAgICAgICsgYG5vIHN1Y2ggYWRkcmVzcyBpbiBvdXRwdXQ6ICR7c3BlbmRlcnNbal19YCk7XG4gICAgICAgIH1cbiAgICAgICAgb3AuYWRkU2lnbmF0dXJlSWR4KGlkeCwgc3BlbmRlcnNbal0pO1xuICAgICAgfVxuICBcbiAgICAgIGNvbnN0IHhmZXJvcDpUcmFuc2ZlcmFibGVPcGVyYXRpb24gPSBuZXcgVHJhbnNmZXJhYmxlT3BlcmF0aW9uKHV0eG8uZ2V0QXNzZXRJRCgpLFxuICAgICAgICBbdXR4b2lkc1tpXV0sXG4gICAgICAgIG9wKTtcbiAgICAgIG9wcy5wdXNoKHhmZXJvcCk7XG4gICAgfVxuICAgIGNvbnN0IE9wVHg6T3BlcmF0aW9uVHggPSBuZXcgT3BlcmF0aW9uVHgobmV0d29ya2lkLCBibG9ja2NoYWluaWQsIG91dHMsIGlucywgbWVtbywgb3BzKTtcbiAgICByZXR1cm4gbmV3IFVuc2lnbmVkVHgoT3BUeCk7XG4gIH07XG5cbiAgLyoqXG4gICAgKiBDcmVhdGVzIGFuIHVuc2lnbmVkIEltcG9ydFR4IHRyYW5zYWN0aW9uLlxuICAgICpcbiAgICAqIEBwYXJhbSBuZXR3b3JraWQgVGhlIG51bWJlciByZXByZXNlbnRpbmcgTmV0d29ya0lEIG9mIHRoZSBub2RlXG4gICAgKiBAcGFyYW0gYmxvY2tjaGFpbmlkIFRoZSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSByZXByZXNlbnRpbmcgdGhlIEJsb2NrY2hhaW5JRCBmb3IgdGhlIHRyYW5zYWN0aW9uXG4gICAgKiBAcGFyYW0gdG9BZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyB0byBzZW5kIHRoZSBmdW5kc1xuICAgICogQHBhcmFtIGZyb21BZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyBiZWluZyB1c2VkIHRvIHNlbmQgdGhlIGZ1bmRzIGZyb20gdGhlIFVUWE9zIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9XG4gICAgKiBAcGFyYW0gY2hhbmdlQWRkcmVzc2VzIE9wdGlvbmFsLiBUaGUgYWRkcmVzc2VzIHRoYXQgY2FuIHNwZW5kIHRoZSBjaGFuZ2UgcmVtYWluaW5nIGZyb20gdGhlIHNwZW50IFVUWE9zLlxuICAgICogQHBhcmFtIGltcG9ydElucyBBbiBhcnJheSBvZiBbW1RyYW5zZmVyYWJsZUlucHV0XV1zIGJlaW5nIGltcG9ydGVkXG4gICAgKiBAcGFyYW0gc291cmNlQ2hhaW4gQSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBmb3IgdGhlIGNoYWluaWQgd2hlcmUgdGhlIGltcG9ydHMgYXJlIGNvbWluZyBmcm9tLlxuICAgICogQHBhcmFtIGZlZSBPcHRpb25hbC4gVGhlIGFtb3VudCBvZiBmZWVzIHRvIGJ1cm4gaW4gaXRzIHNtYWxsZXN0IGRlbm9taW5hdGlvbiwgcmVwcmVzZW50ZWQgYXMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn0uIEZlZSB3aWxsIGNvbWUgZnJvbSB0aGUgaW5wdXRzIGZpcnN0LCBpZiB0aGV5IGNhbi5cbiAgICAqIEBwYXJhbSBmZWVBc3NldElEIE9wdGlvbmFsLiBUaGUgYXNzZXRJRCBvZiB0aGUgZmVlcyBiZWluZyBidXJuZWQuIFxuICAgICogQHBhcmFtIG1lbW8gT3B0aW9uYWwgY29udGFpbnMgYXJiaXRyYXJ5IGJ5dGVzLCB1cCB0byAyNTYgYnl0ZXNcbiAgICAqIEBwYXJhbSBhc09mIE9wdGlvbmFsLiBUaGUgdGltZXN0YW1wIHRvIHZlcmlmeSB0aGUgdHJhbnNhY3Rpb24gYWdhaW5zdCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAgKiBAcGFyYW0gbG9ja3RpbWUgT3B0aW9uYWwuIFRoZSBsb2NrdGltZSBmaWVsZCBjcmVhdGVkIGluIHRoZSByZXN1bHRpbmcgb3V0cHV0c1xuICAgICogQHBhcmFtIHRocmVzaG9sZCBPcHRpb25hbC4gVGhlIG51bWJlciBvZiBzaWduYXR1cmVzIHJlcXVpcmVkIHRvIHNwZW5kIHRoZSBmdW5kcyBpbiB0aGUgcmVzdWx0YW50IFVUWE9cbiAgICAqIEByZXR1cm5zIEFuIHVuc2lnbmVkIHRyYW5zYWN0aW9uIGNyZWF0ZWQgZnJvbSB0aGUgcGFzc2VkIGluIHBhcmFtZXRlcnMuXG4gICAgKlxuICAgICovXG4gICBidWlsZEltcG9ydFR4ID0gKFxuICAgIG5ldHdvcmtpZDpudW1iZXIsIFxuICAgIGJsb2NrY2hhaW5pZDpCdWZmZXIsXG4gICAgdG9BZGRyZXNzZXM6QXJyYXk8QnVmZmVyPixcbiAgICBmcm9tQWRkcmVzc2VzOkFycmF5PEJ1ZmZlcj4sXG4gICAgY2hhbmdlQWRkcmVzc2VzOkFycmF5PEJ1ZmZlcj4sXG4gICAgYXRvbWljczpBcnJheTxVVFhPPixcbiAgICBzb3VyY2VDaGFpbjpCdWZmZXIgPSB1bmRlZmluZWQsIFxuICAgIGZlZTpCTiA9IHVuZGVmaW5lZCxcbiAgICBmZWVBc3NldElEOkJ1ZmZlciA9IHVuZGVmaW5lZCwgXG4gICAgbWVtbzpCdWZmZXIgPSB1bmRlZmluZWQsIFxuICAgIGFzT2Y6Qk4gPSBVbml4Tm93KCksXG4gICAgbG9ja3RpbWU6Qk4gPSBuZXcgQk4oMCksIFxuICAgIHRocmVzaG9sZDpudW1iZXIgPSAxXG4gICk6VW5zaWduZWRUeCA9PiB7XG4gICAgY29uc3QgemVybzpCTiA9IG5ldyBCTigwKTtcbiAgICBsZXQgaW5zOkFycmF5PFRyYW5zZmVyYWJsZUlucHV0PiA9IFtdO1xuICAgIGxldCBvdXRzOkFycmF5PFRyYW5zZmVyYWJsZU91dHB1dD4gPSBbXTtcbiAgICBpZih0eXBlb2YgZmVlID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBmZWUgPSB6ZXJvLmNsb25lKCk7XG4gICAgfVxuXG4gICAgY29uc3QgaW1wb3J0SW5zOkFycmF5PFRyYW5zZmVyYWJsZUlucHV0PiA9IFtdO1xuICAgIGxldCBmZWVwYWlkOkJOID0gbmV3IEJOKDApO1xuICAgIGxldCBmZWVBc3NldFN0cjpzdHJpbmcgPSBmZWVBc3NldElELnRvU3RyaW5nKFwiaGV4XCIpO1xuICAgIGZvcihsZXQgaTpudW1iZXIgPSAwOyBpIDwgYXRvbWljcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgdXR4bzpVVFhPID0gYXRvbWljc1tpXTtcbiAgICAgIGNvbnN0IGFzc2V0SUQ6QnVmZmVyID0gdXR4by5nZXRBc3NldElEKCk7IFxuICAgICAgY29uc3Qgb3V0cHV0OkFtb3VudE91dHB1dCA9IHV0eG8uZ2V0T3V0cHV0KCkgYXMgQW1vdW50T3V0cHV0O1xuICAgICAgbGV0IGFtdDpCTiA9IG91dHB1dC5nZXRBbW91bnQoKS5jbG9uZSgpO1xuXG4gICAgICBsZXQgaW5mZWVhbW91bnQgPSBhbXQuY2xvbmUoKTtcbiAgICAgIGxldCBhc3NldFN0cjpzdHJpbmcgPSBhc3NldElELnRvU3RyaW5nKFwiaGV4XCIpO1xuICAgICAgaWYoXG4gICAgICAgIHR5cGVvZiBmZWVBc3NldElEICE9PSBcInVuZGVmaW5lZFwiICYmIFxuICAgICAgICBmZWUuZ3QoemVybykgJiYgXG4gICAgICAgIGZlZXBhaWQubHQoZmVlKSAmJiBcbiAgICAgICAgYXNzZXRTdHIgPT09IGZlZUFzc2V0U3RyXG4gICAgICApIFxuICAgICAge1xuICAgICAgICBmZWVwYWlkID0gZmVlcGFpZC5hZGQoaW5mZWVhbW91bnQpO1xuICAgICAgICBpZihmZWVwYWlkLmd0KGZlZSkpIHtcbiAgICAgICAgICBpbmZlZWFtb3VudCA9IGZlZXBhaWQuc3ViKGZlZSk7XG4gICAgICAgICAgZmVlcGFpZCA9IGZlZS5jbG9uZSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGluZmVlYW1vdW50ID0gIHplcm8uY2xvbmUoKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBjb25zdCB0eGlkOkJ1ZmZlciA9IHV0eG8uZ2V0VHhJRCgpO1xuICAgICAgY29uc3Qgb3V0cHV0aWR4OkJ1ZmZlciA9IHV0eG8uZ2V0T3V0cHV0SWR4KCk7XG4gICAgICBjb25zdCBpbnB1dDpTRUNQVHJhbnNmZXJJbnB1dCA9IG5ldyBTRUNQVHJhbnNmZXJJbnB1dChhbXQpO1xuICAgICAgY29uc3QgeGZlcmluOlRyYW5zZmVyYWJsZUlucHV0ID0gbmV3IFRyYW5zZmVyYWJsZUlucHV0KHR4aWQsIG91dHB1dGlkeCwgYXNzZXRJRCwgaW5wdXQpO1xuICAgICAgY29uc3QgZnJvbTpBcnJheTxCdWZmZXI+ID0gb3V0cHV0LmdldEFkZHJlc3NlcygpOyBcbiAgICAgIGNvbnN0IHNwZW5kZXJzOkFycmF5PEJ1ZmZlcj4gPSBvdXRwdXQuZ2V0U3BlbmRlcnMoZnJvbSwgYXNPZik7XG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHNwZW5kZXJzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgIGNvbnN0IGlkeDpudW1iZXIgPSBvdXRwdXQuZ2V0QWRkcmVzc0lkeChzcGVuZGVyc1tqXSk7XG4gICAgICAgIGlmIChpZHggPT09IC0xKSB7XG4gICAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Vycm9yIC0gVVRYT1NldC5idWlsZEltcG9ydFR4OiBubyBzdWNoICdcbiAgICAgICAgICArIGBhZGRyZXNzIGluIG91dHB1dDogJHtzcGVuZGVyc1tqXX1gKTtcbiAgICAgICAgfVxuICAgICAgICB4ZmVyaW4uZ2V0SW5wdXQoKS5hZGRTaWduYXR1cmVJZHgoaWR4LCBzcGVuZGVyc1tqXSk7XG4gICAgICB9XG4gICAgICBpbXBvcnRJbnMucHVzaCh4ZmVyaW4pO1xuXG4gICAgICAvL2FkZCBleHRyYSBvdXRwdXRzIGZvciBlYWNoIGFtb3VudCAoY2FsY3VsYXRlZCBmcm9tIHRoZSBpbXBvcnRlZCBpbnB1dHMpLCBtaW51cyBmZWVzXG4gICAgICBpZihpbmZlZWFtb3VudC5ndCh6ZXJvKSkge1xuICAgICAgICBjb25zdCBzcGVuZG91dDpBbW91bnRPdXRwdXQgPSBTZWxlY3RPdXRwdXRDbGFzcyhvdXRwdXQuZ2V0T3V0cHV0SUQoKSxcbiAgICAgICAgICBpbmZlZWFtb3VudCwgdG9BZGRyZXNzZXMsIGxvY2t0aW1lLCB0aHJlc2hvbGQpIGFzIEFtb3VudE91dHB1dDtcbiAgICAgICAgY29uc3QgeGZlcm91dDpUcmFuc2ZlcmFibGVPdXRwdXQgPSBuZXcgVHJhbnNmZXJhYmxlT3V0cHV0KGFzc2V0SUQsIHNwZW5kb3V0KTtcbiAgICAgICAgb3V0cy5wdXNoKHhmZXJvdXQpO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyBnZXQgcmVtYWluaW5nIGZlZXMgZnJvbSB0aGUgcHJvdmlkZWQgYWRkcmVzc2VzXG4gICAgbGV0IGZlZVJlbWFpbmluZzpCTiA9IGZlZS5zdWIoZmVlcGFpZCk7XG4gICAgaWYoZmVlUmVtYWluaW5nLmd0KHplcm8pICYmIHRoaXMuX2ZlZUNoZWNrKGZlZVJlbWFpbmluZywgZmVlQXNzZXRJRCkpIHtcbiAgICAgIGNvbnN0IGFhZDpBc3NldEFtb3VudERlc3RpbmF0aW9uID0gbmV3IEFzc2V0QW1vdW50RGVzdGluYXRpb24odG9BZGRyZXNzZXMsIGZyb21BZGRyZXNzZXMsIGNoYW5nZUFkZHJlc3Nlcyk7XG4gICAgICBhYWQuYWRkQXNzZXRBbW91bnQoZmVlQXNzZXRJRCwgemVybywgZmVlUmVtYWluaW5nKTtcbiAgICAgIGNvbnN0IHN1Y2Nlc3M6RXJyb3IgPSB0aGlzLmdldE1pbmltdW1TcGVuZGFibGUoYWFkLCBhc09mLCBsb2NrdGltZSwgdGhyZXNob2xkKTtcbiAgICAgIGlmKHR5cGVvZiBzdWNjZXNzID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIGlucyA9IGFhZC5nZXRJbnB1dHMoKTtcbiAgICAgICAgb3V0cyA9IGFhZC5nZXRBbGxPdXRwdXRzKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBzdWNjZXNzO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGltcG9ydFR4OkltcG9ydFR4ID0gbmV3IEltcG9ydFR4KG5ldHdvcmtpZCwgYmxvY2tjaGFpbmlkLCBvdXRzLCBpbnMsIG1lbW8sIHNvdXJjZUNoYWluLCBpbXBvcnRJbnMpO1xuICAgIHJldHVybiBuZXcgVW5zaWduZWRUeChpbXBvcnRUeCk7XG4gIH07XG5cbiAgICAvKipcbiAgICAqIENyZWF0ZXMgYW4gdW5zaWduZWQgRXhwb3J0VHggdHJhbnNhY3Rpb24uIFxuICAgICpcbiAgICAqIEBwYXJhbSBuZXR3b3JraWQgVGhlIG51bWJlciByZXByZXNlbnRpbmcgTmV0d29ya0lEIG9mIHRoZSBub2RlXG4gICAgKiBAcGFyYW0gYmxvY2tjaGFpbmlkIFRoZSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSByZXByZXNlbnRpbmcgdGhlIEJsb2NrY2hhaW5JRCBmb3IgdGhlIHRyYW5zYWN0aW9uXG4gICAgKiBAcGFyYW0gYW1vdW50IFRoZSBhbW91bnQgYmVpbmcgZXhwb3J0ZWQgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgICogQHBhcmFtIGF2YXhBc3NldElEIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IG9mIHRoZSBhc3NldCBJRCBmb3IgQVZBWFxuICAgICogQHBhcmFtIHRvQWRkcmVzc2VzIEFuIGFycmF5IG9mIGFkZHJlc3NlcyBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSB3aG8gcmVjaWV2ZXMgdGhlIEFWQVhcbiAgICAqIEBwYXJhbSBmcm9tQWRkcmVzc2VzIEFuIGFycmF5IG9mIGFkZHJlc3NlcyBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSB3aG8gb3ducyB0aGUgQVZBWFxuICAgICogQHBhcmFtIGNoYW5nZUFkZHJlc3NlcyBPcHRpb25hbC4gVGhlIGFkZHJlc3NlcyB0aGF0IGNhbiBzcGVuZCB0aGUgY2hhbmdlIHJlbWFpbmluZyBmcm9tIHRoZSBzcGVudCBVVFhPcy5cbiAgICAqIEBwYXJhbSBmZWUgT3B0aW9uYWwuIFRoZSBhbW91bnQgb2YgZmVlcyB0byBidXJuIGluIGl0cyBzbWFsbGVzdCBkZW5vbWluYXRpb24sIHJlcHJlc2VudGVkIGFzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAgKiBAcGFyYW0gZGVzdGluYXRpb25DaGFpbiBPcHRpb25hbC4gQSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBmb3IgdGhlIGNoYWluaWQgd2hlcmUgdG8gc2VuZCB0aGUgYXNzZXQuXG4gICAgKiBAcGFyYW0gZmVlQXNzZXRJRCBPcHRpb25hbC4gVGhlIGFzc2V0SUQgb2YgdGhlIGZlZXMgYmVpbmcgYnVybmVkLiBcbiAgICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsIGNvbnRhaW5zIGFyYml0cmFyeSBieXRlcywgdXAgdG8gMjU2IGJ5dGVzXG4gICAgKiBAcGFyYW0gYXNPZiBPcHRpb25hbC4gVGhlIHRpbWVzdGFtcCB0byB2ZXJpZnkgdGhlIHRyYW5zYWN0aW9uIGFnYWluc3QgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgICogQHBhcmFtIGxvY2t0aW1lIE9wdGlvbmFsLiBUaGUgbG9ja3RpbWUgZmllbGQgY3JlYXRlZCBpbiB0aGUgcmVzdWx0aW5nIG91dHB1dHNcbiAgICAqIEBwYXJhbSB0aHJlc2hvbGQgT3B0aW9uYWwuIFRoZSBudW1iZXIgb2Ygc2lnbmF0dXJlcyByZXF1aXJlZCB0byBzcGVuZCB0aGUgZnVuZHMgaW4gdGhlIHJlc3VsdGFudCBVVFhPXG4gICAgKiBAcmV0dXJucyBBbiB1bnNpZ25lZCB0cmFuc2FjdGlvbiBjcmVhdGVkIGZyb20gdGhlIHBhc3NlZCBpbiBwYXJhbWV0ZXJzLlxuICAgICpcbiAgICAqL1xuICAgYnVpbGRFeHBvcnRUeCA9IChcbiAgICBuZXR3b3JraWQ6bnVtYmVyLCBcbiAgICBibG9ja2NoYWluaWQ6QnVmZmVyLFxuICAgIGFtb3VudDpCTixcbiAgICBhdmF4QXNzZXRJRDpCdWZmZXIsXG4gICAgdG9BZGRyZXNzZXM6QXJyYXk8QnVmZmVyPixcbiAgICBmcm9tQWRkcmVzc2VzOkFycmF5PEJ1ZmZlcj4sXG4gICAgY2hhbmdlQWRkcmVzc2VzOkFycmF5PEJ1ZmZlcj4gPSB1bmRlZmluZWQsXG4gICAgZGVzdGluYXRpb25DaGFpbjpCdWZmZXIgPSB1bmRlZmluZWQsXG4gICAgZmVlOkJOID0gdW5kZWZpbmVkLFxuICAgIGZlZUFzc2V0SUQ6QnVmZmVyID0gdW5kZWZpbmVkLCBcbiAgICBtZW1vOkJ1ZmZlciA9IHVuZGVmaW5lZCwgXG4gICAgYXNPZjpCTiA9IFVuaXhOb3coKSxcbiAgICBsb2NrdGltZTpCTiA9IG5ldyBCTigwKSwgXG4gICAgdGhyZXNob2xkOm51bWJlciA9IDFcbiAgKTpVbnNpZ25lZFR4ID0+IHtcbiAgICBsZXQgaW5zOkFycmF5PFRyYW5zZmVyYWJsZUlucHV0PiA9IFtdO1xuICAgIGxldCBvdXRzOkFycmF5PFRyYW5zZmVyYWJsZU91dHB1dD4gPSBbXTtcbiAgICBsZXQgZXhwb3J0b3V0czpBcnJheTxUcmFuc2ZlcmFibGVPdXRwdXQ+ID0gW107XG4gICAgXG4gICAgaWYodHlwZW9mIGNoYW5nZUFkZHJlc3NlcyA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgY2hhbmdlQWRkcmVzc2VzID0gdG9BZGRyZXNzZXM7XG4gICAgfVxuXG4gICAgY29uc3QgemVybzpCTiA9IG5ldyBCTigwKTtcbiAgICBcbiAgICBpZiAoYW1vdW50LmVxKHplcm8pKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIGlmKHR5cGVvZiBmZWVBc3NldElEID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBmZWVBc3NldElEID0gYXZheEFzc2V0SUQ7XG4gICAgfSBlbHNlIGlmIChmZWVBc3NldElELnRvU3RyaW5nKFwiaGV4XCIpICE9PSBhdmF4QXNzZXRJRC50b1N0cmluZyhcImhleFwiKSkge1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgIHRocm93IG5ldyBFcnJvcignRXJyb3IgLSBVVFhPU2V0LmJ1aWxkRXhwb3J0VHg6ICdcbiAgICAgICsgYGZlZUFzc2V0SUQgbXVzdCBtYXRjaCBhdmF4QXNzZXRJRGApO1xuICAgIH1cblxuICAgIGlmKHR5cGVvZiBkZXN0aW5hdGlvbkNoYWluID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBkZXN0aW5hdGlvbkNoYWluID0gYmludG9vbHMuY2I1OERlY29kZShQbGF0Zm9ybUNoYWluSUQpO1xuICAgIH1cblxuICAgIGNvbnN0IGFhZDpBc3NldEFtb3VudERlc3RpbmF0aW9uID0gbmV3IEFzc2V0QW1vdW50RGVzdGluYXRpb24odG9BZGRyZXNzZXMsIGZyb21BZGRyZXNzZXMsIGNoYW5nZUFkZHJlc3Nlcyk7XG4gICAgaWYoYXZheEFzc2V0SUQudG9TdHJpbmcoXCJoZXhcIikgPT09IGZlZUFzc2V0SUQudG9TdHJpbmcoXCJoZXhcIikpe1xuICAgICAgYWFkLmFkZEFzc2V0QW1vdW50KGF2YXhBc3NldElELCBhbW91bnQsIGZlZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGFhZC5hZGRBc3NldEFtb3VudChhdmF4QXNzZXRJRCwgYW1vdW50LCB6ZXJvKTtcbiAgICAgIGlmKHRoaXMuX2ZlZUNoZWNrKGZlZSwgZmVlQXNzZXRJRCkpe1xuICAgICAgICBhYWQuYWRkQXNzZXRBbW91bnQoZmVlQXNzZXRJRCwgemVybywgZmVlKTtcbiAgICAgIH1cbiAgICB9XG4gICAgY29uc3Qgc3VjY2VzczpFcnJvciA9IHRoaXMuZ2V0TWluaW11bVNwZW5kYWJsZShhYWQsIGFzT2YsIGxvY2t0aW1lLCB0aHJlc2hvbGQpO1xuICAgIGlmKHR5cGVvZiBzdWNjZXNzID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBpbnMgPSBhYWQuZ2V0SW5wdXRzKCk7XG4gICAgICBvdXRzID0gYWFkLmdldENoYW5nZU91dHB1dHMoKTtcbiAgICAgIGV4cG9ydG91dHMgPSBhYWQuZ2V0T3V0cHV0cygpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBzdWNjZXNzO1xuICAgIH1cblxuICAgIGNvbnN0IGV4cG9ydFR4OkV4cG9ydFR4ID0gbmV3IEV4cG9ydFR4KG5ldHdvcmtpZCwgYmxvY2tjaGFpbmlkLCBvdXRzLCBpbnMsIG1lbW8sIGRlc3RpbmF0aW9uQ2hhaW4sIGV4cG9ydG91dHMpO1xuICAgIHJldHVybiBuZXcgVW5zaWduZWRUeChleHBvcnRUeCk7XG4gIH07XG59XG4iXX0=