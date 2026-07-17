/**
 *public class ST<Key extends Comparable<Key>, Value>
 *ST() create an ordered symbol table
 *void put(Key key, Value val) put key-value pair into the table
 *(delete key from table if value is null)
 *Value get(Key key) value paired with key
 *(null if key is absent)
 *void delete(Key key) delete key (and its value) from table
 *boolean contains(Key key) is there a value paired with key?
 *boolean isEmpty() is the table empty?
 *int size() number of key-value pairs
 *Key min() smallest key
 *Key max() largest key
 *Key floor(Key key) largest key less than or equal to key
 *Key ceiling(Key key) smallest key greater than or equal to key
 *int rank(Key key) number of _keys less than key
 *Key select(int k) key of rank k
 *void deleteMin() delete smallest key
 *void deleteMax() delete largest key
 *int size(Key lo, Key hi) number of _keys in [lo..hi]
 *Iterable<Key> _keys(Key lo, Key hi) _keys in [lo..hi], in sorted order
 *Iterable<Key> _keys() all _keys in the table, in sorted order
 */

import type { NonNullComparable } from "../../types/dsa";
import { TArray } from "../arrays/Array";

export class OrderedSymbolTable<K extends NonNullComparable> {
  _keys: TArray<K> = new TArray([], true, true);
  values: TArray<K> = new TArray([], false, true);
  size: number = 0;

  contains(key: K): boolean {
    return this.findKeyIdx(key) != -1;
  }

  put(key: K, value: K): void {
    const idx = this.findKeyIdx(key);

    if (idx !== -1) {
      if (value == null) this.delete(key);
      else this.values.update(idx, value);
    } else this.insert(key, value);
  }

  delete(key: K): void {
    const idx = this.findKeyIdx(key);
    this._keys.delete(idx);
    this.values.delete(idx);
    this.size--;
  }

  insert(key: K, value: K): void {
    this._keys.insert(key);
    const keyIdx = this.findKeyIdx(key);
    // always expect key to exist?
    if (keyIdx === -1) return;
    this.values.insert(value, keyIdx);
    this.size++;
  }

  findKeyIdx(key: K): number {
    return this._keys.search(key);
  }

  get(key: K): K | null {
    const keyIdx = this.findKeyIdx(key);
    return this.values[keyIdx] ?? null;
  }

  get isEmpty(): boolean {
    return this.size <= 0;
  }

  get min(): K | null {
    return this._keys[0] ?? null;
  }

  get max(): K | null {
    return this._keys[this.lastIdx] ?? null;
  }

  get lastIdx(): number {
    return this._keys.validLen - 1;
  }

  floor(key: K): K | null {
    const foundIdx = this.findKeyOrLessIdx(key);
    if (foundIdx == -1) return null;
    return this._keys[foundIdx] ?? null;
  }

  findKeyOrLessIdx(key: K, lo?: number, hi?: number): number {
    lo = lo ?? 0;
    hi = hi ?? this.lastIdx;

    if (lo >= hi) return hi;
    const mid = lo + Math.floor((hi - lo) / 2);

    const midValue = this._keys[mid]!;
    if (key === midValue) return mid;
    else if (key < midValue) hi = mid - 1;
    else lo = mid + 1;
    return this.findKeyOrLessIdx(key, lo, hi);
  }

  ceiling(key: K): K | null {
    const foundIdx = this.findKeyOrLessIdx(key);
    if (foundIdx == -1) return null;

    const isSameKey = this._keys[foundIdx] === key;
    return isSameKey ? key : (this._keys[foundIdx + 1] ?? null);
  }

  rank(key: K): number {
    return this.findKeyIdx(key);
  }

  select(rank: number): K | null {
    return this._keys[rank] ?? null;
  }

  deleteMin(): void {
    const min = this.min;
    if (min !== null) this.delete(min);
  }

  deleteMax(): void {
    const max = this.max;
    if (max !== null) this.delete(max);
  }

  keys(lo?: number, hi?: number): Array<K | null> {
    lo = lo ?? 0;
    hi = hi ?? this.lastIdx;

    const returnedKeys: Array<K | null> = [];
    for (let keyIdx = lo; keyIdx <= hi; keyIdx++)
      returnedKeys.push(this._keys[keyIdx]);

    return returnedKeys;
  }

  toString() {
    const keys = this._keys.toString();
    const values = this.values.toString();

    return `${keys}\n${values}`;
  }
}
