/**
 * File:   Service.js
 * Author: elethuillier
 *
 * Created on 25 février 2020, 17:45
 */
import Entity from './Entity.js';
import Queue from './Queue.js';
import VM from './VM.js';

export default class Service extends Entity {
  constructor(threshold) {
    super();
    const d = new Date();
    this._q = new Queue(threshold);
    this._state = 3;
    this._rejected = 0;
    this._host = null;
    // this.id = `S@${this.hashCode().toString(16)}${d.getTime().toString(16)}`;
    this.id = `S@${d.getTime().toString(36)}`;
  }

  getLoad() {
    return this.q.length;
  }

  compareTo(service) {
    if (!(service instanceof Service)) {
      throw new Error('parameter service is not an instance of Service');
    }
    if (this.id === service.id) {
      return 0;
    }
    return 1;
  }

  toString() {
    return (`${this.constructor.name}[${this.state.toString()}${this.q.toString()}${this.rejected.toString()}]`);
  }

  // ////////////////////////////////////GETTERS//////////////////////////////
  get q() {
    return this._q;
  }

  get host() {
    return this._host;
  }

  get rejected() {
    return this._rejected;
  }

  // ////////////////////////////////////SETTERS//////////////////////////////
  set q(q) {
    if (!(q instanceof Queue)) {
      throw new Error('new value of q is not an instance of Queue');
    }
    this._q = q;
  }

  set host(host) {
    if (!(host instanceof VM)) {
      throw new Error('new value of host is not an instance of VM');
    }
    this._host = host;
  }

  set rejected(rejected) {
    if (typeof rejected !== 'number') {
      throw new Error('new value of rejected is not a number');
    }
    this._rejected = rejected;
  }
}
