// The Problem: var is function-scoped
for (var i = 0; i < 3; i++) {
  setTimeout(() => {
    console.log(i);
  }, 100);
}

// solution #1
for (let i = 0; i < 3; i++) {
  setTimeout(() => {
    console.log(i);
  }, 100);
}

//solution #2
for (var i = 0; i < 3; i++) {
  (function (j) {
    setTimeout(() => {
      console.log(j);
    }, 100);
  })(i);
}
// Output: 3, 3, 3  (not 0, 1, 2!)

// solution #3
[0, 1, 2].forEach((val) => {
  setTimeout(() => console.log(val), 100);
});

// Why? There's only ONE 'i' variable shared across all iterations.
// By the time the setTimeout callbacks run, the loop has finished and i === 3.
// closures are created at function call. A reference to its lexical environ

// Real-world example: API request factories
// function createApiClient(baseUrl) {
//   return {
//     get(endpoint) {
//       return fetch(`${baseUrl}${endpoint}`);
//     },
//     post(endpoint, data) {
//       return fetch(`${baseUrl}${endpoint}`, {
//         method: "POST",
//         body: JSON.stringify(data),
//       });
//     },
//   };
// }

// const githubApi = createApiClient("https://api.github.com");
// const myApi = createApiClient("https://myapp.com/api");

// // Each client remembers its baseUrl
// githubApi.get("/users/leonardomso");
// myApi.get("/users/1");
