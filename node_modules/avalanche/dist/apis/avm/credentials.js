"use strict";
/**
 * @packageDocumentation
 * @module API-AVM-Credentials
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NFTCredential = exports.SECPCredential = exports.SelectCredentialClass = void 0;
const constants_1 = require("./constants");
const credentials_1 = require("../../common/credentials");
/**
 * Takes a buffer representing the credential and returns the proper [[Credential]] instance.
 *
 * @param credid A number representing the credential ID parsed prior to the bytes passed in
 *
 * @returns An instance of an [[Credential]]-extended class.
 */
exports.SelectCredentialClass = (credid, ...args) => {
    if (credid === constants_1.AVMConstants.SECPCREDENTIAL) {
        return new SECPCredential(...args);
    }
    if (credid === constants_1.AVMConstants.NFTCREDENTIAL) {
        return new NFTCredential(...args);
    }
    /* istanbul ignore next */
    throw new Error(`Error - SelectCredentialClass: unknown credid ${credid}`);
};
class SECPCredential extends credentials_1.Credential {
    constructor() {
        super(...arguments);
        this._typeName = "SECPCredential";
        this._typeID = constants_1.AVMConstants.SECPCREDENTIAL;
    }
    //serialize and deserialize both are inherited
    getCredentialID() {
        return this._typeID;
    }
    clone() {
        let newbase = new SECPCredential();
        newbase.fromBuffer(this.toBuffer());
        return newbase;
    }
    create(...args) {
        return new SECPCredential(...args);
    }
    select(id, ...args) {
        let newbasetx = exports.SelectCredentialClass(id, ...args);
        return newbasetx;
    }
}
exports.SECPCredential = SECPCredential;
class NFTCredential extends credentials_1.Credential {
    constructor() {
        super(...arguments);
        this._typeName = "NFTCredential";
        this._typeID = constants_1.AVMConstants.NFTCREDENTIAL;
    }
    //serialize and deserialize both are inherited
    getCredentialID() {
        return this._typeID;
    }
    clone() {
        let newbase = new NFTCredential();
        newbase.fromBuffer(this.toBuffer());
        return newbase;
    }
    create(...args) {
        return new NFTCredential(...args);
    }
    select(id, ...args) {
        let newbasetx = exports.SelectCredentialClass(id, ...args);
        return newbasetx;
    }
}
exports.NFTCredential = NFTCredential;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlZGVudGlhbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvYXBpcy9hdm0vY3JlZGVudGlhbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7R0FHRzs7O0FBRUgsMkNBQTJDO0FBQzNDLDBEQUFzRDtBQUV0RDs7Ozs7O0dBTUc7QUFDVSxRQUFBLHFCQUFxQixHQUFHLENBQUMsTUFBYSxFQUFFLEdBQUcsSUFBZSxFQUFhLEVBQUU7SUFDcEYsSUFBSSxNQUFNLEtBQUssd0JBQVksQ0FBQyxjQUFjLEVBQUU7UUFDMUMsT0FBTyxJQUFJLGNBQWMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDO0tBQ3BDO0lBQUMsSUFBSSxNQUFNLEtBQUssd0JBQVksQ0FBQyxhQUFhLEVBQUU7UUFDM0MsT0FBTyxJQUFJLGFBQWEsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDO0tBQ25DO0lBQ0QsMEJBQTBCO0lBQzFCLE1BQU0sSUFBSSxLQUFLLENBQUMsaURBQWlELE1BQU0sRUFBRSxDQUFDLENBQUM7QUFDN0UsQ0FBQyxDQUFDO0FBRUYsTUFBYSxjQUFlLFNBQVEsd0JBQVU7SUFBOUM7O1FBQ1ksY0FBUyxHQUFHLGdCQUFnQixDQUFDO1FBQzdCLFlBQU8sR0FBRyx3QkFBWSxDQUFDLGNBQWMsQ0FBQztJQXVCbEQsQ0FBQztJQXJCQyw4Q0FBOEM7SUFFOUMsZUFBZTtRQUNiLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQztJQUN0QixDQUFDO0lBRUQsS0FBSztRQUNILElBQUksT0FBTyxHQUFrQixJQUFJLGNBQWMsRUFBRSxDQUFDO1FBQ2xELE9BQU8sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7UUFDcEMsT0FBTyxPQUFlLENBQUM7SUFDekIsQ0FBQztJQUVELE1BQU0sQ0FBQyxHQUFHLElBQVU7UUFDbEIsT0FBTyxJQUFJLGNBQWMsQ0FBQyxHQUFHLElBQUksQ0FBUyxDQUFDO0lBQzdDLENBQUM7SUFFRCxNQUFNLENBQUMsRUFBUyxFQUFFLEdBQUcsSUFBVTtRQUM3QixJQUFJLFNBQVMsR0FBYyw2QkFBcUIsQ0FBQyxFQUFFLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQztRQUM5RCxPQUFPLFNBQVMsQ0FBQztJQUNuQixDQUFDO0NBRUY7QUF6QkQsd0NBeUJDO0FBRUQsTUFBYSxhQUFjLFNBQVEsd0JBQVU7SUFBN0M7O1FBQ1ksY0FBUyxHQUFHLGVBQWUsQ0FBQztRQUM1QixZQUFPLEdBQUcsd0JBQVksQ0FBQyxhQUFhLENBQUM7SUF1QmpELENBQUM7SUFyQkMsOENBQThDO0lBRTlDLGVBQWU7UUFDYixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUM7SUFDdEIsQ0FBQztJQUVELEtBQUs7UUFDSCxJQUFJLE9BQU8sR0FBaUIsSUFBSSxhQUFhLEVBQUUsQ0FBQztRQUNoRCxPQUFPLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBQ3BDLE9BQU8sT0FBZSxDQUFDO0lBQ3pCLENBQUM7SUFFRCxNQUFNLENBQUMsR0FBRyxJQUFVO1FBQ2xCLE9BQU8sSUFBSSxhQUFhLENBQUMsR0FBRyxJQUFJLENBQVMsQ0FBQztJQUM1QyxDQUFDO0lBRUQsTUFBTSxDQUFDLEVBQVMsRUFBRSxHQUFHLElBQVU7UUFDN0IsSUFBSSxTQUFTLEdBQWMsNkJBQXFCLENBQUMsRUFBRSxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUM7UUFDOUQsT0FBTyxTQUFTLENBQUM7SUFDbkIsQ0FBQztDQUVGO0FBekJELHNDQXlCQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQHBhY2thZ2VEb2N1bWVudGF0aW9uXG4gKiBAbW9kdWxlIEFQSS1BVk0tQ3JlZGVudGlhbHNcbiAqL1xuXG5pbXBvcnQgeyBBVk1Db25zdGFudHMgfSBmcm9tICcuL2NvbnN0YW50cyc7XG5pbXBvcnQgeyBDcmVkZW50aWFsIH0gZnJvbSAnLi4vLi4vY29tbW9uL2NyZWRlbnRpYWxzJztcblxuLyoqXG4gKiBUYWtlcyBhIGJ1ZmZlciByZXByZXNlbnRpbmcgdGhlIGNyZWRlbnRpYWwgYW5kIHJldHVybnMgdGhlIHByb3BlciBbW0NyZWRlbnRpYWxdXSBpbnN0YW5jZS5cbiAqXG4gKiBAcGFyYW0gY3JlZGlkIEEgbnVtYmVyIHJlcHJlc2VudGluZyB0aGUgY3JlZGVudGlhbCBJRCBwYXJzZWQgcHJpb3IgdG8gdGhlIGJ5dGVzIHBhc3NlZCBpblxuICpcbiAqIEByZXR1cm5zIEFuIGluc3RhbmNlIG9mIGFuIFtbQ3JlZGVudGlhbF1dLWV4dGVuZGVkIGNsYXNzLlxuICovXG5leHBvcnQgY29uc3QgU2VsZWN0Q3JlZGVudGlhbENsYXNzID0gKGNyZWRpZDpudW1iZXIsIC4uLmFyZ3M6QXJyYXk8YW55Pik6Q3JlZGVudGlhbCA9PiB7XG4gIGlmIChjcmVkaWQgPT09IEFWTUNvbnN0YW50cy5TRUNQQ1JFREVOVElBTCkge1xuICAgIHJldHVybiBuZXcgU0VDUENyZWRlbnRpYWwoLi4uYXJncyk7XG4gIH0gaWYgKGNyZWRpZCA9PT0gQVZNQ29uc3RhbnRzLk5GVENSRURFTlRJQUwpIHtcbiAgICByZXR1cm4gbmV3IE5GVENyZWRlbnRpYWwoLi4uYXJncyk7XG4gIH1cbiAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgdGhyb3cgbmV3IEVycm9yKGBFcnJvciAtIFNlbGVjdENyZWRlbnRpYWxDbGFzczogdW5rbm93biBjcmVkaWQgJHtjcmVkaWR9YCk7XG59O1xuXG5leHBvcnQgY2xhc3MgU0VDUENyZWRlbnRpYWwgZXh0ZW5kcyBDcmVkZW50aWFsIHtcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiU0VDUENyZWRlbnRpYWxcIjtcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSBBVk1Db25zdGFudHMuU0VDUENSRURFTlRJQUw7XG5cbiAgLy9zZXJpYWxpemUgYW5kIGRlc2VyaWFsaXplIGJvdGggYXJlIGluaGVyaXRlZFxuXG4gIGdldENyZWRlbnRpYWxJRCgpOm51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX3R5cGVJRDtcbiAgfVxuXG4gIGNsb25lKCk6dGhpcyB7XG4gICAgbGV0IG5ld2Jhc2U6U0VDUENyZWRlbnRpYWwgPSBuZXcgU0VDUENyZWRlbnRpYWwoKTtcbiAgICBuZXdiYXNlLmZyb21CdWZmZXIodGhpcy50b0J1ZmZlcigpKTtcbiAgICByZXR1cm4gbmV3YmFzZSBhcyB0aGlzO1xuICB9XG5cbiAgY3JlYXRlKC4uLmFyZ3M6YW55W10pOnRoaXMge1xuICAgIHJldHVybiBuZXcgU0VDUENyZWRlbnRpYWwoLi4uYXJncykgYXMgdGhpcztcbiAgfVxuXG4gIHNlbGVjdChpZDpudW1iZXIsIC4uLmFyZ3M6YW55W10pOkNyZWRlbnRpYWwge1xuICAgIGxldCBuZXdiYXNldHg6Q3JlZGVudGlhbCA9IFNlbGVjdENyZWRlbnRpYWxDbGFzcyhpZCwgLi4uYXJncyk7XG4gICAgcmV0dXJuIG5ld2Jhc2V0eDtcbiAgfVxuXG59XG5cbmV4cG9ydCBjbGFzcyBORlRDcmVkZW50aWFsIGV4dGVuZHMgQ3JlZGVudGlhbCB7XG4gIHByb3RlY3RlZCBfdHlwZU5hbWUgPSBcIk5GVENyZWRlbnRpYWxcIjtcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSBBVk1Db25zdGFudHMuTkZUQ1JFREVOVElBTDtcblxuICAvL3NlcmlhbGl6ZSBhbmQgZGVzZXJpYWxpemUgYm90aCBhcmUgaW5oZXJpdGVkXG5cbiAgZ2V0Q3JlZGVudGlhbElEKCk6bnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fdHlwZUlEO1xuICB9XG5cbiAgY2xvbmUoKTp0aGlzIHtcbiAgICBsZXQgbmV3YmFzZTpORlRDcmVkZW50aWFsID0gbmV3IE5GVENyZWRlbnRpYWwoKTtcbiAgICBuZXdiYXNlLmZyb21CdWZmZXIodGhpcy50b0J1ZmZlcigpKTtcbiAgICByZXR1cm4gbmV3YmFzZSBhcyB0aGlzO1xuICB9XG5cbiAgY3JlYXRlKC4uLmFyZ3M6YW55W10pOnRoaXMge1xuICAgIHJldHVybiBuZXcgTkZUQ3JlZGVudGlhbCguLi5hcmdzKSBhcyB0aGlzO1xuICB9XG5cbiAgc2VsZWN0KGlkOm51bWJlciwgLi4uYXJnczphbnlbXSk6Q3JlZGVudGlhbCB7XG4gICAgbGV0IG5ld2Jhc2V0eDpDcmVkZW50aWFsID0gU2VsZWN0Q3JlZGVudGlhbENsYXNzKGlkLCAuLi5hcmdzKTtcbiAgICByZXR1cm4gbmV3YmFzZXR4O1xuICB9XG5cbn1cbiJdfQ==