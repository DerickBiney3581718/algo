// Create a simple object
const wizard = {
  name: "Gandalf",
  castSpell() {
    return `${this.name} casts a spell!`;
  },
};

// Create another object that inherits from wizard
const apprentice = Object.create(wizard);
apprentice.name = "Harry";

// apprentice has its own 'name' property
console.log(apprentice.name); // "Harry"

// But castSpell comes from the prototype (wizard)
console.log(apprentice.castSpell()); // "Harry casts a spell!"

// The prototype chain:
// apprentice → wizard → Object.prototype → null
console.log(Object.prototype, typeof Object.prototype);
console.log(Object.getPrototypeOf(wizard));
console.log(wizard.__proto__);

console.log(wizard.hasOwnProperty("name"));
console.log(Object.getPrototypeOf(apprentice));
console.log(apprentice.__proto__); //deprecated

//  .prototype        A property that exists ONLY on functions              │
// │  ──────────        Used as the [[Prototype]] for objects                 │
// │                    created with new                                      │
// │
console.log("////////////////////////////////////////");
function Player(name) {
  this.name = name;
}

// Player is a function object → it automatically gets a .prototype property
console.log(typeof Player); // "function"
console.log(Player.prototype); // { constructor: Player }
console.log(Player.prototype.constructor === Player); // true
