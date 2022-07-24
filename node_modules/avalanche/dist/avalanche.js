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
/**
 * @packageDocumentation
 * @module AvalancheCore
 */
const axios_1 = __importDefault(require("axios"));
const apibase_1 = require("./common/apibase");
const helperfunctions_1 = require("./utils/helperfunctions");
/**
 * AvalancheCore is middleware for interacting with Avalanche node RPC APIs.
 *
 * Example usage:
 * ```js
 * let avalanche = new AvalancheCore("127.0.0.1", 9650, "https");
 * ```
 *
 */
class AvalancheCore {
    /**
     * Creates a new Avalanche instance. Sets the address and port of the main Avalanche Client.
     *
     * @param ip The hostname to resolve to reach the Avalanche Client APIs
     * @param port The port to resolve to reach the Avalanche Client APIs
     * @param protocol The protocol string to use before a "://" in a request, ex: "http", "https", "git", "ws", etc ...
     */
    constructor(ip, port, protocol = 'http') {
        this.networkID = 0;
        this.hrp = '';
        this.auth = undefined;
        this.apis = {};
        /**
           * Sets the address and port of the main Avalanche Client.
           *
           * @param ip The hostname to resolve to reach the Avalanche Client RPC APIs
           * @param port The port to resolve to reach the Avalanche Client RPC APIs
           * @param protocol The protocol string to use before a "://" in a request,
           * ex: "http", "https", "git", "ws", etc ...
           */
        this.setAddress = (ip, port, protocol = 'http') => {
            this.ip = ip;
            this.port = port;
            this.protocol = protocol;
            this.url = `${protocol}://${ip}:${port}`;
        };
        /**
           * Returns the protocol such as "http", "https", "git", "ws", etc.
           */
        this.getProtocol = () => this.protocol;
        /**
           * Returns the IP for the Avalanche node.
           */
        this.getIP = () => this.ip;
        /**
           * Returns the port for the Avalanche node.
           */
        this.getPort = () => this.port;
        /**
           * Returns the URL of the Avalanche node (ip + port);
           */
        this.getURL = () => this.url;
        /**
           * Returns the networkID;
           */
        this.getNetworkID = () => this.networkID;
        /**
           * Sets the networkID
           */
        this.setNetworkID = (netid) => {
            this.networkID = netid;
            this.hrp = helperfunctions_1.getPreferredHRP(this.networkID);
        };
        /**
         * Returns the Human-Readable-Part of the network associated with this key.
         *
         * @returns The [[KeyPair]]'s Human-Readable-Part of the network's Bech32 addressing scheme
         */
        this.getHRP = () => this.hrp;
        /**
         * Sets the the Human-Readable-Part of the network associated with this key.
         *
         * @param hrp String for the Human-Readable-Part of Bech32 addresses
         */
        this.setHRP = (hrp) => {
            this.hrp = hrp;
        };
        /**
         * Sets the temporary auth token used for communicating with the node.
         *
         * @param auth A temporary token provided by the node enabling access to the endpoints on the node.
         */
        this.setAuthToken = (auth) => {
            this.auth = auth;
        };
        this._setHeaders = (headers) => {
            if (typeof this.auth === "string") {
                headers["Authorization"] = "Bearer " + this.auth;
            }
            return headers;
        };
        /**
         * Adds an API to the middleware. The API resolves to a registered blockchain's RPC.
         *
         * In TypeScript:
         * ```js
         * avalanche.addAPI<MyVMClass>("mychain", MyVMClass, "/ext/bc/mychain");
         * ```
         *
         * In Javascript:
         * ```js
         * avalanche.addAPI("mychain", MyVMClass, "/ext/bc/mychain");
         * ```
         *
         * @typeparam GA Class of the API being added
         * @param apiName A label for referencing the API in the future
         * @param ConstructorFN A reference to the class which instantiates the API
         * @param baseurl Path to resolve to reach the API
         *
         */
        this.addAPI = (apiName, ConstructorFN, baseurl = undefined, ...args) => {
            if (typeof baseurl === 'undefined') {
                this.apis[apiName] = new ConstructorFN(this, undefined, ...args);
            }
            else {
                this.apis[apiName] = new ConstructorFN(this, baseurl, ...args);
            }
        };
        /**
         * Retrieves a reference to an API by its apiName label.
         *
         * @param apiName Name of the API to return
         */
        this.api = (apiName) => this.apis[apiName];
        /**
         * @ignore
         */
        this._request = (xhrmethod, baseurl, getdata, postdata, headers = {}, axiosConfig = undefined) => __awaiter(this, void 0, void 0, function* () {
            let config;
            if (axiosConfig) {
                config = axiosConfig;
            }
            else {
                config = {
                    baseURL: `${this.protocol}://${this.ip}:${this.port}`,
                    responseType: 'text',
                };
            }
            config.url = baseurl;
            config.method = xhrmethod;
            config.headers = headers;
            config.data = postdata;
            config.params = getdata;
            return axios_1.default.request(config).then((resp) => {
                // purging all that is axios
                const xhrdata = new apibase_1.RequestResponseData();
                xhrdata.data = resp.data;
                xhrdata.headers = resp.headers;
                xhrdata.request = resp.request;
                xhrdata.status = resp.status;
                xhrdata.statusText = resp.statusText;
                return xhrdata;
            });
        });
        /**
         * Makes a GET call to an API.
         *
         * @param baseurl Path to the api
         * @param getdata Object containing the key value pairs sent in GET
         * @param parameters Object containing the parameters of the API call
         * @param headers An array HTTP Request Headers
         * @param axiosConfig Configuration for the axios javascript library that will be the
         * foundation for the rest of the parameters
         *
         * @returns A promise for [[RequestResponseData]]
         */
        this.get = (baseurl, getdata, headers = {}, axiosConfig = undefined) => this._request('GET', baseurl, getdata, {}, this._setHeaders(headers), axiosConfig);
        /**
         * Makes a DELETE call to an API.
         *
         * @param baseurl Path to the API
         * @param getdata Object containing the key value pairs sent in DELETE
         * @param parameters Object containing the parameters of the API call
         * @param headers An array HTTP Request Headers
         * @param axiosConfig Configuration for the axios javascript library that will be the
         * foundation for the rest of the parameters
         *
         * @returns A promise for [[RequestResponseData]]
         */
        this.delete = (baseurl, getdata, headers = {}, axiosConfig = undefined) => this._request('DELETE', baseurl, getdata, {}, this._setHeaders(headers), axiosConfig);
        /**
         * Makes a POST call to an API.
         *
         * @param baseurl Path to the API
         * @param getdata Object containing the key value pairs sent in POST
         * @param postdata Object containing the key value pairs sent in POST
         * @param parameters Object containing the parameters of the API call
         * @param headers An array HTTP Request Headers
         * @param axiosConfig Configuration for the axios javascript library that will be the
         * foundation for the rest of the parameters
         *
         * @returns A promise for [[RequestResponseData]]
         */
        this.post = (baseurl, getdata, postdata, headers = {}, axiosConfig = undefined) => this._request('POST', baseurl, getdata, postdata, this._setHeaders(headers), axiosConfig);
        /**
         * Makes a PUT call to an API.
         *
         * @param baseurl Path to the baseurl
         * @param getdata Object containing the key value pairs sent in PUT
         * @param postdata Object containing the key value pairs sent in PUT
         * @param parameters Object containing the parameters of the API call
         * @param headers An array HTTP Request Headers
         * @param axiosConfig Configuration for the axios javascript library that will be the
         * foundation for the rest of the parameters
         *
         * @returns A promise for [[RequestResponseData]]
         */
        this.put = (baseurl, getdata, postdata, headers = {}, axiosConfig = undefined) => this._request('PUT', baseurl, getdata, postdata, this._setHeaders(headers), axiosConfig);
        /**
         * Makes a PATCH call to an API.
         *
         * @param baseurl Path to the baseurl
         * @param getdata Object containing the key value pairs sent in PATCH
         * @param postdata Object containing the key value pairs sent in PATCH
         * @param parameters Object containing the parameters of the API call
         * @param headers An array HTTP Request Headers
         * @param axiosConfig Configuration for the axios javascript library that will be the
         * foundation for the rest of the parameters
         *
         * @returns A promise for [[RequestResponseData]]
         */
        this.patch = (baseurl, getdata, postdata, headers = {}, axiosConfig = undefined) => this._request('PATCH', baseurl, getdata, postdata, this._setHeaders(headers), axiosConfig);
        this.setAddress(ip, port, protocol);
    }
}
exports.default = AvalancheCore;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXZhbGFuY2hlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2F2YWxhbmNoZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUFBOzs7R0FHRztBQUNILGtEQUF5RTtBQUN6RSw4Q0FBZ0U7QUFDaEUsNkRBQTBEO0FBRTFEOzs7Ozs7OztHQVFHO0FBQ0gsTUFBcUIsYUFBYTtJQWtTaEM7Ozs7OztPQU1HO0lBQ0gsWUFBWSxFQUFTLEVBQUUsSUFBVyxFQUFFLFdBQWtCLE1BQU07UUF4U2xELGNBQVMsR0FBVSxDQUFDLENBQUM7UUFFckIsUUFBRyxHQUFVLEVBQUUsQ0FBQztRQVVoQixTQUFJLEdBQVUsU0FBUyxDQUFDO1FBRXhCLFNBQUksR0FBNEIsRUFBRSxDQUFDO1FBRTdDOzs7Ozs7O2FBT0s7UUFDTCxlQUFVLEdBQUcsQ0FBQyxFQUFTLEVBQUUsSUFBVyxFQUFFLFdBQWtCLE1BQU0sRUFBRSxFQUFFO1lBQ2hFLElBQUksQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDO1lBQ2IsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7WUFDakIsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7WUFDekIsSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLFFBQVEsTUFBTSxFQUFFLElBQUksSUFBSSxFQUFFLENBQUM7UUFDM0MsQ0FBQyxDQUFDO1FBRUY7O2FBRUs7UUFDTCxnQkFBVyxHQUFHLEdBQVUsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUM7UUFFekM7O2FBRUs7UUFDTCxVQUFLLEdBQUcsR0FBVSxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztRQUU3Qjs7YUFFSztRQUNMLFlBQU8sR0FBRyxHQUFVLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO1FBRWpDOzthQUVLO1FBQ0wsV0FBTSxHQUFHLEdBQVUsRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUM7UUFFL0I7O2FBRUs7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T0FBTyxDQUFDLEVBQ3pCLFdBQVcsQ0FBQyxDQUFDO1FBRWY7Ozs7Ozs7Ozs7OztXQVlHO1FBQ0gsUUFBRyxHQUFHLENBQUMsT0FBYyxFQUNuQixPQUFjLEVBQ2QsUUFBd0QsRUFDeEQsVUFBaUIsRUFBRSxFQUNuQixjQUFpQyxTQUFTLEVBQ2IsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUNuRCxPQUFPLEVBQ1AsT0FBTyxFQUNQLFFBQVEsRUFDUixJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxFQUN6QixXQUFXLENBQUMsQ0FBQztRQUVmOzs7Ozs7Ozs7Ozs7V0FZRztRQUNILFVBQUssR0FBRyxDQUFDLE9BQWMsRUFDckIsT0FBYyxFQUNkLFFBQXdELEVBQ3hELFVBQWlCLEVBQUUsRUFDbkIsY0FBaUMsU0FBUyxFQUNiLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFDckQsT0FBTyxFQUNQLE9BQU8sRUFDUCxRQUFRLEVBQ1IsSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsRUFDekIsV0FBVyxDQUFDLENBQUM7UUFVYixJQUFJLENBQUMsVUFBVSxDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDdEMsQ0FBQztDQUNGO0FBNVNELGdDQTRTQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQHBhY2thZ2VEb2N1bWVudGF0aW9uXG4gKiBAbW9kdWxlIEF2YWxhbmNoZUNvcmVcbiAqL1xuaW1wb3J0IGF4aW9zLCB7IEF4aW9zUmVxdWVzdENvbmZpZywgQXhpb3NSZXNwb25zZSwgTWV0aG9kIH0gZnJvbSAnYXhpb3MnO1xuaW1wb3J0IHsgQVBJQmFzZSwgUmVxdWVzdFJlc3BvbnNlRGF0YSB9IGZyb20gJy4vY29tbW9uL2FwaWJhc2UnO1xuaW1wb3J0IHsgZ2V0UHJlZmVycmVkSFJQIH0gZnJvbSAnLi91dGlscy9oZWxwZXJmdW5jdGlvbnMnO1xuXG4vKipcbiAqIEF2YWxhbmNoZUNvcmUgaXMgbWlkZGxld2FyZSBmb3IgaW50ZXJhY3Rpbmcgd2l0aCBBdmFsYW5jaGUgbm9kZSBSUEMgQVBJcy5cbiAqXG4gKiBFeGFtcGxlIHVzYWdlOlxuICogYGBganNcbiAqIGxldCBhdmFsYW5jaGUgPSBuZXcgQXZhbGFuY2hlQ29yZShcIjEyNy4wLjAuMVwiLCA5NjUwLCBcImh0dHBzXCIpO1xuICogYGBgXG4gKlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBBdmFsYW5jaGVDb3JlIHtcbiAgcHJvdGVjdGVkIG5ldHdvcmtJRDpudW1iZXIgPSAwO1xuXG4gIHByb3RlY3RlZCBocnA6c3RyaW5nID0gJyc7XG5cbiAgcHJvdGVjdGVkIHByb3RvY29sOnN0cmluZztcblxuICBwcm90ZWN0ZWQgaXA6c3RyaW5nO1xuXG4gIHByb3RlY3RlZCBwb3J0Om51bWJlcjtcblxuICBwcm90ZWN0ZWQgdXJsOnN0cmluZztcblxuICBwcm90ZWN0ZWQgYXV0aDpzdHJpbmcgPSB1bmRlZmluZWQ7XG5cbiAgcHJvdGVjdGVkIGFwaXM6eyBbazogc3RyaW5nXTogQVBJQmFzZSB9ID0ge307XG5cbiAgLyoqXG4gICAgICogU2V0cyB0aGUgYWRkcmVzcyBhbmQgcG9ydCBvZiB0aGUgbWFpbiBBdmFsYW5jaGUgQ2xpZW50LlxuICAgICAqXG4gICAgICogQHBhcmFtIGlwIFRoZSBob3N0bmFtZSB0byByZXNvbHZlIHRvIHJlYWNoIHRoZSBBdmFsYW5jaGUgQ2xpZW50IFJQQyBBUElzXG4gICAgICogQHBhcmFtIHBvcnQgVGhlIHBvcnQgdG8gcmVzb2x2ZSB0byByZWFjaCB0aGUgQXZhbGFuY2hlIENsaWVudCBSUEMgQVBJc1xuICAgICAqIEBwYXJhbSBwcm90b2NvbCBUaGUgcHJvdG9jb2wgc3RyaW5nIHRvIHVzZSBiZWZvcmUgYSBcIjovL1wiIGluIGEgcmVxdWVzdCxcbiAgICAgKiBleDogXCJodHRwXCIsIFwiaHR0cHNcIiwgXCJnaXRcIiwgXCJ3c1wiLCBldGMgLi4uXG4gICAgICovXG4gIHNldEFkZHJlc3MgPSAoaXA6c3RyaW5nLCBwb3J0Om51bWJlciwgcHJvdG9jb2w6c3RyaW5nID0gJ2h0dHAnKSA9PiB7XG4gICAgdGhpcy5pcCA9IGlwO1xuICAgIHRoaXMucG9ydCA9IHBvcnQ7XG4gICAgdGhpcy5wcm90b2NvbCA9IHByb3RvY29sO1xuICAgIHRoaXMudXJsID0gYCR7cHJvdG9jb2x9Oi8vJHtpcH06JHtwb3J0fWA7XG4gIH07XG5cbiAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgcHJvdG9jb2wgc3VjaCBhcyBcImh0dHBcIiwgXCJodHRwc1wiLCBcImdpdFwiLCBcIndzXCIsIGV0Yy5cbiAgICAgKi9cbiAgZ2V0UHJvdG9jb2wgPSAoKTpzdHJpbmcgPT4gdGhpcy5wcm90b2NvbDtcblxuICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBJUCBmb3IgdGhlIEF2YWxhbmNoZSBub2RlLlxuICAgICAqL1xuICBnZXRJUCA9ICgpOnN0cmluZyA9PiB0aGlzLmlwO1xuXG4gIC8qKlxuICAgICAqIFJldHVybnMgdGhlIHBvcnQgZm9yIHRoZSBBdmFsYW5jaGUgbm9kZS5cbiAgICAgKi9cbiAgZ2V0UG9ydCA9ICgpOm51bWJlciA9PiB0aGlzLnBvcnQ7XG5cbiAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgVVJMIG9mIHRoZSBBdmFsYW5jaGUgbm9kZSAoaXAgKyBwb3J0KTtcbiAgICAgKi9cbiAgZ2V0VVJMID0gKCk6c3RyaW5nID0+IHRoaXMudXJsO1xuXG4gIC8qKlxuICAgICAqIFJldHVybnMgdGhlIG5ldHdvcmtJRDtcbiAgICAgKi9cbiAgZ2V0TmV0d29ya0lEID0gKCk6bnVtYmVyID0+IHRoaXMubmV0d29ya0lEO1xuXG4gIC8qKlxuICAgICAqIFNldHMgdGhlIG5ldHdvcmtJRFxuICAgICAqL1xuICBzZXROZXR3b3JrSUQgPSAobmV0aWQ6bnVtYmVyKSA9PiB7XG4gICAgdGhpcy5uZXR3b3JrSUQgPSBuZXRpZDtcbiAgICB0aGlzLmhycCA9IGdldFByZWZlcnJlZEhSUCh0aGlzLm5ldHdvcmtJRCk7XG4gIH07XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIEh1bWFuLVJlYWRhYmxlLVBhcnQgb2YgdGhlIG5ldHdvcmsgYXNzb2NpYXRlZCB3aXRoIHRoaXMga2V5LlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgW1tLZXlQYWlyXV0ncyBIdW1hbi1SZWFkYWJsZS1QYXJ0IG9mIHRoZSBuZXR3b3JrJ3MgQmVjaDMyIGFkZHJlc3Npbmcgc2NoZW1lXG4gICAqL1xuICBnZXRIUlAgPSAoKTpzdHJpbmcgPT4gdGhpcy5ocnA7XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHRoZSBIdW1hbi1SZWFkYWJsZS1QYXJ0IG9mIHRoZSBuZXR3b3JrIGFzc29jaWF0ZWQgd2l0aCB0aGlzIGtleS5cbiAgICpcbiAgICogQHBhcmFtIGhycCBTdHJpbmcgZm9yIHRoZSBIdW1hbi1SZWFkYWJsZS1QYXJ0IG9mIEJlY2gzMiBhZGRyZXNzZXNcbiAgICovXG4gIHNldEhSUCA9IChocnA6c3RyaW5nKTp2b2lkID0+IHtcbiAgICB0aGlzLmhycCA9IGhycDtcbiAgfTtcblxuICAvKipcbiAgICogU2V0cyB0aGUgdGVtcG9yYXJ5IGF1dGggdG9rZW4gdXNlZCBmb3IgY29tbXVuaWNhdGluZyB3aXRoIHRoZSBub2RlLlxuICAgKiBcbiAgICogQHBhcmFtIGF1dGggQSB0ZW1wb3JhcnkgdG9rZW4gcHJvdmlkZWQgYnkgdGhlIG5vZGUgZW5hYmxpbmcgYWNjZXNzIHRvIHRoZSBlbmRwb2ludHMgb24gdGhlIG5vZGUuXG4gICAqL1xuICBzZXRBdXRoVG9rZW4gPSAoYXV0aDpzdHJpbmcpOnZvaWQgPT4ge1xuICAgIHRoaXMuYXV0aCA9IGF1dGg7XG4gIH1cblxuICBwcm90ZWN0ZWQgX3NldEhlYWRlcnMgPSAoaGVhZGVyczpvYmplY3QpOm9iamVjdCA9PiB7XG4gICAgaWYodHlwZW9mIHRoaXMuYXV0aCA9PT0gXCJzdHJpbmdcIil7XG4gICAgICBoZWFkZXJzW1wiQXV0aG9yaXphdGlvblwiXSA9IFwiQmVhcmVyIFwiICsgdGhpcy5hdXRoO1xuICAgIH1cbiAgICByZXR1cm4gaGVhZGVycztcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGFuIEFQSSB0byB0aGUgbWlkZGxld2FyZS4gVGhlIEFQSSByZXNvbHZlcyB0byBhIHJlZ2lzdGVyZWQgYmxvY2tjaGFpbidzIFJQQy5cbiAgICpcbiAgICogSW4gVHlwZVNjcmlwdDpcbiAgICogYGBganNcbiAgICogYXZhbGFuY2hlLmFkZEFQSTxNeVZNQ2xhc3M+KFwibXljaGFpblwiLCBNeVZNQ2xhc3MsIFwiL2V4dC9iYy9teWNoYWluXCIpO1xuICAgKiBgYGBcbiAgICpcbiAgICogSW4gSmF2YXNjcmlwdDpcbiAgICogYGBganNcbiAgICogYXZhbGFuY2hlLmFkZEFQSShcIm15Y2hhaW5cIiwgTXlWTUNsYXNzLCBcIi9leHQvYmMvbXljaGFpblwiKTtcbiAgICogYGBgXG4gICAqXG4gICAqIEB0eXBlcGFyYW0gR0EgQ2xhc3Mgb2YgdGhlIEFQSSBiZWluZyBhZGRlZFxuICAgKiBAcGFyYW0gYXBpTmFtZSBBIGxhYmVsIGZvciByZWZlcmVuY2luZyB0aGUgQVBJIGluIHRoZSBmdXR1cmVcbiAgICogQHBhcmFtIENvbnN0cnVjdG9yRk4gQSByZWZlcmVuY2UgdG8gdGhlIGNsYXNzIHdoaWNoIGluc3RhbnRpYXRlcyB0aGUgQVBJXG4gICAqIEBwYXJhbSBiYXNldXJsIFBhdGggdG8gcmVzb2x2ZSB0byByZWFjaCB0aGUgQVBJXG4gICAqXG4gICAqL1xuICBhZGRBUEkgPSA8R0EgZXh0ZW5kcyBBUElCYXNlPihhcGlOYW1lOnN0cmluZyxcbiAgICBDb25zdHJ1Y3RvckZOOiBuZXcoYXZheDpBdmFsYW5jaGVDb3JlLCBiYXNldXJsPzpzdHJpbmcsIC4uLmFyZ3M6QXJyYXk8YW55PikgPT4gR0EsXG4gICAgYmFzZXVybDpzdHJpbmcgPSB1bmRlZmluZWQsXG4gICAgLi4uYXJnczpBcnJheTxhbnk+KSA9PiB7XG4gICAgaWYgKHR5cGVvZiBiYXNldXJsID09PSAndW5kZWZpbmVkJykge1xuICAgICAgdGhpcy5hcGlzW2FwaU5hbWVdID0gbmV3IENvbnN0cnVjdG9yRk4odGhpcywgdW5kZWZpbmVkLCAuLi5hcmdzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5hcGlzW2FwaU5hbWVdID0gbmV3IENvbnN0cnVjdG9yRk4odGhpcywgYmFzZXVybCwgLi4uYXJncyk7XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZXMgYSByZWZlcmVuY2UgdG8gYW4gQVBJIGJ5IGl0cyBhcGlOYW1lIGxhYmVsLlxuICAgKlxuICAgKiBAcGFyYW0gYXBpTmFtZSBOYW1lIG9mIHRoZSBBUEkgdG8gcmV0dXJuXG4gICAqL1xuICBhcGkgPSA8R0EgZXh0ZW5kcyBBUElCYXNlPihhcGlOYW1lOnN0cmluZyk6IEdBID0+IHRoaXMuYXBpc1thcGlOYW1lXSBhcyBHQTtcblxuICAvKipcbiAgICogQGlnbm9yZVxuICAgKi9cbiAgcHJvdGVjdGVkIF9yZXF1ZXN0ID0gYXN5bmMgKHhocm1ldGhvZDpNZXRob2QsXG4gICAgYmFzZXVybDpzdHJpbmcsXG4gICAgZ2V0ZGF0YTpvYmplY3QsXG4gICAgcG9zdGRhdGE6c3RyaW5nIHwgb2JqZWN0IHwgQXJyYXlCdWZmZXIgfCBBcnJheUJ1ZmZlclZpZXcsXG4gICAgaGVhZGVyczpvYmplY3QgPSB7fSxcbiAgICBheGlvc0NvbmZpZzpBeGlvc1JlcXVlc3RDb25maWcgPSB1bmRlZmluZWQpOiBQcm9taXNlPFJlcXVlc3RSZXNwb25zZURhdGE+ID0+IHtcbiAgICBsZXQgY29uZmlnOkF4aW9zUmVxdWVzdENvbmZpZztcbiAgICBpZiAoYXhpb3NDb25maWcpIHtcbiAgICAgIGNvbmZpZyA9IGF4aW9zQ29uZmlnO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25maWcgPSB7XG4gICAgICAgIGJhc2VVUkw6IGAke3RoaXMucHJvdG9jb2x9Oi8vJHt0aGlzLmlwfToke3RoaXMucG9ydH1gLFxuICAgICAgICByZXNwb25zZVR5cGU6ICd0ZXh0JyxcbiAgICAgIH07XG4gICAgfVxuICAgIGNvbmZpZy51cmwgPSBiYXNldXJsO1xuICAgIGNvbmZpZy5tZXRob2QgPSB4aHJtZXRob2Q7XG4gICAgY29uZmlnLmhlYWRlcnMgPSBoZWFkZXJzO1xuICAgIGNvbmZpZy5kYXRhID0gcG9zdGRhdGE7XG4gICAgY29uZmlnLnBhcmFtcyA9IGdldGRhdGE7XG4gICAgcmV0dXJuIGF4aW9zLnJlcXVlc3QoY29uZmlnKS50aGVuKChyZXNwOkF4aW9zUmVzcG9uc2U8YW55PikgPT4ge1xuICAgICAgLy8gcHVyZ2luZyBhbGwgdGhhdCBpcyBheGlvc1xuICAgICAgY29uc3QgeGhyZGF0YTpSZXF1ZXN0UmVzcG9uc2VEYXRhID0gbmV3IFJlcXVlc3RSZXNwb25zZURhdGEoKTtcbiAgICAgIHhocmRhdGEuZGF0YSA9IHJlc3AuZGF0YTtcbiAgICAgIHhocmRhdGEuaGVhZGVycyA9IHJlc3AuaGVhZGVycztcbiAgICAgIHhocmRhdGEucmVxdWVzdCA9IHJlc3AucmVxdWVzdDtcbiAgICAgIHhocmRhdGEuc3RhdHVzID0gcmVzcC5zdGF0dXM7XG4gICAgICB4aHJkYXRhLnN0YXR1c1RleHQgPSByZXNwLnN0YXR1c1RleHQ7XG4gICAgICByZXR1cm4geGhyZGF0YTtcbiAgICB9KTtcbiAgfTtcblxuICAvKipcbiAgICogTWFrZXMgYSBHRVQgY2FsbCB0byBhbiBBUEkuXG4gICAqXG4gICAqIEBwYXJhbSBiYXNldXJsIFBhdGggdG8gdGhlIGFwaVxuICAgKiBAcGFyYW0gZ2V0ZGF0YSBPYmplY3QgY29udGFpbmluZyB0aGUga2V5IHZhbHVlIHBhaXJzIHNlbnQgaW4gR0VUXG4gICAqIEBwYXJhbSBwYXJhbWV0ZXJzIE9iamVjdCBjb250YWluaW5nIHRoZSBwYXJhbWV0ZXJzIG9mIHRoZSBBUEkgY2FsbFxuICAgKiBAcGFyYW0gaGVhZGVycyBBbiBhcnJheSBIVFRQIFJlcXVlc3QgSGVhZGVyc1xuICAgKiBAcGFyYW0gYXhpb3NDb25maWcgQ29uZmlndXJhdGlvbiBmb3IgdGhlIGF4aW9zIGphdmFzY3JpcHQgbGlicmFyeSB0aGF0IHdpbGwgYmUgdGhlXG4gICAqIGZvdW5kYXRpb24gZm9yIHRoZSByZXN0IG9mIHRoZSBwYXJhbWV0ZXJzXG4gICAqXG4gICAqIEByZXR1cm5zIEEgcHJvbWlzZSBmb3IgW1tSZXF1ZXN0UmVzcG9uc2VEYXRhXV1cbiAgICovXG4gIGdldCA9IChiYXNldXJsOnN0cmluZyxcbiAgICBnZXRkYXRhOm9iamVjdCxcbiAgICBoZWFkZXJzOm9iamVjdCA9IHt9LFxuICAgIGF4aW9zQ29uZmlnOkF4aW9zUmVxdWVzdENvbmZpZyA9IHVuZGVmaW5lZClcbiAgOiBQcm9taXNlPFJlcXVlc3RSZXNwb25zZURhdGE+ID0+ICB0aGlzLl9yZXF1ZXN0KCdHRVQnLFxuICAgICAgYmFzZXVybCxcbiAgICAgIGdldGRhdGEsXG4gICAgICB7fSxcbiAgICAgIHRoaXMuX3NldEhlYWRlcnMoaGVhZGVycyksXG4gICAgICBheGlvc0NvbmZpZyk7XG5cbiAgLyoqXG4gICAqIE1ha2VzIGEgREVMRVRFIGNhbGwgdG8gYW4gQVBJLlxuICAgKlxuICAgKiBAcGFyYW0gYmFzZXVybCBQYXRoIHRvIHRoZSBBUElcbiAgICogQHBhcmFtIGdldGRhdGEgT2JqZWN0IGNvbnRhaW5pbmcgdGhlIGtleSB2YWx1ZSBwYWlycyBzZW50IGluIERFTEVURVxuICAgKiBAcGFyYW0gcGFyYW1ldGVycyBPYmplY3QgY29udGFpbmluZyB0aGUgcGFyYW1ldGVycyBvZiB0aGUgQVBJIGNhbGxcbiAgICogQHBhcmFtIGhlYWRlcnMgQW4gYXJyYXkgSFRUUCBSZXF1ZXN0IEhlYWRlcnNcbiAgICogQHBhcmFtIGF4aW9zQ29uZmlnIENvbmZpZ3VyYXRpb24gZm9yIHRoZSBheGlvcyBqYXZhc2NyaXB0IGxpYnJhcnkgdGhhdCB3aWxsIGJlIHRoZVxuICAgKiBmb3VuZGF0aW9uIGZvciB0aGUgcmVzdCBvZiB0aGUgcGFyYW1ldGVyc1xuICAgKlxuICAgKiBAcmV0dXJucyBBIHByb21pc2UgZm9yIFtbUmVxdWVzdFJlc3BvbnNlRGF0YV1dXG4gICAqL1xuICBkZWxldGUgPSAoYmFzZXVybDpzdHJpbmcsXG4gICAgZ2V0ZGF0YTpvYmplY3QsXG4gICAgaGVhZGVyczpvYmplY3QgPSB7fSxcbiAgICBheGlvc0NvbmZpZzpBeGlvc1JlcXVlc3RDb25maWcgPSB1bmRlZmluZWQpXG4gIDogUHJvbWlzZTxSZXF1ZXN0UmVzcG9uc2VEYXRhPiA9PiB0aGlzLl9yZXF1ZXN0KCdERUxFVEUnLFxuICAgIGJhc2V1cmwsXG4gICAgZ2V0ZGF0YSxcbiAgICB7fSxcbiAgICB0aGlzLl9zZXRIZWFkZXJzKGhlYWRlcnMpLFxuICAgIGF4aW9zQ29uZmlnKTtcblxuICAvKipcbiAgICogTWFrZXMgYSBQT1NUIGNhbGwgdG8gYW4gQVBJLlxuICAgKlxuICAgKiBAcGFyYW0gYmFzZXVybCBQYXRoIHRvIHRoZSBBUElcbiAgICogQHBhcmFtIGdldGRhdGEgT2JqZWN0IGNvbnRhaW5pbmcgdGhlIGtleSB2YWx1ZSBwYWlycyBzZW50IGluIFBPU1RcbiAgICogQHBhcmFtIHBvc3RkYXRhIE9iamVjdCBjb250YWluaW5nIHRoZSBrZXkgdmFsdWUgcGFpcnMgc2VudCBpbiBQT1NUXG4gICAqIEBwYXJhbSBwYXJhbWV0ZXJzIE9iamVjdCBjb250YWluaW5nIHRoZSBwYXJhbWV0ZXJzIG9mIHRoZSBBUEkgY2FsbFxuICAgKiBAcGFyYW0gaGVhZGVycyBBbiBhcnJheSBIVFRQIFJlcXVlc3QgSGVhZGVyc1xuICAgKiBAcGFyYW0gYXhpb3NDb25maWcgQ29uZmlndXJhdGlvbiBmb3IgdGhlIGF4aW9zIGphdmFzY3JpcHQgbGlicmFyeSB0aGF0IHdpbGwgYmUgdGhlXG4gICAqIGZvdW5kYXRpb24gZm9yIHRoZSByZXN0IG9mIHRoZSBwYXJhbWV0ZXJzXG4gICAqXG4gICAqIEByZXR1cm5zIEEgcHJvbWlzZSBmb3IgW1tSZXF1ZXN0UmVzcG9uc2VEYXRhXV1cbiAgICovXG4gIHBvc3QgPSAoYmFzZXVybDpzdHJpbmcsXG4gICAgZ2V0ZGF0YTpvYmplY3QsXG4gICAgcG9zdGRhdGE6c3RyaW5nIHwgb2JqZWN0IHwgQXJyYXlCdWZmZXIgfCBBcnJheUJ1ZmZlclZpZXcsXG4gICAgaGVhZGVyczpvYmplY3QgPSB7fSxcbiAgICBheGlvc0NvbmZpZzpBeGlvc1JlcXVlc3RDb25maWcgPSB1bmRlZmluZWQpXG4gIDogUHJvbWlzZTxSZXF1ZXN0UmVzcG9uc2VEYXRhPiA9PiB0aGlzLl9yZXF1ZXN0KCdQT1NUJyxcbiAgICBiYXNldXJsLFxuICAgIGdldGRhdGEsXG4gICAgcG9zdGRhdGEsXG4gICAgdGhpcy5fc2V0SGVhZGVycyhoZWFkZXJzKSxcbiAgICBheGlvc0NvbmZpZyk7XG5cbiAgLyoqXG4gICAqIE1ha2VzIGEgUFVUIGNhbGwgdG8gYW4gQVBJLlxuICAgKlxuICAgKiBAcGFyYW0gYmFzZXVybCBQYXRoIHRvIHRoZSBiYXNldXJsXG4gICAqIEBwYXJhbSBnZXRkYXRhIE9iamVjdCBjb250YWluaW5nIHRoZSBrZXkgdmFsdWUgcGFpcnMgc2VudCBpbiBQVVRcbiAgICogQHBhcmFtIHBvc3RkYXRhIE9iamVjdCBjb250YWluaW5nIHRoZSBrZXkgdmFsdWUgcGFpcnMgc2VudCBpbiBQVVRcbiAgICogQHBhcmFtIHBhcmFtZXRlcnMgT2JqZWN0IGNvbnRhaW5pbmcgdGhlIHBhcmFtZXRlcnMgb2YgdGhlIEFQSSBjYWxsXG4gICAqIEBwYXJhbSBoZWFkZXJzIEFuIGFycmF5IEhUVFAgUmVxdWVzdCBIZWFkZXJzXG4gICAqIEBwYXJhbSBheGlvc0NvbmZpZyBDb25maWd1cmF0aW9uIGZvciB0aGUgYXhpb3MgamF2YXNjcmlwdCBsaWJyYXJ5IHRoYXQgd2lsbCBiZSB0aGVcbiAgICogZm91bmRhdGlvbiBmb3IgdGhlIHJlc3Qgb2YgdGhlIHBhcmFtZXRlcnNcbiAgICpcbiAgICogQHJldHVybnMgQSBwcm9taXNlIGZvciBbW1JlcXVlc3RSZXNwb25zZURhdGFdXVxuICAgKi9cbiAgcHV0ID0gKGJhc2V1cmw6c3RyaW5nLFxuICAgIGdldGRhdGE6b2JqZWN0LFxuICAgIHBvc3RkYXRhOnN0cmluZyB8IG9iamVjdCB8IEFycmF5QnVmZmVyIHwgQXJyYXlCdWZmZXJWaWV3LFxuICAgIGhlYWRlcnM6b2JqZWN0ID0ge30sXG4gICAgYXhpb3NDb25maWc6QXhpb3NSZXF1ZXN0Q29uZmlnID0gdW5kZWZpbmVkKVxuICA6IFByb21pc2U8UmVxdWVzdFJlc3BvbnNlRGF0YT4gPT4gdGhpcy5fcmVxdWVzdCgnUFVUJyxcbiAgICBiYXNldXJsLFxuICAgIGdldGRhdGEsXG4gICAgcG9zdGRhdGEsXG4gICAgdGhpcy5fc2V0SGVhZGVycyhoZWFkZXJzKSxcbiAgICBheGlvc0NvbmZpZyk7XG5cbiAgLyoqXG4gICAqIE1ha2VzIGEgUEFUQ0ggY2FsbCB0byBhbiBBUEkuXG4gICAqXG4gICAqIEBwYXJhbSBiYXNldXJsIFBhdGggdG8gdGhlIGJhc2V1cmxcbiAgICogQHBhcmFtIGdldGRhdGEgT2JqZWN0IGNvbnRhaW5pbmcgdGhlIGtleSB2YWx1ZSBwYWlycyBzZW50IGluIFBBVENIXG4gICAqIEBwYXJhbSBwb3N0ZGF0YSBPYmplY3QgY29udGFpbmluZyB0aGUga2V5IHZhbHVlIHBhaXJzIHNlbnQgaW4gUEFUQ0hcbiAgICogQHBhcmFtIHBhcmFtZXRlcnMgT2JqZWN0IGNvbnRhaW5pbmcgdGhlIHBhcmFtZXRlcnMgb2YgdGhlIEFQSSBjYWxsXG4gICAqIEBwYXJhbSBoZWFkZXJzIEFuIGFycmF5IEhUVFAgUmVxdWVzdCBIZWFkZXJzXG4gICAqIEBwYXJhbSBheGlvc0NvbmZpZyBDb25maWd1cmF0aW9uIGZvciB0aGUgYXhpb3MgamF2YXNjcmlwdCBsaWJyYXJ5IHRoYXQgd2lsbCBiZSB0aGVcbiAgICogZm91bmRhdGlvbiBmb3IgdGhlIHJlc3Qgb2YgdGhlIHBhcmFtZXRlcnNcbiAgICpcbiAgICogQHJldHVybnMgQSBwcm9taXNlIGZvciBbW1JlcXVlc3RSZXNwb25zZURhdGFdXVxuICAgKi9cbiAgcGF0Y2ggPSAoYmFzZXVybDpzdHJpbmcsXG4gICAgZ2V0ZGF0YTpvYmplY3QsXG4gICAgcG9zdGRhdGE6c3RyaW5nIHwgb2JqZWN0IHwgQXJyYXlCdWZmZXIgfCBBcnJheUJ1ZmZlclZpZXcsXG4gICAgaGVhZGVyczpvYmplY3QgPSB7fSxcbiAgICBheGlvc0NvbmZpZzpBeGlvc1JlcXVlc3RDb25maWcgPSB1bmRlZmluZWQpXG4gIDogUHJvbWlzZTxSZXF1ZXN0UmVzcG9uc2VEYXRhPiA9PiB0aGlzLl9yZXF1ZXN0KCdQQVRDSCcsXG4gICAgYmFzZXVybCxcbiAgICBnZXRkYXRhLFxuICAgIHBvc3RkYXRhLFxuICAgIHRoaXMuX3NldEhlYWRlcnMoaGVhZGVycyksXG4gICAgYXhpb3NDb25maWcpO1xuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IEF2YWxhbmNoZSBpbnN0YW5jZS4gU2V0cyB0aGUgYWRkcmVzcyBhbmQgcG9ydCBvZiB0aGUgbWFpbiBBdmFsYW5jaGUgQ2xpZW50LlxuICAgKlxuICAgKiBAcGFyYW0gaXAgVGhlIGhvc3RuYW1lIHRvIHJlc29sdmUgdG8gcmVhY2ggdGhlIEF2YWxhbmNoZSBDbGllbnQgQVBJc1xuICAgKiBAcGFyYW0gcG9ydCBUaGUgcG9ydCB0byByZXNvbHZlIHRvIHJlYWNoIHRoZSBBdmFsYW5jaGUgQ2xpZW50IEFQSXNcbiAgICogQHBhcmFtIHByb3RvY29sIFRoZSBwcm90b2NvbCBzdHJpbmcgdG8gdXNlIGJlZm9yZSBhIFwiOi8vXCIgaW4gYSByZXF1ZXN0LCBleDogXCJodHRwXCIsIFwiaHR0cHNcIiwgXCJnaXRcIiwgXCJ3c1wiLCBldGMgLi4uXG4gICAqL1xuICBjb25zdHJ1Y3RvcihpcDpzdHJpbmcsIHBvcnQ6bnVtYmVyLCBwcm90b2NvbDpzdHJpbmcgPSAnaHR0cCcpIHtcbiAgICB0aGlzLnNldEFkZHJlc3MoaXAsIHBvcnQsIHByb3RvY29sKTtcbiAgfVxufVxuIl19