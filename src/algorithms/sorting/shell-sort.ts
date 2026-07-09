/**
 * allows the value exchanges far apart to make a partially sorted array
 * The idea is to rearrange the array to give it the property that taking every hth entry
(starting anywhere) yields a sorted subsequence
*Produces h-independent sorted subsequences
*
* 
 */
export type subscriptable<T> = { [idx: number]: T };
export function swap<T extends string | number | null>(
  list: subscriptable<T>, //any subscriptable
  left: number,
  right: number,
) {
  const buffer = list[left];
  list[left] = list[right];
  list[right] = buffer;
}

export function shellSort<T extends string | number>(list: T[]) {
  const listNumber = list.length;
  let h = 1;
  while (h < listNumber / 3) h = 3 * h + 1; // find the perfect h: the subsequence intervals

  while (h >= 1) {
    for (let idx = h; idx < listNumber; idx++) {
      for (
        let idx2 = idx;
        idx2 >= h && list[idx2 - h] > list[idx2];
        idx2 -= h
      ) {
        swap(list, idx2 - h, idx2);
      }
    }
    h = Math.floor(h / 3);
  }
}
