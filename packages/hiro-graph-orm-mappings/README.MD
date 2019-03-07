# @hiro-graph/orm-mappings

Automatic ORM mapping generation based on OGIT.
Supports blacklisting of unwanted data and renaming of relationships for clarity.

Relationships are setup in both directions, as a result, entity "dependencies" have their mapping generated whether they are on the blacklist or not, this ensures all required mappings are correct. For example, `Forum` is on blacklist, however it is fully generated due to incoming relationships and then further generated due to internal relationships (`Forum` entities requiring other `Forum` entities).

## Usage

Setup `config.json`:

```json
{
    "OGIT": "../../../OGIT/NTO", // Should point to OGIT/NTO
    "OUTPUT_DIR": "lib", // Build directory
    "blacklist": ["Factory", "Forum", "MRP", "Network", "Auth/DataScope"], // Supports folder names, or specific entities (without ogit/).
    "mapping": {
        // Renames relationships for better usability and backward compatibility
        "ogit/Auth/belongs -> ogit/Auth/Organization": "parentOrg",
        "ogit/Auth/belongs <- ogit/Auth/AccountProfile": "profile",
        "ogit/Auth/isMemberOf -> ogit/Auth/Team": "team",
        "ogit/Auth/belongs -> ogit/Auth/Account": "account",
        "ogit/belongs -> ogit/Person": "person",
        "ogit/Auth/isMemberOf -> ogit/Auth/Organization": "org"
    }
}
```

Build using:
`yarn && yarn build`
