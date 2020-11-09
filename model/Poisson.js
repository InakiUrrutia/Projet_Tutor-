/**
 * File:   Poisson.js
 * Author: elethuillier
 *
 * Created on 25 février 2020, 18:27
 */

export default class Poisson {
  static getPoisson(lambda) {
    if (typeof lambda !== 'number') {
      throw new Error('parameter lambda is not a number');
    }
    const L = Math.exp(-lambda);
    let p = 1.0;
    let k = 0;

    while (p > L) {
      k += 1;
      p *= Math.random();
    }
    return k - 1;
  }
}
