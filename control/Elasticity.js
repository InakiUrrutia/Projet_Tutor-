import VM from '../model/VM.js';
import Service from '../model/Service.js';
import Monitor from './Monitor.js';
import Actuator from './Actuator.js';
import CloudSystem from '../model/CloudSystem.js';
import { getNumberOfAgents } from '../lib/erlangc.js';

export default class Elasticity {
  constructor(m, a, s) {
    if (!(m instanceof Monitor)) {
      throw new Error('parameter m is not a Monitor');
    }
    if (!(a instanceof Actuator)) {
      throw new Error('parameter a is not an Actuator');
    }
    this._monitor = m;
    this._actuator = a;
    this._system = s;
  }

  // ////////////////////////IMPLEMENTING THE ACTIONS FOR STRATEGIES//////////////////////////////
  // how requests are routed to service instances
  distributeRequests(q) {
    if (typeof q !== 'number') {
      throw new Error('parameter q is not a number');
    }
    let iteratorServices; let service; let t;
    while (this.monitor.getRequests() > 0
    && this.monitor.getAllServices().size > 0
    && !Monitor.allOverloadedS(this.monitor.getAllServices())) {
      iteratorServices = this.monitor.getAllServices().values();
      service = iteratorServices.next();
      while (!service.done && this.monitor.getRequests() > 0) {
        switch (this.system.strategy) {
          case 1:
            if (service.value.getLoad() < this.monitor.getSmax()) {
              console.log(`System Queue length = ${this.monitor.getRequests()}`);
              t = this.actuator.systemQtoServiceQ(service.value,
                Math.min(this.monitor.getRequests(), q));
              console.log(` transferring ${t} requests to ${service.value.id}`);
              this.monitor.getQueue().length -= t;
              console.log(` NEW System Queue length = ${this.monitor.getRequests()}`);
            }
            break;
          case 2:
            if (service.value.getLoad() < this.monitor.getSmax() * service.value.ram) {
              t = this.actuator.systemQtoServiceQ(service.value,
                Math.min(this.monitor.getRequests(), q * service.value.cpu));
              console.log(` transferring ${t} requests to ${service.value.id}`);
              this.monitor.getQueue().length -= t;
              console.log(` NEW System Queue length = ${this.monitor.getRequests()}`);
            }
            break;
          default:
            throw new Error('No strategy other than horizontal (1) or vertical (2)');
        }
        service = iteratorServices.next();
      }
      this.monitor.refreshStates();
    }
  }

  // consume requests
  serveRequests(q) {
    if (typeof q !== 'number') {
      throw new Error('parameter q is not a number');
    }
    this.monitor.getAllServices().forEach((item) => {
      if (item.getLoad() > 0) {
        switch (this.system.strategy) {
          case 1:
            this.monitor.processing += Actuator.releaseRequest(item, q);
            break;
          case 2:
            this.monitor.processing += Actuator.releaseRequest(item, q * item.cpu);
            break;
          default:
            throw new Error('No strategy other than horizontal (1) or vertical (2)');
        }
      }
    });
  }

  // how service instances chose their host VM
  map(s) {
    if (!(s instanceof Service)) {
      throw new Error('parameter s is not an instance of Service');
    }
    const vm = this.monitor.lessVM();
    if (vm == null) {
      return false;
    }
    if (vm.getLoad() < this.monitor.getVMmax()) {
      this.actuator.deployService(vm, s);
      return true;
    }
    return false;
  }

  // //////////////////////////////////////THE SCALING ACTIONS/////////////////////////////////////
  // VMs////////////////////////////////////
  // scaling out VMs (VM replication)
  scaleOutV(cas) {
    if (typeof cas !== 'number') {
      throw new Error('parameter cas is not a number');
    }
    switch (this.system.strategy) {
      case 1: {
        const base = this.monitor.getAllVMs().size === 0 && this.monitor.getQueue().length > 0;
        let predicate = false;
        switch (cas) {
          case 1:
            predicate = Monitor.existOverloadedVM(this.monitor.getAllVMs())
            && (Monitor.existEmptyVM(this.monitor.getAllVMs()) == null); // ONE VM L --> + VM
            break;
          case 2:
            predicate = Monitor.allOverloadedV(this.monitor.getAllVMs()); // ALL VM L --> + VM
            break;
          default:
            throw new Error('H strategy at infrastructure level other than 1 or 2 not implemented');
        }
        // creates new VM if no offline VM and if max capacity of online VMs not reached
        if (base || (predicate && (this.monitor.getVMs() < this.monitor.system.capacity))) {
          this.actuator.deployVM(new VM(this.monitor.getVMmax()));
        }
        break;
      }
      case 2:
        this.monitor.getAllVMs().forEach((vm) => {
          if (vm.getRamUsed() >= vm.ram || vm.getCpuUsed() >= vm.cpu) {
            if (vm.cpu === 0) {
              vm.cpu = 1;
            } else {
              vm.cpu *= 2;
            }
            if (vm.ram === 0) {
              vm.ram = 1;
            } else {
              vm.ram *= 2;
            }
          }
        });
        break;
      default:
        throw new Error('No strategy other than horizontal (1) or vertical (2)');
    }
  }

  // scaling in VMs (VM destruction)
  scaleInV() {
    switch (this.system.strategy) {
      case 1:
        if (Monitor.allEmptyV(this.monitor.getAllVMs())
        && this.monitor.getRequests() === 0
        && this.monitor.workload === 0) {
          this.actuator.destroyVMs(this.monitor.getAllVMs());
        } else {
          const v = Monitor.existEmptyVM(this.monitor.getAllVMs());
          // if (v != null && !monitor.existOverloadedVM(monitor.getAllVMs()))
          // && (monitor.getAllVMs().size-1 > 0))
          if (v != null) {
            this.actuator.destroyVM(v); // the empty VM is returned in variable v
          }
        }
        break;
      case 2:
        if (Monitor.allEmptyV(this.monitor.getAllVMs())
        && this.monitor.getRequests() === 0
        && this.monitor.workload === 0) {
          this.monitor.getAllVMs().forEach((vm) => {
            vm.services.forEach((service) => {
              service.ram = 0;
              service.cpu = 0;
            });
            vm.ram = 1;
            vm.cpu = 1;
          });
        } else {
          const v = Monitor.existEmptyVM(this.monitor.getAllVMs());
          if (v != null) {
            v.services.forEach((service) => {
              service.ram = 0;
              service.cpu = 0;
            });
            v.ram = 1;
            v.cpu = 1;
          } else {
            this.monitor.getAllVMs().forEach((vm) => {
              if (vm.getRamUsed < vm.ram / 2) {
                vm.ram /= 2;
              }
              if (vm.getCpuUsed < vm.cpu / 2) {
                vm.cpu /= 2;
              }
            });
          }
        }
        break;
      default:
        throw new Error('No strategy other than horizontal (1) or vertical (2)');
    }
  }

  // SERVICES////////////////////////////////
  // scaling out services (service replication)
  scaleOutS(cas) {
    if (typeof cas !== 'number') {
      throw new Error('parameter cas is not a number');
    }
    switch (this.system.strategy) {
      case 1: {
        const base = this.monitor.getAllServices().size === 0
        && this.monitor.getQueue().length > 0;
        let predicate = false;
        switch (cas) {
          case 1:
            predicate = (Monitor.existOverloadedS(this.monitor.getAllServices())
            && ((Monitor.existEmptyService(this.monitor.getAllServices()) == null)));
            break; // ONE S L --> + S
          case 2:
            predicate = Monitor.allOverloadedS(this.monitor.getAllServices());
            break; // ALL S L --> + S
          default:
            throw new Error('H strategy at service level other than 1 or 2 not implemented');
        }
        if ((predicate || base) && (!Monitor.allOverloadedV(this.monitor.getAllVMs()))) {
          this.map(new Service(this.monitor.getSmax()));
        }
        break;
      }
      case 2:
        this.monitor.getAllServices().forEach((service) => {
          if (Monitor.isOverloaded(service)) {
            const sumRam = service.host.getRamUsed();
            const sumCpu = service.host.getCpuUsed();
            if (sumRam + service.ram <= service.host.ram) {
              service.ram = service.ram === 0 ? 1 : service.ram * 2;
            } else {
              service.ram += service.host.ram - sumRam;
            }
            if (sumCpu + service.cpu <= service.host.cpu) {
              service.cpu = service.cpu === 0 ? 1 : service.cpu * 2;
            } else {
              service.cpu += service.host.cpu - sumCpu;
            }
          }
        });
        break;
      default:
        throw new Error('No strategy other than horizontal (1) or vertical (2)');
    }
  }

  // scaling in Services (services destruction)
  scaleInS() {
    switch (this.system.strategy) {
      case 1:
        if (Monitor.allEmptyS(this.monitor.getAllServices())
        && this.monitor.getRequests() === 0
        && this.monitor.workload === 0) { // ALL S U && Q = 0 ---> - ALL S
          this.actuator.destroyServices(this.monitor.getAllServices());
        } else { // ONE S U && Exist S ! L ---> - S U
          const s = Monitor.existEmptyService(this.monitor.getAllServices());
          // if (s != null)
          if ((s != null)
          && !Monitor.existOverloadedS(this.monitor.getAllServices())
          && this.monitor.getServices() > 1) {
            this.actuator.destroyService(s); // the empty S is returned in variable s
          }
        }
        break;
      case 2:
        if (Monitor.allEmptyS(this.monitor.getAllServices())
        && this.monitor.getRequests() === 0
        && this.monitor.workload === 0) { // ALL S U && Q = 0 ---> - ALL S
          this.monitor.getAllServices().forEach((item) => {
            item.cpu = 0;
            item.ram = 0;
          });
        } else { // ONE S U && Exist S ! L ---> - S U
          const s = Monitor.existEmptyService(this.monitor.getAllServices());
          // if (s != null)
          if ((s != null)
          && !Monitor.existOverloadedS(this.monitor.getAllServices())) {
            s.ram = 0;
            s.cpu = 0;
          } else {
            this.monitor.getAllServices().forEach((service) => {
              if (service.getLoad() <= (service.ram * this.system.W) / 2) {
                service.ram /= 2;
                service.cpu /= 2;
              }
            });
          }
        }
        break;
      default:
        throw new Error('No strategy other than horizontal (1) or vertical (2)');
    }
  }

  MigrateS() {
    const VMs = this.monitor.getAllVMs();
    let s = null;
    if (Monitor.existOverloadedVM(VMs)) {
      s = this.monitor.mostVM().services.values().next().value; // TODO get most loaded service ?
    }
    if (s != null) {
      const vm = this.monitor.lessVM();
      switch (this.system.strategy) {
        case 1:
          if (vm != null && (vm.getLoad() + 1 < this.monitor.getVMmax())) {
            const prev = s.host.id; // String
            s.host.services.delete(s);
            vm.services.add(s);
            s.host = vm;
            console.log(`Service instance ${s.id} migrated from ${prev} to ${vm.id} TOTAL VMs = ${VMs.size}/ Services =${this.monitor.getAllServices().size}`);
          }
          break;
        case 2:
          if (vm != null && (vm.getRamUsed() + s.ram < vm.ram)
          && (vm.getCpuUsed() + s.cpu < vm.cpu)) {
            const prev = s.host.id; // String
            s.host.services.delete(s);
            vm.services.add(s);
            s.host = vm;
            console.log(`Service instance ${s.id} migrated from ${prev} to ${vm.id} TOTAL VMs = ${VMs.size}/ Services =${this.monitor.getAllServices().size}`);
          }
          break;
        default:
          throw new Error('No strategy other than horizontal (1) or vertical (2)');
      }
    }
  }

  scale(v, s) {
    if (typeof v !== 'number') {
      throw new Error('parameter v is not a number');
    }
    if (typeof s !== 'number') {
      throw new Error('parameter s is not a number');
    }
    this.monitor.refreshStates();
    if (this.system.strategy === 2 && this.system.vertical === 1) {
      const volumes = this.monitor.getRequests();
      const IntervalLength = 1; // 1 tick
      const aht = IntervalLength / this.system.mu;
      const targetServiceLevel = 1; // 100%
      const targetTime = IntervalLength;
      const maxOccupancy = 1; // 100%
      const shrinkage = 0;
      const agents = getNumberOfAgents(volumes, IntervalLength, aht,
        targetServiceLevel, targetTime, maxOccupancy, shrinkage);
      const CpuRam = Math.round(agents / this.system.services.size);
      this.system.services.forEach((service) => {
        service.ram = CpuRam;
        service.cpu = CpuRam;
      });
      this.system.VMs.forEach((vm) => {
        vm.ram = vm.getRamUsed();
        vm.cpu = vm.getCpuUsed();
      });
    } else {
      this.scaleInS();
      this.monitor.refreshStates();
      this.scaleInV();
      this.monitor.refreshStates();
      this.MigrateS();
      this.monitor.refreshStates();
      this.scaleOutV(v);
      this.monitor.refreshStates();
      this.scaleOutS(s);
      this.monitor.refreshStates();
    }
  }

  // //////////////////////////////////////GETTERS/////////////////////////////////////

  get monitor() {
    return this._monitor;
  }

  get actuator() {
    return this._actuator;
  }

  get system() {
    return this._system;
  }

  // //////////////////////////////////////SETTERS/////////////////////////////////////

  set monitor(monitor) {
    if (monitor instanceof Monitor) {
      throw new Error('parameter monitor is not an instance of Monitor');
    }
    this._monitor = monitor;
  }

  set actuator(actuator) {
    if (actuator instanceof Actuator) {
      throw new Error('parameter actuator is not an instance of Actuator');
    }
    this._actuator = actuator;
  }

  set system(system) {
    if (system instanceof CloudSystem) {
      throw new Error('parameter system is not an instance of CludSystem');
    }
    this._system = system;
  }
}
