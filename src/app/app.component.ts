import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {}
// // app.component.ts
// import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
// import { select, forceSimulation, forceManyBody, forceCenter, forceLink } from 'd3';
//
// interface Attributes {
//   ambitious: number;
//   creative: number;
//   intelligent: number;
// }
//
// interface Person {
//   id: number;
//   name: string;
//   attributes: Attributes;
//   personalAuraRadio: number;
// }
//
// interface Preference {
//   value: number;
//   sign: string;
//   weight: number;
// }
//
// interface SelectedPerson {
//   id: number;
//   name: string;
//   preferences: {
//     ambitious: Preference;
//     creative: Preference;
//     intelligent: Preference;
//   };
//   personalAuraRadio: number;
// }
//
// @Component({
//   selector: 'app-root',
//   template: '<svg width="800" height="600"></svg>',
//   styles: [
//     `
//       .node circle {
//         stroke: #fff;
//         stroke-width: 1.5px;
//       }
//       .node text {
//         font: 10px sans-serif;
//       }
//       .link {
//         stroke: #999;
//         stroke-opacity: 0.6;
//       }
//     `,
//   ],
// })
// export class AppComponent implements OnInit, OnChanges {
//   public otherPeople: Person[] = [
//     {
//       id: 1,
//       name: 'Ben (26)',
//       attributes: {
//         ambitious: 10,
//         creative: 10,
//         intelligent: 10,
//       },
//       personalAuraRadio: 200,
//     },
//     {
//       id: 2,
//       name: 'Penelope (21)',
//       attributes: {
//         ambitious: 10,
//         creative: 10,
//         intelligent: 5,
//       },
//       personalAuraRadio: 200,
//     },
//     {
//       id: 3,
//       name: 'Chloe (27)',
//       attributes: {
//         ambitious: 0,
//         creative: 0,
//         intelligent: 5,
//       },
//       personalAuraRadio: 66.66666666666667,
//     },
//   ];
//
//   public selectedPerson: SelectedPerson = {
//     id: 0,
//     name: 'Derek (22)',
//     preferences: {
//       ambitious: {
//         value: 10,
//         sign: 'closer',
//         weight: 10,
//       },
//       creative: {
//         value: 10,
//         sign: 'closer',
//         weight: 10,
//       },
//       intelligent: {
//         value: 10,
//         sign: 'closer',
//         weight: 10,
//       },
//     },
//     personalAuraRadio: 133.33333333333334,
//   };
//
//   ngOnInit() {
//     this.createForceGraph();
//   }
//
//   ngOnChanges(changes: SimpleChanges) {
//     if (changes.otherPeople || changes.selectedPerson) {
//       this.createForceGraph();
//     }
//   }
//
//   createForceGraph() {
//     const svg = select('svg');
//     svg.selectAll('*').remove();
//     const width = +svg.attr('width');
//     const height = +svg.attr('height');
//
//     const nodes = [...this.otherPeople.map((person) => ({ ...person, type: 'other' })), { ...this.selectedPerson, type: 'selected' }];
//
//     const links = this.otherPeople.map((person) => ({
//       source: this.selectedPerson.id,
//       target: person.id,
//       distance: this.calculateDistance(this.selectedPerson.preferences, person.attributes),
//     }));
//
//     const simulation = forceSimulation(nodes)
//       .force(
//         'link',
//         forceLink(links)
//           .id((d: any) => d.id)
//           .distance((d) => d.distance),
//       )
//       .force('charge', forceManyBody().strength(-200))
//       .force('center', forceCenter(width / 2, height / 2));
//
//     const link = svg.append('g').attr('class', 'links').selectAll('line').data(links).enter().append('line').attr('class', 'link');
//
//     const node = svg.append('g').attr('class', 'nodes').selectAll('g').data(nodes).enter().append('g').attr('class', 'node');
//
//     node
//       .append('circle')
//       .attr('r', 10)
//       .attr('fill', (d) => (d.type === 'selected' ? 'blue' : 'gray'));
//
//     node
//       .append('text')
//       .attr('x', 12)
//       .attr('dy', '.35em')
//       .text((d) => d.name);
//
//     simulation.on('tick', () => {
//       link
//         .attr('x1', (d) => d.source.x)
//         .attr('y1', (d) => d.source.y)
//         .attr('x2', (d) => d.target.x)
//         .attr('y2', (d) => d.target.y);
//
//       node.attr('transform', (d) => `translate(${d.x},${d.y})`);
//     });
//   }
//
//   calculateDistance(preferences, attributes) {
//     let distance = 0;
//     Object.keys(preferences).forEach((key) => {
//       distance += preferences[key].weight * Math.abs(preferences[key].value - attributes[key]);
//     });
//     return distance;
//   }
// }
