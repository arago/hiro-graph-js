export default {
  name: "AuthAccount",
  ogit: "ogit/Auth/Account",
  required: {
    name: "ogit/name",
    status: "ogit/status",
  },
  optional: {
    roles: {
      src: "/roles",
      type: "list",
    },
  },
};
