export default client => [
    {
        name: "me",
        fn: () => client.me()
    },
    {
        name: "info",
        fn: () => client.info()
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
        fn: () => client.connect("some-verb", "the-in-id", "the-out-id")
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
    }
];
