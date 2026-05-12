// const cache = new Map();

// function fibonacci(n) {
//   // check cache first
//   if (cache.has(n)) return cache.get(n);
//   if (n === 0) return 0;
//   if (n === 1) return 1;
//   const fibNum = fibonacci(n - 1) + fibonacci(n - 2);
//   cache.set(n, fibNum);
//   return fibNum;
// }

function fibonacci(n) {
  let prev2 = 0;
  let prev1 = 1;

  for (let idx = 2; idx <= n; idx++) {
    const next = prev1 + prev2;

    prev2 = prev1;
    prev1 = next;
  }
  return prev1;
}

const fibNum = fibonacci(45);
console.log("fib num : ", fibNum);
