/**
 * File:   Entity.js
 * Author: elethuillier
 *
 * Created on 25 février 2020, 16:56
 */

export default class Entity {
  constructor() {
    this._id = null;
    this._state = null; // 0 = normal / 1 = overloaded / 2 = unused / 3 = new
    this.cpu = 1;
    this.ram = 1;
  }

  hashCode() {
    const s = this.toString();
    let i = 0; let h = 0;
    for (i = 0, h = 0; i < s.length; i += 1) {
      h = Math.imul(31, h) + s.charCodeAt(i) | 0;
    }
    return h;
  }

  toString() {
    return (`${this.constructor.name}`);
  }

  // //////////////////////////GETTERS/////////////////////////
  get id() {
    return this._id;
  }

  get state() {
    return this._state;
  }


  get cpu() {
    return this._cpu;
  }

  get ram() {
    return this._ram;
  }

  // //////////////////////////SETTERS/////////////////////////
  set id(id) {
    if (typeof id !== 'string') {
      throw new Error('new value of id is not a string');
    }
    this._id = id;
  }

  set state(state) {
    if (typeof state !== 'number') {
      throw new Error('new value of state is not a number');
    }
    if (state !== 0 && state !== 1 && state !== 2 && state !== 3) {
      throw new Error('new value of state is not in [0;3]');
    }
    this._state = state;
  }

  set cpu(cpu) {
    if (typeof cpu !== 'number') {
      throw new Error('new value of cpu is not a number');
    }
    this._cpu = cpu;
  }

  set ram(ram) {
    if (typeof ram !== 'number') {
      throw new Error('new value of ram is not a number');
    }
    this._ram = ram;
  }
}
