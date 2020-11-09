import CloudSystem from '../model/CloudSystem.js';
import VM from '../model/VM.js';
import Service from '../model/Service.js';
import Queue from '../model/Queue.js';

export default class Actuator {
  constructor(system) {
    if (!(system instanceof CloudSystem)) {
      throw new Error('parameter system is not an instance of CloudSystem');
    }
    this._system = system;
    this._adaptations = 0;
  }

  // ///////////////////////////////////ACTIONS OVER VMs////////////////////////////////////////////
  // deploy ONE VM and turn it ON
  deployVM(v) {
    // this.VMs.add(v); // static number of VMs
    if (!(v instanceof VM)) {
      throw new Error('parameter v is not an instance of VM');
    }
    this.system.VMs.add(v);
    console.log(`Virtual Machine ${v.id} succesfully deployed`);
    this.adaptations += 1;
  }

  // deploy A SET of VMS and turn them ON
  deployVMs(v) {
    // this.VMs.addAll(v); // static number of VMs
    if (!(v instanceof Set)) {
      throw new Error('parameter v is not an instance of Set');
    }
    v.forEach((item) => {
      this.deployVM(item);
    }, this);
  }

  // destroy ONE VM and turn it OFF
  destroyVM(v) {
    if (!(v instanceof VM)) {
      throw new Error('parameter v is not an instance of VM');
    }
    console.log(`Number of VMs in the system : ${this.system.VMs.size}`);
    const { id } = v; // prefer destructuring
    this.system.VMs.delete(v);
    console.log(` virtual machine ${id} destroyed - Remaining :${this._system.VMs.size}`);
    this.adaptations += 1;
  }

  // destroy A SET OF VMs and turn them OFF ----------------> TODO IMPROVE param set of v ?
  destroyVMs(/* v */) {
    this.system.VMs.clear();
    console.log('All Virtual Machines destroyed');
    this.adaptations += 1;
  }

  // /////////////////////////////////ACTIONS OVER Services/////////////////////////////////////////
  // deploy ONE service
  deployService(v, s) {
    if (!(v instanceof VM)) {
      throw new Error('parameter v is not an instance of VM');
    }
    if (!(s instanceof Service)) {
      throw new Error('parameter s is not an instance of Service');
    }
    s.host = v;
    v.services.add(s);
    this.system.services.add(s);
    console.log(`Service instance ${s.id} deployed to ${v.id}`);
    this.adaptations += 1;
  }

  // deploy A SET of services
  deployServices(v, s) {
    // v.services.addAll(s);
    if (!(v instanceof VM)) {
      throw new Error('parameter v is not an instance of VM');
    }
    if (!(s instanceof Set)) {
      throw new Error('parameter s is not an instance of Set');
    }
    s.forEach((item) => {
      v.services.add(item);
      this.system.services.add(item);
    }, this);
    // this.system.services.addAll(s);
    console.log('all services deployed');
  }

  // destroy ONE service
  destroyService(s) {
    if (!(s instanceof Service)) {
      throw new Error('parameter s is not an instance of Service');
    }
    console.log(`Number of services in the system : ${this.system.services.size}`);
    const { id } = s;// prefer destrucuring
    s.host.services.delete(s);
    this.system.services.delete(s);
    console.log(` Service instance${id} destroyed - Remaining : ${this.system.services.size}`);
    this.adaptations += 1;
  }

  // destroy A SET of services
  destroyServices(s) {
    // system.services.removeAll(s);
    if (!(s instanceof Set)) {
      throw new Error('parameter s is not an instance of Set');
    }
    s.forEach((item) => {
      item.host.services.delete(item); // IMPROVE
      this.system.services.delete(item);
    }, this);
    console.log('all services destroyed');
  }

  // ////////////////////////////////////ACTIONS OVER Requests//////////////////////////////////////
  // fill system queue with arrivals
  queueRequests(qg, q) {
    if (!(qg instanceof Queue)) {
      throw new Error('parameter qg is not an instance of Queue');
    }
    if (typeof q !== 'number') {
      throw new Error('parameter q is not a number');
    }
    if (qg.length >= qg.capacity) {
      this.system.lost += q;
    } else if (q > qg.capacity - qg.length) {
      this.system.lost += q - (qg.capacity - qg.length);
      qg.length = qg.capacity;
    } else {
      qg.length += q;
    }
  }

  // transfer from system queue to service queue
  systemQtoServiceQ(s, q) {
    if (!(s instanceof Service)) {
      throw new Error('parameter s is not an instance of Service');
    }
    if (typeof q !== 'number') {
      throw new Error('parameter q is not a number');
    }
    let result = 0;
    if (s.getLoad() >= this.system.W * s.ram) {
      return result;
    }
    if (q >= this.system.W * s.ram - s.getLoad()) {
      result = (this.system.W * s.ram - s.getLoad());
      s.q.length = this.system.W * s.ram;
      return result;
    }
    s.q.length += q;
    return q;
  }

  // serve requests
  static releaseRequest(s, q) {
    if (!(s instanceof Service)) {
      throw new Error('parameter s is not an instance of Service');
    }
    if (typeof q !== 'number') {
      throw new Error('parameter q is not a number');
    }
    let result = 0;
    if (q >= s.getLoad()) {
      result = s.getLoad();
      s.q.length = 0;
      return result;
    }
    s.q.length -= q;
    return q;
  }

  // /////////////////////////////////GETTERS///////////////////////////////////
  get system() {
    return this._system;
  }

  get adaptations() {
    return this._adaptations;
  }

  // /////////////////////////////////GETTERS///////////////////////////////////
  set system(system) {
    if (!(system instanceof CloudSystem)) {
      throw new Error('new value of system is not an instance of CloudSystem');
    }
    return this._system;
  }

  set adaptations(adaptations) {
    if (typeof adaptations !== 'number') {
      throw new Error('new value of adaptations is not a number');
    }
    return this._adaptations;
  }
}
