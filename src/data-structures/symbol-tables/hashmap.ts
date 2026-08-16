/* public class ST<Key, Value>
 * ST() create a symbol table
 * void put(Key key, Value val) put key-value pair into the table
 * (remove key from table if value is null)
 * Value get(Key key) value paired with key
 * (null if key is absent)
 * void delete(Key key) remove key (and its value) from table
 * boolean contains(Key key) is there a value paired with key?
 * boolean isEmpty() is the table empty?
 * int size() number of key-value pairs in the table
 * Iterable<Key> keys() all the keys in the table
 */

import {
  LinkedList,
  LinkNode,
  type CompareFn,
  type KeyFn,
} from "../linked-lists/LinkedLists";
interface NodeStruct<T, V> {
  key: NonNullable<T>;
  value: NonNullable<V>;
}

type HashFn<K> = (a: K, M: number) => number;
type EqnFn<K> = (a: K, b: K) => number;

/** A bucket stores whole entries but is queried by key alone. */
type Bucket<T, V> = LinkedList<NodeStruct<T, V>, T>;

export class Hashmap<T, V> {
  mersenne: number = 393241;
  cache: Map<NonNullable<T>, number> = new Map();
  hashFn: HashFn<T>;
  eqnFn: EqnFn<T>;
  _keys: Bucket<T, V>[] = [];

  keyOf: KeyFn<NodeStruct<T, V>, T> = (value: NodeStruct<T, V>) => value.key;

  compareFn: CompareFn<NodeStruct<T, V>, T> = (
    node: LinkNode<NodeStruct<T, V>>,
    key: T,
  ): boolean => this.eqnFn(node.value.key, key) === 0;

  constructor(hashFn: HashFn<T>, eqnFn: EqnFn<T>) {
    this.hashFn = hashFn;
    this.eqnFn = eqnFn;
  }

  put(key: NonNullable<T>, value: NonNullable<V>): void {
    const hashedKeyIdx = this.hash(key);

    const list = this._keys[hashedKeyIdx] ?? null;

    if (list) {
      const wasUpdated = list.update({ key, value });

      if (!wasUpdated) list.insertAtEnd({ key, value });
    } else {
      const newList = new LinkedList(
        [{ key, value }],
        this.compareFn,
        this.keyOf,
      );
      this._keys[hashedKeyIdx] = newList;
    }
  }

  private hash(str: NonNullable<T>): number {
    if (this.cache.has(str)) return this.cache.get(str)!;
    const totalHash = this.hashFn(str, this.mersenne);
    this.cache.set(str, totalHash);
    return totalHash;
  }

  get(key: NonNullable<T>): NonNullable<V> | null {
    const list = this._getList(key);
    if (list === null) return null;
    const node = list.search(key);

    return node?.value?.value ?? null;
  }

  private _getList(key: NonNullable<T>): Bucket<T, V> | null {
    const hashedKeyIdx = this.hash(key);
    return this._keys[hashedKeyIdx] ?? null;
  }

  delete(key: NonNullable<T>): void {
    const list = this._getList(key);
    list?.remove(key);
  }
}

export const stringHash: HashFn<string> = (str: string, M) => {
  let totalHash = 0;
  const R = 32;
  for (const char of str) {
    totalHash = (totalHash * R + char.charCodeAt(0)) % M;
  }
  return totalHash;
};
