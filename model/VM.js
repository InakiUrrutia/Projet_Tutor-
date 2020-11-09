/**
 * File:   VM.js
 * Author: elethuillier
 *
 * Created on 25 février 2020, 16:50
 */
import Entity from './Entity.js';

export default class VM extends Entity {
  constructor(threshold) {
    if (typeof threshold !== 'number') {
      throw new Error('parameter threshold is not a number');
    }
    super();
    const d = new Date();
    this._threshold = threshold;
    this._services = new Set();
    this._state = 3;
    // this.id = `V@${this.hashCode().toString(16)}$$${d.getTime().toString(16)}`;
    this.id = `V@${d.getTime().toString(36)}`;
  }

  getLoad() {
    return this.services.size;
  }

  getRamUsed() {
    let sum = 0;
    this.services.forEach((service) => {
      sum += service.ram;
    });
    return sum;
  }

  getCpuUsed() {
    let sum = 0;
    this.services.forEach((service) => {
      sum += service.cpu;
    });
    return sum;
  }

  compareTo(vm) {
    if (!(vm instanceof VM)) {
      throw new Error('parameter vm is not an instance of VM');
    }
    if (this.id === vm.id) {
      return 0;
    }
    return 1;
  }

  toString() {
    return (`${this.constructor.name}[${this.state.toString()}${this.threshold.toString()}${this.services.toString()}]`);
  }

  // ///////////////////////////////////GETTERS//////////////////////////////////
  get services() {
    return this._services;
  }

  get threshold() {
    return this._threshold;
  }

  // //////////////////////////////////SETTERS///////////////////////////////////
  set services(services) {
    if (!(services instanceof Set)) {
      throw new Error('new value of services is not an instance of Set');
    }
    this._services = services;
  }

  set threshold(threshold) {
    if (typeof threshold !== 'number') {
      throw new Error('new value of threshold is not a number');
    }
    this._threshold = threshold;
  }
}
