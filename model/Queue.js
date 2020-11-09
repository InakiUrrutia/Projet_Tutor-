/**
 * File:   Queue.js
 * Author: elethuillier
 *
 * Created on 25 février 2020, 16:13
 */
export default class Queue {
  constructor(capacity) {
    if (typeof capacity !== 'number') {
      throw new Error('parameter capacity is not a number');
    }
    this._capacity = capacity;
    this._length = 0;
  }

  toString() {
    return (`Queue[${this._capacity.toString()}${this._length.toString()}]`);
  }

  // ///////////////////////////GETTERS/////////////////////////////////////

  get capacity() {
    return this._capacity;
  }

  get length() {
    return (this._length);
  }

  // //////////////////////////SETTERS/////////////////////////////////////

  set capacity(capacity) {
    if (typeof capacity !== 'number') {
      throw new Error('new value of capacity is not a number');
    }
    this._capacity = capacity;
  }

  set length(length) {
    if (typeof length !== 'number') {
      throw new Error('new value of length is not a number');
    }
    this._length = length;
  }
}
