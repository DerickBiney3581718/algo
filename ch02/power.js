function customPower(num, pow) {
  if (pow == 0) return 1;
  let newPow = Math.floor(pow / 2);
  let newNum = customPower(num, newPow);

  if (pow % 2 == 0) return newNum * newNum;

  return num * newNum * newNum;
}
// draw out with the use of newPow in the condition
console.log("2 ** 8");
console.log(customPower(2, 8));
