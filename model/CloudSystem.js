/**
 * File:   CloudSystem.js
 * Author: elethuillier
 *
 * Created on 25 février 2020, 18:21
 */
import Queue from './Queue.js';

export default class CloudSystem {
  constructor(K, W, lambda, mu, VMs, services, q, capacity, buffer, strategy, vertical) {
    if (typeof K !== 'number') {
      throw new Error('parameter K is not a number');
    }
    if (typeof W !== 'number') {
      throw new Error('parameter W is not a number');
    }
    if (typeof lambda !== 'number') {
      throw new Error('parameter lambda is not a number');
    }
    if (typeof mu !== 'number') {
      throw new Error('parameter mu is not a number');
    }
    if (!(VMs instanceof Set)) {
      throw new Error('parameter VMs is not a instance of Set');
    }
    if (!(services instanceof Set)) {
      throw new Error('parameter services is not a instance of Set');
    }
    if (!(q instanceof Queue)) {
      throw new Error('parameter q is not a instance of Queue');
    }
    if (typeof capacity !== 'number') {
      throw new Error('parameter capacity is not a number');
    }
    if (typeof buffer !== 'number') {
      throw new Error('parameter buffer is not a number');
    }
    if (typeof strategy !== 'number') {
      throw new Error('parameter strategy is not a number');
    }
    if (typeof vertical !== 'number') {
      throw new Error('parameter vertical is not a number');
    }
    this._K = K;// VMs max threshold
    this._W = W;// Services max threshold
    this._lambda = lambda;// arrivals
    this._mu = mu;// service rate
    this._VMs = VMs;// Set
    this._services = services;// Set
    this._queue = q;
    this._capacity = capacity;// max number of VMs
    this._buffer = buffer;
    this._strategy = strategy;
    this._vertical = vertical;
    // this._buffer = 0;
    this._lost = 0;
  }

  // //////////////////////////GETTERS///////////////////////////
  get K() {
    return this._K;
  }

  get W() {
    return this._W;
  }

  get lambda() {
    return this._lambda;
  }

  get mu() {
    return this._mu;
  }

  get VMs() {
    return this._VMs;
  }

  get services() {
    return this._services;
  }

  get queue() {
    return this._queue;
  }

  get capacity() {
    return this._capacity;
  }

  get buffer() {
    return this._buffer;
  }

  get lost() {
    return this._lost;
  }

  get strategy() {
    return this._strategy;
  }

  get vertical() {
    return this._vertical;
  }

  // ////////////////////////SETTERS////////////////////////
  set K(k) {
    if (typeof k !== 'number') {
      throw new Error('new value of K is not a number');
    }
    this._K = k;
  }

  set W(w) {
    if (typeof w !== 'number') {
      throw new Error('new value of W is not a number');
    }
    this._W = w;
  }

  set lambda(lambda) {
    if (typeof lambda !== 'number') {
      throw new Error('new value of lambda is not a number');
    }
    this._lambda = lambda;
  }

  set mu(mu) {
    if (typeof mu !== 'number') {
      throw new Error('new value of mu is not a number');
    }
    this._mu = mu;
  }

  set VMs(VMs) {
    if (!(VMs instanceof Set)) {
      throw new Error('new value of VMs is not a instance of Set');
    }
    this._VMs = VMs;
  }

  set services(services) {
    if (!(services instanceof Set)) {
      throw new Error('new value of services is not a instance of Set');
    }
    this._services = services;
  }

  set queue(queue) {
    if (!(queue instanceof Queue)) {
      throw new Error('new value of queue is not a instance of Queue');
    }
    this._queue = queue;
  }

  set capacity(capacity) {
    if (typeof capacity !== 'number') {
      throw new Error('new value of capacity is not a number');
    }
    this._capacity = capacity;
  }

  set buffer(buffer) {
    if (typeof buffer !== 'number') {
      throw new Error('new value of capacity is not a number');
    }
    this._buffer = buffer;
  }

  set lost(lost) {
    if (typeof lost !== 'number') {
      throw new Error('new value of lost is not a number');
    }
    this._lost = lost;
  }

  set strategy(strategy) {
    if (typeof strategy !== 'number') {
      throw new Error('new value of strategy is not a number');
    }
    this._strategy = strategy;
  }

  set vertical(vertical) {
    if (typeof vertical !== 'number') {
      throw new Error('new value of vertical is not a number');
    }
    this._vertical = vertical;
  }
}
