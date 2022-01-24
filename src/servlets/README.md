# GraphIT Servlet

This allows you to extend the GraphIT connection api to the custom servlets.

Writing a servlet is easy.

e.g. have a servlet on GraphIT at `/_ping` which returns `{ ping: "pong", echo: ... }` when you `POST` data to it. We can expose this on our graph object like this:

```
const servlet = {
    send(fetch, options, echo) {
        options.method = "POST";
        options.body = "echo=" + encodeURIComponent(echo);
        return fetch("/_ping", options);
    }
}
//now register this to our connection

conn.addServlet("ping", servlet);

//now we can use it.
conn.ping.send("boom")
    .then(res => {
        console.log(res.echo) // "boom"
    });
```

