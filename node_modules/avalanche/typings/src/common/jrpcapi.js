"use strict";
/**
 * @packageDocumentation
 * @module Common-JRPCAPI
 */
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
exports.JRPCAPI = void 0;
const bintools_1 = __importDefault(require("../utils/bintools"));
const apibase_1 = require("./apibase");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
class JRPCAPI extends apibase_1.APIBase {
    /**
       *
       * @param core Reference to the Avalanche instance using this endpoint
       * @param baseurl Path of the APIs baseurl - ex: "/ext/bc/avm"
       * @param jrpcVersion The jrpc version to use, default "2.0".
       */
    constructor(core, baseurl, jrpcVersion = '2.0') {
        super(core, baseurl);
        this.jrpcVersion = '2.0';
        this.rpcid = 1;
        this.callMethod = (method, params, baseurl) => __awaiter(this, void 0, void 0, function* () {
            const ep = baseurl || this.baseurl;
            const rpc = {};
            rpc.id = this.rpcid;
            rpc.method = method;
            // Set parameters if exists
            if (params) {
                rpc.params = params;
            }
            else if (this.jrpcVersion === '1.0') {
                rpc.params = [];
            }
            if (this.jrpcVersion !== '1.0') {
                rpc.jsonrpc = this.jrpcVersion;
            }
            const headers = { 'Content-Type': 'application/json;charset=UTF-8' };
            const axConf = {
                baseURL: `${this.core.getProtocol()}://${this.core.getIP()}:${this.core.getPort()}`,
                responseType: 'json',
            };
            return this.core.post(ep, {}, JSON.stringify(rpc), headers, axConf)
                .then((resp) => {
                if (resp.status >= 200 && resp.status < 300) {
                    this.rpcid += 1;
                    if (typeof resp.data === 'string') {
                        resp.data = JSON.parse(resp.data);
                    }
                    if (typeof resp.data === 'object' && (resp.data === null || 'error' in resp.data)) {
                        throw new Error(`Error returned: ${JSON.stringify(resp.data)}`);
                    }
                }
                return resp;
            });
        });
        /**
           * Returns the rpcid, a strictly-increasing number, starting from 1, indicating the next
           * request ID that will be sent.
           */
        this.getRPCID = () => this.rpcid;
        this.jrpcVersion = jrpcVersion;
        this.rpcid = 1;
    }
}
exports.JRPCAPI = JRPCAPI;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianJwY2FwaS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb21tb24vanJwY2FwaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7OztHQUdHOzs7Ozs7Ozs7Ozs7Ozs7QUFHSCxpRUFBeUM7QUFFekMsdUNBQXlEO0FBRXpEOztHQUVHO0FBQ0gsTUFBTSxRQUFRLEdBQUcsa0JBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUV4QyxNQUFhLE9BQVEsU0FBUSxpQkFBTztJQW9EbEM7Ozs7O1NBS0s7SUFDTCxZQUFZLElBQWtCLEVBQUUsT0FBYyxFQUFFLGNBQXFCLEtBQUs7UUFDeEUsS0FBSyxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztRQTFEYixnQkFBVyxHQUFVLEtBQUssQ0FBQztRQUUzQixVQUFLLEdBQUcsQ0FBQyxDQUFDO1FBRXBCLGVBQVUsR0FBRyxDQUFPLE1BQWEsRUFDL0IsTUFBOEIsRUFDOUIsT0FBZSxFQUErQixFQUFFO1lBQ2hELE1BQU0sRUFBRSxHQUFHLE9BQU8sSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDO1lBQ25DLE1BQU0sR0FBRyxHQUFPLEVBQUUsQ0FBQztZQUNuQixHQUFHLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDcEIsR0FBRyxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7WUFFcEIsMkJBQTJCO1lBQzNCLElBQUksTUFBTSxFQUFFO2dCQUNWLEdBQUcsQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO2FBQ3JCO2lCQUFNLElBQUksSUFBSSxDQUFDLFdBQVcsS0FBSyxLQUFLLEVBQUU7Z0JBQ3JDLEdBQUcsQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFDO2FBQ2pCO1lBRUQsSUFBSSxJQUFJLENBQUMsV0FBVyxLQUFLLEtBQUssRUFBRTtnQkFDOUIsR0FBRyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDO2FBQ2hDO1lBRUQsTUFBTSxPQUFPLEdBQVUsRUFBRSxjQUFjLEVBQUUsZ0NBQWdDLEVBQUUsQ0FBQztZQUU1RSxNQUFNLE1BQU0sR0FBc0I7Z0JBQ2hDLE9BQU8sRUFBRSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLE1BQU0sSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxFQUFFO2dCQUNuRixZQUFZLEVBQUUsTUFBTTthQUNyQixDQUFDO1lBRUYsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEVBQUUsT0FBTyxFQUFFLE1BQU0sQ0FBQztpQkFDaEUsSUFBSSxDQUFDLENBQUMsSUFBd0IsRUFBRSxFQUFFO2dCQUNqQyxJQUFJLElBQUksQ0FBQyxNQUFNLElBQUksR0FBRyxJQUFJLElBQUksQ0FBQyxNQUFNLEdBQUcsR0FBRyxFQUFFO29CQUMzQyxJQUFJLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQztvQkFDaEIsSUFBSSxPQUFPLElBQUksQ0FBQyxJQUFJLEtBQUssUUFBUSxFQUFFO3dCQUNqQyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO3FCQUNuQztvQkFDRCxJQUFJLE9BQU8sSUFBSSxDQUFDLElBQUksS0FBSyxRQUFRLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLElBQUksSUFBSSxPQUFPLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFO3dCQUNqRixNQUFNLElBQUksS0FBSyxDQUFDLG1CQUFtQixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7cUJBQ2pFO2lCQUNGO2dCQUNELE9BQU8sSUFBSSxDQUFDO1lBQ2QsQ0FBQyxDQUFDLENBQUM7UUFDUCxDQUFDLENBQUEsQ0FBQztRQUVGOzs7YUFHSztRQUNMLGFBQVEsR0FBRyxHQUFVLEVBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1FBVWpDLElBQUksQ0FBQyxXQUFXLEdBQUcsV0FBVyxDQUFDO1FBQy9CLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDO0lBQ2pCLENBQUM7Q0FDRjtBQS9ERCwwQkErREMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBwYWNrYWdlRG9jdW1lbnRhdGlvblxuICogQG1vZHVsZSBDb21tb24tSlJQQ0FQSVxuICovXG5cbmltcG9ydCB7IEF4aW9zUmVxdWVzdENvbmZpZyB9IGZyb20gJ2F4aW9zJztcbmltcG9ydCBCaW5Ub29scyBmcm9tICcuLi91dGlscy9iaW50b29scyc7XG5pbXBvcnQgQXZhbGFuY2hlQ29yZSBmcm9tICcuLi9hdmFsYW5jaGUnO1xuaW1wb3J0IHsgQVBJQmFzZSwgUmVxdWVzdFJlc3BvbnNlRGF0YSB9IGZyb20gJy4vYXBpYmFzZSc7XG5cbi8qKlxuICogQGlnbm9yZVxuICovXG5jb25zdCBiaW50b29scyA9IEJpblRvb2xzLmdldEluc3RhbmNlKCk7XG5cbmV4cG9ydCBjbGFzcyBKUlBDQVBJIGV4dGVuZHMgQVBJQmFzZSB7XG4gIHByb3RlY3RlZCBqcnBjVmVyc2lvbjpzdHJpbmcgPSAnMi4wJztcblxuICBwcm90ZWN0ZWQgcnBjaWQgPSAxO1xuXG4gIGNhbGxNZXRob2QgPSBhc3luYyAobWV0aG9kOnN0cmluZyxcbiAgICBwYXJhbXM/OkFycmF5PG9iamVjdD4gfCBvYmplY3QsXG4gICAgYmFzZXVybD86c3RyaW5nKTpQcm9taXNlPFJlcXVlc3RSZXNwb25zZURhdGE+ID0+IHtcbiAgICBjb25zdCBlcCA9IGJhc2V1cmwgfHwgdGhpcy5iYXNldXJsO1xuICAgIGNvbnN0IHJwYzphbnkgPSB7fTtcbiAgICBycGMuaWQgPSB0aGlzLnJwY2lkO1xuICAgIHJwYy5tZXRob2QgPSBtZXRob2Q7XG5cbiAgICAvLyBTZXQgcGFyYW1ldGVycyBpZiBleGlzdHNcbiAgICBpZiAocGFyYW1zKSB7XG4gICAgICBycGMucGFyYW1zID0gcGFyYW1zO1xuICAgIH0gZWxzZSBpZiAodGhpcy5qcnBjVmVyc2lvbiA9PT0gJzEuMCcpIHtcbiAgICAgIHJwYy5wYXJhbXMgPSBbXTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5qcnBjVmVyc2lvbiAhPT0gJzEuMCcpIHtcbiAgICAgIHJwYy5qc29ucnBjID0gdGhpcy5qcnBjVmVyc2lvbjtcbiAgICB9XG5cbiAgICBjb25zdCBoZWFkZXJzOm9iamVjdCA9IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uO2NoYXJzZXQ9VVRGLTgnIH07XG5cbiAgICBjb25zdCBheENvbmY6QXhpb3NSZXF1ZXN0Q29uZmlnID0ge1xuICAgICAgYmFzZVVSTDogYCR7dGhpcy5jb3JlLmdldFByb3RvY29sKCl9Oi8vJHt0aGlzLmNvcmUuZ2V0SVAoKX06JHt0aGlzLmNvcmUuZ2V0UG9ydCgpfWAsXG4gICAgICByZXNwb25zZVR5cGU6ICdqc29uJyxcbiAgICB9O1xuXG4gICAgcmV0dXJuIHRoaXMuY29yZS5wb3N0KGVwLCB7fSwgSlNPTi5zdHJpbmdpZnkocnBjKSwgaGVhZGVycywgYXhDb25mKVxuICAgICAgLnRoZW4oKHJlc3A6UmVxdWVzdFJlc3BvbnNlRGF0YSkgPT4ge1xuICAgICAgICBpZiAocmVzcC5zdGF0dXMgPj0gMjAwICYmIHJlc3Auc3RhdHVzIDwgMzAwKSB7XG4gICAgICAgICAgdGhpcy5ycGNpZCArPSAxO1xuICAgICAgICAgIGlmICh0eXBlb2YgcmVzcC5kYXRhID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgcmVzcC5kYXRhID0gSlNPTi5wYXJzZShyZXNwLmRhdGEpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAodHlwZW9mIHJlc3AuZGF0YSA9PT0gJ29iamVjdCcgJiYgKHJlc3AuZGF0YSA9PT0gbnVsbCB8fCAnZXJyb3InIGluIHJlc3AuZGF0YSkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgRXJyb3IgcmV0dXJuZWQ6ICR7SlNPTi5zdHJpbmdpZnkocmVzcC5kYXRhKX1gKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3A7XG4gICAgICB9KTtcbiAgfTtcblxuICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBycGNpZCwgYSBzdHJpY3RseS1pbmNyZWFzaW5nIG51bWJlciwgc3RhcnRpbmcgZnJvbSAxLCBpbmRpY2F0aW5nIHRoZSBuZXh0XG4gICAgICogcmVxdWVzdCBJRCB0aGF0IHdpbGwgYmUgc2VudC5cbiAgICAgKi9cbiAgZ2V0UlBDSUQgPSAoKTpudW1iZXIgPT4gdGhpcy5ycGNpZDtcblxuICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSBjb3JlIFJlZmVyZW5jZSB0byB0aGUgQXZhbGFuY2hlIGluc3RhbmNlIHVzaW5nIHRoaXMgZW5kcG9pbnRcbiAgICAgKiBAcGFyYW0gYmFzZXVybCBQYXRoIG9mIHRoZSBBUElzIGJhc2V1cmwgLSBleDogXCIvZXh0L2JjL2F2bVwiXG4gICAgICogQHBhcmFtIGpycGNWZXJzaW9uIFRoZSBqcnBjIHZlcnNpb24gdG8gdXNlLCBkZWZhdWx0IFwiMi4wXCIuXG4gICAgICovXG4gIGNvbnN0cnVjdG9yKGNvcmU6QXZhbGFuY2hlQ29yZSwgYmFzZXVybDpzdHJpbmcsIGpycGNWZXJzaW9uOnN0cmluZyA9ICcyLjAnKSB7XG4gICAgc3VwZXIoY29yZSwgYmFzZXVybCk7XG4gICAgdGhpcy5qcnBjVmVyc2lvbiA9IGpycGNWZXJzaW9uO1xuICAgIHRoaXMucnBjaWQgPSAxO1xuICB9XG59XG5cblxuXG5cblxuIl19