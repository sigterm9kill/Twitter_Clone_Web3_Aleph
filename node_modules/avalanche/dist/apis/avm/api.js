"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AVMAPI = void 0;
/**
 * @packageDocumentation
 * @module API-AVM
 */
const bn_js_1 = __importDefault(require("bn.js"));
const buffer_1 = require("buffer/");
const bintools_1 = __importDefault(require("../../utils/bintools"));
const utxos_1 = require("./utxos");
const constants_1 = require("./constants");
const keychain_1 = require("./keychain");
const tx_1 = require("./tx");
const payload_1 = require("../../utils/payload");
const helperfunctions_1 = require("../../utils/helperfunctions");
const jrpcapi_1 = require("../../common/jrpcapi");
const constants_2 = require("../../utils/constants");
const output_1 = require("../../common/output");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
/**
 * Class for interacting with a node endpoint that is using the AVM.
 *
 * @category RPCAPIs
 *
 * @remarks This extends the [[JRPCAPI]] class. This class should not be directly called. Instead, use the [[Avalanche.addAPI]] function to register this interface with Avalanche.
 */
class AVMAPI extends jrpcapi_1.JRPCAPI {
    /**
     * This class should not be instantiated directly. Instead use the [[Avalanche.addAPI]] method.
     *
     * @param core A reference to the Avalanche class
     * @param baseurl Defaults to the string "/ext/bc/X" as the path to blockchain's baseurl
     * @param blockchainID The Blockchain's ID. Defaults to an empty string: ''
     */
    constructor(core, baseurl = '/ext/bc/X', blockchainID = '') {
        super(core, baseurl);
        /**
         * @ignore
         */
        this.keychain = new keychain_1.KeyChain('', '');
        this.blockchainID = '';
        this.blockchainAlias = undefined;
        this.AVAXAssetID = undefined;
        this.txFee = undefined;
        this.creationTxFee = undefined;
        /**
         * Gets the alias for the blockchainID if it exists, otherwise returns `undefined`.
         *
         * @returns The alias for the blockchainID
         */
        this.getBlockchainAlias = () => {
            if (typeof this.blockchainAlias === "undefined") {
                const netid = this.core.getNetworkID();
                if (netid in constants_2.Defaults.network && this.blockchainID in constants_2.Defaults.network[netid]) {
                    this.blockchainAlias = constants_2.Defaults.network[netid][this.blockchainID].alias;
                    return this.blockchainAlias;
                }
                else {
                    /* istanbul ignore next */
                    return undefined;
                }
            }
            return this.blockchainAlias;
        };
        /**
         * Sets the alias for the blockchainID.
         *
         * @param alias The alias for the blockchainID.
         *
         */
        this.setBlockchainAlias = (alias) => {
            this.blockchainAlias = alias;
            /* istanbul ignore next */
            return undefined;
        };
        /**
         * Gets the blockchainID and returns it.
         *
         * @returns The blockchainID
         */
        this.getBlockchainID = () => this.blockchainID;
        /**
         * Refresh blockchainID, and if a blockchainID is passed in, use that.
         *
         * @param Optional. BlockchainID to assign, if none, uses the default based on networkID.
         *
         * @returns The blockchainID
         */
        this.refreshBlockchainID = (blockchainID = undefined) => {
            const netid = this.core.getNetworkID();
            if (typeof blockchainID === 'undefined' && typeof constants_2.Defaults.network[netid] !== "undefined") {
                this.blockchainID = constants_2.Defaults.network[netid].X.blockchainID; //default to X-Chain
                return true;
            }
            if (typeof blockchainID === 'string') {
                this.blockchainID = blockchainID;
                return true;
            }
            return false;
        };
        /**
         * Takes an address string and returns its {@link https://github.com/feross/buffer|Buffer} representation if valid.
         *
         * @returns A {@link https://github.com/feross/buffer|Buffer} for the address if valid, undefined if not valid.
         */
        this.parseAddress = (addr) => {
            const alias = this.getBlockchainAlias();
            const blockchainID = this.getBlockchainID();
            return bintools.parseAddress(addr, blockchainID, alias, constants_1.AVMConstants.ADDRESSLENGTH);
        };
        this.addressFromBuffer = (address) => {
            const chainid = this.getBlockchainAlias() ? this.getBlockchainAlias() : this.getBlockchainID();
            return bintools.addressToString(this.core.getHRP(), chainid, address);
        };
        /**
         * Fetches the AVAX AssetID and returns it in a Promise.
         *
         * @param refresh This function caches the response. Refresh = true will bust the cache.
         *
         * @returns The the provided string representing the AVAX AssetID
         */
        this.getAVAXAssetID = (refresh = false) => __awaiter(this, void 0, void 0, function* () {
            if (typeof this.AVAXAssetID === 'undefined' || refresh) {
                const asset = yield this.getAssetDescription(constants_2.PrimaryAssetAlias);
                this.AVAXAssetID = asset.assetID;
            }
            return this.AVAXAssetID;
        });
        /**
         * Overrides the defaults and sets the cache to a specific AVAX AssetID
         *
         * @param avaxAssetID A cb58 string or Buffer representing the AVAX AssetID
         *
         * @returns The the provided string representing the AVAX AssetID
         */
        this.setAVAXAssetID = (avaxAssetID) => {
            if (typeof avaxAssetID === "string") {
                avaxAssetID = bintools.cb58Decode(avaxAssetID);
            }
            this.AVAXAssetID = avaxAssetID;
        };
        /**
         * Gets the default tx fee for this chain.
         *
         * @returns The default tx fee as a {@link https://github.com/indutny/bn.js/|BN}
         */
        this.getDefaultTxFee = () => {
            return this.core.getNetworkID() in constants_2.Defaults.network ? new bn_js_1.default(constants_2.Defaults.network[this.core.getNetworkID()]["X"]["txFee"]) : new bn_js_1.default(0);
        };
        /**
         * Gets the tx fee for this chain.
         *
         * @returns The tx fee as a {@link https://github.com/indutny/bn.js/|BN}
         */
        this.getTxFee = () => {
            if (typeof this.txFee === "undefined") {
                this.txFee = this.getDefaultTxFee();
            }
            return this.txFee;
        };
        /**
         * Sets the tx fee for this chain.
         *
         * @param fee The tx fee amount to set as {@link https://github.com/indutny/bn.js/|BN}
         */
        this.setTxFee = (fee) => {
            this.txFee = fee;
        };
        /**
         * Gets the default creation fee for this chain.
         *
         * @returns The default creation fee as a {@link https://github.com/indutny/bn.js/|BN}
         */
        this.getDefaultCreationTxFee = () => {
            return this.core.getNetworkID() in constants_2.Defaults.network ? new bn_js_1.default(constants_2.Defaults.network[this.core.getNetworkID()]["X"]["creationTxFee"]) : new bn_js_1.default(0);
        };
        /**
         * Gets the creation fee for this chain.
         *
         * @returns The creation fee as a {@link https://github.com/indutny/bn.js/|BN}
         */
        this.getCreationTxFee = () => {
            if (typeof this.creationTxFee === "undefined") {
                this.creationTxFee = this.getDefaultCreationTxFee();
            }
            return this.creationTxFee;
        };
        /**
         * Sets the creation fee for this chain.
         *
         * @param fee The creation fee amount to set as {@link https://github.com/indutny/bn.js/|BN}
         */
        this.setCreationTxFee = (fee) => {
            this.creationTxFee = fee;
        };
        /**
         * Gets a reference to the keychain for this class.
         *
         * @returns The instance of [[KeyChain]] for this class
         */
        this.keyChain = () => this.keychain;
        /**
         * @ignore
         */
        this.newKeyChain = () => {
            // warning, overwrites the old keychain
            const alias = this.getBlockchainAlias();
            if (alias) {
                this.keychain = new keychain_1.KeyChain(this.core.getHRP(), alias);
            }
            else {
                this.keychain = new keychain_1.KeyChain(this.core.getHRP(), this.blockchainID);
            }
            return this.keychain;
        };
        /**
         * Helper function which determines if a tx is a goose egg transaction.
         *
         * @param utx An UnsignedTx
         *
         * @returns boolean true if passes goose egg test and false if fails.
         *
         * @remarks
         * A "Goose Egg Transaction" is when the fee far exceeds a reasonable amount
         */
        this.checkGooseEgg = (utx, outTotal = new bn_js_1.default(0)) => __awaiter(this, void 0, void 0, function* () {
            const avaxAssetID = yield this.getAVAXAssetID();
            let outputTotal = outTotal.gt(new bn_js_1.default(0)) ? outTotal : utx.getOutputTotal(avaxAssetID);
            const fee = utx.getBurn(avaxAssetID);
            if (fee.lte(constants_2.ONEAVAX.mul(new bn_js_1.default(10))) || fee.lte(outputTotal)) {
                return true;
            }
            else {
                return false;
            }
        });
        /**
           * Gets the balance of a particular asset on a blockchain.
           *
           * @param address The address to pull the asset balance from
           * @param assetID The assetID to pull the balance from
           *
           * @returns Promise with the balance of the assetID as a {@link https://github.com/indutny/bn.js/|BN} on the provided address for the blockchain.
           */
        this.getBalance = (address, assetID) => __awaiter(this, void 0, void 0, function* () {
            if (typeof this.parseAddress(address) === 'undefined') {
                /* istanbul ignore next */
                throw new Error(`Error - AVMAPI.getBalance: Invalid address format ${address}`);
            }
            const params = {
                address,
                assetID,
            };
            return this.callMethod('avm.getBalance', params).then((response) => response.data.result);
        });
        /**
           * Creates an address (and associated private keys) on a user on a blockchain.
           *
           * @param username Name of the user to create the address under
           * @param password Password to unlock the user and encrypt the private key
           *
           * @returns Promise for a string representing the address created by the vm.
           */
        this.createAddress = (username, password) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                username,
                password,
            };
            return this.callMethod('avm.createAddress', params).then((response) => response.data.result.address);
        });
        /**
         * Create a new fixed-cap, fungible asset. A quantity of it is created at initialization and there no more is ever created.
         *
         * @param username The user paying the transaction fee (in $AVAX) for asset creation
         * @param password The password for the user paying the transaction fee (in $AVAX) for asset creation
         * @param name The human-readable name for the asset
         * @param symbol Optional. The shorthand symbol for the asset. Between 0 and 4 characters
         * @param denomination Optional. Determines how balances of this asset are displayed by user interfaces. Default is 0
         * @param initialHolders An array of objects containing the field "address" and "amount" to establish the genesis values for the new asset
         *
         * ```js
         * Example initialHolders:
         * [
         *     {
         *         "address": "X-avax1kj06lhgx84h39snsljcey3tpc046ze68mek3g5",
         *         "amount": 10000
         *     },
         *     {
         *         "address": "X-avax1am4w6hfrvmh3akduzkjthrtgtqafalce6an8cr",
         *         "amount": 50000
         *     }
         * ]
         * ```
         *
         * @returns Returns a Promise<string> containing the base 58 string representation of the ID of the newly created asset.
         */
        this.createFixedCapAsset = (username, password, name, symbol, denomination, initialHolders) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                name,
                symbol,
                denomination,
                username,
                password,
                initialHolders,
            };
            return this.callMethod('avm.createFixedCapAsset', params).then((response) => response.data.result.assetID);
        });
        /**
           * Create a new variable-cap, fungible asset. No units of the asset exist at initialization. Minters can mint units of this asset using createMintTx, signMintTx and sendMintTx.
           *
           * @param username The user paying the transaction fee (in $AVAX) for asset creation
           * @param password The password for the user paying the transaction fee (in $AVAX) for asset creation
           * @param name The human-readable name for the asset
           * @param symbol Optional. The shorthand symbol for the asset -- between 0 and 4 characters
           * @param denomination Optional. Determines how balances of this asset are displayed by user interfaces. Default is 0
           * @param minterSets is a list where each element specifies that threshold of the addresses in minters may together mint more of the asset by signing a minting transaction
           *
           * ```js
           * Example minterSets:
           * [
           *      {
           *          "minters":[
           *              "X-avax1am4w6hfrvmh3akduzkjthrtgtqafalce6an8cr"
           *          ],
           *          "threshold": 1
           *      },
           *      {
           *          "minters": [
           *              "X-avax1am4w6hfrvmh3akduzkjthrtgtqafalce6an8cr",
           *              "X-avax1kj06lhgx84h39snsljcey3tpc046ze68mek3g5",
           *              "X-avax1yell3e4nln0m39cfpdhgqprsd87jkh4qnakklx"
           *          ],
           *          "threshold": 2
           *      }
           * ]
           * ```
           *
           * @returns Returns a Promise<string> containing the base 58 string representation of the ID of the newly created asset.
           */
        this.createVariableCapAsset = (username, password, name, symbol, denomination, minterSets) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                name,
                symbol,
                denomination,
                username,
                password,
                minterSets,
            };
            return this.callMethod('avm.createVariableCapAsset', params).then((response) => response.data.result.assetID);
        });
        /**
           * Create an unsigned transaction to mint more of an asset.
           *
           * @param amount The units of the asset to mint
           * @param assetID The ID of the asset to mint
           * @param to The address to assign the units of the minted asset
           * @param minters Addresses of the minters responsible for signing the transaction
           *
           * @returns Returns a Promise<string> containing the base 58 string representation of the unsigned transaction.
           */
        this.mint = (username, password, amount, assetID, to, minters) => __awaiter(this, void 0, void 0, function* () {
            let asset;
            let amnt;
            if (typeof assetID !== 'string') {
                asset = bintools.cb58Encode(assetID);
            }
            else {
                asset = assetID;
            }
            if (typeof amount === 'number') {
                amnt = new bn_js_1.default(amount);
            }
            else {
                amnt = amount;
            }
            const params = {
                username: username,
                password: password,
                amount: amnt.toString(10),
                assetID: asset,
                to,
                minters
            };
            return this.callMethod('avm.mint', params).then((response) => response.data.result.txID);
        });
        /**
           * Exports the private key for an address.
           *
           * @param username The name of the user with the private key
           * @param password The password used to decrypt the private key
           * @param address The address whose private key should be exported
           *
           * @returns Promise with the decrypted private key as store in the database
           */
        this.exportKey = (username, password, address) => __awaiter(this, void 0, void 0, function* () {
            if (typeof this.parseAddress(address) === 'undefined') {
                /* istanbul ignore next */
                throw new Error(`Error - AVMAPI.exportKey: Invalid address format ${address}`);
            }
            const params = {
                username,
                password,
                address,
            };
            return this.callMethod('avm.exportKey', params).then((response) => response.data.result.privateKey);
        });
        /**
           * Imports a private key into the node's keystore under an user and for a blockchain.
           *
           * @param username The name of the user to store the private key
           * @param password The password that unlocks the user
           * @param privateKey A string representing the private key in the vm's format
           *
           * @returns The address for the imported private key.
           */
        this.importKey = (username, password, privateKey) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                username,
                password,
                privateKey,
            };
            return this.callMethod('avm.importKey', params).then((response) => response.data.result.address);
        });
        /**
          * Send ANT (Avalanche Native Token) assets including AVAX from the X-Chain to an account on the P-Chain or C-Chain.
          *
          * After calling this method, you must call the P-Chain's `importAVAX` or the C-Chain’s `import` method to complete the transfer.
          *
          * @param username The Keystore user that controls the P-Chain or C-Chain account specified in `to`
          * @param password The password of the Keystore user
          * @param to The account on the P-Chain or C-Chain to send the asset to.
          * @param amount Amount of asset to export as a {@link https://github.com/indutny/bn.js/|BN}
          * @param assetID The asset id which is being sent
          *
          * @returns String representing the transaction id
          */
        this.export = (username, password, to, amount, assetID) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                to,
                amount: amount.toString(10),
                username,
                password,
                assetID
            };
            return this.callMethod('avm.export', params).then((response) => response.data.result.txID);
        });
        /**
           * Send AVAX from the X-Chain to an account on the P-Chain or C-Chain.
           *
           * After calling this method, you must call the P-Chain’s or C-Chain's importAVAX method to complete the transfer.
           *
           * @param username The Keystore user that controls the P-Chain account specified in `to`
           * @param password The password of the Keystore user
           * @param to The account on the P-Chain or C-Chain to send the AVAX to.
           * @param amount Amount of AVAX to export as a {@link https://github.com/indutny/bn.js/|BN}
           *
           * @returns String representing the transaction id
           */
        this.exportAVAX = (username, password, to, amount) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                to,
                amount: amount.toString(10),
                username,
                password,
            };
            return this.callMethod('avm.exportAVAX', params).then((response) => response.data.result.txID);
        });
        /**
         * Send ANT (Avalanche Native Token) assets including AVAX from an account on the P-Chain or C-Chain to an address on the X-Chain. This transaction
         * must be signed with the key of the account that the asset is sent from and which pays
         * the transaction fee.
         *
         * @param username The Keystore user that controls the account specified in `to`
         * @param password The password of the Keystore user
         * @param to The address of the account the asset is sent to.
         * @param sourceChain The chainID where the funds are coming from. Ex: "C"
         *
         * @returns Promise for a string for the transaction, which should be sent to the network
         * by calling issueTx.
         */
        this.import = (username, password, to, sourceChain) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                to,
                sourceChain,
                username,
                password,
            };
            return this.callMethod('avm.import', params)
                .then((response) => response.data.result.txID);
        });
        /**
           * Finalize a transfer of AVAX from the P-Chain to the X-Chain.
           *
           * Before this method is called, you must call the P-Chain’s `exportAVAX` method to initiate the transfer.
           * @param username The Keystore user that controls the address specified in `to`
           * @param password The password of the Keystore user
           * @param to The address the AVAX is sent to. This must be the same as the to argument in the corresponding call to the P-Chain’s exportAVAX, except that the prepended X- should be included in this argument
           * @param sourceChain Chain the funds are coming from.
           *
           * @returns String representing the transaction id
           */
        this.importAVAX = (username, password, to, sourceChain) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                to,
                sourceChain,
                username,
                password,
            };
            return this.callMethod('avm.importAVAX', params).then((response) => response.data.result.txID);
        });
        /**
           * Lists all the addresses under a user.
           *
           * @param username The user to list addresses
           * @param password The password of the user to list the addresses
           *
           * @returns Promise of an array of address strings in the format specified by the blockchain.
           */
        this.listAddresses = (username, password) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                username,
                password,
            };
            return this.callMethod('avm.listAddresses', params).then((response) => response.data.result.addresses);
        });
        /**
           * Retrieves all assets for an address on a server and their associated balances.
           *
           * @param address The address to get a list of assets
           *
           * @returns Promise of an object mapping assetID strings with {@link https://github.com/indutny/bn.js/|BN} balance for the address on the blockchain.
           */
        this.getAllBalances = (address) => __awaiter(this, void 0, void 0, function* () {
            if (typeof this.parseAddress(address) === 'undefined') {
                /* istanbul ignore next */
                throw new Error(`Error - AVMAPI.getAllBalances: Invalid address format ${address}`);
            }
            const params = {
                address,
            };
            return this.callMethod('avm.getAllBalances', params).then((response) => response.data.result.balances);
        });
        /**
           * Retrieves an assets name and symbol.
           *
           * @param assetID Either a {@link https://github.com/feross/buffer|Buffer} or an b58 serialized string for the AssetID or its alias.
           *
           * @returns Returns a Promise<object> with keys "name" and "symbol".
           */
        this.getAssetDescription = (assetID) => __awaiter(this, void 0, void 0, function* () {
            let asset;
            if (typeof assetID !== 'string') {
                asset = bintools.cb58Encode(assetID);
            }
            else {
                asset = assetID;
            }
            const params = {
                assetID: asset,
            };
            return this.callMethod('avm.getAssetDescription', params).then((response) => ({
                name: response.data.result.name,
                symbol: response.data.result.symbol,
                assetID: bintools.cb58Decode(response.data.result.assetID),
                denomination: parseInt(response.data.result.denomination, 10),
            }));
        });
        /**
         * Returns the treansaction data of a provided transaction ID by calling the node's `getTx` method.
         *
         * @param txid The string representation of the transaction ID
         *
         * @returns Returns a Promise<string> containing the bytes retrieved from the node
         */
        this.getTx = (txid) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                txID: txid,
            };
            return this.callMethod('avm.getTx', params).then((response) => response.data.result.tx);
        });
        /**
         * Returns the status of a provided transaction ID by calling the node's `getTxStatus` method.
         *
         * @param txid The string representation of the transaction ID
         *
         * @returns Returns a Promise<string> containing the status retrieved from the node
         */
        this.getTxStatus = (txid) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                txID: txid,
            };
            return this.callMethod('avm.getTxStatus', params).then((response) => response.data.result.status);
        });
        /**
         * Retrieves the UTXOs related to the addresses provided from the node's `getUTXOs` method.
         *
         * @param addresses An array of addresses as cb58 strings or addresses as {@link https://github.com/feross/buffer|Buffer}s
         * @param sourceChain A string for the chain to look for the UTXO's. Default is to use this chain, but if exported UTXOs exist from other chains, this can used to pull them instead.
         * @param limit Optional. Returns at most [limit] addresses. If [limit] == 0 or > [maxUTXOsToFetch], fetches up to [maxUTXOsToFetch].
         * @param startIndex Optional. [StartIndex] defines where to start fetching UTXOs (for pagination.)
         * UTXOs fetched are from addresses equal to or greater than [StartIndex.Address]
         * For address [StartIndex.Address], only UTXOs with IDs greater than [StartIndex.Utxo] will be returned.
         * @param persistOpts Options available to persist these UTXOs in local storage
         *
         * @remarks
         * persistOpts is optional and must be of type [[PersistanceOptions]]
         *
         */
        this.getUTXOs = (addresses, sourceChain = undefined, limit = 0, startIndex = undefined, persistOpts = undefined) => __awaiter(this, void 0, void 0, function* () {
            if (typeof addresses === "string") {
                addresses = [addresses];
            }
            const params = {
                addresses: addresses,
                limit
            };
            if (typeof startIndex !== "undefined" && startIndex) {
                params.startIndex = startIndex;
            }
            if (typeof sourceChain !== "undefined") {
                params.sourceChain = sourceChain;
            }
            return this.callMethod('avm.getUTXOs', params).then((response) => {
                const utxos = new utxos_1.UTXOSet();
                let data = response.data.result.utxos;
                if (persistOpts && typeof persistOpts === 'object') {
                    if (this.db.has(persistOpts.getName())) {
                        const selfArray = this.db.get(persistOpts.getName());
                        if (Array.isArray(selfArray)) {
                            utxos.addArray(data);
                            const self = new utxos_1.UTXOSet();
                            self.addArray(selfArray);
                            self.mergeByRule(utxos, persistOpts.getMergeRule());
                            data = self.getAllUTXOStrings();
                        }
                    }
                    this.db.set(persistOpts.getName(), data, persistOpts.getOverwrite());
                }
                utxos.addArray(data, false);
                response.data.result.utxos = utxos;
                return response.data.result;
            });
        });
        /**
         * Helper function which creates an unsigned transaction. For more granular control, you may create your own
         * [[UnsignedTx]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s, and [[TransferOperation]]s).
         *
         * @param utxoset A set of UTXOs that the transaction is built on
         * @param amount The amount of AssetID to be spent in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}.
         * @param assetID The assetID of the value being sent
         * @param toAddresses The addresses to send the funds
         * @param fromAddresses The addresses being used to send the funds from the UTXOs provided
         * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs
         * @param memo Optional CB58 Buffer or String which contains arbitrary bytes, up to 256 bytes
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         * @param locktime Optional. The locktime field created in the resulting outputs
         * @param threshold Optional. The number of signatures required to spend the funds in the resultant UTXO
         *
         * @returns An unsigned transaction ([[UnsignedTx]]) which contains a [[BaseTx]].
         *
         * @remarks
         * This helper exists because the endpoint API should be the primary point of entry for most functionality.
         */
        this.buildBaseTx = (utxoset, amount, assetID = undefined, toAddresses, fromAddresses, changeAddresses, memo = undefined, asOf = helperfunctions_1.UnixNow(), locktime = new bn_js_1.default(0), threshold = 1) => __awaiter(this, void 0, void 0, function* () {
            const to = this._cleanAddressArray(toAddresses, 'buildBaseTx').map((a) => bintools.stringToAddress(a));
            const from = this._cleanAddressArray(fromAddresses, 'buildBaseTx').map((a) => bintools.stringToAddress(a));
            const change = this._cleanAddressArray(changeAddresses, 'buildBaseTx').map((a) => bintools.stringToAddress(a));
            if (typeof assetID === 'string') {
                assetID = bintools.cb58Decode(assetID);
            }
            if (memo instanceof payload_1.PayloadBase) {
                memo = memo.getPayload();
            }
            const builtUnsignedTx = utxoset.buildBaseTx(this.core.getNetworkID(), bintools.cb58Decode(this.blockchainID), amount, assetID, to, from, change, this.getTxFee(), yield this.getAVAXAssetID(), memo, asOf, locktime, threshold);
            if (!(yield this.checkGooseEgg(builtUnsignedTx))) {
                /* istanbul ignore next */
                throw new Error("Failed Goose Egg Check");
            }
            return builtUnsignedTx;
        });
        /**
         * Helper function which creates an unsigned NFT Transfer. For more granular control, you may create your own
         * [[UnsignedTx]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s, and [[TransferOperation]]s).
         *
         * @param utxoset  A set of UTXOs that the transaction is built on
         * @param toAddresses The addresses to send the NFT
         * @param fromAddresses The addresses being used to send the NFT from the utxoID provided
         * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs
         * @param utxoid A base58 utxoID or an array of base58 utxoIDs for the nfts this transaction is sending
         * @param memo Optional CB58 Buffer or String which contains arbitrary bytes, up to 256 bytes
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         * @param locktime Optional. The locktime field created in the resulting outputs
         * @param threshold Optional. The number of signatures required to spend the funds in the resultant UTXO
         *
         * @returns An unsigned transaction ([[UnsignedTx]]) which contains a [[NFTTransferTx]].
         *
         * @remarks
         * This helper exists because the endpoint API should be the primary point of entry for most functionality.
         */
        this.buildNFTTransferTx = (utxoset, toAddresses, fromAddresses, changeAddresses, utxoid, memo = undefined, asOf = helperfunctions_1.UnixNow(), locktime = new bn_js_1.default(0), threshold = 1) => __awaiter(this, void 0, void 0, function* () {
            const to = this._cleanAddressArray(toAddresses, 'buildNFTTransferTx').map((a) => bintools.stringToAddress(a));
            const from = this._cleanAddressArray(fromAddresses, 'buildNFTTransferTx').map((a) => bintools.stringToAddress(a));
            const change = this._cleanAddressArray(changeAddresses, "buildCreateNFTAssetTx").map(a => bintools.stringToAddress(a));
            if (memo instanceof payload_1.PayloadBase) {
                memo = memo.getPayload();
            }
            const avaxAssetID = yield this.getAVAXAssetID();
            let utxoidArray = [];
            if (typeof utxoid === 'string') {
                utxoidArray = [utxoid];
            }
            else if (Array.isArray(utxoid)) {
                utxoidArray = utxoid;
            }
            const builtUnsignedTx = utxoset.buildNFTTransferTx(this.core.getNetworkID(), bintools.cb58Decode(this.blockchainID), to, from, change, utxoidArray, this.getTxFee(), avaxAssetID, memo, asOf, locktime, threshold);
            if (!(yield this.checkGooseEgg(builtUnsignedTx))) {
                /* istanbul ignore next */
                throw new Error("Failed Goose Egg Check");
            }
            return builtUnsignedTx;
        });
        /**
         * Helper function which creates an unsigned Import Tx. For more granular control, you may create your own
         * [[UnsignedTx]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s, and [[TransferOperation]]s).
         *
         * @param utxoset  A set of UTXOs that the transaction is built on
         * @param ownerAddresses The addresses being used to import
         * @param sourceChain The chainid for where the import is coming from
         * @param toAddresses The addresses to send the funds
         * @param fromAddresses The addresses being used to send the funds from the UTXOs provided
         * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs
         * @param memo Optional CB58 Buffer or String which contains arbitrary bytes, up to 256 bytes
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         * @param locktime Optional. The locktime field created in the resulting outputs
         * @param threshold Optional. The number of signatures required to spend the funds in the resultant UTXO
         *
         * @returns An unsigned transaction ([[UnsignedTx]]) which contains a [[ImportTx]].
         *
         * @remarks
         * This helper exists because the endpoint API should be the primary point of entry for most functionality.
         */
        this.buildImportTx = (utxoset, ownerAddresses, sourceChain, toAddresses, fromAddresses, changeAddresses = undefined, memo = undefined, asOf = helperfunctions_1.UnixNow(), locktime = new bn_js_1.default(0), threshold = 1) => __awaiter(this, void 0, void 0, function* () {
            const to = this._cleanAddressArray(toAddresses, 'buildImportTx').map((a) => bintools.stringToAddress(a));
            const from = this._cleanAddressArray(fromAddresses, 'buildImportTx').map((a) => bintools.stringToAddress(a));
            const change = this._cleanAddressArray(changeAddresses, 'buildImportTx').map((a) => bintools.stringToAddress(a));
            let srcChain = undefined;
            if (typeof sourceChain === "undefined") {
                throw new Error("Error - AVMAPI.buildImportTx: Source ChainID is undefined.");
            }
            else if (typeof sourceChain === "string") {
                srcChain = sourceChain;
                sourceChain = bintools.cb58Decode(sourceChain);
            }
            else if (!(sourceChain instanceof buffer_1.Buffer)) {
                srcChain = bintools.cb58Encode(sourceChain);
                throw new Error("Error - AVMAPI.buildImportTx: Invalid destinationChain type: " + (typeof sourceChain));
            }
            const atomicUTXOs = yield (yield this.getUTXOs(ownerAddresses, srcChain, 0, undefined)).utxos;
            const avaxAssetID = yield this.getAVAXAssetID();
            const atomics = atomicUTXOs.getAllUTXOs();
            if (atomics.length === 0) {
                throw new Error("Error - AVMAPI.buildImportTx: No atomic UTXOs to import from " + srcChain + " using addresses: " + ownerAddresses.join(", "));
            }
            if (memo instanceof payload_1.PayloadBase) {
                memo = memo.getPayload();
            }
            const builtUnsignedTx = utxoset.buildImportTx(this.core.getNetworkID(), bintools.cb58Decode(this.blockchainID), to, from, change, atomics, sourceChain, this.getTxFee(), avaxAssetID, memo, asOf, locktime, threshold);
            if (!(yield this.checkGooseEgg(builtUnsignedTx))) {
                /* istanbul ignore next */
                throw new Error("Failed Goose Egg Check");
            }
            return builtUnsignedTx;
        });
        /**
         * Helper function which creates an unsigned Export Tx. For more granular control, you may create your own
         * [[UnsignedTx]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s, and [[TransferOperation]]s).
         *
         * @param utxoset A set of UTXOs that the transaction is built on
         * @param amount The amount being exported as a {@link https://github.com/indutny/bn.js/|BN}
         * @param destinationChain The chainid for where the assets will be sent.
         * @param toAddresses The addresses to send the funds
         * @param fromAddresses The addresses being used to send the funds from the UTXOs provided
         * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs
         * @param memo Optional CB58 Buffer or String which contains arbitrary bytes, up to 256 bytes
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         * @param locktime Optional. The locktime field created in the resulting outputs
         * @param threshold Optional. The number of signatures required to spend the funds in the resultant UTXO
         *
         * @returns An unsigned transaction ([[UnsignedTx]]) which contains an [[ExportTx]].
         */
        this.buildExportTx = (utxoset, amount, destinationChain, toAddresses, fromAddresses, changeAddresses = undefined, memo = undefined, asOf = helperfunctions_1.UnixNow(), locktime = new bn_js_1.default(0), threshold = 1) => __awaiter(this, void 0, void 0, function* () {
            let prefixes = {};
            toAddresses.map((a) => {
                prefixes[a.split("-")[0]] = true;
            });
            if (Object.keys(prefixes).length !== 1) {
                throw new Error("Error - AVMAPI.buildExportTx: To addresses must have the same chainID prefix.");
            }
            if (typeof destinationChain === "undefined") {
                throw new Error("Error - AVMAPI.buildExportTx: Destination ChainID is undefined.");
            }
            else if (typeof destinationChain === "string") {
                destinationChain = bintools.cb58Decode(destinationChain); //
            }
            else if (!(destinationChain instanceof buffer_1.Buffer)) {
                throw new Error("Error - AVMAPI.buildExportTx: Invalid destinationChain type: " + (typeof destinationChain));
            }
            if (destinationChain.length !== 32) {
                throw new Error("Error - AVMAPI.buildExportTx: Destination ChainID must be 32 bytes in length.");
            }
            let to = [];
            toAddresses.map((a) => {
                to.push(bintools.stringToAddress(a));
            });
            const from = this._cleanAddressArray(fromAddresses, 'buildExportTx').map((a) => bintools.stringToAddress(a));
            const change = this._cleanAddressArray(changeAddresses, 'buildExportTx').map((a) => bintools.stringToAddress(a));
            if (memo instanceof payload_1.PayloadBase) {
                memo = memo.getPayload();
            }
            const avaxAssetID = yield this.getAVAXAssetID();
            const builtUnsignedTx = utxoset.buildExportTx(this.core.getNetworkID(), bintools.cb58Decode(this.blockchainID), amount, avaxAssetID, to, from, change, destinationChain, this.getTxFee(), avaxAssetID, memo, asOf, locktime, threshold);
            if (!(yield this.checkGooseEgg(builtUnsignedTx))) {
                /* istanbul ignore next */
                throw new Error("Failed Goose Egg Check");
            }
            return builtUnsignedTx;
        });
        /**
         * Creates an unsigned transaction. For more granular control, you may create your own
         * [[UnsignedTx]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s, and [[TransferOperation]]s).
         *
         * @param utxoset A set of UTXOs that the transaction is built on
         * @param fromAddresses The addresses being used to send the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
         * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs
         * @param initialState The [[InitialStates]] that represent the intial state of a created asset
         * @param name String for the descriptive name of the asset
         * @param symbol String for the ticker symbol of the asset
         * @param denomination Number for the denomination which is 10^D. D must be >= 0 and <= 32. Ex: $1 AVAX = 10^9 $nAVAX
         * @param mintOutputs Optional. Array of [[SECPMintOutput]]s to be included in the transaction. These outputs can be spent to mint more tokens.
         * @param memo Optional CB58 Buffer or String which contains arbitrary bytes, up to 256 bytes
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         *
         * @returns An unsigned transaction ([[UnsignedTx]]) which contains a [[CreateAssetTx]].
         *
         */
        this.buildCreateAssetTx = (utxoset, fromAddresses, changeAddresses, initialStates, name, symbol, denomination, mintOutputs = undefined, memo = undefined, asOf = helperfunctions_1.UnixNow()) => __awaiter(this, void 0, void 0, function* () {
            let from = this._cleanAddressArray(fromAddresses, "buildCreateAssetTx").map(a => bintools.stringToAddress(a));
            let change = this._cleanAddressArray(changeAddresses, "buildCreateNFTAssetTx").map(a => bintools.stringToAddress(a));
            if (memo instanceof payload_1.PayloadBase) {
                memo = memo.getPayload();
            }
            /* istanbul ignore next */
            if (symbol.length > constants_1.AVMConstants.SYMBOLMAXLEN) {
                /* istanbul ignore next */
                throw new Error("Error - AVMAPI.buildCreateAssetTx: Symbols may not exceed length of " + constants_1.AVMConstants.SYMBOLMAXLEN);
            }
            /* istanbul ignore next */
            if (name.length > constants_1.AVMConstants.ASSETNAMELEN) {
                /* istanbul ignore next */
                throw new Error("Error - AVMAPI.buildCreateAssetTx: Names may not exceed length of " + constants_1.AVMConstants.ASSETNAMELEN);
            }
            const avaxAssetID = yield this.getAVAXAssetID();
            const builtUnsignedTx = utxoset.buildCreateAssetTx(this.core.getNetworkID(), bintools.cb58Decode(this.blockchainID), from, change, initialStates, name, symbol, denomination, mintOutputs, this.getCreationTxFee(), avaxAssetID, memo, asOf);
            if (!(yield this.checkGooseEgg(builtUnsignedTx, this.getCreationTxFee()))) {
                /* istanbul ignore next */
                throw new Error("Failed Goose Egg Check");
            }
            return builtUnsignedTx;
        });
        this.buildSECPMintTx = (utxoset, mintOwner, transferOwner, fromAddresses, changeAddresses, mintUTXOID, memo = undefined, asOf = helperfunctions_1.UnixNow()) => __awaiter(this, void 0, void 0, function* () {
            let from = this._cleanAddressArray(fromAddresses, "buildSECPMintTx").map(a => bintools.stringToAddress(a));
            let change = this._cleanAddressArray(changeAddresses, "buildSECPMintTx").map(a => bintools.stringToAddress(a));
            if (memo instanceof payload_1.PayloadBase) {
                memo = memo.getPayload();
            }
            let avaxAssetID = yield this.getAVAXAssetID();
            const builtUnsignedTx = utxoset.buildSECPMintTx(this.core.getNetworkID(), bintools.cb58Decode(this.blockchainID), mintOwner, transferOwner, from, change, mintUTXOID, this.getTxFee(), avaxAssetID, memo, asOf);
            if (!(yield this.checkGooseEgg(builtUnsignedTx))) {
                /* istanbul ignore next */
                throw new Error("Failed Goose Egg Check");
            }
            return builtUnsignedTx;
        });
        /**
        * Creates an unsigned transaction. For more granular control, you may create your own
        * [[UnsignedTx]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s, and [[TransferOperation]]s).
        *
        * @param utxoset A set of UTXOs that the transaction is built on
        * @param fromAddresses The addresses being used to send the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
        * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs
        * @param minterSets is a list where each element specifies that threshold of the addresses in minters may together mint more of the asset by signing a minting transaction
        * @param name String for the descriptive name of the asset
        * @param symbol String for the ticker symbol of the asset
        * @param memo Optional CB58 Buffer or String which contains arbitrary bytes, up to 256 bytes
        * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
        * @param locktime Optional. The locktime field created in the resulting mint output
        *
        * ```js
        * Example minterSets:
        * [
        *      {
        *          "minters":[
        *              "X-avax1ghstjukrtw8935lryqtnh643xe9a94u3tc75c7"
        *          ],
        *          "threshold": 1
        *      },
        *      {
        *          "minters": [
        *              "X-avax1yell3e4nln0m39cfpdhgqprsd87jkh4qnakklx",
        *              "X-avax1k4nr26c80jaquzm9369j5a4shmwcjn0vmemcjz",
        *              "X-avax1ztkzsrjnkn0cek5ryvhqswdtcg23nhge3nnr5e"
        *          ],
        *          "threshold": 2
        *      }
        * ]
        * ```
        *
        * @returns An unsigned transaction ([[UnsignedTx]]) which contains a [[CreateAssetTx]].
        *
        */
        this.buildCreateNFTAssetTx = (utxoset, fromAddresses, changeAddresses, minterSets, name, symbol, memo = undefined, asOf = helperfunctions_1.UnixNow(), locktime = new bn_js_1.default(0)) => __awaiter(this, void 0, void 0, function* () {
            let from = this._cleanAddressArray(fromAddresses, "buildCreateNFTAssetTx").map(a => bintools.stringToAddress(a));
            let change = this._cleanAddressArray(changeAddresses, "buildCreateNFTAssetTx").map(a => bintools.stringToAddress(a));
            if (memo instanceof payload_1.PayloadBase) {
                memo = memo.getPayload();
            }
            if (name.length > constants_1.AVMConstants.ASSETNAMELEN) {
                /* istanbul ignore next */
                throw new Error("Error - AVMAPI.buildCreateNFTAssetTx: Names may not exceed length of " + constants_1.AVMConstants.ASSETNAMELEN);
            }
            if (symbol.length > constants_1.AVMConstants.SYMBOLMAXLEN) {
                /* istanbul ignore next */
                throw new Error("Error - AVMAPI.buildCreateNFTAssetTx: Symbols may not exceed length of " + constants_1.AVMConstants.SYMBOLMAXLEN);
            }
            let avaxAssetID = yield this.getAVAXAssetID();
            const builtUnsignedTx = utxoset.buildCreateNFTAssetTx(this.core.getNetworkID(), bintools.cb58Decode(this.blockchainID), from, change, minterSets, name, symbol, this.getCreationTxFee(), avaxAssetID, memo, asOf, locktime);
            if (!(yield this.checkGooseEgg(builtUnsignedTx, this.getCreationTxFee()))) {
                /* istanbul ignore next */
                throw new Error("Failed Goose Egg Check");
            }
            return builtUnsignedTx;
        });
        /**
        * Creates an unsigned transaction. For more granular control, you may create your own
        * [[UnsignedTx]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s, and [[TransferOperation]]s).
        *
        * @param utxoset  A set of UTXOs that the transaction is built on
        * @param owners Either a single or an array of [[OutputOwners]] to send the nft output
        * @param fromAddresses The addresses being used to send the NFT from the utxoID provided
        * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs
        * @param utxoid A base58 utxoID or an array of base58 utxoIDs for the nft mint output this transaction is sending
        * @param groupID Optional. The group this NFT is issued to.
        * @param payload Optional. Data for NFT Payload as either a [[PayloadBase]] or a {@link https://github.com/feross/buffer|Buffer}
        * @param memo Optional CB58 Buffer or String which contains arbitrary bytes, up to 256 bytes
        * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
        *
        * @returns An unsigned transaction ([[UnsignedTx]]) which contains an [[OperationTx]].
        *
        */
        this.buildCreateNFTMintTx = (utxoset, owners, fromAddresses, changeAddresses, utxoid, groupID = 0, payload = undefined, memo = undefined, asOf = helperfunctions_1.UnixNow()) => __awaiter(this, void 0, void 0, function* () {
            let from = this._cleanAddressArray(fromAddresses, "buildCreateNFTMintTx").map(a => bintools.stringToAddress(a));
            let change = this._cleanAddressArray(changeAddresses, "buildCreateNFTMintTx").map(a => bintools.stringToAddress(a));
            if (memo instanceof payload_1.PayloadBase) {
                memo = memo.getPayload();
            }
            if (payload instanceof payload_1.PayloadBase) {
                payload = payload.getPayload();
            }
            if (typeof utxoid === 'string') {
                utxoid = [utxoid];
            }
            let avaxAssetID = yield this.getAVAXAssetID();
            if (owners instanceof output_1.OutputOwners) {
                owners = [owners];
            }
            const builtUnsignedTx = utxoset.buildCreateNFTMintTx(this.core.getNetworkID(), bintools.cb58Decode(this.blockchainID), owners, from, change, utxoid, groupID, payload, this.getTxFee(), avaxAssetID, memo, asOf);
            if (!(yield this.checkGooseEgg(builtUnsignedTx))) {
                /* istanbul ignore next */
                throw new Error("Failed Goose Egg Check");
            }
            return builtUnsignedTx;
        });
        /**
         * Helper function which takes an unsigned transaction and signs it, returning the resulting [[Tx]].
        *
        * @param utx The unsigned transaction of type [[UnsignedTx]]
        *
        * @returns A signed transaction of type [[Tx]]
        */
        this.signTx = (utx) => utx.sign(this.keychain);
        /**
         * Calls the node's issueTx method from the API and returns the resulting transaction ID as a string.
         *
         * @param tx A string, {@link https://github.com/feross/buffer|Buffer}, or [[Tx]] representing a transaction
         *
         * @returns A Promise<string> representing the transaction ID of the posted transaction.
         */
        this.issueTx = (tx) => __awaiter(this, void 0, void 0, function* () {
            let Transaction = '';
            if (typeof tx === 'string') {
                Transaction = tx;
            }
            else if (tx instanceof buffer_1.Buffer) {
                const txobj = new tx_1.Tx();
                txobj.fromBuffer(tx);
                Transaction = txobj.toString();
            }
            else if (tx instanceof tx_1.Tx) {
                Transaction = tx.toString();
            }
            else {
                /* istanbul ignore next */
                throw new Error('Error - avm.issueTx: provided tx is not expected type of string, Buffer, or Tx');
            }
            const params = {
                tx: Transaction.toString(),
            };
            return this.callMethod('avm.issueTx', params).then((response) => response.data.result.txID);
        });
        /**
         * Sends an amount of assetID to the specified address from a list of owned of addresses.
         *
         * @param username The user that owns the private keys associated with the `from` addresses
         * @param password The password unlocking the user
         * @param assetID The assetID of the asset to send
         * @param amount The amount of the asset to be sent
         * @param to The address of the recipient
         * @param from Optional. An array of addresses managed by the node's keystore for this blockchain which will fund this transaction
         * @param changeAddr Optional. An address to send the change
         * @param memo Optional. CB58 Buffer or String which contains arbitrary bytes, up to 256 bytes
         *
         * @returns Promise for the string representing the transaction's ID.
         */
        this.send = (username, password, assetID, amount, to, from = undefined, changeAddr = undefined, memo = undefined) => __awaiter(this, void 0, void 0, function* () {
            let asset;
            let amnt;
            if (typeof this.parseAddress(to) === 'undefined') {
                /* istanbul ignore next */
                throw new Error(`Error - AVMAPI.send: Invalid address format ${to}`);
            }
            if (typeof assetID !== 'string') {
                asset = bintools.cb58Encode(assetID);
            }
            else {
                asset = assetID;
            }
            if (typeof amount === 'number') {
                amnt = new bn_js_1.default(amount);
            }
            else {
                amnt = amount;
            }
            const params = {
                username: username,
                password: password,
                assetID: asset,
                amount: amnt.toString(10),
                to: to
            };
            from = this._cleanAddressArray(from, 'send');
            if (typeof from !== "undefined") {
                params["from"] = from;
            }
            if (typeof changeAddr !== 'undefined') {
                if (typeof this.parseAddress(changeAddr) === 'undefined') {
                    /* istanbul ignore next */
                    throw new Error(`Error - AVMAPI.send: Invalid address format ${changeAddr}`);
                }
                params["changeAddr"] = changeAddr;
            }
            if (typeof memo !== "undefined") {
                if (typeof memo !== 'string') {
                    params["memo"] = bintools.cb58Encode(memo);
                }
                else {
                    params["memo"] = memo;
                }
            }
            return this.callMethod('avm.send', params).then((response) => response.data.result);
        });
        /**
         * Sends an amount of assetID to an array of specified addresses from a list of owned of addresses.
         *
         * @param username The user that owns the private keys associated with the `from` addresses
         * @param password The password unlocking the user
         * @param sendOutputs The array of SendOutputs. A SendOutput is an object literal which contains an assetID, amount, and to.
         * @param from Optional. An array of addresses managed by the node's keystore for this blockchain which will fund this transaction
         * @param changeAddr Optional. An address to send the change
         * @param memo Optional. CB58 Buffer or String which contains arbitrary bytes, up to 256 bytes
         *
         * @returns Promise for the string representing the transaction's ID.
         */
        this.sendMultiple = (username, password, sendOutputs, from = undefined, changeAddr = undefined, memo = undefined) => __awaiter(this, void 0, void 0, function* () {
            let asset;
            let amnt;
            let sOutputs = [];
            sendOutputs.forEach((output) => {
                if (typeof this.parseAddress(output.to) === 'undefined') {
                    /* istanbul ignore next */
                    throw new Error(`Error - AVMAPI.sendMultiple: Invalid address format ${output.to}`);
                }
                if (typeof output.assetID !== 'string') {
                    asset = bintools.cb58Encode(output.assetID);
                }
                else {
                    asset = output.assetID;
                }
                if (typeof output.amount === 'number') {
                    amnt = new bn_js_1.default(output.amount);
                }
                else {
                    amnt = output.amount;
                }
                sOutputs.push({ to: output.to, assetID: asset, amount: amnt.toString(10) });
            });
            const params = {
                username: username,
                password: password,
                outputs: sOutputs,
            };
            from = this._cleanAddressArray(from, 'send');
            if (typeof from !== "undefined") {
                params["from"] = from;
            }
            if (typeof changeAddr !== 'undefined') {
                if (typeof this.parseAddress(changeAddr) === 'undefined') {
                    /* istanbul ignore next */
                    throw new Error(`Error - AVMAPI.send: Invalid address format ${changeAddr}`);
                }
                params["changeAddr"] = changeAddr;
            }
            if (typeof memo !== "undefined") {
                if (typeof memo !== 'string') {
                    params["memo"] = bintools.cb58Encode(memo);
                }
                else {
                    params["memo"] = memo;
                }
            }
            return this.callMethod('avm.sendMultiple', params).then((response) => response.data.result);
        });
        /**
         * Given a JSON representation of this Virtual Machine’s genesis state, create the byte representation of that state.
         *
         * @param genesisData The blockchain's genesis data object
         *
         * @returns Promise of a string of bytes
         */
        this.buildGenesis = (genesisData) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                genesisData,
            };
            return this.callMethod('avm.buildGenesis', params).then((response) => {
                const r = response.data.result.bytes;
                return r;
            });
        });
        this.blockchainID = blockchainID;
        const netid = core.getNetworkID();
        if (netid in constants_2.Defaults.network && blockchainID in constants_2.Defaults.network[netid]) {
            const { alias } = constants_2.Defaults.network[netid][blockchainID];
            this.keychain = new keychain_1.KeyChain(this.core.getHRP(), alias);
        }
        else {
            this.keychain = new keychain_1.KeyChain(this.core.getHRP(), blockchainID);
        }
    }
    /**
     * @ignore
     */
    _cleanAddressArray(addresses, caller) {
        const addrs = [];
        const chainid = this.getBlockchainAlias() ? this.getBlockchainAlias() : this.getBlockchainID();
        if (addresses && addresses.length > 0) {
            for (let i = 0; i < addresses.length; i++) {
                if (typeof addresses[i] === 'string') {
                    if (typeof this.parseAddress(addresses[i]) === 'undefined') {
                        /* istanbul ignore next */
                        throw new Error(`Error - AVMAPI.${caller}: Invalid address format ${addresses[i]}`);
                    }
                    addrs.push(addresses[i]);
                }
                else {
                    addrs.push(bintools.addressToString(this.core.getHRP(), chainid, addresses[i]));
                }
            }
        }
        return addrs;
    }
}
exports.AVMAPI = AVMAPI;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2FwaXMvYXZtL2FwaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFBQTs7O0dBR0c7QUFDSCxrREFBdUI7QUFDdkIsb0NBQWlDO0FBRWpDLG9FQUE0QztBQUM1QyxtQ0FBa0M7QUFDbEMsMkNBQTJDO0FBQzNDLHlDQUFzQztBQUN0Qyw2QkFBc0M7QUFDdEMsaURBQWtEO0FBR2xELGlFQUFzRDtBQUN0RCxrREFBK0M7QUFFL0MscURBQThGO0FBRzlGLGdEQUFtRDtBQUduRDs7R0FFRztBQUNILE1BQU0sUUFBUSxHQUFHLGtCQUFRLENBQUMsV0FBVyxFQUFFLENBQUM7QUFHeEM7Ozs7OztHQU1HO0FBQ0gsTUFBYSxNQUFPLFNBQVEsaUJBQU87SUFzNUNqQzs7Ozs7O09BTUc7SUFDSCxZQUFZLElBQWtCLEVBQUUsVUFBaUIsV0FBVyxFQUFFLGVBQXNCLEVBQUU7UUFDcEYsS0FBSyxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztRQTc1Q3ZCOztXQUVHO1FBQ08sYUFBUSxHQUFZLElBQUksbUJBQVEsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFFekMsaUJBQVksR0FBVSxFQUFFLENBQUM7UUFFekIsb0JBQWUsR0FBVSxTQUFTLENBQUM7UUFFbkMsZ0JBQVcsR0FBVSxTQUFTLENBQUM7UUFFL0IsVUFBSyxHQUFNLFNBQVMsQ0FBQztRQUVyQixrQkFBYSxHQUFNLFNBQVMsQ0FBQztRQUV2Qzs7OztXQUlHO1FBQ0gsdUJBQWtCLEdBQUcsR0FBVSxFQUFFO1lBQy9CLElBQUcsT0FBTyxJQUFJLENBQUMsZUFBZSxLQUFLLFdBQVcsRUFBQztnQkFDN0MsTUFBTSxLQUFLLEdBQVUsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztnQkFDOUMsSUFBSSxLQUFLLElBQUksb0JBQVEsQ0FBQyxPQUFPLElBQUksSUFBSSxD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QUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUN0RyxJQUFJLFNBQVMsSUFBSSxTQUFTLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtZQUNyQyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsU0FBUyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtnQkFDekMsSUFBSSxPQUFPLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxRQUFRLEVBQUU7b0JBQ3BDLElBQUksT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQVcsQ0FBQyxLQUFLLFdBQVcsRUFBRTt3QkFDcEUsMEJBQTBCO3dCQUMxQixNQUFNLElBQUksS0FBSyxDQUFDLGtCQUFrQixNQUFNLDRCQUE0QixTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO3FCQUNyRjtvQkFDRCxLQUFLLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQVcsQ0FBQyxDQUFDO2lCQUNwQztxQkFBTTtvQkFDTCxLQUFLLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsRUFBRSxPQUFPLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBVyxDQUFDLENBQUMsQ0FBQztpQkFDM0Y7YUFDRjtTQUNGO1FBQ0QsT0FBTyxLQUFLLENBQUM7SUFDZixDQUFDO0NBb0JGO0FBeDZDRCx3QkF3NkNDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAcGFja2FnZURvY3VtZW50YXRpb25cbiAqIEBtb2R1bGUgQVBJLUFWTVxuICovXG5pbXBvcnQgQk4gZnJvbSAnYm4uanMnO1xuaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSAnYnVmZmVyLyc7XG5pbXBvcnQgQXZhbGFuY2hlQ29yZSBmcm9tICcuLi8uLi9hdmFsYW5jaGUnO1xuaW1wb3J0IEJpblRvb2xzIGZyb20gJy4uLy4uL3V0aWxzL2JpbnRvb2xzJztcbmltcG9ydCB7IFVUWE9TZXQgfSBmcm9tICcuL3V0eG9zJztcbmltcG9ydCB7IEFWTUNvbnN0YW50cyB9IGZyb20gJy4vY29uc3RhbnRzJztcbmltcG9ydCB7IEtleUNoYWluIH0gZnJvbSAnLi9rZXljaGFpbic7XG5pbXBvcnQgeyBUeCwgVW5zaWduZWRUeCB9IGZyb20gJy4vdHgnO1xuaW1wb3J0IHsgUGF5bG9hZEJhc2UgfSBmcm9tICcuLi8uLi91dGlscy9wYXlsb2FkJztcbmltcG9ydCB7IFNFQ1BNaW50T3V0cHV0IH0gZnJvbSAnLi9vdXRwdXRzJztcbmltcG9ydCB7IEluaXRpYWxTdGF0ZXMgfSBmcm9tICcuL2luaXRpYWxzdGF0ZXMnO1xuaW1wb3J0IHsgVW5peE5vdyB9IGZyb20gJy4uLy4uL3V0aWxzL2hlbHBlcmZ1bmN0aW9ucyc7XG5pbXBvcnQgeyBKUlBDQVBJIH0gZnJvbSAnLi4vLi4vY29tbW9uL2pycGNhcGknO1xuaW1wb3J0IHsgUmVxdWVzdFJlc3BvbnNlRGF0YSB9IGZyb20gJy4uLy4uL2NvbW1vbi9hcGliYXNlJztcbmltcG9ydCB7IERlZmF1bHRzLCBQbGF0Zm9ybUNoYWluSUQsIFByaW1hcnlBc3NldEFsaWFzLCBPTkVBVkFYIH0gZnJvbSAnLi4vLi4vdXRpbHMvY29uc3RhbnRzJztcbmltcG9ydCB7IE1pbnRlclNldCB9IGZyb20gJy4vbWludGVyc2V0JztcbmltcG9ydCB7IFBlcnNpc3RhbmNlT3B0aW9ucyB9IGZyb20gJy4uLy4uL3V0aWxzL3BlcnNpc3RlbmNlb3B0aW9ucyc7XG5pbXBvcnQgeyBPdXRwdXRPd25lcnMgfSBmcm9tICcuLi8uLi9jb21tb24vb3V0cHV0JztcbmltcG9ydCB7IFNFQ1BUcmFuc2Zlck91dHB1dCB9IGZyb20gJy4vb3V0cHV0cyc7XG5cbi8qKlxuICogQGlnbm9yZVxuICovXG5jb25zdCBiaW50b29scyA9IEJpblRvb2xzLmdldEluc3RhbmNlKCk7XG5cblxuLyoqXG4gKiBDbGFzcyBmb3IgaW50ZXJhY3Rpbmcgd2l0aCBhIG5vZGUgZW5kcG9pbnQgdGhhdCBpcyB1c2luZyB0aGUgQVZNLlxuICpcbiAqIEBjYXRlZ29yeSBSUENBUElzXG4gKlxuICogQHJlbWFya3MgVGhpcyBleHRlbmRzIHRoZSBbW0pSUENBUEldXSBjbGFzcy4gVGhpcyBjbGFzcyBzaG91bGQgbm90IGJlIGRpcmVjdGx5IGNhbGxlZC4gSW5zdGVhZCwgdXNlIHRoZSBbW0F2YWxhbmNoZS5hZGRBUEldXSBmdW5jdGlvbiB0byByZWdpc3RlciB0aGlzIGludGVyZmFjZSB3aXRoIEF2YWxhbmNoZS5cbiAqL1xuZXhwb3J0IGNsYXNzIEFWTUFQSSBleHRlbmRzIEpSUENBUEkge1xuICAvKipcbiAgICogQGlnbm9yZVxuICAgKi9cbiAgcHJvdGVjdGVkIGtleWNoYWluOktleUNoYWluID0gbmV3IEtleUNoYWluKCcnLCAnJyk7XG5cbiAgcHJvdGVjdGVkIGJsb2NrY2hhaW5JRDpzdHJpbmcgPSAnJztcblxuICBwcm90ZWN0ZWQgYmxvY2tjaGFpbkFsaWFzOnN0cmluZyA9IHVuZGVmaW5lZDtcblxuICBwcm90ZWN0ZWQgQVZBWEFzc2V0SUQ6QnVmZmVyID0gdW5kZWZpbmVkO1xuXG4gIHByb3RlY3RlZCB0eEZlZTpCTiA9IHVuZGVmaW5lZDtcblxuICBwcm90ZWN0ZWQgY3JlYXRpb25UeEZlZTpCTiA9IHVuZGVmaW5lZDtcblxuICAvKipcbiAgICogR2V0cyB0aGUgYWxpYXMgZm9yIHRoZSBibG9ja2NoYWluSUQgaWYgaXQgZXhpc3RzLCBvdGhlcndpc2UgcmV0dXJucyBgdW5kZWZpbmVkYC5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGFsaWFzIGZvciB0aGUgYmxvY2tjaGFpbklEXG4gICAqL1xuICBnZXRCbG9ja2NoYWluQWxpYXMgPSAoKTpzdHJpbmcgPT4ge1xuICAgIGlmKHR5cGVvZiB0aGlzLmJsb2NrY2hhaW5BbGlhcyA9PT0gXCJ1bmRlZmluZWRcIil7XG4gICAgICBjb25zdCBuZXRpZDpudW1iZXIgPSB0aGlzLmNvcmUuZ2V0TmV0d29ya0lEKCk7XG4gICAgICBpZiAobmV0aWQgaW4gRGVmYXVsdHMubmV0d29yayAmJiB0aGlzLmJsb2NrY2hhaW5JRCBpbiBEZWZhdWx0cy5uZXR3b3JrW25ldGlkXSkge1xuICAgICAgICB0aGlzLmJsb2NrY2hhaW5BbGlhcyA9IERlZmF1bHRzLm5ldHdvcmtbbmV0aWRdW3RoaXMuYmxvY2tjaGFpbklEXS5hbGlhcztcbiAgICAgICAgcmV0dXJuIHRoaXMuYmxvY2tjaGFpbkFsaWFzO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgIH1cbiAgICB9IFxuICAgIHJldHVybiB0aGlzLmJsb2NrY2hhaW5BbGlhcztcbiAgfTtcblxuICAvKipcbiAgICogU2V0cyB0aGUgYWxpYXMgZm9yIHRoZSBibG9ja2NoYWluSUQuXG4gICAqIFxuICAgKiBAcGFyYW0gYWxpYXMgVGhlIGFsaWFzIGZvciB0aGUgYmxvY2tjaGFpbklELlxuICAgKiBcbiAgICovXG4gIHNldEJsb2NrY2hhaW5BbGlhcyA9IChhbGlhczpzdHJpbmcpOnN0cmluZyA9PiB7XG4gICAgdGhpcy5ibG9ja2NoYWluQWxpYXMgPSBhbGlhcztcbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH07XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGJsb2NrY2hhaW5JRCBhbmQgcmV0dXJucyBpdC5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGJsb2NrY2hhaW5JRFxuICAgKi9cbiAgZ2V0QmxvY2tjaGFpbklEID0gKCk6c3RyaW5nID0+IHRoaXMuYmxvY2tjaGFpbklEO1xuXG4gIC8qKlxuICAgKiBSZWZyZXNoIGJsb2NrY2hhaW5JRCwgYW5kIGlmIGEgYmxvY2tjaGFpbklEIGlzIHBhc3NlZCBpbiwgdXNlIHRoYXQuXG4gICAqXG4gICAqIEBwYXJhbSBPcHRpb25hbC4gQmxvY2tjaGFpbklEIHRvIGFzc2lnbiwgaWYgbm9uZSwgdXNlcyB0aGUgZGVmYXVsdCBiYXNlZCBvbiBuZXR3b3JrSUQuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBibG9ja2NoYWluSURcbiAgICovXG4gIHJlZnJlc2hCbG9ja2NoYWluSUQgPSAoYmxvY2tjaGFpbklEOnN0cmluZyA9IHVuZGVmaW5lZCk6Ym9vbGVhbiA9PiB7XG4gICAgY29uc3QgbmV0aWQ6bnVtYmVyID0gdGhpcy5jb3JlLmdldE5ldHdvcmtJRCgpO1xuICAgIGlmICh0eXBlb2YgYmxvY2tjaGFpbklEID09PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgRGVmYXVsdHMubmV0d29ya1tuZXRpZF0gIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHRoaXMuYmxvY2tjaGFpbklEID0gRGVmYXVsdHMubmV0d29ya1tuZXRpZF0uWC5ibG9ja2NoYWluSUQ7IC8vZGVmYXVsdCB0byBYLUNoYWluXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGlmICh0eXBlb2YgYmxvY2tjaGFpbklEID09PSAnc3RyaW5nJykge1xuICAgICAgdGhpcy5ibG9ja2NoYWluSUQgPSBibG9ja2NoYWluSUQ7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9O1xuXG4gIC8qKlxuICAgKiBUYWtlcyBhbiBhZGRyZXNzIHN0cmluZyBhbmQgcmV0dXJucyBpdHMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gcmVwcmVzZW50YXRpb24gaWYgdmFsaWQuXG4gICAqXG4gICAqIEByZXR1cm5zIEEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gZm9yIHRoZSBhZGRyZXNzIGlmIHZhbGlkLCB1bmRlZmluZWQgaWYgbm90IHZhbGlkLlxuICAgKi9cbiAgcGFyc2VBZGRyZXNzID0gKGFkZHI6c3RyaW5nKTpCdWZmZXIgPT4ge1xuICAgIGNvbnN0IGFsaWFzOnN0cmluZyA9IHRoaXMuZ2V0QmxvY2tjaGFpbkFsaWFzKCk7XG4gICAgY29uc3QgYmxvY2tjaGFpbklEOnN0cmluZyA9IHRoaXMuZ2V0QmxvY2tjaGFpbklEKCk7XG4gICAgcmV0dXJuIGJpbnRvb2xzLnBhcnNlQWRkcmVzcyhhZGRyLCBibG9ja2NoYWluSUQsIGFsaWFzLCBBVk1Db25zdGFudHMuQUREUkVTU0xFTkdUSCk7XG4gIH07XG5cbiAgYWRkcmVzc0Zyb21CdWZmZXIgPSAoYWRkcmVzczpCdWZmZXIpOnN0cmluZyA9PiB7XG4gICAgY29uc3QgY2hhaW5pZDpzdHJpbmcgPSB0aGlzLmdldEJsb2NrY2hhaW5BbGlhcygpID8gdGhpcy5nZXRCbG9ja2NoYWluQWxpYXMoKSA6IHRoaXMuZ2V0QmxvY2tjaGFpbklEKCk7XG4gICAgcmV0dXJuIGJpbnRvb2xzLmFkZHJlc3NUb1N0cmluZyh0aGlzLmNvcmUuZ2V0SFJQKCksIGNoYWluaWQsIGFkZHJlc3MpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBGZXRjaGVzIHRoZSBBVkFYIEFzc2V0SUQgYW5kIHJldHVybnMgaXQgaW4gYSBQcm9taXNlLlxuICAgKlxuICAgKiBAcGFyYW0gcmVmcmVzaCBUaGlzIGZ1bmN0aW9uIGNhY2hlcyB0aGUgcmVzcG9uc2UuIFJlZnJlc2ggPSB0cnVlIHdpbGwgYnVzdCB0aGUgY2FjaGUuXG4gICAqIFxuICAgKiBAcmV0dXJucyBUaGUgdGhlIHByb3ZpZGVkIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIEFWQVggQXNzZXRJRFxuICAgKi9cbiAgZ2V0QVZBWEFzc2V0SUQgPSBhc3luYyAocmVmcmVzaDpib29sZWFuID0gZmFsc2UpOlByb21pc2U8QnVmZmVyPiA9PiB7XG4gICAgaWYgKHR5cGVvZiB0aGlzLkFWQVhBc3NldElEID09PSAndW5kZWZpbmVkJyB8fCByZWZyZXNoKSB7XG4gICAgICBjb25zdCBhc3NldDp7XG4gICAgICAgIG5hbWU6IHN0cmluZztcbiAgICAgICAgc3ltYm9sOiBzdHJpbmc7XG4gICAgICAgIGFzc2V0SUQ6IEJ1ZmZlcjtcbiAgICAgICAgZGVub21pbmF0aW9uOiBudW1iZXI7XG4gICAgICB9ID0gYXdhaXQgdGhpcy5nZXRBc3NldERlc2NyaXB0aW9uKFByaW1hcnlBc3NldEFsaWFzKTtcbiAgICAgIHRoaXMuQVZBWEFzc2V0SUQgPSBhc3NldC5hc3NldElEO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5BVkFYQXNzZXRJRDtcbiAgfTtcbiAgXG4gIC8qKlxuICAgKiBPdmVycmlkZXMgdGhlIGRlZmF1bHRzIGFuZCBzZXRzIHRoZSBjYWNoZSB0byBhIHNwZWNpZmljIEFWQVggQXNzZXRJRFxuICAgKiBcbiAgICogQHBhcmFtIGF2YXhBc3NldElEIEEgY2I1OCBzdHJpbmcgb3IgQnVmZmVyIHJlcHJlc2VudGluZyB0aGUgQVZBWCBBc3NldElEXG4gICAqIFxuICAgKiBAcmV0dXJucyBUaGUgdGhlIHByb3ZpZGVkIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIEFWQVggQXNzZXRJRFxuICAgKi9cbiAgc2V0QVZBWEFzc2V0SUQgPSAoYXZheEFzc2V0SUQ6c3RyaW5nIHwgQnVmZmVyKSA9PiB7XG4gICAgaWYodHlwZW9mIGF2YXhBc3NldElEID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBhdmF4QXNzZXRJRCA9IGJpbnRvb2xzLmNiNThEZWNvZGUoYXZheEFzc2V0SUQpO1xuICAgIH1cbiAgICB0aGlzLkFWQVhBc3NldElEID0gYXZheEFzc2V0SUQ7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgZGVmYXVsdCB0eCBmZWUgZm9yIHRoaXMgY2hhaW4uXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBkZWZhdWx0IHR4IGZlZSBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqL1xuICBnZXREZWZhdWx0VHhGZWUgPSAgKCk6Qk4gPT4ge1xuICAgIHJldHVybiB0aGlzLmNvcmUuZ2V0TmV0d29ya0lEKCkgaW4gRGVmYXVsdHMubmV0d29yayA/IG5ldyBCTihEZWZhdWx0cy5uZXR3b3JrW3RoaXMuY29yZS5nZXROZXR3b3JrSUQoKV1bXCJYXCJdW1widHhGZWVcIl0pIDogbmV3IEJOKDApO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHR4IGZlZSBmb3IgdGhpcyBjaGFpbi5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIHR4IGZlZSBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqL1xuICBnZXRUeEZlZSA9ICgpOkJOID0+IHtcbiAgICBpZih0eXBlb2YgdGhpcy50eEZlZSA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgdGhpcy50eEZlZSA9IHRoaXMuZ2V0RGVmYXVsdFR4RmVlKCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLnR4RmVlO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHR4IGZlZSBmb3IgdGhpcyBjaGFpbi5cbiAgICpcbiAgICogQHBhcmFtIGZlZSBUaGUgdHggZmVlIGFtb3VudCB0byBzZXQgYXMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICovXG4gIHNldFR4RmVlID0gKGZlZTpCTikgPT4ge1xuICAgIHRoaXMudHhGZWUgPSBmZWU7XG4gIH1cblxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBkZWZhdWx0IGNyZWF0aW9uIGZlZSBmb3IgdGhpcyBjaGFpbi5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGRlZmF1bHQgY3JlYXRpb24gZmVlIGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICovXG4gIGdldERlZmF1bHRDcmVhdGlvblR4RmVlID0gICgpOkJOID0+IHtcbiAgICByZXR1cm4gdGhpcy5jb3JlLmdldE5ldHdvcmtJRCgpIGluIERlZmF1bHRzLm5ldHdvcmsgPyBuZXcgQk4oRGVmYXVsdHMubmV0d29ya1t0aGlzLmNvcmUuZ2V0TmV0d29ya0lEKCldW1wiWFwiXVtcImNyZWF0aW9uVHhGZWVcIl0pIDogbmV3IEJOKDApO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGNyZWF0aW9uIGZlZSBmb3IgdGhpcyBjaGFpbi5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGNyZWF0aW9uIGZlZSBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqL1xuICBnZXRDcmVhdGlvblR4RmVlID0gKCk6Qk4gPT4ge1xuICAgIGlmKHR5cGVvZiB0aGlzLmNyZWF0aW9uVHhGZWUgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHRoaXMuY3JlYXRpb25UeEZlZSA9IHRoaXMuZ2V0RGVmYXVsdENyZWF0aW9uVHhGZWUoKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuY3JlYXRpb25UeEZlZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBjcmVhdGlvbiBmZWUgZm9yIHRoaXMgY2hhaW4uXG4gICAqXG4gICAqIEBwYXJhbSBmZWUgVGhlIGNyZWF0aW9uIGZlZSBhbW91bnQgdG8gc2V0IGFzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqL1xuICBzZXRDcmVhdGlvblR4RmVlID0gKGZlZTpCTikgPT4ge1xuICAgIHRoaXMuY3JlYXRpb25UeEZlZSA9IGZlZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIGEgcmVmZXJlbmNlIHRvIHRoZSBrZXljaGFpbiBmb3IgdGhpcyBjbGFzcy5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGluc3RhbmNlIG9mIFtbS2V5Q2hhaW5dXSBmb3IgdGhpcyBjbGFzc1xuICAgKi9cbiAga2V5Q2hhaW4gPSAoKTpLZXlDaGFpbiA9PiB0aGlzLmtleWNoYWluO1xuXG4gIC8qKlxuICAgKiBAaWdub3JlXG4gICAqL1xuICBuZXdLZXlDaGFpbiA9ICgpOktleUNoYWluID0+IHtcbiAgICAvLyB3YXJuaW5nLCBvdmVyd3JpdGVzIHRoZSBvbGQga2V5Y2hhaW5cbiAgICBjb25zdCBhbGlhcyA9IHRoaXMuZ2V0QmxvY2tjaGFpbkFsaWFzKCk7XG4gICAgaWYgKGFsaWFzKSB7XG4gICAgICB0aGlzLmtleWNoYWluID0gbmV3IEtleUNoYWluKHRoaXMuY29yZS5nZXRIUlAoKSwgYWxpYXMpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmtleWNoYWluID0gbmV3IEtleUNoYWluKHRoaXMuY29yZS5nZXRIUlAoKSwgdGhpcy5ibG9ja2NoYWluSUQpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5rZXljaGFpbjtcbiAgfTtcblxuICAvKipcbiAgICogSGVscGVyIGZ1bmN0aW9uIHdoaWNoIGRldGVybWluZXMgaWYgYSB0eCBpcyBhIGdvb3NlIGVnZyB0cmFuc2FjdGlvbi4gXG4gICAqXG4gICAqIEBwYXJhbSB1dHggQW4gVW5zaWduZWRUeFxuICAgKlxuICAgKiBAcmV0dXJucyBib29sZWFuIHRydWUgaWYgcGFzc2VzIGdvb3NlIGVnZyB0ZXN0IGFuZCBmYWxzZSBpZiBmYWlscy5cbiAgICpcbiAgICogQHJlbWFya3NcbiAgICogQSBcIkdvb3NlIEVnZyBUcmFuc2FjdGlvblwiIGlzIHdoZW4gdGhlIGZlZSBmYXIgZXhjZWVkcyBhIHJlYXNvbmFibGUgYW1vdW50XG4gICAqL1xuICBjaGVja0dvb3NlRWdnID0gYXN5bmMgKHV0eDpVbnNpZ25lZFR4LCBvdXRUb3RhbDpCTiA9IG5ldyBCTigwKSk6IFByb21pc2U8Ym9vbGVhbj4gPT4ge1xuICAgIGNvbnN0IGF2YXhBc3NldElEOkJ1ZmZlciA9IGF3YWl0IHRoaXMuZ2V0QVZBWEFzc2V0SUQoKTtcbiAgICBsZXQgb3V0cHV0VG90YWw6Qk4gPSBvdXRUb3RhbC5ndChuZXcgQk4oMCkpID8gb3V0VG90YWwgOiB1dHguZ2V0T3V0cHV0VG90YWwoYXZheEFzc2V0SUQpO1xuICAgIGNvbnN0IGZlZTpCTiA9IHV0eC5nZXRCdXJuKGF2YXhBc3NldElEKTtcbiAgICBpZihmZWUubHRlKE9ORUFWQVgubXVsKG5ldyBCTigxMCkpKSB8fCBmZWUubHRlKG91dHB1dFRvdGFsKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICAgKiBHZXRzIHRoZSBiYWxhbmNlIG9mIGEgcGFydGljdWxhciBhc3NldCBvbiBhIGJsb2NrY2hhaW4uXG4gICAgICpcbiAgICAgKiBAcGFyYW0gYWRkcmVzcyBUaGUgYWRkcmVzcyB0byBwdWxsIHRoZSBhc3NldCBiYWxhbmNlIGZyb21cbiAgICAgKiBAcGFyYW0gYXNzZXRJRCBUaGUgYXNzZXRJRCB0byBwdWxsIHRoZSBiYWxhbmNlIGZyb21cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIFByb21pc2Ugd2l0aCB0aGUgYmFsYW5jZSBvZiB0aGUgYXNzZXRJRCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59IG9uIHRoZSBwcm92aWRlZCBhZGRyZXNzIGZvciB0aGUgYmxvY2tjaGFpbi5cbiAgICAgKi9cbiAgZ2V0QmFsYW5jZSA9IGFzeW5jIChhZGRyZXNzOnN0cmluZywgYXNzZXRJRDpzdHJpbmcpOlByb21pc2U8b2JqZWN0PiA9PiB7XG4gICAgaWYgKHR5cGVvZiB0aGlzLnBhcnNlQWRkcmVzcyhhZGRyZXNzKSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEVycm9yIC0gQVZNQVBJLmdldEJhbGFuY2U6IEludmFsaWQgYWRkcmVzcyBmb3JtYXQgJHthZGRyZXNzfWApO1xuICAgIH1cbiAgICBjb25zdCBwYXJhbXM6YW55ID0ge1xuICAgICAgYWRkcmVzcyxcbiAgICAgIGFzc2V0SUQsXG4gICAgfTtcbiAgICByZXR1cm4gdGhpcy5jYWxsTWV0aG9kKCdhdm0uZ2V0QmFsYW5jZScsIHBhcmFtcykudGhlbigocmVzcG9uc2U6UmVxdWVzdFJlc3BvbnNlRGF0YSkgPT4gcmVzcG9uc2UuZGF0YS5yZXN1bHQpO1xuICB9O1xuXG4gIC8qKlxuICAgICAqIENyZWF0ZXMgYW4gYWRkcmVzcyAoYW5kIGFzc29jaWF0ZWQgcHJpdmF0ZSBrZXlzKSBvbiBhIHVzZXIgb24gYSBibG9ja2NoYWluLlxuICAgICAqXG4gICAgICogQHBhcmFtIHVzZXJuYW1lIE5hbWUgb2YgdGhlIHVzZXIgdG8gY3JlYXRlIHRoZSBhZGRyZXNzIHVuZGVyXG4gICAgICogQHBhcmFtIHBhc3N3b3JkIFBhc3N3b3JkIHRvIHVubG9jayB0aGUgdXNlciBhbmQgZW5jcnlwdCB0aGUgcHJpdmF0ZSBrZXlcbiAgICAgKlxuICAgICAqIEByZXR1cm5zIFByb21pc2UgZm9yIGEgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgYWRkcmVzcyBjcmVhdGVkIGJ5IHRoZSB2bS5cbiAgICAgKi9cbiAgY3JlYXRlQWRkcmVzcyA9IGFzeW5jICh1c2VybmFtZTpzdHJpbmcsIHBhc3N3b3JkOnN0cmluZyk6UHJvbWlzZTxzdHJpbmc+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6YW55ID0ge1xuICAgICAgdXNlcm5hbWUsXG4gICAgICBwYXNzd29yZCxcbiAgICB9O1xuICAgIHJldHVybiB0aGlzLmNhbGxNZXRob2QoJ2F2bS5jcmVhdGVBZGRyZXNzJywgcGFyYW1zKS50aGVuKChyZXNwb25zZTpSZXF1ZXN0UmVzcG9uc2VEYXRhKSA9PiByZXNwb25zZS5kYXRhLnJlc3VsdC5hZGRyZXNzKTtcbiAgfTtcblxuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IGZpeGVkLWNhcCwgZnVuZ2libGUgYXNzZXQuIEEgcXVhbnRpdHkgb2YgaXQgaXMgY3JlYXRlZCBhdCBpbml0aWFsaXphdGlvbiBhbmQgdGhlcmUgbm8gbW9yZSBpcyBldmVyIGNyZWF0ZWQuXG4gICAqXG4gICAqIEBwYXJhbSB1c2VybmFtZSBUaGUgdXNlciBwYXlpbmcgdGhlIHRyYW5zYWN0aW9uIGZlZSAoaW4gJEFWQVgpIGZvciBhc3NldCBjcmVhdGlvblxuICAgKiBAcGFyYW0gcGFzc3dvcmQgVGhlIHBhc3N3b3JkIGZvciB0aGUgdXNlciBwYXlpbmcgdGhlIHRyYW5zYWN0aW9uIGZlZSAoaW4gJEFWQVgpIGZvciBhc3NldCBjcmVhdGlvblxuICAgKiBAcGFyYW0gbmFtZSBUaGUgaHVtYW4tcmVhZGFibGUgbmFtZSBmb3IgdGhlIGFzc2V0XG4gICAqIEBwYXJhbSBzeW1ib2wgT3B0aW9uYWwuIFRoZSBzaG9ydGhhbmQgc3ltYm9sIGZvciB0aGUgYXNzZXQuIEJldHdlZW4gMCBhbmQgNCBjaGFyYWN0ZXJzXG4gICAqIEBwYXJhbSBkZW5vbWluYXRpb24gT3B0aW9uYWwuIERldGVybWluZXMgaG93IGJhbGFuY2VzIG9mIHRoaXMgYXNzZXQgYXJlIGRpc3BsYXllZCBieSB1c2VyIGludGVyZmFjZXMuIERlZmF1bHQgaXMgMFxuICAgKiBAcGFyYW0gaW5pdGlhbEhvbGRlcnMgQW4gYXJyYXkgb2Ygb2JqZWN0cyBjb250YWluaW5nIHRoZSBmaWVsZCBcImFkZHJlc3NcIiBhbmQgXCJhbW91bnRcIiB0byBlc3RhYmxpc2ggdGhlIGdlbmVzaXMgdmFsdWVzIGZvciB0aGUgbmV3IGFzc2V0XG4gICAqXG4gICAqIGBgYGpzXG4gICAqIEV4YW1wbGUgaW5pdGlhbEhvbGRlcnM6XG4gICAqIFtcbiAgICogICAgIHtcbiAgICogICAgICAgICBcImFkZHJlc3NcIjogXCJYLWF2YXgxa2owNmxoZ3g4NGgzOXNuc2xqY2V5M3RwYzA0NnplNjhtZWszZzVcIixcbiAgICogICAgICAgICBcImFtb3VudFwiOiAxMDAwMFxuICAgKiAgICAgfSxcbiAgICogICAgIHtcbiAgICogICAgICAgICBcImFkZHJlc3NcIjogXCJYLWF2YXgxYW00dzZoZnJ2bWgzYWtkdXpranRocnRndHFhZmFsY2U2YW44Y3JcIixcbiAgICogICAgICAgICBcImFtb3VudFwiOiA1MDAwMFxuICAgKiAgICAgfVxuICAgKiBdXG4gICAqIGBgYFxuICAgKlxuICAgKiBAcmV0dXJucyBSZXR1cm5zIGEgUHJvbWlzZTxzdHJpbmc+IGNvbnRhaW5pbmcgdGhlIGJhc2UgNTggc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBJRCBvZiB0aGUgbmV3bHkgY3JlYXRlZCBhc3NldC5cbiAgICovXG4gIGNyZWF0ZUZpeGVkQ2FwQXNzZXQgPSBhc3luYyAodXNlcm5hbWU6c3RyaW5nLCBwYXNzd29yZDpzdHJpbmcsIG5hbWU6c3RyaW5nLCBzeW1ib2w6c3RyaW5nLCBkZW5vbWluYXRpb246bnVtYmVyLCBpbml0aWFsSG9sZGVyczpBcnJheTxvYmplY3Q+KTpQcm9taXNlPHN0cmluZz4gPT4ge1xuICAgIGNvbnN0IHBhcmFtczphbnkgPSB7XG4gICAgICBuYW1lLFxuICAgICAgc3ltYm9sLFxuICAgICAgZGVub21pbmF0aW9uLFxuICAgICAgdXNlcm5hbWUsXG4gICAgICBwYXNzd29yZCxcbiAgICAgIGluaXRpYWxIb2xkZXJzLFxuICAgIH07XG4gICAgcmV0dXJuIHRoaXMuY2FsbE1ldGhvZCgnYXZtLmNyZWF0ZUZpeGVkQ2FwQXNzZXQnLCBwYXJhbXMpLnRoZW4oKHJlc3BvbnNlOlJlcXVlc3RSZXNwb25zZURhdGEpID0+IHJlc3BvbnNlLmRhdGEucmVzdWx0LmFzc2V0SUQpO1xuICB9O1xuXG4gIC8qKlxuICAgICAqIENyZWF0ZSBhIG5ldyB2YXJpYWJsZS1jYXAsIGZ1bmdpYmxlIGFzc2V0LiBObyB1bml0cyBvZiB0aGUgYXNzZXQgZXhpc3QgYXQgaW5pdGlhbGl6YXRpb24uIE1pbnRlcnMgY2FuIG1pbnQgdW5pdHMgb2YgdGhpcyBhc3NldCB1c2luZyBjcmVhdGVNaW50VHgsIHNpZ25NaW50VHggYW5kIHNlbmRNaW50VHguXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdXNlcm5hbWUgVGhlIHVzZXIgcGF5aW5nIHRoZSB0cmFuc2FjdGlvbiBmZWUgKGluICRBVkFYKSBmb3IgYXNzZXQgY3JlYXRpb25cbiAgICAgKiBAcGFyYW0gcGFzc3dvcmQgVGhlIHBhc3N3b3JkIGZvciB0aGUgdXNlciBwYXlpbmcgdGhlIHRyYW5zYWN0aW9uIGZlZSAoaW4gJEFWQVgpIGZvciBhc3NldCBjcmVhdGlvblxuICAgICAqIEBwYXJhbSBuYW1lIFRoZSBodW1hbi1yZWFkYWJsZSBuYW1lIGZvciB0aGUgYXNzZXRcbiAgICAgKiBAcGFyYW0gc3ltYm9sIE9wdGlvbmFsLiBUaGUgc2hvcnRoYW5kIHN5bWJvbCBmb3IgdGhlIGFzc2V0IC0tIGJldHdlZW4gMCBhbmQgNCBjaGFyYWN0ZXJzXG4gICAgICogQHBhcmFtIGRlbm9taW5hdGlvbiBPcHRpb25hbC4gRGV0ZXJtaW5lcyBob3cgYmFsYW5jZXMgb2YgdGhpcyBhc3NldCBhcmUgZGlzcGxheWVkIGJ5IHVzZXIgaW50ZXJmYWNlcy4gRGVmYXVsdCBpcyAwXG4gICAgICogQHBhcmFtIG1pbnRlclNldHMgaXMgYSBsaXN0IHdoZXJlIGVhY2ggZWxlbWVudCBzcGVjaWZpZXMgdGhhdCB0aHJlc2hvbGQgb2YgdGhlIGFkZHJlc3NlcyBpbiBtaW50ZXJzIG1heSB0b2dldGhlciBtaW50IG1vcmUgb2YgdGhlIGFzc2V0IGJ5IHNpZ25pbmcgYSBtaW50aW5nIHRyYW5zYWN0aW9uXG4gICAgICogXG4gICAgICogYGBganNcbiAgICAgKiBFeGFtcGxlIG1pbnRlclNldHM6XG4gICAgICogW1xuICAgICAqICAgICAge1xuICAgICAqICAgICAgICAgIFwibWludGVyc1wiOltcbiAgICAgKiAgICAgICAgICAgICAgXCJYLWF2YXgxYW00dzZoZnJ2bWgzYWtkdXpranRocnRndHFhZmFsY2U2YW44Y3JcIlxuICAgICAqICAgICAgICAgIF0sXG4gICAgICogICAgICAgICAgXCJ0aHJlc2hvbGRcIjogMVxuICAgICAqICAgICAgfSxcbiAgICAgKiAgICAgIHtcbiAgICAgKiAgICAgICAgICBcIm1pbnRlcnNcIjogW1xuICAgICAqICAgICAgICAgICAgICBcIlgtYXZheDFhbTR3NmhmcnZtaDNha2R1emtqdGhydGd0cWFmYWxjZTZhbjhjclwiLFxuICAgICAqICAgICAgICAgICAgICBcIlgtYXZheDFrajA2bGhneDg0aDM5c25zbGpjZXkzdHBjMDQ2emU2OG1lazNnNVwiLFxuICAgICAqICAgICAgICAgICAgICBcIlgtYXZheDF5ZWxsM2U0bmxuMG0zOWNmcGRoZ3FwcnNkODdqa2g0cW5ha2tseFwiXG4gICAgICogICAgICAgICAgXSxcbiAgICAgKiAgICAgICAgICBcInRocmVzaG9sZFwiOiAyXG4gICAgICogICAgICB9XG4gICAgICogXVxuICAgICAqIGBgYFxuICAgICAqXG4gICAgICogQHJldHVybnMgUmV0dXJucyBhIFByb21pc2U8c3RyaW5nPiBjb250YWluaW5nIHRoZSBiYXNlIDU4IHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgSUQgb2YgdGhlIG5ld2x5IGNyZWF0ZWQgYXNzZXQuXG4gICAgICovXG4gIGNyZWF0ZVZhcmlhYmxlQ2FwQXNzZXQgPSBhc3luYyAodXNlcm5hbWU6c3RyaW5nLCBwYXNzd29yZDpzdHJpbmcsIG5hbWU6c3RyaW5nLCBzeW1ib2w6c3RyaW5nLCBkZW5vbWluYXRpb246bnVtYmVyLCBtaW50ZXJTZXRzOkFycmF5PG9iamVjdD4pOlByb21pc2U8c3RyaW5nPiA9PiB7XG4gICAgY29uc3QgcGFyYW1zOmFueSA9IHtcbiAgICAgIG5hbWUsXG4gICAgICBzeW1ib2wsXG4gICAgICBkZW5vbWluYXRpb24sXG4gICAgICB1c2VybmFtZSxcbiAgICAgIHBhc3N3b3JkLFxuICAgICAgbWludGVyU2V0cyxcbiAgICB9O1xuICAgIHJldHVybiB0aGlzLmNhbGxNZXRob2QoJ2F2bS5jcmVhdGVWYXJpYWJsZUNhcEFzc2V0JywgcGFyYW1zKS50aGVuKChyZXNwb25zZTpSZXF1ZXN0UmVzcG9uc2VEYXRhKSA9PiByZXNwb25zZS5kYXRhLnJlc3VsdC5hc3NldElEKTtcbiAgfTtcblxuICAvKipcbiAgICAgKiBDcmVhdGUgYW4gdW5zaWduZWQgdHJhbnNhY3Rpb24gdG8gbWludCBtb3JlIG9mIGFuIGFzc2V0LlxuICAgICAqXG4gICAgICogQHBhcmFtIGFtb3VudCBUaGUgdW5pdHMgb2YgdGhlIGFzc2V0IHRvIG1pbnRcbiAgICAgKiBAcGFyYW0gYXNzZXRJRCBUaGUgSUQgb2YgdGhlIGFzc2V0IHRvIG1pbnRcbiAgICAgKiBAcGFyYW0gdG8gVGhlIGFkZHJlc3MgdG8gYXNzaWduIHRoZSB1bml0cyBvZiB0aGUgbWludGVkIGFzc2V0XG4gICAgICogQHBhcmFtIG1pbnRlcnMgQWRkcmVzc2VzIG9mIHRoZSBtaW50ZXJzIHJlc3BvbnNpYmxlIGZvciBzaWduaW5nIHRoZSB0cmFuc2FjdGlvblxuICAgICAqXG4gICAgICogQHJldHVybnMgUmV0dXJucyBhIFByb21pc2U8c3RyaW5nPiBjb250YWluaW5nIHRoZSBiYXNlIDU4IHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgdW5zaWduZWQgdHJhbnNhY3Rpb24uXG4gICAgICovXG4gIG1pbnQgPSBhc3luYyAodXNlcm5hbWU6c3RyaW5nLCBwYXNzd29yZDpzdHJpbmcsIGFtb3VudDpudW1iZXIgfCBCTiwgYXNzZXRJRDpCdWZmZXIgfCBzdHJpbmcsIHRvOnN0cmluZywgbWludGVyczpBcnJheTxzdHJpbmc+KTpQcm9taXNlPHN0cmluZz4gPT4ge1xuICAgIGxldCBhc3NldDpzdHJpbmc7XG4gICAgbGV0IGFtbnQ6Qk47XG4gICAgaWYgKHR5cGVvZiBhc3NldElEICE9PSAnc3RyaW5nJykge1xuICAgICAgYXNzZXQgPSBiaW50b29scy5jYjU4RW5jb2RlKGFzc2V0SUQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBhc3NldCA9IGFzc2V0SUQ7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgYW1vdW50ID09PSAnbnVtYmVyJykge1xuICAgICAgYW1udCA9IG5ldyBCTihhbW91bnQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBhbW50ID0gYW1vdW50O1xuICAgIH1cbiAgICBjb25zdCBwYXJhbXM6YW55ID0ge1xuICAgICAgdXNlcm5hbWU6IHVzZXJuYW1lLFxuICAgICAgcGFzc3dvcmQ6IHBhc3N3b3JkLFxuICAgICAgYW1vdW50OiBhbW50LnRvU3RyaW5nKDEwKSxcbiAgICAgIGFzc2V0SUQ6IGFzc2V0LFxuICAgICAgdG8sXG4gICAgICBtaW50ZXJzXG4gICAgfTtcbiAgICByZXR1cm4gdGhpcy5jYWxsTWV0aG9kKCdhdm0ubWludCcsIHBhcmFtcykudGhlbigocmVzcG9uc2U6UmVxdWVzdFJlc3BvbnNlRGF0YSkgPT4gcmVzcG9uc2UuZGF0YS5yZXN1bHQudHhJRCk7XG4gIH07XG5cbiAgLyoqXG4gICAgICogRXhwb3J0cyB0aGUgcHJpdmF0ZSBrZXkgZm9yIGFuIGFkZHJlc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdXNlcm5hbWUgVGhlIG5hbWUgb2YgdGhlIHVzZXIgd2l0aCB0aGUgcHJpdmF0ZSBrZXlcbiAgICAgKiBAcGFyYW0gcGFzc3dvcmQgVGhlIHBhc3N3b3JkIHVzZWQgdG8gZGVjcnlwdCB0aGUgcHJpdmF0ZSBrZXlcbiAgICAgKiBAcGFyYW0gYWRkcmVzcyBUaGUgYWRkcmVzcyB3aG9zZSBwcml2YXRlIGtleSBzaG91bGQgYmUgZXhwb3J0ZWRcbiAgICAgKlxuICAgICAqIEByZXR1cm5zIFByb21pc2Ugd2l0aCB0aGUgZGVjcnlwdGVkIHByaXZhdGUga2V5IGFzIHN0b3JlIGluIHRoZSBkYXRhYmFzZVxuICAgICAqL1xuICBleHBvcnRLZXkgPSBhc3luYyAodXNlcm5hbWU6c3RyaW5nLCBwYXNzd29yZDpzdHJpbmcsIGFkZHJlc3M6c3RyaW5nKTpQcm9taXNlPHN0cmluZz4gPT4ge1xuICAgIGlmICh0eXBlb2YgdGhpcy5wYXJzZUFkZHJlc3MoYWRkcmVzcykgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBFcnJvciAtIEFWTUFQSS5leHBvcnRLZXk6IEludmFsaWQgYWRkcmVzcyBmb3JtYXQgJHthZGRyZXNzfWApO1xuICAgIH1cbiAgICBjb25zdCBwYXJhbXM6YW55ID0ge1xuICAgICAgdXNlcm5hbWUsXG4gICAgICBwYXNzd29yZCxcbiAgICAgIGFkZHJlc3MsXG4gICAgfTtcbiAgICByZXR1cm4gdGhpcy5jYWxsTWV0aG9kKCdhdm0uZXhwb3J0S2V5JywgcGFyYW1zKS50aGVuKChyZXNwb25zZTpSZXF1ZXN0UmVzcG9uc2VEYXRhKSA9PiByZXNwb25zZS5kYXRhLnJlc3VsdC5wcml2YXRlS2V5KTtcbiAgfTtcblxuICAvKipcbiAgICAgKiBJbXBvcnRzIGEgcHJpdmF0ZSBrZXkgaW50byB0aGUgbm9kZSdzIGtleXN0b3JlIHVuZGVyIGFuIHVzZXIgYW5kIGZvciBhIGJsb2NrY2hhaW4uXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdXNlcm5hbWUgVGhlIG5hbWUgb2YgdGhlIHVzZXIgdG8gc3RvcmUgdGhlIHByaXZhdGUga2V5XG4gICAgICogQHBhcmFtIHBhc3N3b3JkIFRoZSBwYXNzd29yZCB0aGF0IHVubG9ja3MgdGhlIHVzZXJcbiAgICAgKiBAcGFyYW0gcHJpdmF0ZUtleSBBIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIHByaXZhdGUga2V5IGluIHRoZSB2bSdzIGZvcm1hdFxuICAgICAqXG4gICAgICogQHJldHVybnMgVGhlIGFkZHJlc3MgZm9yIHRoZSBpbXBvcnRlZCBwcml2YXRlIGtleS5cbiAgICAgKi9cbiAgaW1wb3J0S2V5ID0gYXN5bmMgKHVzZXJuYW1lOnN0cmluZywgcGFzc3dvcmQ6c3RyaW5nLCBwcml2YXRlS2V5OnN0cmluZyk6UHJvbWlzZTxzdHJpbmc+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6YW55ID0ge1xuICAgICAgdXNlcm5hbWUsXG4gICAgICBwYXNzd29yZCxcbiAgICAgIHByaXZhdGVLZXksXG4gICAgfTtcbiAgICByZXR1cm4gdGhpcy5jYWxsTWV0aG9kKCdhdm0uaW1wb3J0S2V5JywgcGFyYW1zKS50aGVuKChyZXNwb25zZTpSZXF1ZXN0UmVzcG9uc2VEYXRhKSA9PiByZXNwb25zZS5kYXRhLnJlc3VsdC5hZGRyZXNzKTtcbiAgfTtcblxuICAvKipcbiAgICAqIFNlbmQgQU5UIChBdmFsYW5jaGUgTmF0aXZlIFRva2VuKSBhc3NldHMgaW5jbHVkaW5nIEFWQVggZnJvbSB0aGUgWC1DaGFpbiB0byBhbiBhY2NvdW50IG9uIHRoZSBQLUNoYWluIG9yIEMtQ2hhaW4uXG4gICAgKlxuICAgICogQWZ0ZXIgY2FsbGluZyB0aGlzIG1ldGhvZCwgeW91IG11c3QgY2FsbCB0aGUgUC1DaGFpbidzIGBpbXBvcnRBVkFYYCBvciB0aGUgQy1DaGFpbuKAmXMgYGltcG9ydGAgbWV0aG9kIHRvIGNvbXBsZXRlIHRoZSB0cmFuc2Zlci5cbiAgICAqXG4gICAgKiBAcGFyYW0gdXNlcm5hbWUgVGhlIEtleXN0b3JlIHVzZXIgdGhhdCBjb250cm9scyB0aGUgUC1DaGFpbiBvciBDLUNoYWluIGFjY291bnQgc3BlY2lmaWVkIGluIGB0b2BcbiAgICAqIEBwYXJhbSBwYXNzd29yZCBUaGUgcGFzc3dvcmQgb2YgdGhlIEtleXN0b3JlIHVzZXJcbiAgICAqIEBwYXJhbSB0byBUaGUgYWNjb3VudCBvbiB0aGUgUC1DaGFpbiBvciBDLUNoYWluIHRvIHNlbmQgdGhlIGFzc2V0IHRvLiBcbiAgICAqIEBwYXJhbSBhbW91bnQgQW1vdW50IG9mIGFzc2V0IHRvIGV4cG9ydCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAgKiBAcGFyYW0gYXNzZXRJRCBUaGUgYXNzZXQgaWQgd2hpY2ggaXMgYmVpbmcgc2VudFxuICAgICpcbiAgICAqIEByZXR1cm5zIFN0cmluZyByZXByZXNlbnRpbmcgdGhlIHRyYW5zYWN0aW9uIGlkXG4gICAgKi9cbiAgZXhwb3J0ID0gYXN5bmMgKHVzZXJuYW1lOiBzdHJpbmcsIHBhc3N3b3JkOiBzdHJpbmcsIHRvOiBzdHJpbmcsIGFtb3VudDogQk4sIGFzc2V0SUQ6IHN0cmluZyk6UHJvbWlzZTxzdHJpbmc+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6IGFueSA9IHtcbiAgICAgIHRvLFxuICAgICAgYW1vdW50OiBhbW91bnQudG9TdHJpbmcoMTApLFxuICAgICAgdXNlcm5hbWUsXG4gICAgICBwYXNzd29yZCxcbiAgICAgIGFzc2V0SURcbiAgICB9O1xuICAgIHJldHVybiB0aGlzLmNhbGxNZXRob2QoJ2F2bS5leHBvcnQnLCBwYXJhbXMpLnRoZW4oKHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhKSA9PiByZXNwb25zZS5kYXRhLnJlc3VsdC50eElEKTtcbiAgfTtcblxuICAvKipcbiAgICAgKiBTZW5kIEFWQVggZnJvbSB0aGUgWC1DaGFpbiB0byBhbiBhY2NvdW50IG9uIHRoZSBQLUNoYWluIG9yIEMtQ2hhaW4uXG4gICAgICpcbiAgICAgKiBBZnRlciBjYWxsaW5nIHRoaXMgbWV0aG9kLCB5b3UgbXVzdCBjYWxsIHRoZSBQLUNoYWlu4oCZcyBvciBDLUNoYWluJ3MgaW1wb3J0QVZBWCBtZXRob2QgdG8gY29tcGxldGUgdGhlIHRyYW5zZmVyLlxuICAgICAqXG4gICAgICogQHBhcmFtIHVzZXJuYW1lIFRoZSBLZXlzdG9yZSB1c2VyIHRoYXQgY29udHJvbHMgdGhlIFAtQ2hhaW4gYWNjb3VudCBzcGVjaWZpZWQgaW4gYHRvYFxuICAgICAqIEBwYXJhbSBwYXNzd29yZCBUaGUgcGFzc3dvcmQgb2YgdGhlIEtleXN0b3JlIHVzZXJcbiAgICAgKiBAcGFyYW0gdG8gVGhlIGFjY291bnQgb24gdGhlIFAtQ2hhaW4gb3IgQy1DaGFpbiB0byBzZW5kIHRoZSBBVkFYIHRvLlxuICAgICAqIEBwYXJhbSBhbW91bnQgQW1vdW50IG9mIEFWQVggdG8gZXhwb3J0IGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIFN0cmluZyByZXByZXNlbnRpbmcgdGhlIHRyYW5zYWN0aW9uIGlkXG4gICAgICovXG4gIGV4cG9ydEFWQVggPSBhc3luYyAodXNlcm5hbWU6c3RyaW5nLCBwYXNzd29yZDpzdHJpbmcsIHRvOnN0cmluZywgYW1vdW50OkJOKTpQcm9taXNlPHN0cmluZz4gPT4ge1xuICAgIGNvbnN0IHBhcmFtczphbnkgPSB7XG4gICAgICB0byxcbiAgICAgIGFtb3VudDogYW1vdW50LnRvU3RyaW5nKDEwKSxcbiAgICAgIHVzZXJuYW1lLFxuICAgICAgcGFzc3dvcmQsXG4gICAgfTtcbiAgICByZXR1cm4gdGhpcy5jYWxsTWV0aG9kKCdhdm0uZXhwb3J0QVZBWCcsIHBhcmFtcykudGhlbigocmVzcG9uc2U6UmVxdWVzdFJlc3BvbnNlRGF0YSkgPT4gcmVzcG9uc2UuZGF0YS5yZXN1bHQudHhJRCk7XG4gIH07XG5cbiAgLyoqXG4gICAqIFNlbmQgQU5UIChBdmFsYW5jaGUgTmF0aXZlIFRva2VuKSBhc3NldHMgaW5jbHVkaW5nIEFWQVggZnJvbSBhbiBhY2NvdW50IG9uIHRoZSBQLUNoYWluIG9yIEMtQ2hhaW4gdG8gYW4gYWRkcmVzcyBvbiB0aGUgWC1DaGFpbi4gVGhpcyB0cmFuc2FjdGlvblxuICAgKiBtdXN0IGJlIHNpZ25lZCB3aXRoIHRoZSBrZXkgb2YgdGhlIGFjY291bnQgdGhhdCB0aGUgYXNzZXQgaXMgc2VudCBmcm9tIGFuZCB3aGljaCBwYXlzXG4gICAqIHRoZSB0cmFuc2FjdGlvbiBmZWUuXG4gICAqXG4gICAqIEBwYXJhbSB1c2VybmFtZSBUaGUgS2V5c3RvcmUgdXNlciB0aGF0IGNvbnRyb2xzIHRoZSBhY2NvdW50IHNwZWNpZmllZCBpbiBgdG9gXG4gICAqIEBwYXJhbSBwYXNzd29yZCBUaGUgcGFzc3dvcmQgb2YgdGhlIEtleXN0b3JlIHVzZXJcbiAgICogQHBhcmFtIHRvIFRoZSBhZGRyZXNzIG9mIHRoZSBhY2NvdW50IHRoZSBhc3NldCBpcyBzZW50IHRvLlxuICAgKiBAcGFyYW0gc291cmNlQ2hhaW4gVGhlIGNoYWluSUQgd2hlcmUgdGhlIGZ1bmRzIGFyZSBjb21pbmcgZnJvbS4gRXg6IFwiQ1wiXG4gICAqXG4gICAqIEByZXR1cm5zIFByb21pc2UgZm9yIGEgc3RyaW5nIGZvciB0aGUgdHJhbnNhY3Rpb24sIHdoaWNoIHNob3VsZCBiZSBzZW50IHRvIHRoZSBuZXR3b3JrXG4gICAqIGJ5IGNhbGxpbmcgaXNzdWVUeC5cbiAgICovXG4gIGltcG9ydCA9IGFzeW5jICh1c2VybmFtZTogc3RyaW5nLCBwYXNzd29yZDpzdHJpbmcsIHRvOnN0cmluZywgc291cmNlQ2hhaW46c3RyaW5nKVxuICA6UHJvbWlzZTxzdHJpbmc+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6YW55ID0ge1xuICAgICAgdG8sXG4gICAgICBzb3VyY2VDaGFpbixcbiAgICAgIHVzZXJuYW1lLFxuICAgICAgcGFzc3dvcmQsXG4gICAgfTtcbiAgICByZXR1cm4gdGhpcy5jYWxsTWV0aG9kKCdhdm0uaW1wb3J0JywgcGFyYW1zKVxuICAgICAgLnRoZW4oKHJlc3BvbnNlOlJlcXVlc3RSZXNwb25zZURhdGEpID0+IHJlc3BvbnNlLmRhdGEucmVzdWx0LnR4SUQpO1xuICB9O1xuXG4gIC8qKlxuICAgICAqIEZpbmFsaXplIGEgdHJhbnNmZXIgb2YgQVZBWCBmcm9tIHRoZSBQLUNoYWluIHRvIHRoZSBYLUNoYWluLlxuICAgICAqXG4gICAgICogQmVmb3JlIHRoaXMgbWV0aG9kIGlzIGNhbGxlZCwgeW91IG11c3QgY2FsbCB0aGUgUC1DaGFpbuKAmXMgYGV4cG9ydEFWQVhgIG1ldGhvZCB0byBpbml0aWF0ZSB0aGUgdHJhbnNmZXIuXG4gICAgICogQHBhcmFtIHVzZXJuYW1lIFRoZSBLZXlzdG9yZSB1c2VyIHRoYXQgY29udHJvbHMgdGhlIGFkZHJlc3Mgc3BlY2lmaWVkIGluIGB0b2BcbiAgICAgKiBAcGFyYW0gcGFzc3dvcmQgVGhlIHBhc3N3b3JkIG9mIHRoZSBLZXlzdG9yZSB1c2VyXG4gICAgICogQHBhcmFtIHRvIFRoZSBhZGRyZXNzIHRoZSBBVkFYIGlzIHNlbnQgdG8uIFRoaXMgbXVzdCBiZSB0aGUgc2FtZSBhcyB0aGUgdG8gYXJndW1lbnQgaW4gdGhlIGNvcnJlc3BvbmRpbmcgY2FsbCB0byB0aGUgUC1DaGFpbuKAmXMgZXhwb3J0QVZBWCwgZXhjZXB0IHRoYXQgdGhlIHByZXBlbmRlZCBYLSBzaG91bGQgYmUgaW5jbHVkZWQgaW4gdGhpcyBhcmd1bWVudFxuICAgICAqIEBwYXJhbSBzb3VyY2VDaGFpbiBDaGFpbiB0aGUgZnVuZHMgYXJlIGNvbWluZyBmcm9tLlxuICAgICAqXG4gICAgICogQHJldHVybnMgU3RyaW5nIHJlcHJlc2VudGluZyB0aGUgdHJhbnNhY3Rpb24gaWRcbiAgICAgKi9cbiAgaW1wb3J0QVZBWCA9IGFzeW5jICh1c2VybmFtZTpzdHJpbmcsIHBhc3N3b3JkOnN0cmluZywgdG86c3RyaW5nLCBzb3VyY2VDaGFpbjpzdHJpbmcpOlByb21pc2U8c3RyaW5nPiA9PiB7XG4gICAgY29uc3QgcGFyYW1zOmFueSA9IHtcbiAgICAgIHRvLFxuICAgICAgc291cmNlQ2hhaW4sXG4gICAgICB1c2VybmFtZSxcbiAgICAgIHBhc3N3b3JkLFxuICAgIH07XG4gICAgcmV0dXJuIHRoaXMuY2FsbE1ldGhvZCgnYXZtLmltcG9ydEFWQVgnLCBwYXJhbXMpLnRoZW4oKHJlc3BvbnNlOlJlcXVlc3RSZXNwb25zZURhdGEpID0+IHJlc3BvbnNlLmRhdGEucmVzdWx0LnR4SUQpO1xuICB9O1xuXG4gIC8qKlxuICAgICAqIExpc3RzIGFsbCB0aGUgYWRkcmVzc2VzIHVuZGVyIGEgdXNlci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB1c2VybmFtZSBUaGUgdXNlciB0byBsaXN0IGFkZHJlc3Nlc1xuICAgICAqIEBwYXJhbSBwYXNzd29yZCBUaGUgcGFzc3dvcmQgb2YgdGhlIHVzZXIgdG8gbGlzdCB0aGUgYWRkcmVzc2VzXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBQcm9taXNlIG9mIGFuIGFycmF5IG9mIGFkZHJlc3Mgc3RyaW5ncyBpbiB0aGUgZm9ybWF0IHNwZWNpZmllZCBieSB0aGUgYmxvY2tjaGFpbi5cbiAgICAgKi9cbiAgbGlzdEFkZHJlc3NlcyA9IGFzeW5jICh1c2VybmFtZTpzdHJpbmcsIHBhc3N3b3JkOnN0cmluZyk6IFByb21pc2U8QXJyYXk8c3RyaW5nPj4gPT4ge1xuICAgIGNvbnN0IHBhcmFtczphbnkgPSB7XG4gICAgICB1c2VybmFtZSxcbiAgICAgIHBhc3N3b3JkLFxuICAgIH07XG4gICAgcmV0dXJuIHRoaXMuY2FsbE1ldGhvZCgnYXZtLmxpc3RBZGRyZXNzZXMnLCBwYXJhbXMpLnRoZW4oKHJlc3BvbnNlOlJlcXVlc3RSZXNwb25zZURhdGEpID0+IHJlc3BvbnNlLmRhdGEucmVzdWx0LmFkZHJlc3Nlcyk7XG4gIH07XG5cbiAgLyoqXG4gICAgICogUmV0cmlldmVzIGFsbCBhc3NldHMgZm9yIGFuIGFkZHJlc3Mgb24gYSBzZXJ2ZXIgYW5kIHRoZWlyIGFzc29jaWF0ZWQgYmFsYW5jZXMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gYWRkcmVzcyBUaGUgYWRkcmVzcyB0byBnZXQgYSBsaXN0IG9mIGFzc2V0c1xuICAgICAqXG4gICAgICogQHJldHVybnMgUHJvbWlzZSBvZiBhbiBvYmplY3QgbWFwcGluZyBhc3NldElEIHN0cmluZ3Mgd2l0aCB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfSBiYWxhbmNlIGZvciB0aGUgYWRkcmVzcyBvbiB0aGUgYmxvY2tjaGFpbi5cbiAgICAgKi9cbiAgZ2V0QWxsQmFsYW5jZXMgPSBhc3luYyAoYWRkcmVzczpzdHJpbmcpOlByb21pc2U8QXJyYXk8b2JqZWN0Pj4gPT4ge1xuICAgIGlmICh0eXBlb2YgdGhpcy5wYXJzZUFkZHJlc3MoYWRkcmVzcykgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBFcnJvciAtIEFWTUFQSS5nZXRBbGxCYWxhbmNlczogSW52YWxpZCBhZGRyZXNzIGZvcm1hdCAke2FkZHJlc3N9YCk7XG4gICAgfVxuICAgIGNvbnN0IHBhcmFtczphbnkgPSB7XG4gICAgICBhZGRyZXNzLFxuICAgIH07XG4gICAgcmV0dXJuIHRoaXMuY2FsbE1ldGhvZCgnYXZtLmdldEFsbEJhbGFuY2VzJywgcGFyYW1zKS50aGVuKChyZXNwb25zZTpSZXF1ZXN0UmVzcG9uc2VEYXRhKSA9PiByZXNwb25zZS5kYXRhLnJlc3VsdC5iYWxhbmNlcyk7XG4gIH07XG5cbiAgLyoqXG4gICAgICogUmV0cmlldmVzIGFuIGFzc2V0cyBuYW1lIGFuZCBzeW1ib2wuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gYXNzZXRJRCBFaXRoZXIgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBvciBhbiBiNTggc2VyaWFsaXplZCBzdHJpbmcgZm9yIHRoZSBBc3NldElEIG9yIGl0cyBhbGlhcy5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIFJldHVybnMgYSBQcm9taXNlPG9iamVjdD4gd2l0aCBrZXlzIFwibmFtZVwiIGFuZCBcInN5bWJvbFwiLlxuICAgICAqL1xuICBnZXRBc3NldERlc2NyaXB0aW9uID0gYXN5bmMgKGFzc2V0SUQ6QnVmZmVyIHwgc3RyaW5nKTpQcm9taXNlPHtuYW1lOnN0cmluZztzeW1ib2w6c3RyaW5nO2Fzc2V0SUQ6QnVmZmVyO2Rlbm9taW5hdGlvbjpudW1iZXJ9PiA9PiB7XG4gICAgbGV0IGFzc2V0OnN0cmluZztcbiAgICBpZiAodHlwZW9mIGFzc2V0SUQgIT09ICdzdHJpbmcnKSB7XG4gICAgICBhc3NldCA9IGJpbnRvb2xzLmNiNThFbmNvZGUoYXNzZXRJRCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGFzc2V0ID0gYXNzZXRJRDtcbiAgICB9XG4gICAgY29uc3QgcGFyYW1zOmFueSA9IHtcbiAgICAgIGFzc2V0SUQ6IGFzc2V0LFxuICAgIH07XG4gICAgcmV0dXJuIHRoaXMuY2FsbE1ldGhvZCgnYXZtLmdldEFzc2V0RGVzY3JpcHRpb24nLCBwYXJhbXMpLnRoZW4oKHJlc3BvbnNlOlJlcXVlc3RSZXNwb25zZURhdGEpID0+ICh7XG4gICAgICBuYW1lOiByZXNwb25zZS5kYXRhLnJlc3VsdC5uYW1lLFxuICAgICAgc3ltYm9sOiByZXNwb25zZS5kYXRhLnJlc3VsdC5zeW1ib2wsXG4gICAgICBhc3NldElEOiBiaW50b29scy5jYjU4RGVjb2RlKHJlc3BvbnNlLmRhdGEucmVzdWx0LmFzc2V0SUQpLFxuICAgICAgZGVub21pbmF0aW9uOiBwYXJzZUludChyZXNwb25zZS5kYXRhLnJlc3VsdC5kZW5vbWluYXRpb24sIDEwKSxcbiAgICB9KSk7XG4gIH07XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIHRyZWFuc2FjdGlvbiBkYXRhIG9mIGEgcHJvdmlkZWQgdHJhbnNhY3Rpb24gSUQgYnkgY2FsbGluZyB0aGUgbm9kZSdzIGBnZXRUeGAgbWV0aG9kLlxuICAgKlxuICAgKiBAcGFyYW0gdHhpZCBUaGUgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSB0cmFuc2FjdGlvbiBJRFxuICAgKlxuICAgKiBAcmV0dXJucyBSZXR1cm5zIGEgUHJvbWlzZTxzdHJpbmc+IGNvbnRhaW5pbmcgdGhlIGJ5dGVzIHJldHJpZXZlZCBmcm9tIHRoZSBub2RlXG4gICAqL1xuICBnZXRUeCA9IGFzeW5jICh0eGlkOnN0cmluZyk6UHJvbWlzZTxzdHJpbmc+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6YW55ID0ge1xuICAgICAgdHhJRDogdHhpZCxcbiAgICB9O1xuICAgIHJldHVybiB0aGlzLmNhbGxNZXRob2QoJ2F2bS5nZXRUeCcsIHBhcmFtcykudGhlbigocmVzcG9uc2U6UmVxdWVzdFJlc3BvbnNlRGF0YSkgPT4gcmVzcG9uc2UuZGF0YS5yZXN1bHQudHgpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBzdGF0dXMgb2YgYSBwcm92aWRlZCB0cmFuc2FjdGlvbiBJRCBieSBjYWxsaW5nIHRoZSBub2RlJ3MgYGdldFR4U3RhdHVzYCBtZXRob2QuXG4gICAqXG4gICAqIEBwYXJhbSB0eGlkIFRoZSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIHRyYW5zYWN0aW9uIElEXG4gICAqXG4gICAqIEByZXR1cm5zIFJldHVybnMgYSBQcm9taXNlPHN0cmluZz4gY29udGFpbmluZyB0aGUgc3RhdHVzIHJldHJpZXZlZCBmcm9tIHRoZSBub2RlXG4gICAqL1xuICBnZXRUeFN0YXR1cyA9IGFzeW5jICh0eGlkOnN0cmluZyk6UHJvbWlzZTxzdHJpbmc+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6YW55ID0ge1xuICAgICAgdHhJRDogdHhpZCxcbiAgICB9O1xuICAgIHJldHVybiB0aGlzLmNhbGxNZXRob2QoJ2F2bS5nZXRUeFN0YXR1cycsIHBhcmFtcykudGhlbigocmVzcG9uc2U6UmVxdWVzdFJlc3BvbnNlRGF0YSkgPT4gcmVzcG9uc2UuZGF0YS5yZXN1bHQuc3RhdHVzKTtcbiAgfTtcblxuICAvKipcbiAgICogUmV0cmlldmVzIHRoZSBVVFhPcyByZWxhdGVkIHRvIHRoZSBhZGRyZXNzZXMgcHJvdmlkZWQgZnJvbSB0aGUgbm9kZSdzIGBnZXRVVFhPc2AgbWV0aG9kLlxuICAgKlxuICAgKiBAcGFyYW0gYWRkcmVzc2VzIEFuIGFycmF5IG9mIGFkZHJlc3NlcyBhcyBjYjU4IHN0cmluZ3Mgb3IgYWRkcmVzc2VzIGFzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9c1xuICAgKiBAcGFyYW0gc291cmNlQ2hhaW4gQSBzdHJpbmcgZm9yIHRoZSBjaGFpbiB0byBsb29rIGZvciB0aGUgVVRYTydzLiBEZWZhdWx0IGlzIHRvIHVzZSB0aGlzIGNoYWluLCBidXQgaWYgZXhwb3J0ZWQgVVRYT3MgZXhpc3QgZnJvbSBvdGhlciBjaGFpbnMsIHRoaXMgY2FuIHVzZWQgdG8gcHVsbCB0aGVtIGluc3RlYWQuXG4gICAqIEBwYXJhbSBsaW1pdCBPcHRpb25hbC4gUmV0dXJucyBhdCBtb3N0IFtsaW1pdF0gYWRkcmVzc2VzLiBJZiBbbGltaXRdID09IDAgb3IgPiBbbWF4VVRYT3NUb0ZldGNoXSwgZmV0Y2hlcyB1cCB0byBbbWF4VVRYT3NUb0ZldGNoXS5cbiAgICogQHBhcmFtIHN0YXJ0SW5kZXggT3B0aW9uYWwuIFtTdGFydEluZGV4XSBkZWZpbmVzIHdoZXJlIHRvIHN0YXJ0IGZldGNoaW5nIFVUWE9zIChmb3IgcGFnaW5hdGlvbi4pXG4gICAqIFVUWE9zIGZldGNoZWQgYXJlIGZyb20gYWRkcmVzc2VzIGVxdWFsIHRvIG9yIGdyZWF0ZXIgdGhhbiBbU3RhcnRJbmRleC5BZGRyZXNzXVxuICAgKiBGb3IgYWRkcmVzcyBbU3RhcnRJbmRleC5BZGRyZXNzXSwgb25seSBVVFhPcyB3aXRoIElEcyBncmVhdGVyIHRoYW4gW1N0YXJ0SW5kZXguVXR4b10gd2lsbCBiZSByZXR1cm5lZC5cbiAgICogQHBhcmFtIHBlcnNpc3RPcHRzIE9wdGlvbnMgYXZhaWxhYmxlIHRvIHBlcnNpc3QgdGhlc2UgVVRYT3MgaW4gbG9jYWwgc3RvcmFnZVxuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiBwZXJzaXN0T3B0cyBpcyBvcHRpb25hbCBhbmQgbXVzdCBiZSBvZiB0eXBlIFtbUGVyc2lzdGFuY2VPcHRpb25zXV1cbiAgICpcbiAgICovXG4gIGdldFVUWE9zID0gYXN5bmMgKFxuICAgIGFkZHJlc3NlczpBcnJheTxzdHJpbmc+IHwgc3RyaW5nLFxuICAgIHNvdXJjZUNoYWluOnN0cmluZyA9IHVuZGVmaW5lZCxcbiAgICBsaW1pdDpudW1iZXIgPSAwLFxuICAgIHN0YXJ0SW5kZXg6e2FkZHJlc3M6c3RyaW5nLCB1dHhvOnN0cmluZ30gPSB1bmRlZmluZWQsXG4gICAgcGVyc2lzdE9wdHM6UGVyc2lzdGFuY2VPcHRpb25zID0gdW5kZWZpbmVkXG4gICk6UHJvbWlzZTx7XG4gICAgbnVtRmV0Y2hlZDpudW1iZXIsXG4gICAgdXR4b3M6VVRYT1NldCxcbiAgICBlbmRJbmRleDp7YWRkcmVzczpzdHJpbmcsIHV0eG86c3RyaW5nfVxuICB9PiA9PiB7XG4gICAgXG4gICAgaWYodHlwZW9mIGFkZHJlc3NlcyA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgYWRkcmVzc2VzID0gW2FkZHJlc3Nlc107XG4gICAgfVxuXG4gICAgY29uc3QgcGFyYW1zOmFueSA9IHtcbiAgICAgIGFkZHJlc3NlczogYWRkcmVzc2VzLFxuICAgICAgbGltaXRcbiAgICB9O1xuICAgIGlmKHR5cGVvZiBzdGFydEluZGV4ICE9PSBcInVuZGVmaW5lZFwiICYmIHN0YXJ0SW5kZXgpIHtcbiAgICAgIHBhcmFtcy5zdGFydEluZGV4ID0gc3RhcnRJbmRleDtcbiAgICB9XG5cbiAgICBpZih0eXBlb2Ygc291cmNlQ2hhaW4gIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHBhcmFtcy5zb3VyY2VDaGFpbiA9IHNvdXJjZUNoYWluO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmNhbGxNZXRob2QoJ2F2bS5nZXRVVFhPcycsIHBhcmFtcykudGhlbigocmVzcG9uc2U6UmVxdWVzdFJlc3BvbnNlRGF0YSkgPT4ge1xuXG4gICAgICBjb25zdCB1dHhvczpVVFhPU2V0ID0gbmV3IFVUWE9TZXQoKTtcbiAgICAgIGxldCBkYXRhID0gcmVzcG9uc2UuZGF0YS5yZXN1bHQudXR4b3M7XG4gICAgICBpZiAocGVyc2lzdE9wdHMgJiYgdHlwZW9mIHBlcnNpc3RPcHRzID09PSAnb2JqZWN0Jykge1xuICAgICAgICBpZiAodGhpcy5kYi5oYXMocGVyc2lzdE9wdHMuZ2V0TmFtZSgpKSkge1xuICAgICAgICAgIGNvbnN0IHNlbGZBcnJheTpBcnJheTxzdHJpbmc+ID0gdGhpcy5kYi5nZXQocGVyc2lzdE9wdHMuZ2V0TmFtZSgpKTtcbiAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShzZWxmQXJyYXkpKSB7XG4gICAgICAgICAgICB1dHhvcy5hZGRBcnJheShkYXRhKTtcbiAgICAgICAgICAgIGNvbnN0IHNlbGY6VVRYT1NldCA9IG5ldyBVVFhPU2V0KCk7XG4gICAgICAgICAgICBzZWxmLmFkZEFycmF5KHNlbGZBcnJheSk7XG4gICAgICAgICAgICBzZWxmLm1lcmdlQnlSdWxlKHV0eG9zLCBwZXJzaXN0T3B0cy5nZXRNZXJnZVJ1bGUoKSk7XG4gICAgICAgICAgICBkYXRhID0gc2VsZi5nZXRBbGxVVFhPU3RyaW5ncygpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLmRiLnNldChwZXJzaXN0T3B0cy5nZXROYW1lKCksIGRhdGEsIHBlcnNpc3RPcHRzLmdldE92ZXJ3cml0ZSgpKTtcbiAgICAgIH1cbiAgICAgIHV0eG9zLmFkZEFycmF5KGRhdGEsIGZhbHNlKTtcbiAgICAgIHJlc3BvbnNlLmRhdGEucmVzdWx0LnV0eG9zID0gdXR4b3M7XG4gICAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQ7XG4gICAgfSk7XG4gIH07XG5cbiAgLyoqXG4gICAqIEhlbHBlciBmdW5jdGlvbiB3aGljaCBjcmVhdGVzIGFuIHVuc2lnbmVkIHRyYW5zYWN0aW9uLiBGb3IgbW9yZSBncmFudWxhciBjb250cm9sLCB5b3UgbWF5IGNyZWF0ZSB5b3VyIG93blxuICAgKiBbW1Vuc2lnbmVkVHhdXSBtYW51YWxseSAod2l0aCB0aGVpciBjb3JyZXNwb25kaW5nIFtbVHJhbnNmZXJhYmxlSW5wdXRdXXMsIFtbVHJhbnNmZXJhYmxlT3V0cHV0XV1zLCBhbmQgW1tUcmFuc2Zlck9wZXJhdGlvbl1dcykuXG4gICAqXG4gICAqIEBwYXJhbSB1dHhvc2V0IEEgc2V0IG9mIFVUWE9zIHRoYXQgdGhlIHRyYW5zYWN0aW9uIGlzIGJ1aWx0IG9uXG4gICAqIEBwYXJhbSBhbW91bnQgVGhlIGFtb3VudCBvZiBBc3NldElEIHRvIGJlIHNwZW50IGluIGl0cyBzbWFsbGVzdCBkZW5vbWluYXRpb24sIHJlcHJlc2VudGVkIGFzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59LlxuICAgKiBAcGFyYW0gYXNzZXRJRCBUaGUgYXNzZXRJRCBvZiB0aGUgdmFsdWUgYmVpbmcgc2VudFxuICAgKiBAcGFyYW0gdG9BZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyB0byBzZW5kIHRoZSBmdW5kc1xuICAgKiBAcGFyYW0gZnJvbUFkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIGJlaW5nIHVzZWQgdG8gc2VuZCB0aGUgZnVuZHMgZnJvbSB0aGUgVVRYT3MgcHJvdmlkZWRcbiAgICogQHBhcmFtIGNoYW5nZUFkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIHRoYXQgY2FuIHNwZW5kIHRoZSBjaGFuZ2UgcmVtYWluaW5nIGZyb20gdGhlIHNwZW50IFVUWE9zXG4gICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsIENCNTggQnVmZmVyIG9yIFN0cmluZyB3aGljaCBjb250YWlucyBhcmJpdHJhcnkgYnl0ZXMsIHVwIHRvIDI1NiBieXRlc1xuICAgKiBAcGFyYW0gYXNPZiBPcHRpb25hbC4gVGhlIHRpbWVzdGFtcCB0byB2ZXJpZnkgdGhlIHRyYW5zYWN0aW9uIGFnYWluc3QgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKiBAcGFyYW0gbG9ja3RpbWUgT3B0aW9uYWwuIFRoZSBsb2NrdGltZSBmaWVsZCBjcmVhdGVkIGluIHRoZSByZXN1bHRpbmcgb3V0cHV0c1xuICAgKiBAcGFyYW0gdGhyZXNob2xkIE9wdGlvbmFsLiBUaGUgbnVtYmVyIG9mIHNpZ25hdHVyZXMgcmVxdWlyZWQgdG8gc3BlbmQgdGhlIGZ1bmRzIGluIHRoZSByZXN1bHRhbnQgVVRYT1xuICAgKlxuICAgKiBAcmV0dXJucyBBbiB1bnNpZ25lZCB0cmFuc2FjdGlvbiAoW1tVbnNpZ25lZFR4XV0pIHdoaWNoIGNvbnRhaW5zIGEgW1tCYXNlVHhdXS5cbiAgICpcbiAgICogQHJlbWFya3NcbiAgICogVGhpcyBoZWxwZXIgZXhpc3RzIGJlY2F1c2UgdGhlIGVuZHBvaW50IEFQSSBzaG91bGQgYmUgdGhlIHByaW1hcnkgcG9pbnQgb2YgZW50cnkgZm9yIG1vc3QgZnVuY3Rpb25hbGl0eS5cbiAgICovXG4gIGJ1aWxkQmFzZVR4ID0gYXN5bmMgKFxuICAgIHV0eG9zZXQ6VVRYT1NldCwgXG4gICAgYW1vdW50OkJOLCBcbiAgICBhc3NldElEOkJ1ZmZlciB8IHN0cmluZyA9IHVuZGVmaW5lZCwgXG4gICAgdG9BZGRyZXNzZXM6QXJyYXk8c3RyaW5nPiwgXG4gICAgZnJvbUFkZHJlc3NlczpBcnJheTxzdHJpbmc+LFxuICAgIGNoYW5nZUFkZHJlc3NlczpBcnJheTxzdHJpbmc+LCBcbiAgICBtZW1vOlBheWxvYWRCYXNlfEJ1ZmZlciA9IHVuZGVmaW5lZCwgXG4gICAgYXNPZjpCTiA9IFVuaXhOb3coKSxcbiAgICBsb2NrdGltZTpCTiA9IG5ldyBCTigwKSwgXG4gICAgdGhyZXNob2xkOm51bWJlciA9IDFcbiAgKTpQcm9taXNlPFVuc2lnbmVkVHg+ID0+IHtcbiAgICBjb25zdCB0bzpBcnJheTxCdWZmZXI+ID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXkodG9BZGRyZXNzZXMsICdidWlsZEJhc2VUeCcpLm1hcCgoYSkgPT4gYmludG9vbHMuc3RyaW5nVG9BZGRyZXNzKGEpKTtcbiAgICBjb25zdCBmcm9tOkFycmF5PEJ1ZmZlcj4gPSB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheShmcm9tQWRkcmVzc2VzLCAnYnVpbGRCYXNlVHgnKS5tYXAoKGEpID0+IGJpbnRvb2xzLnN0cmluZ1RvQWRkcmVzcyhhKSk7XG4gICAgY29uc3QgY2hhbmdlOkFycmF5PEJ1ZmZlcj4gPSB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheShjaGFuZ2VBZGRyZXNzZXMsICdidWlsZEJhc2VUeCcpLm1hcCgoYSkgPT4gYmludG9vbHMuc3RyaW5nVG9BZGRyZXNzKGEpKTtcblxuICAgIGlmICh0eXBlb2YgYXNzZXRJRCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGFzc2V0SUQgPSBiaW50b29scy5jYjU4RGVjb2RlKGFzc2V0SUQpO1xuICAgIH1cblxuICAgIGlmKCBtZW1vIGluc3RhbmNlb2YgUGF5bG9hZEJhc2UpIHtcbiAgICAgIG1lbW8gPSBtZW1vLmdldFBheWxvYWQoKTtcbiAgICB9XG5cbiAgICBjb25zdCBidWlsdFVuc2lnbmVkVHg6VW5zaWduZWRUeCA9IHV0eG9zZXQuYnVpbGRCYXNlVHgoXG4gICAgICB0aGlzLmNvcmUuZ2V0TmV0d29ya0lEKCksIFxuICAgICAgYmludG9vbHMuY2I1OERlY29kZSh0aGlzLmJsb2NrY2hhaW5JRCksXG4gICAgICBhbW91bnQsIFxuICAgICAgYXNzZXRJRCwgXG4gICAgICB0bywgXG4gICAgICBmcm9tLCBcbiAgICAgIGNoYW5nZSwgXG4gICAgICB0aGlzLmdldFR4RmVlKCksIFxuICAgICAgYXdhaXQgdGhpcy5nZXRBVkFYQXNzZXRJRCgpLFxuICAgICAgbWVtbywgYXNPZiwgbG9ja3RpbWUsIHRocmVzaG9sZCxcbiAgICApO1xuXG4gICAgaWYoISBhd2FpdCB0aGlzLmNoZWNrR29vc2VFZ2coYnVpbHRVbnNpZ25lZFR4KSkge1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkZhaWxlZCBHb29zZSBFZ2cgQ2hlY2tcIik7XG4gICAgfVxuXG4gICAgcmV0dXJuIGJ1aWx0VW5zaWduZWRUeDtcbiAgfTtcblxuICAvKipcbiAgICogSGVscGVyIGZ1bmN0aW9uIHdoaWNoIGNyZWF0ZXMgYW4gdW5zaWduZWQgTkZUIFRyYW5zZmVyLiBGb3IgbW9yZSBncmFudWxhciBjb250cm9sLCB5b3UgbWF5IGNyZWF0ZSB5b3VyIG93blxuICAgKiBbW1Vuc2lnbmVkVHhdXSBtYW51YWxseSAod2l0aCB0aGVpciBjb3JyZXNwb25kaW5nIFtbVHJhbnNmZXJhYmxlSW5wdXRdXXMsIFtbVHJhbnNmZXJhYmxlT3V0cHV0XV1zLCBhbmQgW1tUcmFuc2Zlck9wZXJhdGlvbl1dcykuXG4gICAqXG4gICAqIEBwYXJhbSB1dHhvc2V0ICBBIHNldCBvZiBVVFhPcyB0aGF0IHRoZSB0cmFuc2FjdGlvbiBpcyBidWlsdCBvblxuICAgKiBAcGFyYW0gdG9BZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyB0byBzZW5kIHRoZSBORlRcbiAgICogQHBhcmFtIGZyb21BZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyBiZWluZyB1c2VkIHRvIHNlbmQgdGhlIE5GVCBmcm9tIHRoZSB1dHhvSUQgcHJvdmlkZWRcbiAgICogQHBhcmFtIGNoYW5nZUFkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIHRoYXQgY2FuIHNwZW5kIHRoZSBjaGFuZ2UgcmVtYWluaW5nIGZyb20gdGhlIHNwZW50IFVUWE9zXG4gICAqIEBwYXJhbSB1dHhvaWQgQSBiYXNlNTggdXR4b0lEIG9yIGFuIGFycmF5IG9mIGJhc2U1OCB1dHhvSURzIGZvciB0aGUgbmZ0cyB0aGlzIHRyYW5zYWN0aW9uIGlzIHNlbmRpbmdcbiAgICogQHBhcmFtIG1lbW8gT3B0aW9uYWwgQ0I1OCBCdWZmZXIgb3IgU3RyaW5nIHdoaWNoIGNvbnRhaW5zIGFyYml0cmFyeSBieXRlcywgdXAgdG8gMjU2IGJ5dGVzXG4gICAqIEBwYXJhbSBhc09mIE9wdGlvbmFsLiBUaGUgdGltZXN0YW1wIHRvIHZlcmlmeSB0aGUgdHJhbnNhY3Rpb24gYWdhaW5zdCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqIEBwYXJhbSBsb2NrdGltZSBPcHRpb25hbC4gVGhlIGxvY2t0aW1lIGZpZWxkIGNyZWF0ZWQgaW4gdGhlIHJlc3VsdGluZyBvdXRwdXRzXG4gICAqIEBwYXJhbSB0aHJlc2hvbGQgT3B0aW9uYWwuIFRoZSBudW1iZXIgb2Ygc2lnbmF0dXJlcyByZXF1aXJlZCB0byBzcGVuZCB0aGUgZnVuZHMgaW4gdGhlIHJlc3VsdGFudCBVVFhPXG4gICAqXG4gICAqIEByZXR1cm5zIEFuIHVuc2lnbmVkIHRyYW5zYWN0aW9uIChbW1Vuc2lnbmVkVHhdXSkgd2hpY2ggY29udGFpbnMgYSBbW05GVFRyYW5zZmVyVHhdXS5cbiAgICpcbiAgICogQHJlbWFya3NcbiAgICogVGhpcyBoZWxwZXIgZXhpc3RzIGJlY2F1c2UgdGhlIGVuZHBvaW50IEFQSSBzaG91bGQgYmUgdGhlIHByaW1hcnkgcG9pbnQgb2YgZW50cnkgZm9yIG1vc3QgZnVuY3Rpb25hbGl0eS5cbiAgICovXG4gIGJ1aWxkTkZUVHJhbnNmZXJUeCA9IGFzeW5jIChcbiAgICB1dHhvc2V0OlVUWE9TZXQsIFxuICAgIHRvQWRkcmVzc2VzOkFycmF5PHN0cmluZz4sIFxuICAgIGZyb21BZGRyZXNzZXM6QXJyYXk8c3RyaW5nPiwgXG4gICAgY2hhbmdlQWRkcmVzc2VzOkFycmF5PHN0cmluZz4sIFxuICAgIHV0eG9pZDpzdHJpbmcgfCBBcnJheTxzdHJpbmc+LCBcbiAgICBtZW1vOlBheWxvYWRCYXNlfEJ1ZmZlciA9IHVuZGVmaW5lZCwgXG4gICAgYXNPZjpCTiA9IFVuaXhOb3coKSwgXG4gICAgbG9ja3RpbWU6Qk4gPSBuZXcgQk4oMCksIFxuICAgIHRocmVzaG9sZDpudW1iZXIgPSAxLFxuICApOlByb21pc2U8VW5zaWduZWRUeD4gPT4ge1xuICAgIGNvbnN0IHRvOkFycmF5PEJ1ZmZlcj4gPSB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheSh0b0FkZHJlc3NlcywgJ2J1aWxkTkZUVHJhbnNmZXJUeCcpLm1hcCgoYSkgPT4gYmludG9vbHMuc3RyaW5nVG9BZGRyZXNzKGEpKTtcbiAgICBjb25zdCBmcm9tOkFycmF5PEJ1ZmZlcj4gPSB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheShmcm9tQWRkcmVzc2VzLCAnYnVpbGRORlRUcmFuc2ZlclR4JykubWFwKChhKSA9PiBiaW50b29scy5zdHJpbmdUb0FkZHJlc3MoYSkpO1xuICAgIGNvbnN0IGNoYW5nZTpBcnJheTxCdWZmZXI+ID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXkoY2hhbmdlQWRkcmVzc2VzLCBcImJ1aWxkQ3JlYXRlTkZUQXNzZXRUeFwiKS5tYXAoYSA9PiBiaW50b29scy5zdHJpbmdUb0FkZHJlc3MoYSkpO1xuXG4gICAgaWYoIG1lbW8gaW5zdGFuY2VvZiBQYXlsb2FkQmFzZSkge1xuICAgICAgbWVtbyA9IG1lbW8uZ2V0UGF5bG9hZCgpO1xuICAgIH1cbiAgICBjb25zdCBhdmF4QXNzZXRJRDpCdWZmZXIgPSBhd2FpdCB0aGlzLmdldEFWQVhBc3NldElEKCk7XG5cbiAgICBsZXQgdXR4b2lkQXJyYXk6QXJyYXk8c3RyaW5nPiA9IFtdO1xuICAgIGlmICh0eXBlb2YgdXR4b2lkID09PSAnc3RyaW5nJykge1xuICAgICAgdXR4b2lkQXJyYXkgPSBbdXR4b2lkXTtcbiAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkodXR4b2lkKSkge1xuICAgICAgdXR4b2lkQXJyYXkgPSB1dHhvaWQ7XG4gICAgfVxuXG4gICAgY29uc3QgYnVpbHRVbnNpZ25lZFR4OlVuc2lnbmVkVHggPSB1dHhvc2V0LmJ1aWxkTkZUVHJhbnNmZXJUeChcbiAgICAgIHRoaXMuY29yZS5nZXROZXR3b3JrSUQoKSwgXG4gICAgICBiaW50b29scy5jYjU4RGVjb2RlKHRoaXMuYmxvY2tjaGFpbklEKSwgXG4gICAgICB0bywgXG4gICAgICBmcm9tLFxuICAgICAgY2hhbmdlLFxuICAgICAgdXR4b2lkQXJyYXksIFxuICAgICAgdGhpcy5nZXRUeEZlZSgpLFxuICAgICAgYXZheEFzc2V0SUQsIFxuICAgICAgbWVtbywgYXNPZiwgbG9ja3RpbWUsIHRocmVzaG9sZCxcbiAgICApO1xuXG4gICAgaWYoISBhd2FpdCB0aGlzLmNoZWNrR29vc2VFZ2coYnVpbHRVbnNpZ25lZFR4KSkge1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkZhaWxlZCBHb29zZSBFZ2cgQ2hlY2tcIik7XG4gICAgfVxuXG4gICAgcmV0dXJuIGJ1aWx0VW5zaWduZWRUeDtcbiAgfTtcblxuICAvKipcbiAgICogSGVscGVyIGZ1bmN0aW9uIHdoaWNoIGNyZWF0ZXMgYW4gdW5zaWduZWQgSW1wb3J0IFR4LiBGb3IgbW9yZSBncmFudWxhciBjb250cm9sLCB5b3UgbWF5IGNyZWF0ZSB5b3VyIG93blxuICAgKiBbW1Vuc2lnbmVkVHhdXSBtYW51YWxseSAod2l0aCB0aGVpciBjb3JyZXNwb25kaW5nIFtbVHJhbnNmZXJhYmxlSW5wdXRdXXMsIFtbVHJhbnNmZXJhYmxlT3V0cHV0XV1zLCBhbmQgW1tUcmFuc2Zlck9wZXJhdGlvbl1dcykuXG4gICAqXG4gICAqIEBwYXJhbSB1dHhvc2V0ICBBIHNldCBvZiBVVFhPcyB0aGF0IHRoZSB0cmFuc2FjdGlvbiBpcyBidWlsdCBvblxuICAgKiBAcGFyYW0gb3duZXJBZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyBiZWluZyB1c2VkIHRvIGltcG9ydFxuICAgKiBAcGFyYW0gc291cmNlQ2hhaW4gVGhlIGNoYWluaWQgZm9yIHdoZXJlIHRoZSBpbXBvcnQgaXMgY29taW5nIGZyb21cbiAgICogQHBhcmFtIHRvQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgdG8gc2VuZCB0aGUgZnVuZHNcbiAgICogQHBhcmFtIGZyb21BZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyBiZWluZyB1c2VkIHRvIHNlbmQgdGhlIGZ1bmRzIGZyb20gdGhlIFVUWE9zIHByb3ZpZGVkXG4gICAqIEBwYXJhbSBjaGFuZ2VBZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyB0aGF0IGNhbiBzcGVuZCB0aGUgY2hhbmdlIHJlbWFpbmluZyBmcm9tIHRoZSBzcGVudCBVVFhPc1xuICAgKiBAcGFyYW0gbWVtbyBPcHRpb25hbCBDQjU4IEJ1ZmZlciBvciBTdHJpbmcgd2hpY2ggY29udGFpbnMgYXJiaXRyYXJ5IGJ5dGVzLCB1cCB0byAyNTYgYnl0ZXNcbiAgICogQHBhcmFtIGFzT2YgT3B0aW9uYWwuIFRoZSB0aW1lc3RhbXAgdG8gdmVyaWZ5IHRoZSB0cmFuc2FjdGlvbiBhZ2FpbnN0IGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICogQHBhcmFtIGxvY2t0aW1lIE9wdGlvbmFsLiBUaGUgbG9ja3RpbWUgZmllbGQgY3JlYXRlZCBpbiB0aGUgcmVzdWx0aW5nIG91dHB1dHNcbiAgICogQHBhcmFtIHRocmVzaG9sZCBPcHRpb25hbC4gVGhlIG51bWJlciBvZiBzaWduYXR1cmVzIHJlcXVpcmVkIHRvIHNwZW5kIHRoZSBmdW5kcyBpbiB0aGUgcmVzdWx0YW50IFVUWE9cbiAgICpcbiAgICogQHJldHVybnMgQW4gdW5zaWduZWQgdHJhbnNhY3Rpb24gKFtbVW5zaWduZWRUeF1dKSB3aGljaCBjb250YWlucyBhIFtbSW1wb3J0VHhdXS5cbiAgICpcbiAgICogQHJlbWFya3NcbiAgICogVGhpcyBoZWxwZXIgZXhpc3RzIGJlY2F1c2UgdGhlIGVuZHBvaW50IEFQSSBzaG91bGQgYmUgdGhlIHByaW1hcnkgcG9pbnQgb2YgZW50cnkgZm9yIG1vc3QgZnVuY3Rpb25hbGl0eS5cbiAgICovXG4gIGJ1aWxkSW1wb3J0VHggPSBhc3luYyAoXG4gICAgdXR4b3NldDpVVFhPU2V0LCBcbiAgICBvd25lckFkZHJlc3NlczpBcnJheTxzdHJpbmc+LFxuICAgIHNvdXJjZUNoYWluOkJ1ZmZlciB8IHN0cmluZyxcbiAgICB0b0FkZHJlc3NlczpBcnJheTxzdHJpbmc+LCBcbiAgICBmcm9tQWRkcmVzc2VzOkFycmF5PHN0cmluZz4sXG4gICAgY2hhbmdlQWRkcmVzc2VzOkFycmF5PHN0cmluZz4gPSB1bmRlZmluZWQsXG4gICAgbWVtbzpQYXlsb2FkQmFzZXxCdWZmZXIgPSB1bmRlZmluZWQsIFxuICAgIGFzT2Y6Qk4gPSBVbml4Tm93KCksIFxuICAgIGxvY2t0aW1lOkJOID0gbmV3IEJOKDApLCBcbiAgICB0aHJlc2hvbGQ6bnVtYmVyID0gMVxuICApOlByb21pc2U8VW5zaWduZWRUeD4gPT4ge1xuICAgIGNvbnN0IHRvOkFycmF5PEJ1ZmZlcj4gPSB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheSh0b0FkZHJlc3NlcywgJ2J1aWxkSW1wb3J0VHgnKS5tYXAoKGEpID0+IGJpbnRvb2xzLnN0cmluZ1RvQWRkcmVzcyhhKSk7XG4gICAgY29uc3QgZnJvbTpBcnJheTxCdWZmZXI+ID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXkoZnJvbUFkZHJlc3NlcywgJ2J1aWxkSW1wb3J0VHgnKS5tYXAoKGEpID0+IGJpbnRvb2xzLnN0cmluZ1RvQWRkcmVzcyhhKSk7XG4gICAgY29uc3QgY2hhbmdlOkFycmF5PEJ1ZmZlcj4gPSB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheShjaGFuZ2VBZGRyZXNzZXMsICdidWlsZEltcG9ydFR4JykubWFwKChhKSA9PiBiaW50b29scy5zdHJpbmdUb0FkZHJlc3MoYSkpO1xuXG4gICAgbGV0IHNyY0NoYWluOnN0cmluZyA9IHVuZGVmaW5lZDtcblxuICAgIGlmKHR5cGVvZiBzb3VyY2VDaGFpbiA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRXJyb3IgLSBBVk1BUEkuYnVpbGRJbXBvcnRUeDogU291cmNlIENoYWluSUQgaXMgdW5kZWZpbmVkLlwiKTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBzb3VyY2VDaGFpbiA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgc3JjQ2hhaW4gPSBzb3VyY2VDaGFpbjtcbiAgICAgIHNvdXJjZUNoYWluID0gYmludG9vbHMuY2I1OERlY29kZShzb3VyY2VDaGFpbik7XG4gICAgfSBlbHNlIGlmKCEoc291cmNlQ2hhaW4gaW5zdGFuY2VvZiBCdWZmZXIpKSB7XG4gICAgc3JjQ2hhaW4gPSBiaW50b29scy5jYjU4RW5jb2RlKHNvdXJjZUNoYWluKTtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJFcnJvciAtIEFWTUFQSS5idWlsZEltcG9ydFR4OiBJbnZhbGlkIGRlc3RpbmF0aW9uQ2hhaW4gdHlwZTogXCIgKyAodHlwZW9mIHNvdXJjZUNoYWluKSApO1xuICB9XG4gIFxuICBjb25zdCBhdG9taWNVVFhPczpVVFhPU2V0ID0gYXdhaXQgKGF3YWl0IHRoaXMuZ2V0VVRYT3Mob3duZXJBZGRyZXNzZXMsIHNyY0NoYWluLCAwLCB1bmRlZmluZWQpKS51dHhvcztcbiAgY29uc3QgYXZheEFzc2V0SUQ6QnVmZmVyID0gYXdhaXQgdGhpcy5nZXRBVkFYQXNzZXRJRCgpO1xuXG4gIGNvbnN0IGF0b21pY3MgPSBhdG9taWNVVFhPcy5nZXRBbGxVVFhPcygpO1xuXG4gIGlmKGF0b21pY3MubGVuZ3RoID09PSAwKXtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJFcnJvciAtIEFWTUFQSS5idWlsZEltcG9ydFR4OiBObyBhdG9taWMgVVRYT3MgdG8gaW1wb3J0IGZyb20gXCIgKyBzcmNDaGFpbiArIFwiIHVzaW5nIGFkZHJlc3NlczogXCIgKyBvd25lckFkZHJlc3Nlcy5qb2luKFwiLCBcIikgKTtcbiAgfVxuXG4gIGlmKCBtZW1vIGluc3RhbmNlb2YgUGF5bG9hZEJhc2UpIHtcbiAgICBtZW1vID0gbWVtby5nZXRQYXlsb2FkKCk7XG4gIH1cblxuICBjb25zdCBidWlsdFVuc2lnbmVkVHg6VW5zaWduZWRUeCA9IHV0eG9zZXQuYnVpbGRJbXBvcnRUeChcbiAgICB0aGlzLmNvcmUuZ2V0TmV0d29ya0lEKCksIFxuICAgIGJpbnRvb2xzLmNiNThEZWNvZGUodGhpcy5ibG9ja2NoYWluSUQpLCBcbiAgICB0byxcbiAgICBmcm9tLFxuICAgIGNoYW5nZSxcbiAgICBhdG9taWNzLCBcbiAgICBzb3VyY2VDaGFpbixcbiAgICB0aGlzLmdldFR4RmVlKCksIFxuICAgIGF2YXhBc3NldElELCBcbiAgICBtZW1vLCBhc09mLCBsb2NrdGltZSwgdGhyZXNob2xkXG4gICk7XG5cbiAgICBpZighIGF3YWl0IHRoaXMuY2hlY2tHb29zZUVnZyhidWlsdFVuc2lnbmVkVHgpKSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRmFpbGVkIEdvb3NlIEVnZyBDaGVja1wiKTtcbiAgICB9XG5cbiAgICByZXR1cm4gYnVpbHRVbnNpZ25lZFR4O1xuICB9O1xuXG4gIC8qKlxuICAgKiBIZWxwZXIgZnVuY3Rpb24gd2hpY2ggY3JlYXRlcyBhbiB1bnNpZ25lZCBFeHBvcnQgVHguIEZvciBtb3JlIGdyYW51bGFyIGNvbnRyb2wsIHlvdSBtYXkgY3JlYXRlIHlvdXIgb3duXG4gICAqIFtbVW5zaWduZWRUeF1dIG1hbnVhbGx5ICh3aXRoIHRoZWlyIGNvcnJlc3BvbmRpbmcgW1tUcmFuc2ZlcmFibGVJbnB1dF1dcywgW1tUcmFuc2ZlcmFibGVPdXRwdXRdXXMsIGFuZCBbW1RyYW5zZmVyT3BlcmF0aW9uXV1zKS5cbiAgICpcbiAgICogQHBhcmFtIHV0eG9zZXQgQSBzZXQgb2YgVVRYT3MgdGhhdCB0aGUgdHJhbnNhY3Rpb24gaXMgYnVpbHQgb25cbiAgICogQHBhcmFtIGFtb3VudCBUaGUgYW1vdW50IGJlaW5nIGV4cG9ydGVkIGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICogQHBhcmFtIGRlc3RpbmF0aW9uQ2hhaW4gVGhlIGNoYWluaWQgZm9yIHdoZXJlIHRoZSBhc3NldHMgd2lsbCBiZSBzZW50LlxuICAgKiBAcGFyYW0gdG9BZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyB0byBzZW5kIHRoZSBmdW5kc1xuICAgKiBAcGFyYW0gZnJvbUFkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIGJlaW5nIHVzZWQgdG8gc2VuZCB0aGUgZnVuZHMgZnJvbSB0aGUgVVRYT3MgcHJvdmlkZWRcbiAgICogQHBhcmFtIGNoYW5nZUFkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIHRoYXQgY2FuIHNwZW5kIHRoZSBjaGFuZ2UgcmVtYWluaW5nIGZyb20gdGhlIHNwZW50IFVUWE9zXG4gICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsIENCNTggQnVmZmVyIG9yIFN0cmluZyB3aGljaCBjb250YWlucyBhcmJpdHJhcnkgYnl0ZXMsIHVwIHRvIDI1NiBieXRlc1xuICAgKiBAcGFyYW0gYXNPZiBPcHRpb25hbC4gVGhlIHRpbWVzdGFtcCB0byB2ZXJpZnkgdGhlIHRyYW5zYWN0aW9uIGFnYWluc3QgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKiBAcGFyYW0gbG9ja3RpbWUgT3B0aW9uYWwuIFRoZSBsb2NrdGltZSBmaWVsZCBjcmVhdGVkIGluIHRoZSByZXN1bHRpbmcgb3V0cHV0c1xuICAgKiBAcGFyYW0gdGhyZXNob2xkIE9wdGlvbmFsLiBUaGUgbnVtYmVyIG9mIHNpZ25hdHVyZXMgcmVxdWlyZWQgdG8gc3BlbmQgdGhlIGZ1bmRzIGluIHRoZSByZXN1bHRhbnQgVVRYT1xuICAgKlxuICAgKiBAcmV0dXJucyBBbiB1bnNpZ25lZCB0cmFuc2FjdGlvbiAoW1tVbnNpZ25lZFR4XV0pIHdoaWNoIGNvbnRhaW5zIGFuIFtbRXhwb3J0VHhdXS5cbiAgICovXG4gIGJ1aWxkRXhwb3J0VHggPSBhc3luYyAoXG4gICAgdXR4b3NldDpVVFhPU2V0LCBcbiAgICBhbW91bnQ6Qk4sXG4gICAgZGVzdGluYXRpb25DaGFpbjpCdWZmZXIgfCBzdHJpbmcsXG4gICAgdG9BZGRyZXNzZXM6QXJyYXk8c3RyaW5nPiwgXG4gICAgZnJvbUFkZHJlc3NlczpBcnJheTxzdHJpbmc+LFxuICAgIGNoYW5nZUFkZHJlc3NlczpBcnJheTxzdHJpbmc+ID0gdW5kZWZpbmVkLFxuICAgIG1lbW86UGF5bG9hZEJhc2V8QnVmZmVyID0gdW5kZWZpbmVkLCBcbiAgICBhc09mOkJOID0gVW5peE5vdygpLFxuICAgIGxvY2t0aW1lOkJOID0gbmV3IEJOKDApLCBcbiAgICB0aHJlc2hvbGQ6bnVtYmVyID0gMVxuICApOlByb21pc2U8VW5zaWduZWRUeD4gPT4ge1xuICAgIFxuICAgIGxldCBwcmVmaXhlczpvYmplY3QgPSB7fTtcbiAgICB0b0FkZHJlc3Nlcy5tYXAoKGEpID0+IHtcbiAgICAgIHByZWZpeGVzW2Euc3BsaXQoXCItXCIpWzBdXSA9IHRydWU7XG4gICAgfSk7XG4gICAgaWYoT2JqZWN0LmtleXMocHJlZml4ZXMpLmxlbmd0aCAhPT0gMSl7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJFcnJvciAtIEFWTUFQSS5idWlsZEV4cG9ydFR4OiBUbyBhZGRyZXNzZXMgbXVzdCBoYXZlIHRoZSBzYW1lIGNoYWluSUQgcHJlZml4LlwiKTtcbiAgICB9XG4gICAgXG4gICAgaWYodHlwZW9mIGRlc3RpbmF0aW9uQ2hhaW4gPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkVycm9yIC0gQVZNQVBJLmJ1aWxkRXhwb3J0VHg6IERlc3RpbmF0aW9uIENoYWluSUQgaXMgdW5kZWZpbmVkLlwiKTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBkZXN0aW5hdGlvbkNoYWluID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBkZXN0aW5hdGlvbkNoYWluID0gYmludG9vbHMuY2I1OERlY29kZShkZXN0aW5hdGlvbkNoYWluKTsgLy9cbiAgICB9IGVsc2UgaWYoIShkZXN0aW5hdGlvbkNoYWluIGluc3RhbmNlb2YgQnVmZmVyKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRXJyb3IgLSBBVk1BUEkuYnVpbGRFeHBvcnRUeDogSW52YWxpZCBkZXN0aW5hdGlvbkNoYWluIHR5cGU6IFwiICsgKHR5cGVvZiBkZXN0aW5hdGlvbkNoYWluKSApO1xuICAgIH1cbiAgICBpZihkZXN0aW5hdGlvbkNoYWluLmxlbmd0aCAhPT0gMzIpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkVycm9yIC0gQVZNQVBJLmJ1aWxkRXhwb3J0VHg6IERlc3RpbmF0aW9uIENoYWluSUQgbXVzdCBiZSAzMiBieXRlcyBpbiBsZW5ndGguXCIpO1xuICAgIH1cblxuICAgIGxldCB0bzpBcnJheTxCdWZmZXI+ID0gW107XG4gICAgdG9BZGRyZXNzZXMubWFwKChhKSA9PiB7XG4gICAgICB0by5wdXNoKGJpbnRvb2xzLnN0cmluZ1RvQWRkcmVzcyhhKSk7XG4gICAgfSk7XG5cbiAgICBjb25zdCBmcm9tOkFycmF5PEJ1ZmZlcj4gPSB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheShmcm9tQWRkcmVzc2VzLCAnYnVpbGRFeHBvcnRUeCcpLm1hcCgoYSkgPT4gYmludG9vbHMuc3RyaW5nVG9BZGRyZXNzKGEpKTtcbiAgICBjb25zdCBjaGFuZ2U6QXJyYXk8QnVmZmVyPiA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5KGNoYW5nZUFkZHJlc3NlcywgJ2J1aWxkRXhwb3J0VHgnKS5tYXAoKGEpID0+IGJpbnRvb2xzLnN0cmluZ1RvQWRkcmVzcyhhKSk7XG5cbiAgICBpZiggbWVtbyBpbnN0YW5jZW9mIFBheWxvYWRCYXNlKSB7XG4gICAgICBtZW1vID0gbWVtby5nZXRQYXlsb2FkKCk7XG4gICAgfVxuXG4gICAgY29uc3QgYXZheEFzc2V0SUQ6QnVmZmVyID0gYXdhaXQgdGhpcy5nZXRBVkFYQXNzZXRJRCgpO1xuXG4gICAgY29uc3QgYnVpbHRVbnNpZ25lZFR4OlVuc2lnbmVkVHggPSB1dHhvc2V0LmJ1aWxkRXhwb3J0VHgoXG4gICAgICB0aGlzLmNvcmUuZ2V0TmV0d29ya0lEKCksIFxuICAgICAgYmludG9vbHMuY2I1OERlY29kZSh0aGlzLmJsb2NrY2hhaW5JRCksIFxuICAgICAgYW1vdW50LFxuICAgICAgYXZheEFzc2V0SUQsIFxuICAgICAgdG8sXG4gICAgICBmcm9tLFxuICAgICAgY2hhbmdlLFxuICAgICAgZGVzdGluYXRpb25DaGFpbixcbiAgICAgIHRoaXMuZ2V0VHhGZWUoKSwgXG4gICAgICBhdmF4QXNzZXRJRCxcbiAgICAgIG1lbW8sIGFzT2YsIGxvY2t0aW1lLCB0aHJlc2hvbGRcbiAgICApO1xuXG4gICAgaWYoISBhd2FpdCB0aGlzLmNoZWNrR29vc2VFZ2coYnVpbHRVbnNpZ25lZFR4KSkge1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkZhaWxlZCBHb29zZSBFZ2cgQ2hlY2tcIik7XG4gICAgfVxuXG4gICAgcmV0dXJuIGJ1aWx0VW5zaWduZWRUeDtcbiAgfTtcblxuICAvKipcbiAgICogQ3JlYXRlcyBhbiB1bnNpZ25lZCB0cmFuc2FjdGlvbi4gRm9yIG1vcmUgZ3JhbnVsYXIgY29udHJvbCwgeW91IG1heSBjcmVhdGUgeW91ciBvd25cbiAgICogW1tVbnNpZ25lZFR4XV0gbWFudWFsbHkgKHdpdGggdGhlaXIgY29ycmVzcG9uZGluZyBbW1RyYW5zZmVyYWJsZUlucHV0XV1zLCBbW1RyYW5zZmVyYWJsZU91dHB1dF1dcywgYW5kIFtbVHJhbnNmZXJPcGVyYXRpb25dXXMpLlxuICAgKlxuICAgKiBAcGFyYW0gdXR4b3NldCBBIHNldCBvZiBVVFhPcyB0aGF0IHRoZSB0cmFuc2FjdGlvbiBpcyBidWlsdCBvblxuICAgKiBAcGFyYW0gZnJvbUFkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIGJlaW5nIHVzZWQgdG8gc2VuZCB0aGUgZnVuZHMgZnJvbSB0aGUgVVRYT3Mge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn1cbiAgICogQHBhcmFtIGNoYW5nZUFkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIHRoYXQgY2FuIHNwZW5kIHRoZSBjaGFuZ2UgcmVtYWluaW5nIGZyb20gdGhlIHNwZW50IFVUWE9zXG4gICAqIEBwYXJhbSBpbml0aWFsU3RhdGUgVGhlIFtbSW5pdGlhbFN0YXRlc11dIHRoYXQgcmVwcmVzZW50IHRoZSBpbnRpYWwgc3RhdGUgb2YgYSBjcmVhdGVkIGFzc2V0XG4gICAqIEBwYXJhbSBuYW1lIFN0cmluZyBmb3IgdGhlIGRlc2NyaXB0aXZlIG5hbWUgb2YgdGhlIGFzc2V0XG4gICAqIEBwYXJhbSBzeW1ib2wgU3RyaW5nIGZvciB0aGUgdGlja2VyIHN5bWJvbCBvZiB0aGUgYXNzZXRcbiAgICogQHBhcmFtIGRlbm9taW5hdGlvbiBOdW1iZXIgZm9yIHRoZSBkZW5vbWluYXRpb24gd2hpY2ggaXMgMTBeRC4gRCBtdXN0IGJlID49IDAgYW5kIDw9IDMyLiBFeDogJDEgQVZBWCA9IDEwXjkgJG5BVkFYXG4gICAqIEBwYXJhbSBtaW50T3V0cHV0cyBPcHRpb25hbC4gQXJyYXkgb2YgW1tTRUNQTWludE91dHB1dF1dcyB0byBiZSBpbmNsdWRlZCBpbiB0aGUgdHJhbnNhY3Rpb24uIFRoZXNlIG91dHB1dHMgY2FuIGJlIHNwZW50IHRvIG1pbnQgbW9yZSB0b2tlbnMuXG4gICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsIENCNTggQnVmZmVyIG9yIFN0cmluZyB3aGljaCBjb250YWlucyBhcmJpdHJhcnkgYnl0ZXMsIHVwIHRvIDI1NiBieXRlc1xuICAgKiBAcGFyYW0gYXNPZiBPcHRpb25hbC4gVGhlIHRpbWVzdGFtcCB0byB2ZXJpZnkgdGhlIHRyYW5zYWN0aW9uIGFnYWluc3QgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKlxuICAgKiBAcmV0dXJucyBBbiB1bnNpZ25lZCB0cmFuc2FjdGlvbiAoW1tVbnNpZ25lZFR4XV0pIHdoaWNoIGNvbnRhaW5zIGEgW1tDcmVhdGVBc3NldFR4XV0uXG4gICAqIFxuICAgKi9cbiAgYnVpbGRDcmVhdGVBc3NldFR4ID0gYXN5bmMgKFxuICAgICAgdXR4b3NldDpVVFhPU2V0LCBcbiAgICAgIGZyb21BZGRyZXNzZXM6QXJyYXk8c3RyaW5nPiwgXG4gICAgICBjaGFuZ2VBZGRyZXNzZXM6QXJyYXk8c3RyaW5nPiAsXG4gICAgICBpbml0aWFsU3RhdGVzOkluaXRpYWxTdGF0ZXMsIFxuICAgICAgbmFtZTpzdHJpbmcsIFxuICAgICAgc3ltYm9sOnN0cmluZywgXG4gICAgICBkZW5vbWluYXRpb246bnVtYmVyLCBcbiAgICAgIG1pbnRPdXRwdXRzOkFycmF5PFNFQ1BNaW50T3V0cHV0PiA9IHVuZGVmaW5lZCxcbiAgICAgIG1lbW86UGF5bG9hZEJhc2V8QnVmZmVyID0gdW5kZWZpbmVkLCBcbiAgICAgIGFzT2Y6Qk4gPSBVbml4Tm93KClcbiAgKTpQcm9taXNlPFVuc2lnbmVkVHg+ID0+IHtcbiAgICBsZXQgZnJvbTpBcnJheTxCdWZmZXI+ID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXkoZnJvbUFkZHJlc3NlcywgXCJidWlsZENyZWF0ZUFzc2V0VHhcIikubWFwKGEgPT4gYmludG9vbHMuc3RyaW5nVG9BZGRyZXNzKGEpKTtcbiAgICBsZXQgY2hhbmdlOkFycmF5PEJ1ZmZlcj4gPSB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheShjaGFuZ2VBZGRyZXNzZXMsIFwiYnVpbGRDcmVhdGVORlRBc3NldFR4XCIpLm1hcChhID0+IGJpbnRvb2xzLnN0cmluZ1RvQWRkcmVzcyhhKSk7XG5cbiAgICBpZiggbWVtbyBpbnN0YW5jZW9mIFBheWxvYWRCYXNlKSB7XG4gICAgICBtZW1vID0gbWVtby5nZXRQYXlsb2FkKCk7XG4gICAgfVxuXG4gICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICBpZihzeW1ib2wubGVuZ3RoID4gQVZNQ29uc3RhbnRzLlNZTUJPTE1BWExFTil7XG4gICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkVycm9yIC0gQVZNQVBJLmJ1aWxkQ3JlYXRlQXNzZXRUeDogU3ltYm9scyBtYXkgbm90IGV4Y2VlZCBsZW5ndGggb2YgXCIgKyBBVk1Db25zdGFudHMuU1lNQk9MTUFYTEVOKTtcbiAgICB9XG4gICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICBpZihuYW1lLmxlbmd0aCA+IEFWTUNvbnN0YW50cy5BU1NFVE5BTUVMRU4pIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJFcnJvciAtIEFWTUFQSS5idWlsZENyZWF0ZUFzc2V0VHg6IE5hbWVzIG1heSBub3QgZXhjZWVkIGxlbmd0aCBvZiBcIiArIEFWTUNvbnN0YW50cy5BU1NFVE5BTUVMRU4pO1xuICAgIH1cblxuICAgIGNvbnN0IGF2YXhBc3NldElEOkJ1ZmZlciA9IGF3YWl0IHRoaXMuZ2V0QVZBWEFzc2V0SUQoKTtcbiAgICBjb25zdCBidWlsdFVuc2lnbmVkVHg6VW5zaWduZWRUeCA9IHV0eG9zZXQuYnVpbGRDcmVhdGVBc3NldFR4KFxuICAgICAgdGhpcy5jb3JlLmdldE5ldHdvcmtJRCgpLCBcbiAgICAgIGJpbnRvb2xzLmNiNThEZWNvZGUodGhpcy5ibG9ja2NoYWluSUQpLCBcbiAgICAgIGZyb20sXG4gICAgICBjaGFuZ2UsXG4gICAgICBpbml0aWFsU3RhdGVzLFxuICAgICAgbmFtZSwgXG4gICAgICBzeW1ib2wsIFxuICAgICAgZGVub21pbmF0aW9uLCBcbiAgICAgIG1pbnRPdXRwdXRzLFxuICAgICAgdGhpcy5nZXRDcmVhdGlvblR4RmVlKCksIFxuICAgICAgYXZheEFzc2V0SUQsXG4gICAgICBtZW1vLCBhc09mXG4gICAgKTtcblxuICAgIGlmKCEgYXdhaXQgdGhpcy5jaGVja0dvb3NlRWdnKGJ1aWx0VW5zaWduZWRUeCwgdGhpcy5nZXRDcmVhdGlvblR4RmVlKCkpKSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRmFpbGVkIEdvb3NlIEVnZyBDaGVja1wiKTtcbiAgICB9XG5cbiAgICByZXR1cm4gYnVpbHRVbnNpZ25lZFR4O1xuICB9O1xuXG4gIGJ1aWxkU0VDUE1pbnRUeCA9IGFzeW5jIChcbiAgICB1dHhvc2V0OlVUWE9TZXQsICBcbiAgICBtaW50T3duZXI6U0VDUE1pbnRPdXRwdXQsXG4gICAgdHJhbnNmZXJPd25lcjpTRUNQVHJhbnNmZXJPdXRwdXQsXG4gICAgZnJvbUFkZHJlc3NlczpBcnJheTxzdHJpbmc+LFxuICAgIGNoYW5nZUFkZHJlc3NlczpBcnJheTxzdHJpbmc+LFxuICAgIG1pbnRVVFhPSUQ6c3RyaW5nLFxuICAgIG1lbW86UGF5bG9hZEJhc2V8QnVmZmVyID0gdW5kZWZpbmVkLCBhc09mOkJOID0gVW5peE5vdygpXG4gICk6IFByb21pc2U8YW55PiA9PiB7XG4gICAgbGV0IGZyb206QXJyYXk8QnVmZmVyPiA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5KGZyb21BZGRyZXNzZXMsIFwiYnVpbGRTRUNQTWludFR4XCIpLm1hcChhID0+IGJpbnRvb2xzLnN0cmluZ1RvQWRkcmVzcyhhKSk7XG4gICAgbGV0IGNoYW5nZTpBcnJheTxCdWZmZXI+ID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXkoY2hhbmdlQWRkcmVzc2VzLCBcImJ1aWxkU0VDUE1pbnRUeFwiKS5tYXAoYSA9PiBiaW50b29scy5zdHJpbmdUb0FkZHJlc3MoYSkpO1xuICAgIFxuICAgIGlmKCBtZW1vIGluc3RhbmNlb2YgUGF5bG9hZEJhc2UpIHtcbiAgICAgIG1lbW8gPSBtZW1vLmdldFBheWxvYWQoKTtcbiAgICB9XG5cbiAgICBsZXQgYXZheEFzc2V0SUQ6QnVmZmVyID0gYXdhaXQgdGhpcy5nZXRBVkFYQXNzZXRJRCgpO1xuXG4gICAgY29uc3QgYnVpbHRVbnNpZ25lZFR4OlVuc2lnbmVkVHggPSB1dHhvc2V0LmJ1aWxkU0VDUE1pbnRUeChcbiAgICAgICAgdGhpcy5jb3JlLmdldE5ldHdvcmtJRCgpLFxuICAgICAgICBiaW50b29scy5jYjU4RGVjb2RlKHRoaXMuYmxvY2tjaGFpbklEKSxcbiAgICAgICAgbWludE93bmVyLFxuICAgICAgICB0cmFuc2Zlck93bmVyLFxuICAgICAgICBmcm9tLFxuICAgICAgICBjaGFuZ2UsXG4gICAgICAgIG1pbnRVVFhPSUQsXG4gICAgICAgIHRoaXMuZ2V0VHhGZWUoKSxcbiAgICAgICAgYXZheEFzc2V0SUQsXG4gICAgICAgIG1lbW8sIGFzT2ZcbiAgICApO1xuICAgIGlmKCEgYXdhaXQgdGhpcy5jaGVja0dvb3NlRWdnKGJ1aWx0VW5zaWduZWRUeCkpIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJGYWlsZWQgR29vc2UgRWdnIENoZWNrXCIpO1xuICAgIH1cbiAgICByZXR1cm4gYnVpbHRVbnNpZ25lZFR4O1xuICB9XG5cbiAgLyoqXG4gICogQ3JlYXRlcyBhbiB1bnNpZ25lZCB0cmFuc2FjdGlvbi4gRm9yIG1vcmUgZ3JhbnVsYXIgY29udHJvbCwgeW91IG1heSBjcmVhdGUgeW91ciBvd25cbiAgKiBbW1Vuc2lnbmVkVHhdXSBtYW51YWxseSAod2l0aCB0aGVpciBjb3JyZXNwb25kaW5nIFtbVHJhbnNmZXJhYmxlSW5wdXRdXXMsIFtbVHJhbnNmZXJhYmxlT3V0cHV0XV1zLCBhbmQgW1tUcmFuc2Zlck9wZXJhdGlvbl1dcykuXG4gICogXG4gICogQHBhcmFtIHV0eG9zZXQgQSBzZXQgb2YgVVRYT3MgdGhhdCB0aGUgdHJhbnNhY3Rpb24gaXMgYnVpbHQgb25cbiAgKiBAcGFyYW0gZnJvbUFkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIGJlaW5nIHVzZWQgdG8gc2VuZCB0aGUgZnVuZHMgZnJvbSB0aGUgVVRYT3Mge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn1cbiAgKiBAcGFyYW0gY2hhbmdlQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgdGhhdCBjYW4gc3BlbmQgdGhlIGNoYW5nZSByZW1haW5pbmcgZnJvbSB0aGUgc3BlbnQgVVRYT3NcbiAgKiBAcGFyYW0gbWludGVyU2V0cyBpcyBhIGxpc3Qgd2hlcmUgZWFjaCBlbGVtZW50IHNwZWNpZmllcyB0aGF0IHRocmVzaG9sZCBvZiB0aGUgYWRkcmVzc2VzIGluIG1pbnRlcnMgbWF5IHRvZ2V0aGVyIG1pbnQgbW9yZSBvZiB0aGUgYXNzZXQgYnkgc2lnbmluZyBhIG1pbnRpbmcgdHJhbnNhY3Rpb25cbiAgKiBAcGFyYW0gbmFtZSBTdHJpbmcgZm9yIHRoZSBkZXNjcmlwdGl2ZSBuYW1lIG9mIHRoZSBhc3NldFxuICAqIEBwYXJhbSBzeW1ib2wgU3RyaW5nIGZvciB0aGUgdGlja2VyIHN5bWJvbCBvZiB0aGUgYXNzZXRcbiAgKiBAcGFyYW0gbWVtbyBPcHRpb25hbCBDQjU4IEJ1ZmZlciBvciBTdHJpbmcgd2hpY2ggY29udGFpbnMgYXJiaXRyYXJ5IGJ5dGVzLCB1cCB0byAyNTYgYnl0ZXNcbiAgKiBAcGFyYW0gYXNPZiBPcHRpb25hbC4gVGhlIHRpbWVzdGFtcCB0byB2ZXJpZnkgdGhlIHRyYW5zYWN0aW9uIGFnYWluc3QgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAqIEBwYXJhbSBsb2NrdGltZSBPcHRpb25hbC4gVGhlIGxvY2t0aW1lIGZpZWxkIGNyZWF0ZWQgaW4gdGhlIHJlc3VsdGluZyBtaW50IG91dHB1dFxuICAqIFxuICAqIGBgYGpzXG4gICogRXhhbXBsZSBtaW50ZXJTZXRzOlxuICAqIFtcbiAgKiAgICAgIHtcbiAgKiAgICAgICAgICBcIm1pbnRlcnNcIjpbXG4gICogICAgICAgICAgICAgIFwiWC1hdmF4MWdoc3RqdWtydHc4OTM1bHJ5cXRuaDY0M3hlOWE5NHUzdGM3NWM3XCJcbiAgKiAgICAgICAgICBdLFxuICAqICAgICAgICAgIFwidGhyZXNob2xkXCI6IDFcbiAgKiAgICAgIH0sXG4gICogICAgICB7XG4gICogICAgICAgICAgXCJtaW50ZXJzXCI6IFtcbiAgKiAgICAgICAgICAgICAgXCJYLWF2YXgxeWVsbDNlNG5sbjBtMzljZnBkaGdxcHJzZDg3amtoNHFuYWtrbHhcIixcbiAgKiAgICAgICAgICAgICAgXCJYLWF2YXgxazRucjI2YzgwamFxdXptOTM2OWo1YTRzaG13Y2puMHZtZW1janpcIixcbiAgKiAgICAgICAgICAgICAgXCJYLWF2YXgxenRrenNyam5rbjBjZWs1cnl2aHFzd2R0Y2cyM25oZ2Uzbm5yNWVcIlxuICAqICAgICAgICAgIF0sXG4gICogICAgICAgICAgXCJ0aHJlc2hvbGRcIjogMlxuICAqICAgICAgfVxuICAqIF1cbiAgKiBgYGBcbiAgKiBcbiAgKiBAcmV0dXJucyBBbiB1bnNpZ25lZCB0cmFuc2FjdGlvbiAoW1tVbnNpZ25lZFR4XV0pIHdoaWNoIGNvbnRhaW5zIGEgW1tDcmVhdGVBc3NldFR4XV0uXG4gICogXG4gICovXG4gIGJ1aWxkQ3JlYXRlTkZUQXNzZXRUeCA9IGFzeW5jIChcbiAgICB1dHhvc2V0OlVUWE9TZXQsIFxuICAgIGZyb21BZGRyZXNzZXM6QXJyYXk8c3RyaW5nPixcbiAgICBjaGFuZ2VBZGRyZXNzZXM6QXJyYXk8c3RyaW5nPixcbiAgICBtaW50ZXJTZXRzOk1pbnRlclNldFtdLCBcbiAgICBuYW1lOnN0cmluZywgXG4gICAgc3ltYm9sOnN0cmluZywgXG4gICAgbWVtbzpQYXlsb2FkQmFzZXxCdWZmZXIgPSB1bmRlZmluZWQsIGFzT2Y6Qk4gPSBVbml4Tm93KCksIGxvY2t0aW1lOkJOID0gbmV3IEJOKDApXG4gICk6IFByb21pc2U8VW5zaWduZWRUeD4gPT4ge1xuICAgIGxldCBmcm9tOkFycmF5PEJ1ZmZlcj4gPSB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheShmcm9tQWRkcmVzc2VzLCBcImJ1aWxkQ3JlYXRlTkZUQXNzZXRUeFwiKS5tYXAoYSA9PiBiaW50b29scy5zdHJpbmdUb0FkZHJlc3MoYSkpO1xuICAgIGxldCBjaGFuZ2U6QXJyYXk8QnVmZmVyPiA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5KGNoYW5nZUFkZHJlc3NlcywgXCJidWlsZENyZWF0ZU5GVEFzc2V0VHhcIikubWFwKGEgPT4gYmludG9vbHMuc3RyaW5nVG9BZGRyZXNzKGEpKTtcbiAgICBcbiAgICBpZiggbWVtbyBpbnN0YW5jZW9mIFBheWxvYWRCYXNlKSB7XG4gICAgICBtZW1vID0gbWVtby5nZXRQYXlsb2FkKCk7XG4gICAgfVxuXG4gICAgaWYobmFtZS5sZW5ndGggPiBBVk1Db25zdGFudHMuQVNTRVROQU1FTEVOKSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJFcnJvciAtIEFWTUFQSS5idWlsZENyZWF0ZU5GVEFzc2V0VHg6IE5hbWVzIG1heSBub3QgZXhjZWVkIGxlbmd0aCBvZiBcIiArIEFWTUNvbnN0YW50cy5BU1NFVE5BTUVMRU4pO1xuICAgIH1cbiAgICBpZihzeW1ib2wubGVuZ3RoID4gQVZNQ29uc3RhbnRzLlNZTUJPTE1BWExFTil7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJFcnJvciAtIEFWTUFQSS5idWlsZENyZWF0ZU5GVEFzc2V0VHg6IFN5bWJvbHMgbWF5IG5vdCBleGNlZWQgbGVuZ3RoIG9mIFwiICsgQVZNQ29uc3RhbnRzLlNZTUJPTE1BWExFTik7XG4gICAgfVxuICAgIGxldCBhdmF4QXNzZXRJRDpCdWZmZXIgPSBhd2FpdCB0aGlzLmdldEFWQVhBc3NldElEKCk7XG4gICAgY29uc3QgYnVpbHRVbnNpZ25lZFR4OlVuc2lnbmVkVHggPSB1dHhvc2V0LmJ1aWxkQ3JlYXRlTkZUQXNzZXRUeChcbiAgICAgICAgdGhpcy5jb3JlLmdldE5ldHdvcmtJRCgpLCBcbiAgICAgICAgYmludG9vbHMuY2I1OERlY29kZSh0aGlzLmJsb2NrY2hhaW5JRCksXG4gICAgICAgIGZyb20sXG4gICAgICAgIGNoYW5nZSxcbiAgICAgICAgbWludGVyU2V0cyxcbiAgICAgICAgbmFtZSwgXG4gICAgICAgIHN5bWJvbCxcbiAgICAgICAgdGhpcy5nZXRDcmVhdGlvblR4RmVlKCksIFxuICAgICAgICBhdmF4QXNzZXRJRCxcbiAgICAgICAgbWVtbywgYXNPZiwgbG9ja3RpbWVcbiAgICApO1xuICAgIGlmKCEgYXdhaXQgdGhpcy5jaGVja0dvb3NlRWdnKGJ1aWx0VW5zaWduZWRUeCwgdGhpcy5nZXRDcmVhdGlvblR4RmVlKCkpKSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRmFpbGVkIEdvb3NlIEVnZyBDaGVja1wiKTtcbiAgICB9XG4gICAgcmV0dXJuIGJ1aWx0VW5zaWduZWRUeDtcbiAgfVxuXG4gIC8qKlxuICAqIENyZWF0ZXMgYW4gdW5zaWduZWQgdHJhbnNhY3Rpb24uIEZvciBtb3JlIGdyYW51bGFyIGNvbnRyb2wsIHlvdSBtYXkgY3JlYXRlIHlvdXIgb3duXG4gICogW1tVbnNpZ25lZFR4XV0gbWFudWFsbHkgKHdpdGggdGhlaXIgY29ycmVzcG9uZGluZyBbW1RyYW5zZmVyYWJsZUlucHV0XV1zLCBbW1RyYW5zZmVyYWJsZU91dHB1dF1dcywgYW5kIFtbVHJhbnNmZXJPcGVyYXRpb25dXXMpLlxuICAqIFxuICAqIEBwYXJhbSB1dHhvc2V0ICBBIHNldCBvZiBVVFhPcyB0aGF0IHRoZSB0cmFuc2FjdGlvbiBpcyBidWlsdCBvblxuICAqIEBwYXJhbSBvd25lcnMgRWl0aGVyIGEgc2luZ2xlIG9yIGFuIGFycmF5IG9mIFtbT3V0cHV0T3duZXJzXV0gdG8gc2VuZCB0aGUgbmZ0IG91dHB1dFxuICAqIEBwYXJhbSBmcm9tQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgYmVpbmcgdXNlZCB0byBzZW5kIHRoZSBORlQgZnJvbSB0aGUgdXR4b0lEIHByb3ZpZGVkXG4gICogQHBhcmFtIGNoYW5nZUFkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIHRoYXQgY2FuIHNwZW5kIHRoZSBjaGFuZ2UgcmVtYWluaW5nIGZyb20gdGhlIHNwZW50IFVUWE9zXG4gICogQHBhcmFtIHV0eG9pZCBBIGJhc2U1OCB1dHhvSUQgb3IgYW4gYXJyYXkgb2YgYmFzZTU4IHV0eG9JRHMgZm9yIHRoZSBuZnQgbWludCBvdXRwdXQgdGhpcyB0cmFuc2FjdGlvbiBpcyBzZW5kaW5nXG4gICogQHBhcmFtIGdyb3VwSUQgT3B0aW9uYWwuIFRoZSBncm91cCB0aGlzIE5GVCBpcyBpc3N1ZWQgdG8uXG4gICogQHBhcmFtIHBheWxvYWQgT3B0aW9uYWwuIERhdGEgZm9yIE5GVCBQYXlsb2FkIGFzIGVpdGhlciBhIFtbUGF5bG9hZEJhc2VdXSBvciBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9XG4gICogQHBhcmFtIG1lbW8gT3B0aW9uYWwgQ0I1OCBCdWZmZXIgb3IgU3RyaW5nIHdoaWNoIGNvbnRhaW5zIGFyYml0cmFyeSBieXRlcywgdXAgdG8gMjU2IGJ5dGVzXG4gICogQHBhcmFtIGFzT2YgT3B0aW9uYWwuIFRoZSB0aW1lc3RhbXAgdG8gdmVyaWZ5IHRoZSB0cmFuc2FjdGlvbiBhZ2FpbnN0IGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgKiBcbiAgKiBAcmV0dXJucyBBbiB1bnNpZ25lZCB0cmFuc2FjdGlvbiAoW1tVbnNpZ25lZFR4XV0pIHdoaWNoIGNvbnRhaW5zIGFuIFtbT3BlcmF0aW9uVHhdXS5cbiAgKiBcbiAgKi9cbiAgYnVpbGRDcmVhdGVORlRNaW50VHggPSBhc3luYyAoXG4gICAgdXR4b3NldDpVVFhPU2V0LCAgXG4gICAgb3duZXJzOkFycmF5PE91dHB1dE93bmVycz58T3V0cHV0T3duZXJzLCBcbiAgICBmcm9tQWRkcmVzc2VzOkFycmF5PHN0cmluZz4sXG4gICAgY2hhbmdlQWRkcmVzc2VzOkFycmF5PHN0cmluZz4sXG4gICAgdXR4b2lkOnN0cmluZ3xBcnJheTxzdHJpbmc+LFxuICAgIGdyb3VwSUQ6bnVtYmVyID0gMCwgXG4gICAgcGF5bG9hZDpQYXlsb2FkQmFzZXxCdWZmZXIgPSB1bmRlZmluZWQsIFxuICAgIG1lbW86UGF5bG9hZEJhc2V8QnVmZmVyID0gdW5kZWZpbmVkLCBhc09mOkJOID0gVW5peE5vdygpXG4gICk6IFByb21pc2U8YW55PiA9PiB7XG4gICAgbGV0IGZyb206QXJyYXk8QnVmZmVyPiA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5KGZyb21BZGRyZXNzZXMsIFwiYnVpbGRDcmVhdGVORlRNaW50VHhcIikubWFwKGEgPT4gYmludG9vbHMuc3RyaW5nVG9BZGRyZXNzKGEpKTtcbiAgICBsZXQgY2hhbmdlOkFycmF5PEJ1ZmZlcj4gPSB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheShjaGFuZ2VBZGRyZXNzZXMsIFwiYnVpbGRDcmVhdGVORlRNaW50VHhcIikubWFwKGEgPT4gYmludG9vbHMuc3RyaW5nVG9BZGRyZXNzKGEpKTtcbiAgICBcbiAgICBpZiggbWVtbyBpbnN0YW5jZW9mIFBheWxvYWRCYXNlKSB7XG4gICAgICBtZW1vID0gbWVtby5nZXRQYXlsb2FkKCk7XG4gICAgfVxuXG4gICAgaWYocGF5bG9hZCBpbnN0YW5jZW9mIFBheWxvYWRCYXNlKXtcbiAgICAgIHBheWxvYWQgPSBwYXlsb2FkLmdldFBheWxvYWQoKTtcbiAgICB9XG5cbiAgICBpZih0eXBlb2YgdXR4b2lkID09PSAnc3RyaW5nJykge1xuICAgICAgICB1dHhvaWQgPSBbdXR4b2lkXTtcbiAgICB9XG5cbiAgICBsZXQgYXZheEFzc2V0SUQ6QnVmZmVyID0gYXdhaXQgdGhpcy5nZXRBVkFYQXNzZXRJRCgpO1xuXG4gICAgaWYob3duZXJzIGluc3RhbmNlb2YgT3V0cHV0T3duZXJzKSB7XG4gICAgICBvd25lcnMgPSBbb3duZXJzXTtcbiAgICB9XG5cbiAgICBjb25zdCBidWlsdFVuc2lnbmVkVHg6VW5zaWduZWRUeCA9IHV0eG9zZXQuYnVpbGRDcmVhdGVORlRNaW50VHgoXG4gICAgICAgIHRoaXMuY29yZS5nZXROZXR3b3JrSUQoKSxcbiAgICAgICAgYmludG9vbHMuY2I1OERlY29kZSh0aGlzLmJsb2NrY2hhaW5JRCksXG4gICAgICAgIG93bmVycyxcbiAgICAgICAgZnJvbSxcbiAgICAgICAgY2hhbmdlLFxuICAgICAgICB1dHhvaWQsXG4gICAgICAgIGdyb3VwSUQsXG4gICAgICAgIHBheWxvYWQsXG4gICAgICAgIHRoaXMuZ2V0VHhGZWUoKSxcbiAgICAgICAgYXZheEFzc2V0SUQsXG4gICAgICAgIG1lbW8sIGFzT2ZcbiAgICApO1xuICAgIGlmKCEgYXdhaXQgdGhpcy5jaGVja0dvb3NlRWdnKGJ1aWx0VW5zaWduZWRUeCkpIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJGYWlsZWQgR29vc2UgRWdnIENoZWNrXCIpO1xuICAgIH1cbiAgICByZXR1cm4gYnVpbHRVbnNpZ25lZFR4O1xuICB9XG5cbiAgLyoqXG4gICAqIEhlbHBlciBmdW5jdGlvbiB3aGljaCB0YWtlcyBhbiB1bnNpZ25lZCB0cmFuc2FjdGlvbiBhbmQgc2lnbnMgaXQsIHJldHVybmluZyB0aGUgcmVzdWx0aW5nIFtbVHhdXS5cbiAgKlxuICAqIEBwYXJhbSB1dHggVGhlIHVuc2lnbmVkIHRyYW5zYWN0aW9uIG9mIHR5cGUgW1tVbnNpZ25lZFR4XV1cbiAgKlxuICAqIEByZXR1cm5zIEEgc2lnbmVkIHRyYW5zYWN0aW9uIG9mIHR5cGUgW1tUeF1dXG4gICovXG4gIHNpZ25UeCA9ICh1dHg6VW5zaWduZWRUeCk6VHggPT4gdXR4LnNpZ24odGhpcy5rZXljaGFpbik7XG5cbiAgLyoqXG4gICAqIENhbGxzIHRoZSBub2RlJ3MgaXNzdWVUeCBtZXRob2QgZnJvbSB0aGUgQVBJIGFuZCByZXR1cm5zIHRoZSByZXN1bHRpbmcgdHJhbnNhY3Rpb24gSUQgYXMgYSBzdHJpbmcuXG4gICAqXG4gICAqIEBwYXJhbSB0eCBBIHN0cmluZywge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0sIG9yIFtbVHhdXSByZXByZXNlbnRpbmcgYSB0cmFuc2FjdGlvblxuICAgKlxuICAgKiBAcmV0dXJucyBBIFByb21pc2U8c3RyaW5nPiByZXByZXNlbnRpbmcgdGhlIHRyYW5zYWN0aW9uIElEIG9mIHRoZSBwb3N0ZWQgdHJhbnNhY3Rpb24uXG4gICAqL1xuICBpc3N1ZVR4ID0gYXN5bmMgKHR4OnN0cmluZyB8IEJ1ZmZlciB8IFR4KTpQcm9taXNlPHN0cmluZz4gPT4ge1xuICAgIGxldCBUcmFuc2FjdGlvbiA9ICcnO1xuICAgIGlmICh0eXBlb2YgdHggPT09ICdzdHJpbmcnKSB7XG4gICAgICBUcmFuc2FjdGlvbiA9IHR4O1xuICAgIH0gZWxzZSBpZiAodHggaW5zdGFuY2VvZiBCdWZmZXIpIHtcbiAgICAgIGNvbnN0IHR4b2JqOlR4ID0gbmV3IFR4KCk7XG4gICAgICB0eG9iai5mcm9tQnVmZmVyKHR4KTtcbiAgICAgIFRyYW5zYWN0aW9uID0gdHhvYmoudG9TdHJpbmcoKTtcbiAgICB9IGVsc2UgaWYgKHR4IGluc3RhbmNlb2YgVHgpIHtcbiAgICAgIFRyYW5zYWN0aW9uID0gdHgudG9TdHJpbmcoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgIHRocm93IG5ldyBFcnJvcignRXJyb3IgLSBhdm0uaXNzdWVUeDogcHJvdmlkZWQgdHggaXMgbm90IGV4cGVjdGVkIHR5cGUgb2Ygc3RyaW5nLCBCdWZmZXIsIG9yIFR4Jyk7XG4gICAgfVxuICAgIGNvbnN0IHBhcmFtczphbnkgPSB7XG4gICAgICB0eDogVHJhbnNhY3Rpb24udG9TdHJpbmcoKSxcbiAgICB9O1xuICAgIHJldHVybiB0aGlzLmNhbGxNZXRob2QoJ2F2bS5pc3N1ZVR4JywgcGFyYW1zKS50aGVuKChyZXNwb25zZTpSZXF1ZXN0UmVzcG9uc2VEYXRhKSA9PiByZXNwb25zZS5kYXRhLnJlc3VsdC50eElEKTtcbiAgfTtcblxuICAvKipcbiAgICogU2VuZHMgYW4gYW1vdW50IG9mIGFzc2V0SUQgdG8gdGhlIHNwZWNpZmllZCBhZGRyZXNzIGZyb20gYSBsaXN0IG9mIG93bmVkIG9mIGFkZHJlc3Nlcy5cbiAgICpcbiAgICogQHBhcmFtIHVzZXJuYW1lIFRoZSB1c2VyIHRoYXQgb3ducyB0aGUgcHJpdmF0ZSBrZXlzIGFzc29jaWF0ZWQgd2l0aCB0aGUgYGZyb21gIGFkZHJlc3Nlc1xuICAgKiBAcGFyYW0gcGFzc3dvcmQgVGhlIHBhc3N3b3JkIHVubG9ja2luZyB0aGUgdXNlclxuICAgKiBAcGFyYW0gYXNzZXRJRCBUaGUgYXNzZXRJRCBvZiB0aGUgYXNzZXQgdG8gc2VuZFxuICAgKiBAcGFyYW0gYW1vdW50IFRoZSBhbW91bnQgb2YgdGhlIGFzc2V0IHRvIGJlIHNlbnRcbiAgICogQHBhcmFtIHRvIFRoZSBhZGRyZXNzIG9mIHRoZSByZWNpcGllbnRcbiAgICogQHBhcmFtIGZyb20gT3B0aW9uYWwuIEFuIGFycmF5IG9mIGFkZHJlc3NlcyBtYW5hZ2VkIGJ5IHRoZSBub2RlJ3Mga2V5c3RvcmUgZm9yIHRoaXMgYmxvY2tjaGFpbiB3aGljaCB3aWxsIGZ1bmQgdGhpcyB0cmFuc2FjdGlvblxuICAgKiBAcGFyYW0gY2hhbmdlQWRkciBPcHRpb25hbC4gQW4gYWRkcmVzcyB0byBzZW5kIHRoZSBjaGFuZ2VcbiAgICogQHBhcmFtIG1lbW8gT3B0aW9uYWwuIENCNTggQnVmZmVyIG9yIFN0cmluZyB3aGljaCBjb250YWlucyBhcmJpdHJhcnkgYnl0ZXMsIHVwIHRvIDI1NiBieXRlc1xuICAgKlxuICAgKiBAcmV0dXJucyBQcm9taXNlIGZvciB0aGUgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgdHJhbnNhY3Rpb24ncyBJRC5cbiAgICovXG4gIHNlbmQgPSBhc3luYyAodXNlcm5hbWU6c3RyaW5nLCBwYXNzd29yZDpzdHJpbmcsIGFzc2V0SUQ6c3RyaW5nIHwgQnVmZmVyLCBhbW91bnQ6bnVtYmVyIHwgQk4sIHRvOnN0cmluZywgZnJvbTpBcnJheTxzdHJpbmc+IHwgQXJyYXk8QnVmZmVyPiA9IHVuZGVmaW5lZCwgY2hhbmdlQWRkcjpzdHJpbmcgPSB1bmRlZmluZWQsIG1lbW86c3RyaW5nIHwgQnVmZmVyID0gdW5kZWZpbmVkKTpQcm9taXNlPHt0eElEOiBzdHJpbmcsIGNoYW5nZUFkZHI6IHN0cmluZ30+ID0+IHtcbiAgICBsZXQgYXNzZXQ6c3RyaW5nO1xuICAgIGxldCBhbW50OkJOO1xuXG4gICAgaWYgKHR5cGVvZiB0aGlzLnBhcnNlQWRkcmVzcyh0bykgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBFcnJvciAtIEFWTUFQSS5zZW5kOiBJbnZhbGlkIGFkZHJlc3MgZm9ybWF0ICR7dG99YCk7XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBhc3NldElEICE9PSAnc3RyaW5nJykge1xuICAgICAgYXNzZXQgPSBiaW50b29scy5jYjU4RW5jb2RlKGFzc2V0SUQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBhc3NldCA9IGFzc2V0SUQ7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgYW1vdW50ID09PSAnbnVtYmVyJykge1xuICAgICAgYW1udCA9IG5ldyBCTihhbW91bnQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBhbW50ID0gYW1vdW50O1xuICAgIH1cblxuICAgIGNvbnN0IHBhcmFtczphbnkgPSB7XG4gICAgICB1c2VybmFtZTogdXNlcm5hbWUsXG4gICAgICBwYXNzd29yZDogcGFzc3dvcmQsXG4gICAgICBhc3NldElEOiBhc3NldCxcbiAgICAgIGFtb3VudDogYW1udC50b1N0cmluZygxMCksXG4gICAgICB0bzogdG9cbiAgICB9O1xuXG4gICAgZnJvbSA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5KGZyb20sICdzZW5kJyk7XG4gICAgaWYodHlwZW9mIGZyb20gIT09IFwidW5kZWZpbmVkXCIpe1xuICAgICAgcGFyYW1zW1wiZnJvbVwiXSA9IGZyb207XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBjaGFuZ2VBZGRyICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgaWYodHlwZW9mIHRoaXMucGFyc2VBZGRyZXNzKGNoYW5nZUFkZHIpID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEVycm9yIC0gQVZNQVBJLnNlbmQ6IEludmFsaWQgYWRkcmVzcyBmb3JtYXQgJHtjaGFuZ2VBZGRyfWApO1xuICAgICAgfVxuICAgICAgcGFyYW1zW1wiY2hhbmdlQWRkclwiXSA9IGNoYW5nZUFkZHI7XG4gICAgfSBcblxuICAgIGlmKHR5cGVvZiBtZW1vICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBpZih0eXBlb2YgbWVtbyAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgcGFyYW1zW1wibWVtb1wiXSA9IGJpbnRvb2xzLmNiNThFbmNvZGUobWVtbyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwYXJhbXNbXCJtZW1vXCJdID0gbWVtbztcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHRoaXMuY2FsbE1ldGhvZCgnYXZtLnNlbmQnLCBwYXJhbXMpLnRoZW4oKHJlc3BvbnNlOlJlcXVlc3RSZXNwb25zZURhdGEpID0+IHJlc3BvbnNlLmRhdGEucmVzdWx0KTtcbiAgfTtcblxuICAvKipcbiAgICogU2VuZHMgYW4gYW1vdW50IG9mIGFzc2V0SUQgdG8gYW4gYXJyYXkgb2Ygc3BlY2lmaWVkIGFkZHJlc3NlcyBmcm9tIGEgbGlzdCBvZiBvd25lZCBvZiBhZGRyZXNzZXMuXG4gICAqXG4gICAqIEBwYXJhbSB1c2VybmFtZSBUaGUgdXNlciB0aGF0IG93bnMgdGhlIHByaXZhdGUga2V5cyBhc3NvY2lhdGVkIHdpdGggdGhlIGBmcm9tYCBhZGRyZXNzZXNcbiAgICogQHBhcmFtIHBhc3N3b3JkIFRoZSBwYXNzd29yZCB1bmxvY2tpbmcgdGhlIHVzZXJcbiAgICogQHBhcmFtIHNlbmRPdXRwdXRzIFRoZSBhcnJheSBvZiBTZW5kT3V0cHV0cy4gQSBTZW5kT3V0cHV0IGlzIGFuIG9iamVjdCBsaXRlcmFsIHdoaWNoIGNvbnRhaW5zIGFuIGFzc2V0SUQsIGFtb3VudCwgYW5kIHRvLlxuICAgKiBAcGFyYW0gZnJvbSBPcHRpb25hbC4gQW4gYXJyYXkgb2YgYWRkcmVzc2VzIG1hbmFnZWQgYnkgdGhlIG5vZGUncyBrZXlzdG9yZSBmb3IgdGhpcyBibG9ja2NoYWluIHdoaWNoIHdpbGwgZnVuZCB0aGlzIHRyYW5zYWN0aW9uXG4gICAqIEBwYXJhbSBjaGFuZ2VBZGRyIE9wdGlvbmFsLiBBbiBhZGRyZXNzIHRvIHNlbmQgdGhlIGNoYW5nZVxuICAgKiBAcGFyYW0gbWVtbyBPcHRpb25hbC4gQ0I1OCBCdWZmZXIgb3IgU3RyaW5nIHdoaWNoIGNvbnRhaW5zIGFyYml0cmFyeSBieXRlcywgdXAgdG8gMjU2IGJ5dGVzXG4gICAqXG4gICAqIEByZXR1cm5zIFByb21pc2UgZm9yIHRoZSBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSB0cmFuc2FjdGlvbidzIElELlxuICAgKi9cbiAgc2VuZE11bHRpcGxlID0gYXN5bmMgKHVzZXJuYW1lOnN0cmluZywgcGFzc3dvcmQ6c3RyaW5nLCBcbiAgICAgIHNlbmRPdXRwdXRzOkFycmF5PHthc3NldElEOnN0cmluZyB8IEJ1ZmZlciwgYW1vdW50Om51bWJlciB8IEJOLCB0bzpzdHJpbmd9PiwgXG4gICAgICBmcm9tOkFycmF5PHN0cmluZz4gfCBBcnJheTxCdWZmZXI+ID0gdW5kZWZpbmVkLCBcbiAgICAgIGNoYW5nZUFkZHI6c3RyaW5nID0gdW5kZWZpbmVkLCBcbiAgICAgIG1lbW86c3RyaW5nIHwgQnVmZmVyID0gdW5kZWZpbmVkXG4gICAgKTpQcm9taXNlPHt0eElEOiBzdHJpbmcsIGNoYW5nZUFkZHI6IHN0cmluZ30+ID0+IHtcbiAgICBsZXQgYXNzZXQ6c3RyaW5nO1xuICAgIGxldCBhbW50OkJOO1xuICAgIGxldCBzT3V0cHV0czpBcnJheTx7YXNzZXRJRDpzdHJpbmcsIGFtb3VudDpzdHJpbmcsIHRvOnN0cmluZ30+ID0gW107XG5cbiAgICBzZW5kT3V0cHV0cy5mb3JFYWNoKChvdXRwdXQpID0+IHtcbiAgICAgIGlmICh0eXBlb2YgdGhpcy5wYXJzZUFkZHJlc3Mob3V0cHV0LnRvKSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBFcnJvciAtIEFWTUFQSS5zZW5kTXVsdGlwbGU6IEludmFsaWQgYWRkcmVzcyBmb3JtYXQgJHtvdXRwdXQudG99YCk7XG4gICAgICB9XG4gICAgICBpZiAodHlwZW9mIG91dHB1dC5hc3NldElEICE9PSAnc3RyaW5nJykge1xuICAgICAgICBhc3NldCA9IGJpbnRvb2xzLmNiNThFbmNvZGUob3V0cHV0LmFzc2V0SUQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXNzZXQgPSBvdXRwdXQuYXNzZXRJRDtcbiAgICAgIH1cbiAgICAgIGlmICh0eXBlb2Ygb3V0cHV0LmFtb3VudCA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgYW1udCA9IG5ldyBCTihvdXRwdXQuYW1vdW50KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGFtbnQgPSBvdXRwdXQuYW1vdW50O1xuICAgICAgfVxuICAgICAgc091dHB1dHMucHVzaCh7dG86IG91dHB1dC50bywgYXNzZXRJRDogYXNzZXQsIGFtb3VudDogYW1udC50b1N0cmluZygxMCl9KVxuICAgIH0pO1xuXG4gICAgY29uc3QgcGFyYW1zOmFueSA9IHtcbiAgICAgIHVzZXJuYW1lOiB1c2VybmFtZSxcbiAgICAgIHBhc3N3b3JkOiBwYXNzd29yZCxcbiAgICAgIG91dHB1dHM6IHNPdXRwdXRzLFxuICAgIH07XG5cbiAgICBmcm9tID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXkoZnJvbSwgJ3NlbmQnKTtcbiAgICBpZih0eXBlb2YgZnJvbSAhPT0gXCJ1bmRlZmluZWRcIil7XG4gICAgICBwYXJhbXNbXCJmcm9tXCJdID0gZnJvbTtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGNoYW5nZUFkZHIgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICBpZih0eXBlb2YgdGhpcy5wYXJzZUFkZHJlc3MoY2hhbmdlQWRkcikgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgRXJyb3IgLSBBVk1BUEkuc2VuZDogSW52YWxpZCBhZGRyZXNzIGZvcm1hdCAke2NoYW5nZUFkZHJ9YCk7XG4gICAgICB9XG4gICAgICBwYXJhbXNbXCJjaGFuZ2VBZGRyXCJdID0gY2hhbmdlQWRkcjtcbiAgICB9IFxuXG4gICAgaWYodHlwZW9mIG1lbW8gIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIGlmKHR5cGVvZiBtZW1vICE9PSAnc3RyaW5nJykge1xuICAgICAgICBwYXJhbXNbXCJtZW1vXCJdID0gYmludG9vbHMuY2I1OEVuY29kZShtZW1vKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBhcmFtc1tcIm1lbW9cIl0gPSBtZW1vO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICByZXR1cm4gdGhpcy5jYWxsTWV0aG9kKCdhdm0uc2VuZE11bHRpcGxlJywgcGFyYW1zKS50aGVuKChyZXNwb25zZTpSZXF1ZXN0UmVzcG9uc2VEYXRhKSA9PiByZXNwb25zZS5kYXRhLnJlc3VsdCk7XG4gIH07XG5cbiAgLyoqXG4gICAqIEdpdmVuIGEgSlNPTiByZXByZXNlbnRhdGlvbiBvZiB0aGlzIFZpcnR1YWwgTWFjaGluZeKAmXMgZ2VuZXNpcyBzdGF0ZSwgY3JlYXRlIHRoZSBieXRlIHJlcHJlc2VudGF0aW9uIG9mIHRoYXQgc3RhdGUuXG4gICAqXG4gICAqIEBwYXJhbSBnZW5lc2lzRGF0YSBUaGUgYmxvY2tjaGFpbidzIGdlbmVzaXMgZGF0YSBvYmplY3RcbiAgICpcbiAgICogQHJldHVybnMgUHJvbWlzZSBvZiBhIHN0cmluZyBvZiBieXRlc1xuICAgKi9cbiAgYnVpbGRHZW5lc2lzID0gYXN5bmMgKGdlbmVzaXNEYXRhOm9iamVjdCk6UHJvbWlzZTxzdHJpbmc+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6YW55ID0ge1xuICAgICAgZ2VuZXNpc0RhdGEsXG4gICAgfTtcbiAgICByZXR1cm4gdGhpcy5jYWxsTWV0aG9kKCdhdm0uYnVpbGRHZW5lc2lzJywgcGFyYW1zKS50aGVuKChyZXNwb25zZTpSZXF1ZXN0UmVzcG9uc2VEYXRhKSA9PiB7XG4gICAgICBjb25zdCByID0gcmVzcG9uc2UuZGF0YS5yZXN1bHQuYnl0ZXM7XG4gICAgICByZXR1cm4gcjtcbiAgICB9KTtcbiAgfTtcblxuICAvKipcbiAgICogQGlnbm9yZVxuICAgKi9cbiAgcHJvdGVjdGVkIF9jbGVhbkFkZHJlc3NBcnJheShhZGRyZXNzZXM6QXJyYXk8c3RyaW5nPiB8IEFycmF5PEJ1ZmZlcj4sIGNhbGxlcjpzdHJpbmcpOkFycmF5PHN0cmluZz4ge1xuICAgIGNvbnN0IGFkZHJzOkFycmF5PHN0cmluZz4gPSBbXTtcbiAgICBjb25zdCBjaGFpbmlkOnN0cmluZyA9IHRoaXMuZ2V0QmxvY2tjaGFpbkFsaWFzKCkgPyB0aGlzLmdldEJsb2NrY2hhaW5BbGlhcygpIDogdGhpcy5nZXRCbG9ja2NoYWluSUQoKTtcbiAgICBpZiAoYWRkcmVzc2VzICYmIGFkZHJlc3Nlcy5sZW5ndGggPiAwKSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFkZHJlc3Nlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAodHlwZW9mIGFkZHJlc3Nlc1tpXSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICBpZiAodHlwZW9mIHRoaXMucGFyc2VBZGRyZXNzKGFkZHJlc3Nlc1tpXSBhcyBzdHJpbmcpID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgRXJyb3IgLSBBVk1BUEkuJHtjYWxsZXJ9OiBJbnZhbGlkIGFkZHJlc3MgZm9ybWF0ICR7YWRkcmVzc2VzW2ldfWApO1xuICAgICAgICAgIH1cbiAgICAgICAgICBhZGRycy5wdXNoKGFkZHJlc3Nlc1tpXSBhcyBzdHJpbmcpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGFkZHJzLnB1c2goYmludG9vbHMuYWRkcmVzc1RvU3RyaW5nKHRoaXMuY29yZS5nZXRIUlAoKSwgY2hhaW5pZCwgYWRkcmVzc2VzW2ldIGFzIEJ1ZmZlcikpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBhZGRycztcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGlzIGNsYXNzIHNob3VsZCBub3QgYmUgaW5zdGFudGlhdGVkIGRpcmVjdGx5LiBJbnN0ZWFkIHVzZSB0aGUgW1tBdmFsYW5jaGUuYWRkQVBJXV0gbWV0aG9kLlxuICAgKlxuICAgKiBAcGFyYW0gY29yZSBBIHJlZmVyZW5jZSB0byB0aGUgQXZhbGFuY2hlIGNsYXNzXG4gICAqIEBwYXJhbSBiYXNldXJsIERlZmF1bHRzIHRvIHRoZSBzdHJpbmcgXCIvZXh0L2JjL1hcIiBhcyB0aGUgcGF0aCB0byBibG9ja2NoYWluJ3MgYmFzZXVybFxuICAgKiBAcGFyYW0gYmxvY2tjaGFpbklEIFRoZSBCbG9ja2NoYWluJ3MgSUQuIERlZmF1bHRzIHRvIGFuIGVtcHR5IHN0cmluZzogJydcbiAgICovXG4gIGNvbnN0cnVjdG9yKGNvcmU6QXZhbGFuY2hlQ29yZSwgYmFzZXVybDpzdHJpbmcgPSAnL2V4dC9iYy9YJywgYmxvY2tjaGFpbklEOnN0cmluZyA9ICcnKSB7XG4gICAgc3VwZXIoY29yZSwgYmFzZXVybCk7XG4gICAgdGhpcy5ibG9ja2NoYWluSUQgPSBibG9ja2NoYWluSUQ7XG4gICAgY29uc3QgbmV0aWQ6bnVtYmVyID0gY29yZS5nZXROZXR3b3JrSUQoKTtcbiAgICBpZiAobmV0aWQgaW4gRGVmYXVsdHMubmV0d29yayAmJiBibG9ja2NoYWluSUQgaW4gRGVmYXVsdHMubmV0d29ya1tuZXRpZF0pIHtcbiAgICAgIGNvbnN0IHsgYWxpYXMgfSA9IERlZmF1bHRzLm5ldHdvcmtbbmV0aWRdW2Jsb2NrY2hhaW5JRF07XG4gICAgICB0aGlzLmtleWNoYWluID0gbmV3IEtleUNoYWluKHRoaXMuY29yZS5nZXRIUlAoKSwgYWxpYXMpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmtleWNoYWluID0gbmV3IEtleUNoYWluKHRoaXMuY29yZS5nZXRIUlAoKSwgYmxvY2tjaGFpbklEKTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==