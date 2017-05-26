/**
 * a small helper for dealing with the task state
 *
 *  There are 4 basic states a task can be in:
 *      - pre: not started yet (i.e. doesn't exist)
 *      - loading: task in progress.
 *      - error: task threw an error.
 *      - ok: task succeeded.
 *
 *  There is an optional "reloading" state which you can pass
 *  in a handler for. This will potentially supercede the
 *  `loading` state, to differentiate between loading the first time
 *  and `reloading` to freshen data, or to retry after error.
 *
 *  This exists so your application can continue to show the "stale"
 *  data while a reload is happening, or handle it some other way.
 */
export default function whenTask(
    task,
    {
        pre = noop,
        loading = noop,
        reloading = loading,
        ok = noop,
        error = noop,
        ignoreReloadingIfOK = false,
        ignoreReloadingIfError = false
    }
) {
    if (!task) {
        return pre();
    } else if (task.loading) {
        if (task.finish) {
            //OK our reload logic
            if (task.error && ignoreReloadingIfError) {
                return error(task.error);
            }
            if (!task.error && ignoreReloadingIfOK) {
                return ok(task.result);
            }
            return reloading(task.error, task.result);
        } else {
            return loading();
        }
    } else if (task.error) {
        return error(task.error);
    } else {
        return ok(task.result);
    }
}

const noop = () => {};
