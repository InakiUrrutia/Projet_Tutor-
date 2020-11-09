export default class Interface {
  static addServer(id) {}

  static addVM(id, parentId, vm_CPU, vm_RAM) {
    const newDiv = document.createElement('div');
    newDiv.className = 'vm_test';
    const divIdVM = document.createElement('div');
    divIdVM.className = 'vm_id';
    let p = document.createElement('p');
    p.textContent = 'VM Id:';
    divIdVM.appendChild(p);
    p = document.createElement('p');
    p.textContent = id;
    p.style = 'text-align:center;';
    divIdVM.appendChild(p);
    newDiv.appendChild(divIdVM);
    let div = document.createElement('div');
    const configCpuVM = document.createElement('div');
    configCpuVM.className = 'vm_CPU_config';
    p = document.createElement('p');
    p.textContent = 'CPU';
    configCpuVM.appendChild(p);
    let button = document.createElement('button');
    button.className = 'vm_remove_CPU';
    button.textContent = '-';
    button.disabled = true;
    button.style.visibility = "hidden";
    configCpuVM.appendChild(button);
    p = document.createElement('p');
    p.textContent = vm_CPU;
    p.className = 'vm_CPU_value';
    configCpuVM.appendChild(p);
    button = document.createElement('button');
    button.className = 'vm_add_CPU';
    button.textContent = '+';
    button.disabled = true;
    button.style.visibility = "hidden";
    configCpuVM.appendChild(button);
    p = document.createElement('p');
    p.className = 'server_CPU_available';
    p.textContent = 0;
    p.style.visibility = "hidden";
    configCpuVM.appendChild(p);
    div.appendChild(configCpuVM);
    const configRamVM = document.createElement('div');
    configRamVM.className = 'vm_RAM_config';
    p = document.createElement('p');
    p.textContent = 'RAM';
    configRamVM.appendChild(p);
    button = document.createElement('button');
    button.className = 'vm_remove_RAM';
    button.textContent = '-';
    button.disabled = true;
    button.style.visibility = "hidden";
    configRamVM.appendChild(button);
    p = document.createElement('p');
    p.textContent = vm_RAM;
    p.className = 'vm_RAM_value';
    configRamVM.appendChild(p);
    button = document.createElement('button');
    button.className = 'vm_add_RAM';
    button.textContent = '+';
    button.disabled = true;
    button.style.visibility = "hidden";
    configRamVM.appendChild(button);
    p = document.createElement('p');
    p.className = 'server_RAM_available';
    p.textContent = 0;
    p.style.visibility = "hidden";
    configRamVM.appendChild(p);
    div.appendChild(configRamVM);
    newDiv.appendChild(div);
    div = document.createElement('div');
    const div2 = document.createElement('div');
    p = document.createElement('p');
    p.classame = 'server_parent';
    p.textContent = parentId;
    div2.appendChild(p);
    div.appendChild(div2);
    button = document.createElement('button');
    button.className = 'delete_vm';
    button.textContent = 'Supprimer';
    button.disabled = true;
    button.style.visibility = "hidden";
    div.appendChild(button);
    newDiv.appendChild(div);
    document.getElementById('vm_config').insertBefore(newDiv, document.getElementById('vm_add'));
  }

  static addService(id, parentId, service_CPU, service_RAM, service_MU) {
    const newDiv = document.createElement('div');
    newDiv.className = 'service_test';
    const divIdService = document.createElement('div');
    divIdService.className = 'service_id';
    let p = document.createElement('p');
    p.textContent = 'Service Id:';
    divIdService.appendChild(p);
    p = document.createElement('p');
    p.textContent = id;
    p.style = 'text-align:center;';
    divIdService.appendChild(p);
    newDiv.appendChild(divIdService);
    let div = document.createElement('div');
    // cpu
    const configCpuService = document.createElement('div');
    configCpuService.className = 'service_CPU_config';
    p = document.createElement('p');
    p.textContent = 'CPU';
    configCpuService.appendChild(p);
    let button = document.createElement('button');
    button.className = 'service_remove_CPU';
    button.textContent = '-';
    button.disabled = true;
    button.style.visibility = "hidden";
    configCpuService.appendChild(button);
    p = document.createElement('p');
    p.textContent = service_CPU;
    p.className = 'service_CPU_value';
    configCpuService.appendChild(p);
    button = document.createElement('button');
    button.className = 'service_add_CPU';
    button.textContent = '+';
    button.disabled = true;
    button.style.visibility = "hidden";
    configCpuService.appendChild(button);
    p = document.createElement('p');
    p.className = 'vm_CPU_available';
    p.textContent = 0;
    p.style.visibility = "hidden";
    configCpuService.appendChild(p);
    div.appendChild(configCpuService);
    // ram
    const configRamService = document.createElement('div');
    configRamService.className = 'service_RAM_config';
    p = document.createElement('p');
    p.textContent = 'RAM';
    configRamService.appendChild(p);
    button = document.createElement('button');
    button.className = 'service_remove_RAM';
    button.textContent = '-';
    button.disabled = true;
    button.style.visibility = "hidden";
    configRamService.appendChild(button);
    p = document.createElement('p');
    p.textContent = service_RAM;
    p.className = 'service_RAM_value';
    configRamService.appendChild(p);
    button = document.createElement('button');
    button.className = 'service_add_RAM';
    button.textContent = '+';
    button.disabled = true;
    button.style.visibility = "hidden";
    configRamService.appendChild(button);
    p = document.createElement('p');
    p.className = 'vm_RAM_available';
    p.textContent = 0;
    p.style.visibility = "hidden";
    configRamService.appendChild(p);
    div.appendChild(configRamService);
    // mu
    const configMuService = document.createElement('div');
    configMuService.className = 'service_MU_config';
    p = document.createElement('p');
    p.textContent = 'MU';
    configMuService.appendChild(p);
    button = document.createElement('button');
    button.className = 'service_remove_MU';
    button.textContent = '-';
    button.disabled = true;
    button.style.visibility = "hidden";
    configMuService.appendChild(button);
    p = document.createElement('p');
    p.textContent = service_MU;
    p.className = 'service_MU_value';
    configMuService.appendChild(p);
    button = document.createElement('button');
    button.className = 'service_add_MU';
    button.textContent = '+';
    button.disabled = true;
    button.style.visibility = "hidden";
    configMuService.appendChild(button);
    div.appendChild(configMuService);
    // fin mu
    newDiv.appendChild(div);
    div = document.createElement('div');
    const div2 = document.createElement('div');
    p = document.createElement('p');
    p.classame = 'vm_parent';
    p.textContent = parentId;
    div2.appendChild(p);
    div.appendChild(div2);
    button = document.createElement('button');
    button.className = 'delete_service';
    button.textContent = 'Supprimer';
    button.disabled = true;
    button.style.visibility = "hidden";
    div.appendChild(button);
    newDiv.appendChild(div);
    document.getElementById('services_config').insertBefore(newDiv, document.getElementById('service_add'));
  }

  static removeServer(id) {}

  static removeVM(id) {
    let i = 0;
    let nbVMs = document.getElementsByClassName('vm_test').length;
    let node; let idVM;
    while (i < nbVMs) { // on remove la VM
      node = document.getElementsByClassName('vm_test')[i];
      idVM = node.children[0].children[1].textContent;
      if (idVM === id) {
        document.getElementById('vm_config').removeChild(node);
        nbVMs -= 1;
      } else i += 1;
    }

    i = 0;
    let nbServices = document.getElementsByClassName('service_test').length;
    let parentId;
    while (i < nbServices) {
      node = document.getElementsByClassName('service_test')[i];
      parentId = node.children[2].children[0].children[0].textContent;
      if (parentId === id) {
        document.getElementById('services_config').removeChild(node);
        nbServices -= 1;
      } else i += 1;
    }
  }

  static removeService(id) {
    let i = 0;
    let nbServices = document.getElementsByClassName('service_test').length;
    let node; let idService;
    while (i < nbServices) {
      node = document.getElementsByClassName('service_test')[i];
      idService = node.children[0].children[1].textContent;
      if (idService === id) {
        document.getElementById('services_config').removeChild(node);
        nbServices -= 1;
      } else i += 1;
    }
  }

  static migrateService(id, newParentId) {
    const nbServices = document.getElementsByClassName('service_test').length;
    let node; let idService;
    for (let i = 0; i < nbServices; i += 1) {
      node = document.getElementsByClassName('service_test')[i];
      idService = node.children[0].children[1].textContent;
      if (idService === id) {
        node.children[2].children[0].children[0].innerHTML = newParentId;
      }
    }
  }

  static updateVM(id, cpu, ram) {
    let nbVMs = document.getElementsByClassName("vm_test").length;
    let vm;
    for(let i=0; i<nbVMs; i++){
      vm = document.getElementsByClassName("vm_test")[i];
      if(vm.getElementsByClassName("vm_id")[0].children[1].textContent == id){
        vm.getElementsByClassName("vm_CPU_value")[0].innerHTML = cpu;
        vm.getElementsByClassName("vm_RAM_value")[0].innerHTML = ram;
      }
    }
  }

  static updateService(id, cpu, ram) {
    let nbServices = document.getElementsByClassName("service_test").length;
    let service;
    for(let i=0; i<nbServices; i++){
      service = document.getElementsByClassName("service_test")[i];
      if(service.getElementsByClassName("service_id")[0].children[1].textContent == id){
        service.getElementsByClassName("service_CPU_value")[0].innerHTML = cpu;
        service.getElementsByClassName("service_RAM_value")[0].innerHTML = ram;
      }
    }
  }
}