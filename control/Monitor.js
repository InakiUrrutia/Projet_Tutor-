import Service from '../model/Service.js';
import VM from '../model/VM.js';
import CloudSystem from '../model/CloudSystem.js';

export default class Monitor {
  // constructor and init (link the monitor to a cloud system)
  constructor(s) {
    if (!(s instanceof CloudSystem)) {
      throw new Error('parameter s is not an instance of CloudSystem');
    }
    this._system = s;
    this._processing = 0;
    this._workload = 0;
    this._writer = '';
    this._xml = '';
  }

  // ////////////////////////////////////////DATA REFRESH//////////////////////////////////////////
  // sim metrics refresh
  refresh() {
    this.processing = 0;
    this.workload = 0;
    this.system.lost = 0;
  }

  refreshStates() {
    this.setVStates(); // refresh VMs states
    this.setSStates(); // refresh Services states
  }

  // ////////////////////////////////////UPDATING STATES////////////////////////////////////////
  // set VMs States
  // K : VM capacity threshold //// 0 = normal / 1 = overloaded / 2 = unused / 3 = new
  setVStates() {
    switch (this.system.strategy) {
      case 1:
        this.system.VMs.forEach((item) => {
          if (item.getLoad() < this.getVMmax() && item.getLoad() > 0 && item.state !== 0) {
            item.state = 0;
          } else if (item.getLoad() === 0 && item.state !== 2 && item.state !== 3) {
            item.state = 2;
          } else if (item.getLoad() >= this.getVMmax() && item.state !== 1) {
            item.state = 1;
          }
        });
        break;
      case 2:
        this.system.VMs.forEach((vm) => {
          const sum = vm.getRamUsed();
          if (sum < vm.ram && vm.ram > 0 && vm.state !== 0) {
            vm.state = 0;
          } else if (vm.ram === 0 && vm.state !== 2 && vm.state !== 3) {
            vm.state = 2;
          } else if (sum >= vm.ram && vm.state !== 1) {
            vm.state = 1;
          }
        });
        break;
      default:
        throw new Error('No strategy other than horizontal (1) or vertical (2)');
    }
  }

  // set Services states  // W : service workload threshold
  setSStates() {
    switch (this.system.strategy) {
      case 1:
        this.system.services.forEach((item) => {
          if (item.getLoad() < this.getSmax() && item.getLoad() > 0 && item.state !== 0) {
            item.state = 0;
          } else if (item.getLoad() === 0 && item.state !== 2 && item.state !== 3) {
            item.state = 2;
          } else if (item.getLoad() >= this.getSmax() && item.state !== 1) {
            item.state = 1;
          }
        });
        break;
      case 2:
        this.system.services.forEach((item) => {
          const ramUnit = this.system.W;
          if (item.getLoad() < item.ram * ramUnit && item.getLoad() > 0 && item.state !== 0) {
            item.state = 0;
          } else if (item.getLoad() === 0 && item.state !== 2 && item.state !== 3) {
            item.state = 2;
          } else if (item.getLoad() >= item.ram * ramUnit && item.state !== 1) {
            item.state = 1;
          }
        });
        break;
      default:
        throw new Error('No strategy other than horizontal (1) or vertical (2)');
    }
  }

  // /////////////////////////////////MONITORING METRICS//////////////////////////////////////
  // return VMs threshold
  getVMmax() {
    return this.system.K;
  }

  // return Services threshold
  getSmax() {
    return this.system.W;
  }

  // number of requests in the all services queues
  getRequests() {
    return this.getQueue().length;
  }

  // number of handled requets by all service instances
  getHandledRequests() {
    this.getAllServices().forEach((item) => {
      if (Monitor.isEmpty(item)) {
        this.processing += item.getLoad();
      }
    }, this);
    return this.processing;
  }

  // general request queue of the system
  getQueue() {
    return this.system.queue;
  }

  // Number of rejected requets
  getLost() {
    return this.system.lost;
  }

  // number of services in the system
  getServices() {
    return this.system.services.size;
  }

  // number of vms in the system
  getVMs() {
    return this.system.VMs.size;
  }

  // //////////////////////////////MONITORING VIRTUAL MACHINES/////////////////////////////////////
  // less loaded VM
  lessVM() {
    const iteratorVMs = this.system.VMs.values();
    let vm = iteratorVMs.next();
    let temp = vm.value;
    vm = iteratorVMs.next();
    switch (this.system.strategy) {
      case 1:
        while (!vm.done) {
          if (vm.value.getLoad() < temp.getLoad()) {
            temp = vm.value;
          }
          vm = iteratorVMs.next();
        }
        break;
      case 2:
        while (!vm.done) {
          if (vm.value.getRamUsed() < temp.getRamUsed()) {
            temp = vm.value;
          }
          vm = iteratorVMs.next();
        }
        break;
      default:
        break;
    }
    if (temp === undefined) {
      throw new Error('Less loaded VM not found');
    }
    return temp;
  }

  // most loaded VM
  mostVM() {
    const iteratorVMs = this.system.VMs.values();
    let vm = iteratorVMs.next();
    let temp = vm.value;
    vm = iteratorVMs.next();
    switch (this.system.strategy) {
      case 1:
        while (!vm.done) {
          if (vm.value.getLoad() > temp.getLoad()) {
            temp = vm.value;
          }
          vm = iteratorVMs.next();
        }
        break;
      case 2:
        while (!vm.done) {
          if (vm.value.getRamUsed() > temp.getRamUsed()) {
            temp = vm.value;
          }
          vm = iteratorVMs.next();
        }
        break;
      default:
        throw new Error('No strategy other than horizontal (1) or vertical (2)');
    }
    if (temp === undefined) {
      throw new Error('Most loaded VM not found');
    }
    return temp;
  }

  // there exists an unused VM instance
  // envoi par référence
  static existEmptyVM(set) {
    if (!(set instanceof Set)) {
      throw new Error('parameter set is not an instance of Set');
    }
    if (set.size === 0) {
      return null;
    }
    const iteratorVMs = set.values();
    let vm = iteratorVMs.next();
    while (!vm.done) {
      if (Monitor.isEmpty(vm.value)) {
        return (vm.value);
      }
      vm = iteratorVMs.next();
    }
    return null;
  }

  // all VMs are empty
  static allEmptyV(set) {
    if (!(set instanceof Set)) {
      throw new Error('parameter set is not an instance of Set');
    }
    if (set.size === 0) {
      return false;
    }
    const iteratorVMs = set.values();
    let vm = iteratorVMs.next();
    while (!vm.done) {
      if (!Monitor.isEmpty(vm.value)) {
        return false;
      }
      vm = iteratorVMs.next();
    }
    return true;
  }

  // there exists an oveloaded VM instance
  static existOverloadedVM(set) { // envoi par référence
    if (!(set instanceof Set)) {
      throw new Error('parameter set is not an instance of Set');
    }
    if (set.size === 0) {
      return false;
    }
    const iteratorVMs = set.values();
    let vm = iteratorVMs.next();
    while (!vm.done) {
      if (Monitor.isOverloaded(vm.value)) {
        return true;
      }
      vm = iteratorVMs.next();
    }
    return false;
  }

  // all VMs are overloaded
  static allOverloadedV(set) {
    if (!(set instanceof Set)) {
      throw new Error('parameter set is not an instance of Set');
    }
    if (set.size === 0) {
      return false;
    }
    const iteratorVMs = set.values();
    let vm = iteratorVMs.next();
    while (!vm.done) {
      if (!Monitor.isOverloaded(vm.value)) {
        return false;
      }
      vm = iteratorVMs.next();
    }
    return true;
  }

  // get all VMs
  getAllVMs() {
    return this.system.VMs;
  }

  // //////////////////////////////////MONITORING SERVICES//////////////////////////////////////////
  // less loaded Service
  lessService() {
    const iteratorServices = this.system.services.values();
    let service = iteratorServices.next();
    let temp = service.value;
    service = iteratorServices.next();
    while (!service.done) {
      if (service.value.getLoad() < temp.getLoad()) {
        temp = service.value;
      }
      service = iteratorServices.next();
    }
    if (temp === undefined) {
      throw new Error('Less loaded Service not found');
    }
    return temp;
  }

  // there exists an unused Service instance
  static existEmptyService(set) { // envoi par référence
    if (!(set instanceof Set)) {
      throw new Error('parameter set is not an instance of Set');
    }
    if (set.size === 0) {
      return null;
    }
    const iteratorServices = set.values();
    let service = iteratorServices.next();
    while (!service.done) {
      if (Monitor.isEmpty(service.value)) {
        return (service.value);
      }
      service = iteratorServices.next();
    }
    return null;
  }

  // all services are empty
  static allEmptyS(set) {
    if (!(set instanceof Set)) {
      throw new Error('parameter is not an instance of Set');
    }
    if (set.size === 0) {
      return false;
    }

    const iteratorServices = set.values();
    let service = iteratorServices.next();
    while (!service.done) {
      if (!Monitor.isEmpty(service.value)) {
        return false;
      }
      service = iteratorServices.next();
    }
    return true;
  }

  // all services are overloaded
  static allOverloadedS(set) {
    if (!(set instanceof Set)) {
      throw new Error('parameter set is not an instance of Set');
    }
    if (set.size === 0) {
      return false;
    }
    const iteratorServices = set.values();
    let service = iteratorServices.next();
    while (!service.done) {
      if (!Monitor.isOverloaded(service.value)) {
        return false;
      }
      service = iteratorServices.next();
    }
    return true;
  }

  // there exists an oveloaded Service instance
  static existOverloadedS(set) { // envoi par référence
    if (!(set instanceof Set)) {
      throw new Error('parameter set is not an instance of Set');
    }
    if (set.size === 0) {
      return false;
    }
    const iteratorServices = set.values();
    let service = iteratorServices.next();
    while (!service.done) {
      if (Monitor.isOverloaded(service.value)) {
        return true;
      }
      service = iteratorServices.next();
    }
    return false;
  }

  // get all services (objects)
  getAllServices() {
    return this.system.services;
  }


  printState(state) {
    this.writer = `${this.writer}${state}\n`;
  }

  printXML(state) {
    this.xml = `${this.xml}${state}\n`;
  }

  printTick(t, offering) {
    this.printState(`${t};${this.getVMs()};${this.getServices()};${offering};${this.workload};${this.getRequests()};${Math.abs(this.workload - this.getHandledRequests() - this.getRequests())};${this.getHandledRequests()};${this.getLost()}`);
    this.printXML(`<tick t="${t}">`);
    this.printXML('<server>');
    this.printXML(`<capacity>${this.system.capacity}</capacity>`);
    this.getAllVMs().forEach((vm) => {
      this.printXML(`<vm>\n<id>${vm.id}</id>`);
      this.printXML(`<cpu>${vm.cpu}</cpu>\n<ram>${vm.ram}</ram>`);
      this.printXML(`<threshold>${vm.threshold}</threshold>`);
      this.printXML(`<state>${vm.state}</state>`);
      vm.services.forEach((service) => {
        this.printXML(`<service>\n<id>${service.id}</id>`);
        this.printXML(`<cpu>${service.cpu}</cpu>\n<ram>${service.ram}</ram>`);
        this.printXML(`<threshold>${service.q.capacity}</threshold>`);
        this.printXML(`<state>${service.state}</state>`);
        this.printXML(`<rejected>${service.rejected}</rejected>`);
        this.printXML('</service>');
      });
      this.printXML('</vm>');
    });
    this.printXML('</server>');
    this.printXML(`<mu>${this.system.mu}</mu>`);
    this.printXML(`<workload>${this.workload}</workload>`);
    this.printXML(`<offering>${offering}</offering>`);
    this.printXML('<requests>');
    this.printXML(`<handled>${this.getHandledRequests()}</handled>`);
    this.printXML(`<queue>${this.getRequests()}</queue>`);
    this.printXML(`<lost>${this.getLost()}</lost>`);
    this.printXML('</requests>');
    this.printXML('</tick>');
  }

  // ///////////////////MULTI-TYPE FONCTIONS//////////////////////////
  static isEmpty(VorS) {
    if (VorS instanceof Service) {
      if (VorS.q.length === 0 && VorS.state === 2) {
        return true;
      }
      return false;
    }
    if (VorS instanceof VM) {
      if (VorS.state === 2) {
        return true;
      }
      return false;
    }
    throw new Error('parameter is not a Service or a VM');
  }

  static isOverloaded(VorS) {
    if (VorS instanceof VM) {
      if (VorS.state === 1) {
        return true;
      }
      return false;
    }
    if (VorS instanceof Service) {
      if (VorS.state === 1) {
        return true;
      }
      return false;
    }
    throw new Error('parameter is not a Service or a VM');
  }


  // ////////////////////////////////////////GETTERS/////////////////////////////////////////////
  get system() {
    return this._system;
  }

  get processing() {
    return this._processing;
  }

  get workload() {
    return this._workload;
  }

  get writer() {
    return this._writer;
  }

  get xml() {
    return this._xml;
  }

  // ////////////////////////////////////////SETTERS/////////////////////////////////////////////
  set system(system) {
    if (!(system instanceof CloudSystem)) {
      throw new Error('new value of system is not an instance of CloudSystem');
    }
    this._system = system;
  }

  set processing(processing) {
    if (typeof processing !== 'number') {
      throw new Error('new value of processing is not a number');
    }
    this._processing = processing;
  }

  set workload(workload) {
    if (typeof workload !== 'number') {
      throw new Error('new value of workload is not a number');
    }
    this._workload = workload;
  }

  set writer(writer) {
    if (typeof writer !== 'string') {
      throw new Error('new value of writer is not a string');
    }
    this._writer = writer;
  }

  set xml(xml) {
    if (typeof xml !== 'string') {
      throw new Error('new value of xml is not a string');
    }
    this._xml = xml;
  }
}
