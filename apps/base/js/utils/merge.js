/**
 * @export
 * @method merge: merge objects
 * @param {...} objects
 * @return {Object}
 */
const merge = (...objects) => {
    const isObject = obj => obj && typeof obj === "object";
    return objects.reduce((prev, obj) => {
        Object.keys(obj).forEach(key => {
            const pVal = prev[key], oVal = obj[key];
            if(Array.isArray(pVal) && Array.isArray(oVal)) prev[key] = pVal.concat(...oVal);
            else if(isObject(pVal) && isObject(oVal)) prev[key] = merge(pVal, oVal);
            else prev[key] = oVal;
        });
        return prev;
    }, {});
}