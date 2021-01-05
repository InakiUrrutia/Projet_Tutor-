/* eslint-disable */
import Cyto from '../view/Cyto.js';
import Plot from '../view/Plot.js';
import PlayPause from '../view/PlayPause.js';

import VM from '../model/VM.js';
import Service from '../model/Service.js';

var servers = [];
var vms = [];
var services = [];
var cy;
var chart, lambda, taille, cpt, ctx, valPoisson, valChargeVM;
var tabLambda = [], cptLambda = 0;
var seuil_vm = 4, seuil_service = 50;
var strategie = 'Horizontale';
var strategie_vm = 'HD', strategie_service = 'HD';
var default_mu = 50;
var default_capacity = 10;
var correspCPU = 50, correspRAM = 50;
var verticalStrategy = "Erlang";

function go(){
  var page = location.pathname.split("/").slice(-1);
  console.log(page);
  if(page == "accueil.html"){
    initCyto();
    initPlot();
    buttonEvents();
    vm_more_less_buttonsEvents();
    service_more_less_buttonsEvents();
    server_more_less_buttonsEvents();
    document.getElementsByClassName("service_MU_value")[0].innerHTML = default_mu;
    document.getElementsByClassName("server_CAPACITY_value")[0].innerHTML = default_capacity;
    /*document.getElementById("horizontal_checkbox").checked = "false";
    document.getElementById("vertical_checkbox").checked = "false";*/
    document.getElementById("choix_vertical").style.visibility = "hidden";
    document.getElementById("choix_horizontal").style.visibility = "hidden";
  }
}

function initPlot(){
  cpt = 0; //compteur pour incrémenté le temps.
  ctx = document.getElementById('myPlot').getContext('2d');
  chart = new Plot();
  chart.chart.data.datasets[0].hidden = true;
  chart.chart.data.datasets[2].hidden = true;
  chart.chart.data.datasets[3].hidden = true;
  chart.chart.update();
}

function initCyto(){
  cy = new Cyto();
  cy.addServer('server');
  servers.push({id:'server', cpu:999, ram:999, cpu_available:999, ram_available:999});
  let select = document.getElementById("choix_server");
  let option = document.createElement("option");
  option.appendChild( document.createTextNode(servers[0].id + '  |  ' + servers[0].cpu + ' : ' + servers[0].ram) );
  option.id = 'server';
  select.appendChild(option);
}

function buttonEvents(){
  let btnAddVM = document.getElementById("add_vm");
  let btnAddService = document.getElementById("add_service");
  btnAddVM.onclick = addVM;
  btnAddService.onclick = addService;

  document.getElementById("choix_server").onchange = function(event){
    server_showCPUandRAM();
  }

  document.getElementById("choix_vm").onchange = function(event){
    vm_showCPUandRAM();
  }

  document.getElementById("btnStart").onclick = function(){
    window.open('simulation.html', "_self");
    window.sessionStorage.setItem("initServers", JSON.stringify(servers));
    window.sessionStorage.setItem("initVMs", JSON.stringify(vms));
    window.sessionStorage.setItem("initServices", JSON.stringify(services));
    window.sessionStorage.setItem("initLambda", JSON.stringify(chart.tabLambda));
    window.sessionStorage.setItem("strategy", JSON.stringify(strategie));
    if(strategie == "Horizontale"){
      window.sessionStorage.setItem('strategyInfra', JSON.stringify(strategie_vm));
      window.sessionStorage.setItem('strategyService', JSON.stringify(strategie_service));
      window.sessionStorage.setItem("serverThreshold", JSON.stringify(default_capacity));
      window.sessionStorage.setItem("vmThreshold", JSON.stringify(seuil_vm));
      window.sessionStorage.setItem("serviceThreshold", JSON.stringify(seuil_service));
      window.sessionStorage.setItem('serviceRate', JSON.stringify(default_mu));
    }
    else{
      window.sessionStorage.setItem('strategyVertical', JSON.stringify(verticalStrategy));
      window.sessionStorage.setItem('correspCPU', JSON.stringify(correspCPU));
      window.sessionStorage.setItem('correspRAM', JSON.stringify(correspRAM));
    }
  }

  let btnDownloadXML = document.getElementById('save_state');
  btnDownloadXML.onclick = downloadXML;

  document.getElementById("choose_xml").onchange = importXML;

  document.getElementById("horizontal_checkbox").onclick = function(){
    if(document.getElementById("horizontal_checkbox").checked){
      document.getElementById("vertical_checkbox").checked = false;
      document.getElementById("choix_horizontal").disabled = false;
      document.getElementById("choix_vertical").disabled = true;
      document.getElementById("choix_vertical").style.visibility = "hidden";
      document.getElementById("choix_horizontal").style.visibility = "visible";
      strategie = 'Horizontale';
      verticalStrategy = null;
      document.getElementsByClassName("server_test")[0].getElementsByClassName("server_CAPACITY_config")[0].style.visibility = "visible";
      document.getElementById("config_strategies").children[2].getElementsByTagName("p")[0].getElementsByTagName("b")[0].innerHTML= "Seuil VM";
      document.getElementById("config_strategies").children[3].getElementsByTagName("p")[0].getElementsByTagName("b")[0].innerHTML= "Seuil Service";
      document.getElementById("seuil_vm").value = seuil_vm;
      document.getElementById("seuil_service").value = seuil_service;
      for(let i=0; i<services.length; i++){
        document.getElementsByClassName("service_test")[i].getElementsByClassName("service_MU_config")[0].style.visibility = "visible";
      }
    }
  }

  document.getElementById("vertical_checkbox").onclick = function(){
    if(document.getElementById("vertical_checkbox").checked){
      document.getElementById("horizontal_checkbox").checked = false;
      document.getElementById("choix_horizontal").disabled = true;
      document.getElementById("choix_vertical").disabled = false;
      document.getElementById("choix_horizontal").style.visibility = "hidden";
      document.getElementById("choix_vertical").style.visibility = "visible";
      strategie = 'Verticale';
      strategie_vm = null;
      strategie_service = null;
      document.getElementsByClassName("server_test")[0].getElementsByClassName("server_CAPACITY_config")[0].style.visibility = "hidden";
      document.getElementById("config_strategies").children[2].getElementsByTagName("p")[0].getElementsByTagName("b")[0].innerHTML= "Correspondance CPU";
      document.getElementById("config_strategies").children[3].getElementsByTagName("p")[0].getElementsByTagName("b")[0].innerHTML= "Correspondance RAM";
      document.getElementById("seuil_vm").value = correspCPU;
      document.getElementById("seuil_service").value = correspRAM;
      for(let i=0; i<services.length; i++){
        document.getElementsByClassName("service_test")[i].getElementsByClassName("service_MU_config")[0].style.visibility = "hidden";
      }
    }
  }

  document.getElementById("choix_horizontal").onchange = function(){
    let select = document.getElementById("choix_horizontal");
    let selectedIndex = select.selectedIndex;
    let option = select[selectedIndex];
    switch(parseInt(option.id)){
        case 1:
          strategie_vm = 'HD';
          strategie_service = 'HD';
          break;
        case 2:
          strategie_vm = 'HD';
          strategie_service = 'DL';
          break;
        case 3:
          strategie_vm = 'DL';
          strategie_service = 'HD';
          break;
        case 4:
          strategie_vm = 'DL';
          strategie_service = 'DL';
          break;
        default:
          break;
    }
    console.log(strategie, strategie_vm, strategie_service);
  }

  document.getElementById("choix_vertical").onchange = function(){
    let select = document.getElementById("choix_vertical");
    let selectedIndex = select.selectedIndex;
    let option = select[selectedIndex];
    switch(parseInt(option.id)){
        case 1:
          verticalStrategy = 'Erlang';
          break;
        case 2:
          verticalStrategy = 'Double';
          break;
        default:
          break;
    }
    console.log(strategie, verticalStrategy);
  }

  document.getElementById("seuil_vm").value = seuil_vm;
  document.getElementById("seuil_vm").onchange = function(){
    if(strategie == "Horizontale"){
      seuil_vm = document.getElementById("seuil_vm").value;
    }
    else{
      correspCPU = document.getElementById("seuil_vm").value;
    }
  }

  document.getElementById("seuil_service").value = seuil_service;
  document.getElementById("seuil_service").onchange = function(){
    if(strategie == "Horizontale"){
      seuil_service = document.getElementById("seuil_service").value;
    }
    else{
      correspRAM = document.getElementById("seuil_service").value;
    }
  }

}

function server_more_less_buttonsEvents(){
  let btnServerRemoveCAP = document.getElementsByClassName("server_test")[0].getElementsByClassName("server_remove_CAPACITY")[0];
  let btnServerAddCAP = document.getElementsByClassName("server_test")[0].getElementsByClassName("server_add_CAPACITY")[0];
  btnServerRemoveCAP.onclick = function(event){
    let cap = parseInt(event.target.nextElementSibling.textContent);
    if(cap > 0){
      default_capacity--;
    }
    event.target.nextElementSibling.innerHTML = default_capacity;
  }
  btnServerAddCAP.onclick = function(event){
    default_capacity++;
    event.target.previousElementSibling.innerHTML = default_capacity;
  }
}

function vm_more_less_buttonsEvents(){
  // VM + / - buttons
  let btnVMRemoveCPU = document.getElementById("vm_config").children[1].children[1].children[0].children[1];
  let btnVMAddCPU = document.getElementById("vm_config").children[1].children[1].children[0].children[3];
  let btnVMRemoveRAM = document.getElementById("vm_config").children[1].children[1].children[1].children[1];
  let btnVMAddRAM = document.getElementById("vm_config").children[1].children[1].children[1].children[3];
  btnVMRemoveCPU.onclick = function(event){
    let parent_id = 'server';
    let cpu = parseInt(event.target.nextElementSibling.textContent);
    if(cpu > 0){
      cpu--;
      servers[0].cpu_available++;
    }
    event.target.nextElementSibling.textContent = cpu;
    server_showCPUandRAM();
  };
  btnVMAddCPU.onclick = function(event){
    let parent_id = 'server';
    let cpu_max = servers[0].cpu_available;
    let cpu = parseInt(event.target.previousElementSibling.textContent);
    if(cpu_max>0){
      cpu++;
      servers[0].cpu_available--;
    }
    event.target.previousElementSibling.innerHTML = cpu;
    server_showCPUandRAM();
  };
  btnVMRemoveRAM.onclick = function(event){
    let parent_id = 'server';
    let ram = parseInt(event.target.nextElementSibling.textContent);
    if(ram > 0){
      ram--;
      servers[0].ram_available++;
    }
    event.target.nextElementSibling.textContent = ram;
    server_showCPUandRAM();
  };
  btnVMAddRAM.onclick = function(event){
    let parent_id = 'server';
    let ram_max;
    ram_max = servers[0].ram_available;
    let ram = parseInt(event.target.previousElementSibling.textContent);
    if(ram_max>0){
      ram++;
      servers[0].ram_available--;
    }
    event.target.previousElementSibling.innerHTML = ram;
    server_showCPUandRAM();
  };
}

function service_more_less_buttonsEvents(){
  let btnServiceRemoveCPU = document.getElementById("services_config").children[1].children[1].children[0].children[1];
  let btnServiceAddCPU = document.getElementById("services_config").children[1].children[1].children[0].children[3];
  let btnServiceRemoveRAM = document.getElementById("services_config").children[1].children[1].children[1].children[1];
  let btnServiceAddRAM = document.getElementById("services_config").children[1].children[1].children[1].children[3];
  let btnServiceRemoveMU = document.getElementById("services_config").children[1].children[1].children[2].children[1];
  let btnServiceAddMU = document.getElementById("services_config").children[1].children[1].children[2].children[3];
  btnServiceRemoveCPU.onclick = function(event){
    let selectedIndex = event.target.parentNode.parentNode.parentNode.children[2].children[0].children[0].selectedIndex;
    let parent_id = event.target.parentNode.parentNode.parentNode.children[2].children[0].children[0][selectedIndex].id;
    for(let j=0; j<vms.length; j++){
      if(vms[j].id == parent_id){
        let cpu = parseInt(event.target.nextElementSibling.textContent);
        if(cpu > 0){
          cpu--;
          vms[j].cpu_available++;
        }
        event.target.nextElementSibling.innerHTML = cpu;
        vm_showCPUandRAM();
      }
    }
  };
  btnServiceAddCPU.onclick = function(event){
    let selectedIndex = event.target.parentNode.parentNode.parentNode.children[2].children[0].children[0].selectedIndex;
    let parent_id = event.target.parentNode.parentNode.parentNode.children[2].children[0].children[0][selectedIndex].id;
    let cpu_max;
    for(let j=0; j<vms.length; j++){
      if(vms[j].id == parent_id){
        cpu_max = vms[j].cpu_available;
        let cpu = parseInt(event.target.previousElementSibling.textContent);
        if(cpu_max>0){
          cpu++;
          vms[j].cpu_available--;
        }
        event.target.previousElementSibling.innerHTML = cpu;
        vm_showCPUandRAM();
      }
    }
  };
  btnServiceRemoveRAM.onclick = function(event){
    let selectedIndex = event.target.parentNode.parentNode.parentNode.children[2].children[0].children[0].selectedIndex;
    let parent_id = event.target.parentNode.parentNode.parentNode.children[2].children[0].children[0][selectedIndex].id;
    for(let j=0; j<vms.length; j++){
      if(vms[j].id == parent_id){
        let ram = parseInt(event.target.nextElementSibling.textContent);
        if(ram > 0){
          ram--;
          vms[j].ram_available++;
        }
        event.target.nextElementSibling.innerHTML = ram;
        vm_showCPUandRAM();
      }
    }
  };
  btnServiceAddRAM.onclick = function(event){
    let selectedIndex = event.target.parentNode.parentNode.parentNode.children[2].children[0].children[0].selectedIndex;
    let parent_id = event.target.parentNode.parentNode.parentNode.children[2].children[0].children[0][selectedIndex].id;
    let ram_max;
    for(let j=0; j<vms.length; j++){
      if(vms[j].id == parent_id){
        ram_max = vms[j].ram_available;
        let ram = parseInt(event.target.previousElementSibling.textContent);
        if(ram_max>0){
          ram++;
          vms[j].ram_available--;
        }
        event.target.previousElementSibling.innerHTML = ram;
        vm_showCPUandRAM();
      }
    }
  };
  btnServiceRemoveMU.onclick = function(event){
    let mu = parseInt(event.target.nextElementSibling.textContent);
    if(mu > 0) {
      mu--;
      default_mu--;
    }
    event.target.nextElementSibling.textContent = mu;
    updateMUvalue();
  };
  btnServiceAddMU.onclick = function(event){
    let mu = parseInt(event.target.previousElementSibling.textContent);
    mu++;
    default_mu++;
    event.target.previousElementSibling.innerHTML = mu;
    updateMUvalue();
  };
}

function updateMUvalue(){
  for(let i=0; i<document.getElementsByClassName("service_MU_value").length; i++){
    document.getElementsByClassName("service_MU_value")[i].innerHTML = default_mu;
  }
  for(let i=0; i<services.length; i++){
    services[i].mu = parseInt(default_mu);
  }
}

function addVM(){
  let selectedIndex = document.getElementById("choix_server").selectedIndex;
  let cpu = parseInt(document.getElementsByClassName("vm_CPU_value")[vms.length].textContent);
  let ram = parseInt(document.getElementsByClassName("vm_RAM_value")[vms.length].textContent);
  if(parseInt(servers[0].cpu_available) >= 0 && parseInt(servers[0].ram_available) >= 0 && cpu > 0 && ram > 0){
    if(selectedIndex > 0){
      let newVM = new VM(70);
      cy.addVM(newVM.id,servers[0].id);
      let vm_CPU = document.getElementsByClassName("vm_CPU_value")[vms.length].textContent;
      let vm_RAM = document.getElementsByClassName("vm_RAM_value")[vms.length].textContent;
      createVmHTMLNode(vm_CPU,vm_RAM,'server', newVM.id);
      vms.push( {object: newVM, id: newVM.id, cpu: cpu, ram: ram, cpu_available: cpu, ram_available: ram, parent:'server'} );
      addVMToSelect();
      document.getElementsByClassName("vm_CPU_value")[vms.length].innerHTML = '0';
      document.getElementsByClassName("vm_RAM_value")[vms.length].innerHTML = '0';
      //document.getElementById("choix_server").selectedIndex = 0;
      //document.getElementsByClassName("server_CPU_available")[vms.length].innerHTML = '0';
      //document.getElementsByClassName("server_RAM_available")[vms.length].innerHTML = '0';
      server_showCPUandRAM();
    }
  }
}

function removeVM(vm_id){
  for(let i=0; i<vms.length; i++){
    if(vm_id == vms[i].id){
      let j=0;
      while (j<services.length){ // Supprime tout les services de la vm
        if(services[j].parent == vms[i].id){
          cy.cy.remove('[id=\"'+services[j].id+'\"]');
          document.getElementById("services_config").removeChild(document.getElementById("services_config").children[j+1]);
          services.splice(j,1);
        }
        else j++;
      }
      for(j=0; j<servers.length; j++){
        if(servers[j].id == vms[i].parent){
          servers[j].cpu_available += vms[i].cpu;
          servers[j].ram_available += vms[i].ram;
        }
      }
      vms.splice(i,1);
      cy.cy.remove('[id=\"'+vm_id+'\"]');
      document.getElementById("choix_vm").remove(i+1);
      //update_server_CPU_RAM_available(parent_id);
    }
  }
}

function addVMToSelect(){
  let select = document.getElementById("choix_vm");
  let option = document.createElement("option");
  option.appendChild( document.createTextNode(vms[vms.length-1].id + ' | ' + vms[vms.length-1].cpu_available + ' : ' + vms[vms.length-1].ram_available) );
  option.id = vms[vms.length-1].id;
  select.appendChild(option);
}

function addService(){
  let selectedIndex = document.getElementById("choix_vm").selectedIndex;
  let parent_id = document.getElementById("choix_vm")[selectedIndex].id;
  let cpu = parseInt(document.getElementsByClassName("service_CPU_value")[services.length].textContent);
  let ram = parseInt(document.getElementsByClassName("service_RAM_value")[services.length].textContent);
  let mu = parseInt(document.getElementsByClassName("service_MU_value")[services.length].textContent);
  if(parseInt(vms[selectedIndex-1].cpu_available) >= 0 && parseInt(vms[selectedIndex-1].ram_available) >= 0 && mu > 0 && cpu > 0 && ram > 0){
    if(selectedIndex > 0){
      let newService = new Service(50);
      cy.addService(newService.id,parent_id);
      let service_CPU = document.getElementsByClassName("service_CPU_value")[services.length].textContent;
      let service_RAM = document.getElementsByClassName("service_RAM_value")[services.length].textContent;
      let service_MU = default_mu;
      createServiceHTMLNode(service_CPU,service_RAM,service_MU,parent_id, newService.id);
      services.push( {object: newService, id: newService.id, cpu: parseInt(service_CPU), ram: parseInt(service_RAM), mu: parseInt(service_MU), parent:parent_id} );
      document.getElementsByClassName("service_CPU_value")[services.length].innerHTML = '0';
      document.getElementsByClassName("service_RAM_value")[services.length].innerHTML = '0';
      document.getElementsByClassName("service_MU_value")[services.length].innerHTML = default_mu;
      //document.getElementById("choix_vm").selectedIndex = 0;
      //document.getElementsByClassName("vm_CPU_available")[services.length].innerHTML = '0';
      //document.getElementsByClassName("vm_RAM_available")[services.length].innerHTML = '0';
      vm_showCPUandRAM();
    }
  }
}
function removeService(service_id){
  for(let i=0; i<services.length; i++){
    if(service_id == services[i].id){
      for(let j=0; j<vms.length; j++){
        if(services[i].parent == vms[j].id){
          vms[j].cpu_available += services[i].cpu;
          vms[j].ram_available += services[i].ram;
          vm_showCPUandRAM2(vms[j].id);
        }
      }
      services.splice(i, 1);
      cy.removeService(service_id);
    }
  }
}

function downloadXML(){
  let xmltext = "<cloud>";
  xmltext += "<server>";
  for(let j=0; j<vms.length; j++){
    if(vms[j].parent == servers[0].id){
      xmltext += "<vm>";
      let vm_cpu = vms[j].cpu;
      xmltext += "<cpu>"+vm_cpu+"</cpu>";
      let vm_ram = vms[j].ram;
      xmltext += "<ram>"+vm_ram+"</ram>";
      for(let k=0; k<services.length; k++){
        if(services[k].parent == vms[j].id){
          xmltext += "<service>";
          let service_cpu = services[k].cpu;
          xmltext += "<cpu>"+service_cpu+"</cpu>";
          let service_ram = services[k].ram;
          xmltext += "<ram>"+service_ram+"</ram>";
          let service_mu = services[k].mu;
          xmltext += "<mu>"+service_ram+"</mu>";
          xmltext += "</service>";
        }
      }
      xmltext += "</vm>";
    }
  }
  xmltext += "</server>";
  for(let i=0; i<chart.tabLambda.length; i++){
    xmltext += "<intervalle>";
    xmltext += "<taille>"+chart.tabLambda[i].taille+"</taille>";
    xmltext += "<lambda>"+chart.tabLambda[i].lambda+"</lambda>";
    xmltext += "</intervalle>";
  }
  if(strategie == "Horizontale"){
    xmltext += "<strategie>";
      xmltext += "<type>"+strategie+"</type>";
      xmltext += "<option>"+document.getElementById("choix_horizontal").selectedIndex+"</option>";
    xmltext += "</strategie>";
    xmltext += "<seuil>";
      xmltext += "<vm>"+seuil_vm+"</vm>";
      xmltext += "<service>"+seuil_service+"</service>";
    xmltext += "</seuil>";
  }
  else{
    xmltext += "<strategie>";
      xmltext += "<type>"+strategie+"</type>";
    xmltext += "</strategie>";
    xmltext += "</strategie>";
    xmltext += "<correspondance>";
      xmltext += "<cpu>"+correspCPU+"</cpu>";
      xmltext += "<ram>"+correspRAM+"</ram>";
    xmltext += "</correspondance>";
  }

  xmltext += "</cloud>"
  let final_xml = vkbeautify.xml(xmltext);
  let pom = document.createElement('a');
  let filename = "export.xml";
  let bb = new Blob([final_xml], {type: 'text/xml'});

  pom.setAttribute('href', window.URL.createObjectURL(bb));
  pom.setAttribute('download', filename);

  pom.dataset.downloadurl = ['text/xml', pom.download, pom.href].join(':');
  pom.draggable = true;
  pom.classList.add('dragout');

  pom.click();
}

function drawCloudFromXML(filename){
  cy.cy.remove('nodes');
  servers.length = 0;
  vms.length = 0;
  services.length = 0;
  let selectServer = document.getElementById("choix_server");
  let id_Server_onselect = selectServer.options.length;
  for(let i=id_Server_onselect; i>0; i--){
    selectServer.remove(i);
  }
  let selectVM = document.getElementById("choix_vm");
  let id_VM_onselect = selectVM.options.length;
  for(let i=id_VM_onselect; i>0; i--){
    selectVM.remove(i);
  }
  let elements = document.getElementsByClassName("vm_test");
  while(elements.length > 0){
      elements[0].parentNode.removeChild(elements[0]);
  }
  elements = document.getElementsByClassName("service_test");
  while(elements.length > 0){
      elements[0].parentNode.removeChild(elements[0]);
  }
  let taille = 0;
  for(let ik=0; ik<chart.tabLambda.length; ik++){
    taille += parseInt(chart.tabLambda[ik].taille, 10);
  }
  document.getElementById('fieldRemoveInterval').value = taille;
  chart.removeInterval();
  // XML algorithm
  let connect = new XMLHttpRequest();
  connect.open("GET", "./xml/"+filename, false);
  connect.setRequestHeader("Content-Type", "application/xml");
  connect.overrideMimeType('application/xml');
  connect.send(null);
  // Place the response in an XML document.
  let theDocument = connect.responseXML;
  // Place the root node in an element.
  console.log(theDocument);
  let cloud = theDocument.childNodes[0];
  for(let i=0; i<cloud.children.length; i++){
    let node = cloud.children[i];
    if(node.nodeName == 'server'){
      cy.addServer('server');
      servers.push({id:'server', cpu:8, ram:8, cpu_available:8, ram_available:8});
      let select = document.getElementById("choix_server");
      let option = document.createElement("option");
      option.appendChild( document.createTextNode(servers[0].id + '  |  ' + servers[0].cpu + ' : ' + servers[0].ram) );
      option.id = 'server';
      select.appendChild(option);
      for(let j=0; j<node.children.length; j++){
        let node2 = node.children[j];
        if(node2.nodeName == 'vm'){ //vm list
          for(let k=0; k<node2.children.length; k++){
            let node3 = node2.children[k];
            if(node3.nodeName == 'cpu'){ // vm cpu value
              document.getElementsByClassName("vm_CPU_value")[vms.length].innerHTML = node3.innerHTML;
            }
            else if(node3.nodeName == 'ram'){ // ram cpu value
              document.getElementsByClassName("vm_RAM_value")[vms.length].innerHTML = node3.innerHTML;
              document.getElementById("choix_server").selectedIndex = servers.length;
              addVM();
            }
            else{
              for(let l=0; l<node3.children.length; l++){ //services list
                let node4 = node3.children[l];
                if(node4.nodeName == 'cpu'){ // service cpu value
                  document.getElementsByClassName("service_CPU_value")[services.length].innerHTML = node4.innerHTML;
                }
                else if(node4.nodeName == 'ram'){
                  document.getElementsByClassName("service_RAM_value")[services.length].innerHTML = node4.innerHTML;
                }
                else if(node4.nodeName == 'mu'){
                  document.getElementsByClassName("service_MU_value")[services.length].innerHTML = node4.innerHTML;
                  document.getElementById("choix_vm").selectedIndex = vms.length;
                  addService();
                }
              }
            }
          }
        }
      }
    }
    else if(node.nodeName == 'intervalle'){
      for(let j=0; j<node.children.length; j++){
        let node2 = node.children[j];
        if(node2.nodeName == 'taille'){ // taille intervalle
          document.getElementById("fieldSizeInterval").value = node2.innerHTML;
        }
        else{ // valeur lambda
          document.getElementById("fieldLambda").value = node2.innerHTML;
          chart.createInterval();
          document.getElementById("fieldSizeInterval").value = '';
          document.getElementById("fieldLambda").value = '';
        }
      }
    }
    else if(node.nodeName == 'strategie'){
      for(let j=0; j<node.children.length; j++){
        let node2 = node.children[j];
        if(node2.nodeName == 'type'){ // type strategie
          if(node2.innerHTML == 'horizontale'){
            strategie = "Horizontale";
            document.getElementById("horizontal_checkbox").click();
          }
          else if(node2.innerHTML == 'verticale'){
            strategie = "Verticale";
            document.getElementById("vertical_checkbox").click();
          }
        }
        else{
          if(strategie == 'Horizontale'){
            document.getElementById("choix_horizontal").selectedIndex = parseInt(node2.innerHTML)-1;
            let select = document.getElementById("choix_horizontal");
            let option = select[parseInt(node2.innerHTML)-1];
            switch(parseInt(option.id)){
                case 1:
                  strategie_vm = 'HD';
                  strategie_service = 'HD';
                  break;
                case 2:
                  strategie_vm = 'HD';
                  strategie_service = 'DL';
                  break;
                case 3:
                  strategie_vm = 'DL';
                  strategie_service = 'HD';
                  break;
                case 4:
                  strategie_vm = 'DL';
                  strategie_service = 'DL';
                  break;
                default:
                  break;
            }
            console.log(strategie, strategie_vm, strategie_service);
          }
          else{
            document.getElementById("choix_vertical").selectedIndex = parseInt(node2.innerHTML)-1;
            let select = document.getElementById("choix_vertical");
            let option = select[parseInt(node2.innerHTML)-1];
            switch(parseInt(option.id)){
              case 1:
                verticalStrategy = 'Erlang';
                break;
              case 2:
                verticalStrategy = 'Double';
                break;
              default:
                break;
            }
            console.log(strategie, verticalStrategy);
          }
        }
      }
    }
    else{ // seuil ou correspondance
      for(let j=0; j<node.children.length; j++){
        let node2 = node.children[j];
        if(node2.nodeName == 'vm'){
          document.getElementById("seuil_vm").value = node2.innerHTML;
          seuil_vm = node2.innerHTML;
        }
        if(node2.nodeName == 'service'){
          document.getElementById("seuil_service").value = node2.innerHTML;
          seuil_service = node2.innerHTML;
        }
        if(node2.nodeName == 'cpu'){
          document.getElementById("seuil_vm").value = node2.innerHTML;
          correspCPU = node2.innerHTML;
        }
        if(node2.nodeName == 'ram'){
          document.getElementById("seuil_service").value = node2.innerHTML;
          correspRAM = node2.innerHTML;
        }
      }
    }
  }

}

function server_showCPUandRAM(){
  for(let i=0; i<vms.length; i++){
    let cpu_available = document.getElementsByClassName("vm_test")[i].children[1].children[0].children[4];
    let ram_available = document.getElementsByClassName("vm_test")[i].children[1].children[1].children[4];
    cpu_available.innerHTML = servers[0].cpu_available;
    ram_available.innerHTML = servers[0].ram_available;
  }
  let cpu_available = document.getElementById("vm_add").children[1].children[0].children[4];
  let ram_available = document.getElementById("vm_add").children[1].children[1].children[4];
  cpu_available.innerHTML = servers[0].cpu_available;
  ram_available.innerHTML = servers[0].ram_available;
}

function vm_showCPUandRAM(){
  let selectedIndex = document.getElementById("choix_vm").selectedIndex;
  let cpu_available, ram_available;
  for(let i=0; i<services.length; i++){
    if(services[i].parent == document.getElementById("choix_vm")[selectedIndex].id){
      cpu_available = document.getElementsByClassName("service_test")[i].children[1].children[0].children[4];
      ram_available = document.getElementsByClassName("service_test")[i].children[1].children[1].children[4];
      cpu_available.innerHTML = vms[selectedIndex-1].cpu_available;
      ram_available.innerHTML = vms[selectedIndex-1].ram_available;
    }
  }
  cpu_available = document.getElementById("service_add").children[1].children[0].children[4];
  ram_available = document.getElementById("service_add").children[1].children[1].children[4];
  cpu_available.innerHTML = vms[selectedIndex-1].cpu_available;
  ram_available.innerHTML = vms[selectedIndex-1].ram_available;
}
function vm_showCPUandRAM2(parent_id){
  let selectedIndex = document.getElementById("choix_vm").selectedIndex;
  let cpu_available, ram_available;
  for(let i=0; i<services.length; i++){
    if(services[i].parent == parent_id){
      for(let j=0; j<vms.length; j++){
        if(services[i].parent == vms[j].id){
          cpu_available = document.getElementsByClassName("service_test")[i].children[1].children[0].children[4];
          ram_available = document.getElementsByClassName("service_test")[i].children[1].children[1].children[4];
          cpu_available.innerHTML = vms[j].cpu_available;
          ram_available.innerHTML = vms[j].ram_available;
        }
      }
    }
  }
  if(document.getElementById("choix_vm")[selectedIndex].id == parent_id){
    cpu_available = document.getElementById("service_add").children[1].children[0].children[4];
    ram_available = document.getElementById("service_add").children[1].children[1].children[4];
    cpu_available.innerHTML = vms[selectedIndex-1].cpu_available;
    ram_available.innerHTML = vms[selectedIndex-1].ram_available;
  }
}

function importXML(){
  let choosefile = document.getElementById('choose_xml');
  choosefile.focus();
  let textfile = document.getElementById("textfile");
  let fullPath = choosefile.value;
  if (fullPath){
    let startIndex = (fullPath.indexOf('\\') >= 0 ? fullPath.lastIndexOf('\\') : fullPath.lastIndexOf('/'));
    let filename = fullPath.substring(startIndex);
    if (filename.indexOf('\\') === 0 || filename.indexOf('/') === 0) {
        filename = filename.substring(1);
    }
    textfile.innerHTML = filename;
    drawCloudFromXML(filename);
  }
  choosefile.blur();
}

/*Fonction appelée lorsqu'on clique sur le bouton associé, qui permet de générer sur un intervalle donné
des valeurs suivant la loi de Poisson.
*/
function createInterval() {
  if(cpt < 0){
    cpt = 0;
  }
  taille = document.getElementById("fieldSizeInterval").value;
  lambda = document.getElementById("fieldLambda").value;
  console.log(taille,lambda);
  for (var i = 1; i <= taille; i++) {
    chart.chart.data.labels.push(cpt);
    cpt += 1;
    valPoisson = getPoisson(lambda);
    valChargeVM = valPoisson - (Math.random() * lambda);

    chart.chart.data.datasets[0].data.push(valPoisson);
    chart.chart.data.datasets[1].data.push(lambda);
  }
  chart.chart.update();
  addTabLambda(taille);
}

/*Fonction appelée lorsqu'on clique sur le bouton associé, qui permet de supprimer un nombre d'intervalles choisi.
*/
function removeInterval() {
  taille = document.getElementById("fieldRemoveInterval").value;
  for (var i = 1; i <= taille; i++) {
    chart.chart.data.labels.pop();
    cpt -= 1;
    chart.chart.data.datasets[0].data.pop();
    chart.chart.data.datasets[1].data.pop();
    chart.chart.data.datasets[2].data.pop();
    chart.chart.data.datasets[3].data.pop();
  }
  chart.chart.update();
  removeTabLambda(taille);
}

/*Fonction permettant de recupérer des valeurs qui suit la loi de Poisson suivant un lambda donné.
*/
function getPoisson(lambda){
  var L = Math.exp(-lambda);
  var p = 1.0;
  var k = 0;
  while (p > L) {
    k++;
    p *= Math.random();
  };
  return k - 1;
}

function addTabLambda(taille){
  let tab = chart.chart.data.datasets[1].data;
  let nb =  tab.length - taille;
  let oldValue = 0, newValue;
  for(let i=nb; i<tab.length; i++){
    newValue = tab[i];
    if(newValue != oldValue){
      tabLambda.push({taille:taille, lambda:newValue});
      cptLambda++;
    }
    oldValue = newValue;
  }
  tab = null;
}

function removeTabLambda(taille){
  let tab = chart.chart.data.datasets[1].data;
  let nb =  tab.length - taille;
  for(let i=tab.length; i>nb; i--){
    tabLambda[cptLambda-1].taille -= 1;
    if(tabLambda[cptLambda-1].taille == 0){
      tabLambda.pop();
      cptLambda--;
    }
  }
  tab = null;
}

function createServiceHTMLNode(service_CPU, service_RAM, service_MU, parent_id, id){
  let newDiv = document.createElement("div");
  newDiv.className = "service_test";
  let service_id_div = document.createElement("div");
  service_id_div.className = "vm_id";
  let p = document.createElement("p");
  p.textContent = "Service Id:";
  service_id_div.appendChild(p);
  p = document.createElement("p");
  p.textContent = id
  p.style = "text-align:center;";
  service_id_div.appendChild(p);
  newDiv.appendChild(service_id_div);
  let div = document.createElement("div");
  let service_cpu_config = document.createElement("div");
  service_cpu_config.className = "service_CPU_config";
  p = document.createElement("p");
  p.textContent = "CPU";
  service_cpu_config.appendChild(p);
  let button = document.createElement("button");
  button.className = "service_remove_CPU";
  button.textContent = "-";
  button.disabled = true;
  button.onclick = function(event){
    let cpu = parseInt(event.target.nextElementSibling.textContent);
    if(cpu > 0) cpu--;
    event.target.nextElementSibling.innerHTML = cpu;
  }
  service_cpu_config.appendChild(button);
  p = document.createElement("p");
  p.textContent = service_CPU;
  p.className = "service_CPU_value";
  service_cpu_config.appendChild(p);
  button = document.createElement("button");
  button.className = "service_add_CPU";
  button.textContent = "+";
  button.disabled = true;
  button.onclick = function(event){
    let cpu = parseInt(event.target.previousElementSibling.textContent);
    cpu++;
    event.target.previousElementSibling.innerHTML = cpu;
  }
  service_cpu_config.appendChild(button);
  p = document.createElement("p");
  p.className = "vm_CPU_available";
  for(let i=0; i<vms.length; i++){
    if(vms[i].id == parent_id){
      p.textContent = vms[i].cpu_available;
    }
  }
  service_cpu_config.appendChild(p);
  div.appendChild(service_cpu_config);
  let service_ram_config = document.createElement("div");
  service_ram_config.className = "service_RAM_config";
  p = document.createElement("p");
  p.textContent = "RAM";
  service_ram_config.appendChild(p);
  button = document.createElement("button");
  button.className = "service_remove_RAM";
  button.textContent = "-";
  button.disabled = true;
  button.onclick = function(event){
    let ram = parseInt(event.target.nextElementSibling.textContent);
    if(ram > 0) ram--;
    event.target.nextElementSibling.innerHTML = ram;
  }
  service_ram_config.appendChild(button);
  p = document.createElement("p");
  p.textContent = service_RAM;
  p.className = "service_RAM_value";
  service_ram_config.appendChild(p);
  button = document.createElement("button");
  button.className = "service_add_RAM";
  button.textContent = "+";
  button.disabled = true;
  button.onclick = function(event){
    let ram = parseInt(event.target.previousElementSibling.textContent);
    ram++;
    event.target.previousElementSibling.innerHTML = ram;
  }
  service_ram_config.appendChild(button);
  p = document.createElement("p");
  p.className = "vm_RAM_available";
  for(let i=0; i<vms.length; i++){
    if(vms[i].id == parent_id){
      p.textContent = vms[i].ram_available;
    }
  }
  service_ram_config.appendChild(p);
  div.appendChild(service_ram_config);
  // mu
  let service_mu_config = document.createElement("div");
  service_mu_config.className = "service_MU_config";
  p = document.createElement("p");
  p.textContent = "MU";
  service_mu_config.appendChild(p);
  button = document.createElement("button");
  button.className = "service_remove_MU";
  button.textContent = "-";
  button.disabled = true;
  button.onclick = function(event){
    let mu = parseInt(event.target.nextElementSibling.textContent);
    if(mu > 0) mu--;
    event.target.nextElementSibling.innerHTML = mu;
    updateMUvalue();
  }
  service_mu_config.appendChild(button);
  p = document.createElement("p");
  p.textContent = service_MU;
  p.className = "service_MU_value";
  service_mu_config.appendChild(p);
  button = document.createElement("button");
  button.className = "service_add_MU";
  button.textContent = "+";
  button.disabled = true;
  button.onclick = function(event){
    let mu = parseInt(event.target.previousElementSibling.textContent);
    mu++;
    event.target.previousElementSibling.innerHTML = mu;
    updateMUvalue();
  }
  service_mu_config.appendChild(button);
  div.appendChild(service_mu_config);
  // fin mu
  newDiv.appendChild(div);
  div = document.createElement("div");
  let div2 = document.createElement("div");
  p = document.createElement("p");
  p.classame = "vm_parent";
  p.textContent = parent_id;
  div2.appendChild(p);
  div.appendChild(div2);
  button = document.createElement("button");
  button.className = "delete_service";
  button.textContent = "Supprimer";
  button.onclick = function(event){
    removeService(event.target.parentNode.parentNode.children[0].children[1].textContent);
    document.getElementById("services_config").removeChild(event.target.parentNode.parentNode);
  }
  div.appendChild(button);
  newDiv.appendChild(div);
  document.getElementById("services_config").insertBefore(newDiv, document.getElementById("service_add"));
}
function createVmHTMLNode(vm_CPU, vm_RAM, parent_id, id){
  let newDiv = document.createElement("div");
  newDiv.className = "vm_test";
  let vm_id_div = document.createElement("div");
  vm_id_div.className = "vm_id";
  let p = document.createElement("p");
  p.textContent = "VM Id:";
  vm_id_div.appendChild(p);
  p = document.createElement("p");
  p.textContent = id
  p.style = "text-align:center;";
  vm_id_div.appendChild(p);
  newDiv.appendChild(vm_id_div);
  let div = document.createElement("div");
  let vm_cpu_config = document.createElement("div");
  vm_cpu_config.className = "vm_CPU_config";
  p = document.createElement("p");
  p.textContent = "CPU";
  vm_cpu_config.appendChild(p);
  let button = document.createElement("button");
  button.className = "vm_remove_CPU";
  button.textContent = "-";
  button.disabled = true;
  button.onclick = function(event){
    let cpu = parseInt(event.target.nextElementSibling.textContent);
    let id;
    if(cpu > 0){
      cpu--;
      id = event.target.parentNode.parentNode.previousElementSibling.children[1].textContent;
      for(let i=0; i<vms.length; i++){
        if(vms[i].id == id){
          vms[i].cpu--;
          vms[i].cpu_available--;
        }
      }
      for(let i=0; i<servers.length; i++){
        if(servers[i].id == parent_id){
          servers[i].cpu_available++;
        }
      }
      event.target.nextElementSibling.innerHTML = cpu;
      update_server_CPU_RAM_available(parent_id);
      update_vm_CPU_RAM_available(id);
    }
  }
  vm_cpu_config.appendChild(button);
  p = document.createElement("p");
  p.textContent = vm_CPU;
  p.className = "vm_CPU_value";
  vm_cpu_config.appendChild(p);
  button = document.createElement("button");
  button.className = "vm_add_CPU";
  button.textContent = "+";
  button.disabled = true;
  button.onclick = function(event){
    let cpu = parseInt(event.target.previousElementSibling.textContent);
    let cpu_max;
    let id = event.target.parentNode.parentNode.previousElementSibling.children[1].textContent;
    for(let i=0; i<vms.length; i++){
      if(vms[i].id == id){
        vms[i].cpu++;
        vms[i].cpu_available++;
      }
    }
    for(let i=0; i<servers.length; i++){
      if(servers[i].id == parent_id){
        cpu_max = servers[i].cpu_available;
        if(cpu_max > 0){
          cpu++;
          servers[i].cpu_available--;
        }
      }
      event.target.previousElementSibling.innerHTML = cpu;
    }
    update_server_CPU_RAM_available(parent_id);
    update_vm_CPU_RAM_available(id);
  }
  vm_cpu_config.appendChild(button);
  p = document.createElement("p");

  p.className = "server_CPU_available";
  p.textContent = servers[0].cpu_available;

  vm_cpu_config.appendChild(p);
  div.appendChild(vm_cpu_config);
  let vm_ram_config = document.createElement("div");
  vm_ram_config.className = "vm_RAM_config";
  p = document.createElement("p");
  p.textContent = "RAM";
  vm_ram_config.appendChild(p);
  button = document.createElement("button");
  button.className = "vm_remove_RAM";
  button.textContent = "-";
  button.disabled = true;
  button.onclick = function(event){
    let ram = parseInt(event.target.nextElementSibling.textContent);
    let id;
    if(ram > 0){
      ram--;
      id = event.target.parentNode.parentNode.previousElementSibling.children[1].textContent;
      for(let i=0; i<vms.length; i++){
        if(vms[i].id == id){
          vms[i].ram--;
          vms[i].ram_available--;
        }
      }
      for(let i=0; i<servers.length; i++){
        if(servers[i].id == parent_id){
          servers[i].ram_available++;
        }
      }
      event.target.nextElementSibling.innerHTML = ram;
    }
    update_server_CPU_RAM_available(parent_id);
    update_vm_CPU_RAM_available(id);
  }
  vm_ram_config.appendChild(button);
  p = document.createElement("p");
  p.textContent = vm_RAM;
  p.className = "vm_RAM_value";
  vm_ram_config.appendChild(p);
  button = document.createElement("button");
  button.className = "vm_add_RAM";
  button.textContent = "+";
  button.disabled = true;
  button.onclick = function(event){
    let ram = parseInt(event.target.previousElementSibling.textContent);
    let ram_max;
    let id = event.target.parentNode.parentNode.previousElementSibling.children[1].textContent;
    for(let i=0; i<vms.length; i++){
      if(vms[i].id == id){
        vms[i].ram++;
        vms[i].ram_available++;
      }
    }
    for(let i=0; i<servers.length; i++){
      if(servers[i].id == parent_id){
        ram_max = servers[i].cpu_available;
        if(ram_max > 0){
          ram++;
          servers[i].ram_available--;
        }
      }
      event.target.previousElementSibling.innerHTML = ram;
    }
    update_server_CPU_RAM_available(parent_id);
    update_vm_CPU_RAM_available(id);
  }
  vm_ram_config.appendChild(button);
  p = document.createElement("p");

  p.className = "server_RAM_available";
  p.textContent = servers[0].ram_available;

  vm_ram_config.appendChild(p);
  div.appendChild(vm_ram_config);
  newDiv.appendChild(div);
  div = document.createElement("div");
  let div2 = document.createElement("div");
  p = document.createElement("p");
  p.classame = "server_parent";
  p.textContent = parent_id;
  div2.appendChild(p);
  div.appendChild(div2);
  button = document.createElement("button");
  button.className = "delete_vm";
  button.textContent = "Supprimer";
  button.onclick = function(event){
    removeVM(event.target.parentNode.parentNode.children[0].children[1].textContent);
    document.getElementById("vm_config").removeChild(event.target.parentNode.parentNode);
  }
  div.appendChild(button);
  newDiv.appendChild(div);
  document.getElementById("vm_config").insertBefore(newDiv, document.getElementById("vm_add"));
}


go();
