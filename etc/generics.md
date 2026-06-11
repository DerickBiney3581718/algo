//classes
class Array<T> {
// [s:string]: boolean; even methods are properties too
strip!: Array<T>;

constructor(strip: Array<T>, length?: number) {
if (length) {
}
}

// A derived class can also override a base class field or property. You can use the super. syntax to access base class methods.
// Note that because JavaScript classes are a simple lookup object, there is no notion of a “super field”.
}

// generic
// will provide the <Type> on invocation
function identity<Type>(arg: Type): Type {
return arg;
}

let myIdentity: <Type>(arg: Type) => Type = identity; // a generic function
let myOtherIdentity: { <Type>(arg: Type): Type } = identity; // a generic function using an the call signature of an object literal
// move it to a generic interface
interface GenericIdentity {
<Type>(arg: Type): Type;
}

//
let mySecondidentity: GenericIdentity = myOtherIdentity;

// Rewrite the Generic type: Now type is visible to all members
interface GenericIdentityWithTypeOut<Type> {
(arg: Type): Type;
}

let myThirdIdentity: GenericIdentityWithTypeOut<number> = myIdentity;

identity("sealed");
