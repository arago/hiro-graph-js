/**
 *  The best way to store timestamps.
 */
const encode = s => {
    if (typeof s === "object" && "getUTCDate" in s) {
        return dateToISO8601(s);
    }
    let n;
    if (typeof s === "string") {
        n = parseInt(s, 10);
    } else {
        n = 1 * s; //cast to number...
    }
    return dateToISO8601(new Date(n));
};

//be liberal in what you accept...
const decode = s => {
    let ts = Date.parse(s);
    if (isNaN(ts)) {
        //maybe this was an timestamp.
        ts = parseInt(s, 10);
    }
    return isNaN(ts) ? null : ts;
};

export default { encode, decode };

/**
 * this is a check to see if this could be an ISO8601 - it does not cover all possibilities
 * @ignore
 */
export const isoRegex = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}/;

const dateToISO8601 = date => {
    const time = date.getTime();
    if (isNaN(time)) {
        return null; //invalid dates are still dates :(
    }
    if (typeof date.getISOString === "function") {
        return date.getISOString();
    }
    //otherwise, we have to do it ourselves
    //the format is simple:
    // yyyy-mm-ddThh:mm:ss.sssZ
    const [year, month, day, hour, min, second, ms] = [
        date.getUTCFullYear(),
        date.getUTCMonth() + 1,
        date.getUTCDate(),
        date.getUTCHours(),
        date.getUTCMinutes(),
        date.getUTCSeconds(),
        date.getUTCMilliseconds()
    ];
    return `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(min)}:${pad(second)}.${pad3(ms)}Z`;
};

const pad = n => (n > 9 ? n : "0" + n);
const pad3 = n => (n > 99 ? n : "0" + pad(n));
