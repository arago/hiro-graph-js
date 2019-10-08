const date = 14e11; // 14e11 is about 5pm on 13th may 2014. it just easy to remember its a valid date and short.

export default client => [
    {
        name: "me",
        fn: () => client.me()
    },
    {
        name: "get",
        fn: () => client.get("some-id")
    },
    {
        name: "create",
        fn: () => client.create("some-type", { some: "prop" })
    },
    {
        name: "create (waitForIndex)",
        fn: () =>
            client.create("some-type", { some: "prop" }, { waitForIndex: true })
    },
    {
        name: "update",
        fn: () => client.update("some-id", { "/foo": "bar" })
    },
    {
        name: "update (waitForIndex)",
        fn: () =>
            client.update("some-id", { "/foo": "bar" }, { waitForIndex: true })
    },
    {
        name: "replace",
        fn: () => client.replace("some-id", { "/foo": "bar" })
    },
    {
        name: "replace (createIfNotExists)",
        fn: () =>
            client.replace(
                "some-id",
                { "/foo": "bar" },
                { createIfNotExists: "some-type" }
            )
    },
    {
        name: "replace (waitForIndex)",
        fn: () =>
            client.replace("some-id", { "/foo": "bar" }, { waitForIndex: true })
    },
    {
        name: "delete",
        fn: () => client.delete("some-id")
    },
    {
        name: "delete (waitForIndex)",
        fn: () => client.delete("some-id", { waitForIndex: true })
    },
    {
        name: "ids",
        fn: () => client.ids(["a", "b", "c"])
    },
    {
        name: "connect",
        fn: () =>
            client.connect(
                "some-verb",
                "the-in-id",
                "the-out-id"
            )
    },
    {
        name: "disconnect",
        fn: () => client.disconnect("some-verb", "the-in-id", "the-out-id")
    },
    {
        name: "lucene (basic)",
        fn: () => client.lucene("*:*")
    },
    {
        name: "lucene (limits)",
        fn: () => client.lucene("*:*", { limit: -1, offset: 1000 })
    },
    {
        name: "lucene (placeholders)",
        fn: () => client.lucene("/foo:$bar", { bar: "123" })
    },
    {
        name: "lucene (count)",
        fn: () => client.lucene("*:*", { count: true })
    },
    {
        name: "lucene (order)",
        fn: () =>
            client.lucene("*:*", { order: ["/field1 asc", "/field2 desc"] })
    },
    {
        name: "lucene (fields)",
        fn: () => client.lucene("*:*", { fields: ["/field1", "/field2"] })
    },
    {
        name: "gremlin",
        fn: () => client.gremlin("root-id", "pow()")
    },
    {
        name: "writets",
        fn: () =>
            client.writets("ts-id", [{ timestamp: date, value: "value1" }])
    },
    {
        name: "streamts",
        fn: () => client.streamts("ts-id")
    },
    {
        name: "streamts (from only)",
        fn: () => client.streamts("ts-id", { from: date - 1 })
    },
    {
        name: "streamts (to only)",
        fn: () => client.streamts("ts-id", { to: date + 1 })
    },
    {
        name: "streamts (to + from)",
        fn: () => client.streamts("ts-id", { from: date - 1, to: date + 1 })
    },
    {
        name: "history",
        fn: () => client.history("some-id")
    },
    {
        name: "history (with offset)",
        fn: () => client.history("some-id", { offset: 10 })
    },
    {
        name: "history (with limit)",
        fn: () => client.history("some-id", { limit: 500 })
    },
    {
        name: "history (with offset + limit)",
        fn: () => client.history("some-id", { limit: 5, offset: 100 })
    },
    {
        name: "history (with from)",
        fn: () => client.history("some-id", { from: 0 })
    },
    {
        name: "history (with to)",
        fn: () => client.history("some-id", { to: 1550597976759 })
    },
    {
        name: "history (with from + to)",
        fn: () => client.history("some-id", { from: 0, to: 1550597976759 })
    },
    {
        name: "history (with from + to + offset + limit)",
        fn: () =>
            client.history("some-id", {
                from: 0,
                to: 1550597976759,
                limit: 5,
                offset: 100
            })
    },
    {
        name: "history (with version)",
        fn: () => client.history("some-id", { limit: 500, version: 123 })
    }
];
