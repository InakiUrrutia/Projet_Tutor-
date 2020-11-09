/**
 * File:   Simulation.js
 * Author: elethuillier
 *
 * Created on 25 février 2020, 18:45
 */
import VM from '../model/VM.js';
import Service from '../model/Service.js';
import Queue from '../model/Queue.js';
import CloudSystem from '../model/CloudSystem.js';
import Poisson from '../model/Poisson.js';

import Monitor from './Monitor.js';
import Actuator from './Actuator.js';
import Elasticity from './Elasticity.js';

import Plot from '../view/Plot.js';
import PlayPause from '../view/PlayPause.js';
import Cyto from '../view/Cyto.js';
import Interface from '../view/Interface.js';

class Simulation {
  // This is a simulation for a cloud system with ONE single server (hardware server)
  // the initial setup of the system is 1 online VM hosting 1 service instance
  static main() {
    this.servers = JSON.parse(window.sessionStorage.getItem('initServers'));
    this.vms = JSON.parse(window.sessionStorage.getItem('initVMs'));
    this.services = JSON.parse(window.sessionStorage.getItem('initServices'));
    this.tabLambda = JSON.parse(window.sessionStorage.getItem('initLambda'));
    this.mainStrategy = JSON.parse(window.sessionStorage.getItem('strategy')) === 'Horizontale' ? 1 : 2;
    this.strategyVertical = JSON.parse(window.sessionStorage.getItem('strategyVertical')) === 'Erlang' ? 1 : 2;
    this.lambdaMax = 500.0; // arrival rate
    this.tabLambda.forEach((item) => {
      item.taille = parseInt(item.taille, 10);
      item.lambda = parseInt(item.lambda, 10);
    });

    this.cy = new Cyto();
    this.myPlot = new Plot();
    this.myPlot.addSlider();
    this.runButtons = new PlayPause();

    // H strategy at infrastructure level
    this.vScale = JSON.parse(window.sessionStorage.getItem('strategyInfra')) === 'HD' ? 1 : 2;
    // H strategy at service level
    this.sScale = JSON.parse(window.sessionStorage.getItem('strategyService')) === 'HD' ? 1 : 2;
    this.steps = this.tabLambda.reduce((accumulator, current) => accumulator + current.taille, 0);
    Simulation.defineSystem();
    Simulation.bindSystemToView();
    Simulation.deployEntities();
    Simulation.initMonitor();

    Simulation.bindButtons();

    this.tick = 0;
    this.indexLambda = 0;
    this.intervalLambda = 0;
    this.lambda = this.tabLambda[this.indexLambda].lambda; // arriving requests per unit of time

    this.waitValue = this.myPlot.waitValue;
    if (this.tick < this.steps) {
      Simulation.runCloud();
    } else {
      Simulation.endCloud();
    }
  }

  static defineSystem() {
    const capacity = this.mainStrategy === 1 ? parseInt(JSON.parse(window.sessionStorage.getItem('serverThreshold')), 10) : Infinity; // max VMs in the system
    const K = this.mainStrategy === 1 ? parseInt(JSON.parse(window.sessionStorage.getItem('vmThreshold')), 10) : Infinity; // max Services per VM
    const W = this.mainStrategy === 1 ? parseInt(JSON.parse(window.sessionStorage.getItem('serviceThreshold')), 10) : parseInt(JSON.parse(window.sessionStorage.getItem('correspRAM')), 10); // max requests per Service
    const mu = this.mainStrategy === 1 ? parseInt(JSON.parse(window.sessionStorage.getItem('serviceRate')), 10) : parseInt(JSON.parse(window.sessionStorage.getItem('correspCPU')), 10);// service rate
    const buffer = Infinity; // max system queue size
    const VMs = new Set(); // the initial VMs
    const services = new Set(); // the initial Services
    const queue = new Queue(buffer); // The system queue, infinite calls

    this.CS = new CloudSystem( // Creating the system and the MAPE elements
      K, W, this.lambdaMax, mu, VMs, services, queue, capacity, buffer,
      this.mainStrategy, this.strategyVertical,
    );
    this.monitor = new Monitor(this.CS);
    const actuator = new Actuator(this.CS);
    this.elast = new Elasticity(this.monitor, actuator, this.CS);
  }

  static deployEntities() {
    if (this.vms === null) {
      throw new Error('No VM defined');
    }
    this.vms.forEach((itemVM) => {
      const vm = new VM(this.CS.K);
      vm.cpu = itemVM.cpu;
      vm.ram = itemVM.ram;
      vm.id = itemVM.id;
      this.elast.actuator.deployVM(vm);
      this.services.forEach((itemService) => {
        if (itemService.parent === vm.id) {
          const service = new Service(this.CS.W);
          service.cpu = itemService.cpu;
          service.ram = itemService.ram;
          service.id = itemService.id;
          this.elast.actuator.deployService(vm, service);
        }
      });
    });
  }

  static runCloud() {
    this.tick += 1;
    Simulation.onTick();

    // incoming requests
    console.log(`---> Incoming Requests(${this.tick})`);
    this.monitor.workload = Poisson.getPoisson(this.lambda); // input
    console.log(`     Incoming workload = ${this.monitor.workload}`);
    this.elast.actuator.queueRequests(this.CS.queue, this.monitor.workload);
    this.monitor.refreshStates();

    this.myPlot.addWorkload(this.lambda, this.monitor.workload);
    this.CS.VMs.forEach((vm) => {
      Interface.updateVM(vm.id, vm.cpu, vm.ram);
    });
    this.CS.services.forEach((service) => {
      Interface.updateService(service.id, service.cpu, service.ram);
    });


    // dispatch requests
    console.log(`---> Dispatch Requests(${this.tick})`);
    const munext = Poisson.getPoisson(this.CS.mu); // output
    this.elast.distributeRequests(munext);
    this.monitor.refreshStates();

    // adapting
    console.log(`---> Adapting(${this.tick})`);
    this.elast.scale(this.vScale, this.sScale);
    this.monitor.refreshStates();

    // serve requests
    console.log(`---> Serve Requests(${this.tick})`);
    this.elast.serveRequests(munext);
    this.monitor.refreshStates();
    let offering = 0;
    switch (this.mainStrategy) {
      case 1:
        offering = this.monitor.getAllServices().size * Math.floor(munext);
        this.myPlot.addOffering(this.monitor.getAllServices().size * Math.floor(this.CS.mu),
          offering);
        break;
      case 2: {
        let mu = 0;
        this.monitor.getAllServices().forEach((service) => {
          offering += service.cpu * Math.floor(munext);
          mu += service.cpu * this.CS.mu;
        });
        this.myPlot.addOffering(mu, offering);
        break;
      }
      default:
        throw new Error('No strategy other than horizontal (1) or vertical (2)');
    }

    this.monitor.printTick(this.tick, offering);
    this.monitor.refresh();
    if (this.tick < this.steps) {
      if (!this.runButtons.pause) {
        setTimeout(Simulation.runCloud.bind(this), this.myPlot.waitValue);
      }
    } else {
      Simulation.endCloud();
    }
  }

  static endCloud() {
    this.monitor.printState(`${this.elast.actuator.adaptations}`);
    this.monitor.printXML(`<adaptations>${this.elast.actuator.adaptations}</adaptations>\n</simulation>`);
    console.log('---END---');
    const filenameCSV = 'output.csv';
    const blobCSV = new Blob([this.monitor.writer], { type: 'text/csv' });
    const linkCSV = document.createElement('a');
    linkCSV.style.fontWeight = 'bold';
    linkCSV.download = filenameCSV;
    linkCSV.innerHTML = 'CSV';
    linkCSV.href = window.URL.createObjectURL(blobCSV);
    document.getElementsByTagName('footer')[0].appendChild(linkCSV);
    const filenameXML = 'output.xml';
    const blobXML = new Blob([vkbeautify.xml(this.monitor.xml)], { type: 'text/xml' });
    const linkXML = document.createElement('a');
    linkXML.style.fontWeight = 'bold';
    linkXML.download = filenameXML;
    linkXML.innerHTML = 'XML';
    linkXML.href = window.URL.createObjectURL(blobXML);
    document.getElementsByTagName('footer')[0].appendChild(linkXML);
    document.getElementById('progress_bar').children[5].style.backgroundColor = '#ccd443';
    document.getElementById('progress_bar').children[5].style.textShadow = '#000 0 0 .2em';
    document.getElementById('progress_bar').children[5].style.color = 'white';
  }

  static onTick() {
    if (this.indexLambda < this.tabLambda.length - 1) { // if not last lambda of array
      if (this.tabLambda[this.indexLambda + 1].taille + this.intervalLambda === this.tick) {
        this.indexLambda += 1;
        this.intervalLambda += this.tabLambda[this.indexLambda].taille;
        this.lambda = this.tabLambda[this.indexLambda].lambda;
      }
    }
  }

  static initMonitor() {
    // output file name (according to parameters)
    const buf = this.CS.buffer === Infinity ? 'INF' : `${this.CS.buffer}`;

    // sim lost / processing restart
    this.monitor.refresh();
    // the initial header print with metrics and average results calculation in csv
    this.monitor.printState(`Capacity;${this.CS.capacity}; ;Total Received Requests;=SOMME(E12:E${12 + this.steps}); ;Average VM Deployment;=MOYENNE(B12:B${12 + this.steps})`); // 1
    this.monitor.printState(`K;${this.CS.K}; ;Treated Requests;=SOMME(H12:H${12 + this.steps}); ;System VM Capacity Usage;=(H1/B1)*100;%`); // 2
    this.monitor.printState(`W;${this.CS.W}; ;Lost Requests;=SOMME(I12:I${12 + this.steps})`); // 3
    this.monitor.printState(`Buffer;${buf}; ; ; ; ;Average Service Deployment;=MOYENNE(C12:C${12 + this.steps})`); // 4
    this.monitor.printState(`Lambda;${this.lambdaMax}; ;Treated Requests Rate;=(E2/E1)*100;%;System Service Capacity Usage;=(H4/(B1*B2))*100;%`); // 5
    this.monitor.printState(`Mu;${this.CS.mu}; ;Loss Rate;=(E3/E1)*100;%`); // 6
    this.monitor.printState(`V-scale;${this.vScale}; ;Pending;=100-E5;%;Average System Load;=MOYENNE(H12:H${12 + this.steps})`); // 7
    this.monitor.printState(`S-scale;${this.sScale}; ;Delay;=(SOMME(G12:G${12 + this.steps})/E1)*100;%;Average Service Load;=H7/(H4*B3)*100;%`); // 8
    this.monitor.printState(`Steps;${this.steps}; ;Average Workload;=MOYENNE(E12:E${12 + this.steps}); ;Adaptations;=A${12 + this.steps}`); // 9
    this.monitor.printState('--------------------------------------------------------');
    this.monitor.printState('Step;Virtual Machines;Service Instances;Capacity;Workload;System Queue;Service Queue;System Load;Lost Requests');
    this.monitor.printXML('<init>');
    this.monitor.printXML(`<capacity>${this.CS.capacity}</capacity>`);
    this.monitor.printXML(`<K>${this.CS.K}</K>`);
    this.monitor.printXML(`<W>${this.CS.W}</W>`);
    this.monitor.printXML(`<buffer>${buf}</buffer>`);
    this.monitor.printXML(`<mu>${this.CS.mu}</mu>`);
    this.monitor.printXML(`<vScale>${this.vScale}</vScale>`);
    this.monitor.printXML(`<sScale>${this.sScale}</sScale>`);
    this.monitor.printXML(`<steps>${this.steps}</steps>`);
    this.monitor.printXML('</init>');
    this.monitor.printXML('<simulation>');
  }

  static bindButtons() {
    this.runButtons.stepButton.onclick = () => {
      this.runButtons.Step();
      Simulation.runCloud();
    };

    this.runButtons.PlayBtn.onclick = () => {
      this.runButtons.pauseProcess();
      if (!this.runButtons.pause) {
        Simulation.runCloud();
      }
    };
  }

  static bindSystemToView() {
    const { cy } = this;
    const defaultMu = this.CS.mu;
    // in case of Set from System is init with VM/Services undeployed
    cy.addServer('server'); // add primary parent
    this.CS.VMs.forEach((item) => { // add all his VM children
      cy.addVM(item.id, 'server');
      Interface.addVM(item.id, 'server', 1, 1);
    });
    this.CS.services.forEach((item) => { // add all his Services children
      if (item.host === null) {
        cy.addService(item.id, 'server');
      } else {
        cy.addService(item.id, item.host.id);
        Interface.addService(item.id, item.host.id, 1, 1, defaultMu);
      }
    });

    // to change behaviour of Set
    this.CS.VMs.add = function customAddVM(...argsVM) { // redefine add from VMs Set
      const vm = argsVM[0]; // for scope effect
      Set.prototype.add.apply(this, argsVM); // normal behaviour
      cy.addVM(vm.id, 'server'); // add VM to diagram
      Interface.addVM(vm.id, 'server', 1, 1); // add VM to graphic list
      vm.services.add = function customAddService(...argsService) {
        // redefine add from services Set of VM
        Set.prototype.add.apply(this, argsService); // normal behaviour
        if (cy.hasNode(argsService[0].id)) { // not really useful, remove can be called twice
          cy.removeService(argsService[0].id);
          Interface.removeService(argsService[0].id);
        }
        cy.addService(argsService[0].id, vm.id); // add service to diagram
        Interface.addService(argsService[0].id, vm.id, 1, 1, defaultMu);
      };
      vm.services.delete = function customDeleteService(...argsService) {
        // redefine delete from services Set of VM
        Set.prototype.delete.apply(this, argsService); // normal behaviour
        cy.removeService(argsService[0].id);
        Interface.removeService(argsService[0].id);
      };
    };
    this.CS.services.add = function customAddService(...args) { // in case of services has no host
      Set.prototype.add.apply(this, args);
      if (args[0].host === null) {
        cy.addService(args[0].id, 'server');
      }
    };

    this.CS.VMs.delete = function customDeleteVM(...args) {
      Set.prototype.delete.apply(this, args);
      cy.removeVM(args[0].id);
      Interface.removeVM(args[0].id);
    };
    this.CS.services.delete = function customDeleteService(...args) {
      Set.prototype.delete.apply(this, args);
      cy.removeService(args[0].id);
      Interface.removeService(args[0].id);
    };
    const { VMs } = this.CS; // preserve this
    this.CS.VMs.clear = function customClearVM(...args) { // cf. Actuator.destroyVMs()
      VMs.forEach((item) => {
        cy.removeVM(item.id);
        Interface.removeVM(item.id);
      });
      Set.prototype.clear.apply(this, args);
    };

    document.getElementById('strategie').innerHTML = "Strategie : " + JSON.parse(window.sessionStorage.getItem('strategy'));
    if(this.mainStrategy == 1){
      document.getElementById('strategie_vm').innerHTML = "Dispo VM : " + JSON.parse(window.sessionStorage.getItem('strategyInfra'));
      document.getElementById('strategie_service').innerHTML = "Dispo Service : " +  JSON.parse(window.sessionStorage.getItem('strategyService'));
      document.getElementById('capacite_serveur').innerHTML = "Capacité : " + JSON.parse(window.sessionStorage.getItem('serverThreshold')) + "VMs";
      document.getElementById('seuil_vm').innerHTML = "Seuil VM : " + JSON.parse(window.sessionStorage.getItem('vmThreshold'));
      document.getElementById('seuil_service').innerHTML = "Seuil Service : " + JSON.parse(window.sessionStorage.getItem('serviceThreshold'));
    }
    else{
        document.getElementById('strategie_vm').innerHTML = "Strat. Vertical : " + JSON.parse(window.sessionStorage.getItem('strategyVertical'));
        document.getElementById('strategie_service').innerHTML = "Correspondance CPU : " + JSON.parse(window.sessionStorage.getItem('correspCPU'));
        document.getElementById('capacite_serveur').innerHTML = "Correspondance RAM : " + JSON.parse(window.sessionStorage.getItem('correspRAM'));
        document.getElementById('seuil_vm').innerHTML = " ";
        document.getElementById('seuil_service').innerHTML = " ";
    }
  }
}

Simulation.main();
