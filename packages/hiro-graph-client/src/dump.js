import { inspect } from "util";

export default function dump(obj) {
    return inspect(obj, { depth: null, colors: true });
}
