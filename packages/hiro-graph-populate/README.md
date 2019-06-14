# @hiro-grap/populate

Tool for populating graph with data.

## Install

The tool is executable and can be installed locally, or globally.

### Local

`yarn add -D @hiro/graph-populate`

### Global

`yarn global add @hiro/graph-populate`

## Usage

A config (.rc, .json, .js or in package.json) for `hiro-graph-populate` is required.
The config will be used to populate a graph using the details given in the environmental variables.

### Local

`yarn hiro-graph-populate`

### Global

`hiro-graph-populate`

### Environmental variables

Environment variables must be set in-order to retrieve a token, a `.env.` file can be used for this:

```env
HIRO_CLIENT_ID=[application client id]
HIRO_CLIENT_SECRET=[application secret]
HIRO_GRAPH_URL=https://stagegraph.arago.co
HIRO_GRAPH_USER_NAME=[username]
HIRO_GRAPH_USER_PASSWORD=[password]
```

### Config

Config is required and can be stored as:

-   `hiro-graph-populate` in package.json
-   `.hiro-graph-populaterc` (JSON or YAML)
-   `.hiro-graph-populaterc.{json|yaml|yml|js}`
-   `hiro-graph-populate.config.js`

#### Populate

```json
{
    "populate": [
        {
            "name": "a.arago-demo.com",
            "admins": [
                {
                    "name": "Lydia Mason",
                    "email": "lydia.mason@a.arago-demo.com",
                    "password": "test"
                }
            ],
            "users": [
                {
                    "name": "Nyah Cross",
                    "email": "nyah.cross@a.arago-demo.com",
                    "password": "test"
                },
                {
                    "name": "Mia Rose",
                    "email": "mia-rose.irving@a.arago-demo.com",
                    "password": "test"
                }
            ]
        }
    ]
}
```

#### Generate

```json
{
    "generate": {
        "orgs": {
            "name": "arago-demo.com",
            "count": 18
        },
        "users": {
            "perOrg": 5,
            "password": "test123"
        },
        "admins": {
            "perOrg": 1,
            "password": "test123"
        }
    }
}
```
