import Poisson from '../model/Poisson.js';
import '../lib/Chart.js';

export default class Plot {
  constructor() {
    this.cpt = 0; // compteur pour incrémenté le temps.
    this.mu = [];
    this.tabLambda = [];
    this.cptLambda = 0;
    const ctx = document.getElementById('myPlot').getContext('2d');
    // let lambda, taille;
    // let valPoisson, valChargeVM;
    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        type: 'line',
        labels: [],
        datasets: [{
          label: 'Charge de travail',
          backgroundColor: 'rgb(43, 134, 209, 0.2)',
          borderColor: 'rgb(43, 134, 209, 1)',
          data: [],
          fill: 1,
          stacked: 'Stacked 0',
          hidden: false,
        }, {
          type: 'line',
          label: 'Lambda',
          backgroundColor: 'rgb( 0,0,0)',
          borderColor: 'rgb( 0,0,0)',
          data: [],
          fill: false,
          steppedLine: true,
          pointRadius: 0,
          stacked: 'Stacked 2',
          hidden: false,
        }, {
          type: 'line',
          label: 'Taux de service',
          backgroundColor: 'rgb(129, 81, 26, 0.2)',
          borderColor: 'rgb(129, 81, 26)',
          data: [],
          fill: '+1',
          stacked: 'Stacked 2',
          hidden: false,
        }, {
          type: 'line',
          label: 'Mu',
          backgroundColor: 'rgb(60, 10, 10)',
          borderColor: 'rgb(60, 10, 10)',
          data: [],
          fill: false,
          steppedLine: true,
          pointRadius: 0,
          stacked: 'Stacked 2',
          hidden: false,
        }],
      },
      options: {
        legend: {
          position: 'right',
        },
        scales: {
          xAxes: [{
            stacked: true,
            ticks:{
              beginAtZero: true
            },
            scaleLabel: {
              display: true,
              labelString: 'Temps',
            },
          }],
          yAxes: [{
            stacked: false,
            scaleLabel: {
              display: true,
              labelString: 'Nombre de requête',
            },
          }],
        },
        title: {
          display: true,
          text: 'Charge en entrée',
        },
        plugins: {
          filler: {
            propagate: true,
          },
        },
        tooltips: {
          mode: 'index',
          intersect: false,
        },
        responsive: true,
        maintainAspectRatio: false,
      },
    });

    // Fonction appelée lorsqu'on clique sur le bouton associé,
    // qui permet de générer sur un intervalle donné
    // des valeurs suivant la loi de Poisson.
    // A ENLEVER -> test de la surcharge des VMs
    this.createInterval = () => {

      const taille_value = parseInt(document.getElementById('fieldSizeInterval').value, 10);
      const lambda_value = parseInt(document.getElementById('fieldLambda').value, 10);
      
      this.cptLambda++;
      for (let i = 1; i <= taille_value; i += 1) {
        this.chart.data.labels.push(this.cpt);
        this.cpt += 1;
        const valPoisson = Poisson.getPoisson(lambda_value);
        this.chart.data.datasets[0].data.push(valPoisson);
        this.chart.data.datasets[1].data.push(lambda_value);
        this.chart.update();
      }
      this.tabLambda.push({taille: taille_value, lambda: lambda_value})
    };

    this.removeInterval = () => {
      const taille = parseInt(document.getElementById('fieldRemoveInterval').value);
      for (let i = 1; i <= taille; i += 1) {
        this.chart.data.labels.pop();
        this.cpt -= 1;
        this.chart.data.datasets[0].data.pop();
        this.chart.data.datasets[1].data.pop();
        this.chart.data.datasets[2].data.pop();
        this.chart.data.datasets[3].data.pop();
        this.chart.update();
      }
      this.removeTabLambda(taille);
    };
    const btnAjout = document.getElementById('bouttonInterval');
    const btnRemove = document.getElementById('bouttonRemove');
    if (btnAjout !== null) {
      btnAjout.onclick = this.createInterval;
    }
    if (btnRemove !== null) {
      btnRemove.onclick = this.removeInterval;
    }
  }

  addWorkload(lambda, workload) {
    this.chart.data.datasets[0].data.push(workload);
    this.chart.data.datasets[1].data.push(lambda);
  }

  addOffering(mu, offering) {
    this.chart.data.labels.push(this.cpt);
    this.cpt += 1;
    this.chart.data.datasets[2].data.push(offering); // ajout du mu au graphe
    this.chart.data.datasets[3].data.push(mu);
    this.chart.update();
  }


  addSlider() {
    const mySlide = document.createElement('INPUT');
    mySlide.type = 'range';
    mySlide.min = 0;
    mySlide.max = 1000;
    mySlide.value = 500;
    mySlide.style.direction = 'rtl';
    this.waitValue = mySlide.value;
    document.getElementById('play_pause').appendChild(mySlide);
    mySlide.oninput = () => {
      this.waitValue = mySlide.value;
    };
  }

  removeTabLambda(taille){
    let tab = this.chart.data.datasets[1].data;
    let nb =  tab.length - taille;
    for(let i=tab.length; i>nb; i--){
      this.tabLambda[this.cptLambda-1].taille -= 1;
      if(this.tabLambda[this.cptLambda-1].taille == 0){
        this.tabLambda.pop();
        this.cptLambda--;
      }
    }
    tab = null;
  }
}
