// import cytoscape from '../lib/cytoscape.esm.min.js';

export default class Cyto {
  constructor() {
    this.cy = cytoscape({
      container: document.getElementById('cy'), // container to render in
      ready() {
        this.nodes().forEach((node) => {
          const width = [30, 70, 110];
          const size = width[Math.floor(Math.random() * 3)];
          node.css('width', size);
          node.css('height', size);
        });
        this.layout({ name: 'cose-bilkent', animationDuration: 1000 }).run();
      },
      elements: [ // list of graph elements to start with
        /* { // node a
          data: { id: 'a' }
        }
        { // node b
          data: { id: 'b', parent:"a"}
        },
        {
          data: { id: 'c', parent:"a"}
        } */
      ],
      style: [ // the stylesheet for the graph
        {
          selector: 'node',
          style: {
            // 'background-color': '#cfd138',
            label: 'data(id)',
            'font-size': '7px',
          },
        },
      ],
    });
    this.cy.zoom({
      level: 1.5, // the zoom level
      renderedPosition: { x: -200, y: -100 },
    });
    this.cy.layout({ name: 'cose-bilkent', animationDuration: 1000 }).run();
    const play_pause = document.createElement("div");
    play_pause.id = 'play_pause';
    cy.parentNode.appendChild(play_pause);
  }

  addServer(id) {
    this.cy.add([{
      group: 'nodes',
      data: { id },
      // position: { x: (servers.length*100)+100, y: 0 }
      // On verra plus tard
    }]);
    // node_id = '[id=\"'+ id +'\"]';
    this.cy.getElementById(id).style('background-color', '#49914f');
    this.cy.getElementById(id).style('shape', 'square');
    const layout = this.cy.layout({
      name: 'cose-bilkent',
      animate: 'end',
      animationEasing: 'ease-out',
      animationDuration: 1000,
      randomize: true,
    });
    layout.run();
    this.cy.zoom({
      level: 1.5, // the zoom level
    });
  }

  addVM(id, parentId) {
    this.cy.add([{
      group: 'nodes',
      data: { id, parent: parentId },
      // position: {  x: this.cy.nodes('[id=\"'+parentId+'\"]').position().x, y: posy }
      // On verra plus tard
    }]);
    // node_id = '[id=\"'+ id +'\"]';
    this.cy.getElementById(id).style('background-color', '#cfd138');
    const layout = this.cy.layout({
      name: 'cose-bilkent',
      animate: 'end',
      animationEasing: 'ease-out',
      animationDuration: 1000,
      randomize: true,
    });
    layout.run();
    this.cy.zoom({
      level: 1.5, // the zoom level
    });
  }

  addService(id, parentId) {
    this.cy.add([{
      group: 'nodes',
      data: { id, parent: parentId },
      // position: { x: posx, y: this.cy.nodes('[id=\"'+parentId+'\"]').position().y }
      // On verra plus tard
    }]);
    // node_id = '[id=\"'+ id +'\"]';
    this.cy.getElementById(id).style('background-color', '#7272f7');
    this.cy.getElementById(id).style('shape', 'triangle');
    const layout = this.cy.layout({
      name: 'cose-bilkent',
      animate: 'end',
      animationEasing: 'ease-out',
      animationDuration: 1000,
      randomize: true,
    });
    layout.run();
    this.cy.zoom({
      level: 1.5, // the zoom level
    });
  }

  removeServer(id) {
    this.cy.remove(`[id="${id}"]`);
  }

  removeVM(id) {
    this.cy.remove(`[id="${id}"]`);
  }

  removeService(id) {
    this.cy.remove(`[id="${id}"]`);
  }

  findParent(id) { // unused
    const node = this.cy.elements().jsons().find((item) => item.data.id === id);
    if (node === undefined) { return null; } return node.data.parent;
  }

  hasNode(id) {
    return (this.cy.elements().jsons().some((item) => item.data.id === id));
  }
}
