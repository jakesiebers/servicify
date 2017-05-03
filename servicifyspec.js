[
  {
    name: 'add', // Function name
    method: 'GET', // HTTP Method
    path: '/add/:a/:b',
    arguments: { // arguments are optional
      a: "number", // number|string|object|array|domain (for now)
      b: "number",
    },
    uses: ['user', ...], // auth|user|admin etc. used to run named functions (pre/post)
    description: "add a and b", // a public description of what the endpoint does
  },
  // ...
]
