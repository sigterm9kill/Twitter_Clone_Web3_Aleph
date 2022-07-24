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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminAPI = void 0;
const jrpcapi_1 = require("../../common/jrpcapi");
/**
 * Class for interacting with a node's AdminAPI.
 *
 * @category RPCAPIs
 *
 * @remarks This extends the [[JRPCAPI]] class. This class should not be directly called.
 * Instead, use the [[Avalanche.addAPI]] function to register this interface with Avalanche.
 */
class AdminAPI extends jrpcapi_1.JRPCAPI {
    /**
       * This class should not be instantiated directly. Instead use the [[Avalanche.addAPI]]
       * method.
       *
       * @param core A reference to the Avalanche class
       * @param baseurl Defaults to the string "/ext/admin" as the path to rpc's baseurl
       */
    constructor(core, baseurl = '/ext/admin') {
        super(core, baseurl);
        /**
           * Assign an API an alias, a different endpoint for the API. The original endpoint will still
           * work. This change only affects this node; other nodes will not know about this alias.
           *
           * @param endpoint The original endpoint of the API. endpoint should only include the part of
           * the endpoint after /ext/
           * @param alias The API being aliased can now be called at ext/alias
           *
           * @returns Returns a Promise<boolean> containing success, true for success, false for failure.
           */
        this.alias = (endpoint, alias) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                endpoint,
                alias,
            };
            return this.callMethod('admin.alias', params)
                .then((response) => response.data.result.success);
        });
        /**
           * Give a blockchain an alias, a different name that can be used any place the blockchain’s
           * ID is used.
           *
           * @param endpoint The blockchain’s ID
           * @param alias Can now be used in place of the blockchain’s ID (in API endpoints, for example)
           *
           * @returns Returns a Promise<boolean> containing success, true for success, false for failure.
           */
        this.aliasChain = (chain, alias) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                chain,
                alias,
            };
            return this.callMethod('admin.aliasChain', params)
                .then((response) => response.data.result.success);
        });
        /**
           * Dump the mutex statistics of the node to the specified file.
           *
           * @returns Promise for a boolean that is true on success.
           */
        this.lockProfile = () => __awaiter(this, void 0, void 0, function* () {
            const params = {};
            return this.callMethod('admin.lockProfile', params)
                .then((response) => response.data.result.success);
        });
        /**
           * Dump the current memory footprint of the node to the specified file.
           *
           * @returns Promise for a boolean that is true on success.
           */
        this.memoryProfile = () => __awaiter(this, void 0, void 0, function* () {
            const params = {};
            return this.callMethod('admin.memoryProfile', params)
                .then((response) => response.data.result.success);
        });
        /**
           * Start profiling the cpu utilization of the node. Will dump the profile information into
           * the specified file on stop.
           *
           * @returns Promise for a boolean that is true on success.
           */
        this.startCPUProfiler = () => __awaiter(this, void 0, void 0, function* () {
            const params = {};
            return this.callMethod('admin.startCPUProfiler', params)
                .then((response) => response.data.result.success);
        });
        /**
           * Stop the CPU profile that was previously started.
           *
           * @returns Promise for a boolean that is true on success.
           */
        this.stopCPUProfiler = () => __awaiter(this, void 0, void 0, function* () {
            return this.callMethod('admin.stopCPUProfiler')
                .then((response) => response.data.result.success);
        });
    }
}
exports.AdminAPI = AdminAPI;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2FwaXMvYWRtaW4vYXBpLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUtBLGtEQUErQztBQUkvQzs7Ozs7OztHQU9HO0FBRUgsTUFBYSxRQUFTLFNBQVEsaUJBQU87SUFpRm5DOzs7Ozs7U0FNSztJQUNMLFlBQVksSUFBa0IsRUFBRSxVQUFpQixZQUFZO1FBQUksS0FBSyxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztRQXRGdEY7Ozs7Ozs7OzthQVNLO1FBQ0wsVUFBSyxHQUFHLENBQU8sUUFBZSxFQUFFLEtBQVksRUFBbUIsRUFBRTtZQUMvRCxNQUFNLE1BQU0sR0FBTztnQkFDakIsUUFBUTtnQkFDUixLQUFLO2FBQ04sQ0FBQztZQUNGLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxhQUFhLEVBQUUsTUFBTSxDQUFDO2lCQUMxQyxJQUFJLENBQUMsQ0FBQyxRQUE0QixFQUFFLEVBQUUsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUMxRSxDQUFDLENBQUEsQ0FBQztRQUVGOzs7Ozs7OzthQVFLO1FBQ0wsZUFBVSxHQUFHLENBQU8sS0FBWSxFQUFFLEtBQVksRUFBbUIsRUFBRTtZQUNqRSxNQUFNLE1BQU0sR0FBTztnQkFDakIsS0FBSztnQkFDTCxLQUFLO2FBQ04sQ0FBQztZQUNGLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxrQkFBa0IsRUFBRSxNQUFNLENBQUM7aUJBQy9DLElBQUksQ0FBQyxDQUFDLFFBQTRCLEVBQUUsRUFBRSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzFFLENBQUMsQ0FBQSxDQUFDO1FBRUY7Ozs7YUFJSztRQUNMLGdCQUFXLEdBQUcsR0FBMEIsRUFBRTtZQUN4QyxNQUFNLE1BQU0sR0FBTyxFQUFFLENBQUM7WUFDdEIsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLG1CQUFtQixFQUFFLE1BQU0sQ0FBQztpQkFDaEQsSUFBSSxDQUFDLENBQUMsUUFBNEIsRUFBRSxFQUFFLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDMUUsQ0FBQyxDQUFBLENBQUM7UUFFRjs7OzthQUlLO1FBQ0wsa0JBQWEsR0FBRyxHQUEwQixFQUFFO1lBQzFDLE1BQU0sTUFBTSxHQUFPLEVBQUUsQ0FBQztZQUN0QixPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMscUJBQXFCLEVBQUUsTUFBTSxDQUFDO2lCQUNsRCxJQUFJLENBQUMsQ0FBQyxRQUE0QixFQUFFLEVBQUUsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUMxRSxDQUFDLENBQUEsQ0FBQztRQUVGOzs7OzthQUtLO1FBQ0wscUJBQWdCLEdBQUcsR0FBMEIsRUFBRTtZQUM3QyxNQUFNLE1BQU0sR0FBTyxFQUFFLENBQUM7WUFDdEIsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLHdCQUF3QixFQUFFLE1BQU0sQ0FBQztpQkFDckQsSUFBSSxDQUFDLENBQUMsUUFBNEIsRUFBRSxFQUFFLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDMUUsQ0FBQyxDQUFBLENBQUM7UUFFRjs7OzthQUlLO1FBQ0wsb0JBQWUsR0FBRyxHQUEwQixFQUFFO1lBQUMsT0FBQSxJQUFJLENBQUMsVUFBVSxDQUFDLHVCQUF1QixDQUFDO2lCQUNwRixJQUFJLENBQUMsQ0FBQyxRQUE0QixFQUFFLEVBQUUsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQTtVQUFBLENBQUM7SUFTZSxDQUFDO0NBQ3pGO0FBekZELDRCQXlGQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQHBhY2thZ2VEb2N1bWVudGF0aW9uXG4gKiBAbW9kdWxlIEFQSS1BZG1pblxuICovXG5pbXBvcnQgQXZhbGFuY2hlQ29yZSBmcm9tICcuLi8uLi9hdmFsYW5jaGUnO1xuaW1wb3J0IHsgSlJQQ0FQSSB9IGZyb20gJy4uLy4uL2NvbW1vbi9qcnBjYXBpJztcbmltcG9ydCB7IFJlcXVlc3RSZXNwb25zZURhdGEgfSBmcm9tICcuLi8uLi9jb21tb24vYXBpYmFzZSc7XG5cblxuLyoqXG4gKiBDbGFzcyBmb3IgaW50ZXJhY3Rpbmcgd2l0aCBhIG5vZGUncyBBZG1pbkFQSS5cbiAqXG4gKiBAY2F0ZWdvcnkgUlBDQVBJc1xuICpcbiAqIEByZW1hcmtzIFRoaXMgZXh0ZW5kcyB0aGUgW1tKUlBDQVBJXV0gY2xhc3MuIFRoaXMgY2xhc3Mgc2hvdWxkIG5vdCBiZSBkaXJlY3RseSBjYWxsZWQuXG4gKiBJbnN0ZWFkLCB1c2UgdGhlIFtbQXZhbGFuY2hlLmFkZEFQSV1dIGZ1bmN0aW9uIHRvIHJlZ2lzdGVyIHRoaXMgaW50ZXJmYWNlIHdpdGggQXZhbGFuY2hlLlxuICovXG5cbmV4cG9ydCBjbGFzcyBBZG1pbkFQSSBleHRlbmRzIEpSUENBUEkge1xuXG4gIC8qKlxuICAgICAqIEFzc2lnbiBhbiBBUEkgYW4gYWxpYXMsIGEgZGlmZmVyZW50IGVuZHBvaW50IGZvciB0aGUgQVBJLiBUaGUgb3JpZ2luYWwgZW5kcG9pbnQgd2lsbCBzdGlsbFxuICAgICAqIHdvcmsuIFRoaXMgY2hhbmdlIG9ubHkgYWZmZWN0cyB0aGlzIG5vZGU7IG90aGVyIG5vZGVzIHdpbGwgbm90IGtub3cgYWJvdXQgdGhpcyBhbGlhcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBlbmRwb2ludCBUaGUgb3JpZ2luYWwgZW5kcG9pbnQgb2YgdGhlIEFQSS4gZW5kcG9pbnQgc2hvdWxkIG9ubHkgaW5jbHVkZSB0aGUgcGFydCBvZlxuICAgICAqIHRoZSBlbmRwb2ludCBhZnRlciAvZXh0L1xuICAgICAqIEBwYXJhbSBhbGlhcyBUaGUgQVBJIGJlaW5nIGFsaWFzZWQgY2FuIG5vdyBiZSBjYWxsZWQgYXQgZXh0L2FsaWFzXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBSZXR1cm5zIGEgUHJvbWlzZTxib29sZWFuPiBjb250YWluaW5nIHN1Y2Nlc3MsIHRydWUgZm9yIHN1Y2Nlc3MsIGZhbHNlIGZvciBmYWlsdXJlLlxuICAgICAqL1xuICBhbGlhcyA9IGFzeW5jIChlbmRwb2ludDpzdHJpbmcsIGFsaWFzOnN0cmluZyk6UHJvbWlzZTxib29sZWFuPiA9PiB7XG4gICAgY29uc3QgcGFyYW1zOmFueSA9IHtcbiAgICAgIGVuZHBvaW50LFxuICAgICAgYWxpYXMsXG4gICAgfTtcbiAgICByZXR1cm4gdGhpcy5jYWxsTWV0aG9kKCdhZG1pbi5hbGlhcycsIHBhcmFtcylcbiAgICAgIC50aGVuKChyZXNwb25zZTpSZXF1ZXN0UmVzcG9uc2VEYXRhKSA9PiByZXNwb25zZS5kYXRhLnJlc3VsdC5zdWNjZXNzKTtcbiAgfTtcblxuICAvKipcbiAgICAgKiBHaXZlIGEgYmxvY2tjaGFpbiBhbiBhbGlhcywgYSBkaWZmZXJlbnQgbmFtZSB0aGF0IGNhbiBiZSB1c2VkIGFueSBwbGFjZSB0aGUgYmxvY2tjaGFpbuKAmXNcbiAgICAgKiBJRCBpcyB1c2VkLlxuICAgICAqXG4gICAgICogQHBhcmFtIGVuZHBvaW50IFRoZSBibG9ja2NoYWlu4oCZcyBJRFxuICAgICAqIEBwYXJhbSBhbGlhcyBDYW4gbm93IGJlIHVzZWQgaW4gcGxhY2Ugb2YgdGhlIGJsb2NrY2hhaW7igJlzIElEIChpbiBBUEkgZW5kcG9pbnRzLCBmb3IgZXhhbXBsZSlcbiAgICAgKlxuICAgICAqIEByZXR1cm5zIFJldHVybnMgYSBQcm9taXNlPGJvb2xlYW4+IGNvbnRhaW5pbmcgc3VjY2VzcywgdHJ1ZSBmb3Igc3VjY2VzcywgZmFsc2UgZm9yIGZhaWx1cmUuXG4gICAgICovXG4gIGFsaWFzQ2hhaW4gPSBhc3luYyAoY2hhaW46c3RyaW5nLCBhbGlhczpzdHJpbmcpOlByb21pc2U8Ym9vbGVhbj4gPT4ge1xuICAgIGNvbnN0IHBhcmFtczphbnkgPSB7XG4gICAgICBjaGFpbixcbiAgICAgIGFsaWFzLFxuICAgIH07XG4gICAgcmV0dXJuIHRoaXMuY2FsbE1ldGhvZCgnYWRtaW4uYWxpYXNDaGFpbicsIHBhcmFtcylcbiAgICAgIC50aGVuKChyZXNwb25zZTpSZXF1ZXN0UmVzcG9uc2VEYXRhKSA9PiByZXNwb25zZS5kYXRhLnJlc3VsdC5zdWNjZXNzKTtcbiAgfTtcblxuICAvKipcbiAgICAgKiBEdW1wIHRoZSBtdXRleCBzdGF0aXN0aWNzIG9mIHRoZSBub2RlIHRvIHRoZSBzcGVjaWZpZWQgZmlsZS5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIFByb21pc2UgZm9yIGEgYm9vbGVhbiB0aGF0IGlzIHRydWUgb24gc3VjY2Vzcy5cbiAgICAgKi9cbiAgbG9ja1Byb2ZpbGUgPSBhc3luYyAoKTpQcm9taXNlPGJvb2xlYW4+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6YW55ID0ge307XG4gICAgcmV0dXJuIHRoaXMuY2FsbE1ldGhvZCgnYWRtaW4ubG9ja1Byb2ZpbGUnLCBwYXJhbXMpXG4gICAgICAudGhlbigocmVzcG9uc2U6UmVxdWVzdFJlc3BvbnNlRGF0YSkgPT4gcmVzcG9uc2UuZGF0YS5yZXN1bHQuc3VjY2Vzcyk7XG4gIH07XG5cbiAgLyoqXG4gICAgICogRHVtcCB0aGUgY3VycmVudCBtZW1vcnkgZm9vdHByaW50IG9mIHRoZSBub2RlIHRvIHRoZSBzcGVjaWZpZWQgZmlsZS5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIFByb21pc2UgZm9yIGEgYm9vbGVhbiB0aGF0IGlzIHRydWUgb24gc3VjY2Vzcy5cbiAgICAgKi9cbiAgbWVtb3J5UHJvZmlsZSA9IGFzeW5jICgpOlByb21pc2U8Ym9vbGVhbj4gPT4ge1xuICAgIGNvbnN0IHBhcmFtczphbnkgPSB7fTtcbiAgICByZXR1cm4gdGhpcy5jYWxsTWV0aG9kKCdhZG1pbi5tZW1vcnlQcm9maWxlJywgcGFyYW1zKVxuICAgICAgLnRoZW4oKHJlc3BvbnNlOlJlcXVlc3RSZXNwb25zZURhdGEpID0+IHJlc3BvbnNlLmRhdGEucmVzdWx0LnN1Y2Nlc3MpO1xuICB9O1xuXG4gIC8qKlxuICAgICAqIFN0YXJ0IHByb2ZpbGluZyB0aGUgY3B1IHV0aWxpemF0aW9uIG9mIHRoZSBub2RlLiBXaWxsIGR1bXAgdGhlIHByb2ZpbGUgaW5mb3JtYXRpb24gaW50b1xuICAgICAqIHRoZSBzcGVjaWZpZWQgZmlsZSBvbiBzdG9wLlxuICAgICAqXG4gICAgICogQHJldHVybnMgUHJvbWlzZSBmb3IgYSBib29sZWFuIHRoYXQgaXMgdHJ1ZSBvbiBzdWNjZXNzLlxuICAgICAqL1xuICBzdGFydENQVVByb2ZpbGVyID0gYXN5bmMgKCk6UHJvbWlzZTxib29sZWFuPiA9PiB7XG4gICAgY29uc3QgcGFyYW1zOmFueSA9IHt9O1xuICAgIHJldHVybiB0aGlzLmNhbGxNZXRob2QoJ2FkbWluLnN0YXJ0Q1BVUHJvZmlsZXInLCBwYXJhbXMpXG4gICAgICAudGhlbigocmVzcG9uc2U6UmVxdWVzdFJlc3BvbnNlRGF0YSkgPT4gcmVzcG9uc2UuZGF0YS5yZXN1bHQuc3VjY2Vzcyk7XG4gIH07XG5cbiAgLyoqXG4gICAgICogU3RvcCB0aGUgQ1BVIHByb2ZpbGUgdGhhdCB3YXMgcHJldmlvdXNseSBzdGFydGVkLlxuICAgICAqXG4gICAgICogQHJldHVybnMgUHJvbWlzZSBmb3IgYSBib29sZWFuIHRoYXQgaXMgdHJ1ZSBvbiBzdWNjZXNzLlxuICAgICAqL1xuICBzdG9wQ1BVUHJvZmlsZXIgPSBhc3luYyAoKTpQcm9taXNlPGJvb2xlYW4+ID0+IHRoaXMuY2FsbE1ldGhvZCgnYWRtaW4uc3RvcENQVVByb2ZpbGVyJylcbiAgICAudGhlbigocmVzcG9uc2U6UmVxdWVzdFJlc3BvbnNlRGF0YSkgPT4gcmVzcG9uc2UuZGF0YS5yZXN1bHQuc3VjY2Vzcyk7XG5cbiAgLyoqXG4gICAgICogVGhpcyBjbGFzcyBzaG91bGQgbm90IGJlIGluc3RhbnRpYXRlZCBkaXJlY3RseS4gSW5zdGVhZCB1c2UgdGhlIFtbQXZhbGFuY2hlLmFkZEFQSV1dXG4gICAgICogbWV0aG9kLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNvcmUgQSByZWZlcmVuY2UgdG8gdGhlIEF2YWxhbmNoZSBjbGFzc1xuICAgICAqIEBwYXJhbSBiYXNldXJsIERlZmF1bHRzIHRvIHRoZSBzdHJpbmcgXCIvZXh0L2FkbWluXCIgYXMgdGhlIHBhdGggdG8gcnBjJ3MgYmFzZXVybFxuICAgICAqL1xuICBjb25zdHJ1Y3Rvcihjb3JlOkF2YWxhbmNoZUNvcmUsIGJhc2V1cmw6c3RyaW5nID0gJy9leHQvYWRtaW4nKSB7IHN1cGVyKGNvcmUsIGJhc2V1cmwpOyB9XG59XG4iXX0=