import { inject, Injectable } from '@angular/core';
import { BaseType, drag, forceCenter, forceCollide, forceLink, forceManyBody, forceSimulation, Link, Node, select, Selection, Simulation } from 'd3';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { CHART_OPTIONS } from '../data/chart-options';
import { personNames, personQualities } from '../data/constants';
import { NodeType, Sign } from '../enums';
import { GraphConfiguration, Person2 } from '../interfaces';
import { BreakpointService } from './breakpoint.service';
import { EuclideanCalculatorService } from './euclidean-calculator.service';
import { KMeansClusteringService } from './k-means.service';
import { UtilsService } from './utils.service';

@Injectable({
  providedIn: 'root',
})
export class ChartDataService {
  public persons2Subject: BehaviorSubject<Person2[]> = new BehaviorSubject<Person2[]>([]);
  public proportion = 1;
  public attributesSelected: BehaviorSubject<string[]> = new BehaviorSubject<string[]>(personQualities);
  public graphConfiguration: BehaviorSubject<GraphConfiguration> = new BehaviorSubject<GraphConfiguration>({
    idPersonSelected: 0,
    /**
     * From 0 to 4
     */
    personsDistanceProportion: 2.5,
    /**
     * From 0 to 1
     */
    attributesDistanceProportion: 0.7,
    /**
     * From 0 to 1
     */
    opacityAura: 1,
    /**
     * From 10 to 100,
     */
    percentDefinedAttributes: 70,
    /**
     * From 5 to 100,
     */
    strengthGraph: 10,
    /**
     * From 5 to 250,
     */
    maxAuraRadio: 200,
    /**
     * From 4 to 10,
     */
    valueAttributeNode: 4,
    /**
     * From 1 to 10
     */
    stiffness: 1,
    fullColorAttributeNodes: true,
    showNames: true,
  });
  private US = inject(UtilsService);
  private persons2Shown: Person2[] = [];
  private persons2Created: Person2[] = [];
  private breakpointService = inject(BreakpointService);
  private kmeansService = inject(KMeansClusteringService);
  private euclideanCalculatorService = inject(EuclideanCalculatorService);
  private rangeAttributes = 10;
  private rangeWeight = 5;
  private auraReduced = 8;
  private distanceProportion = 1;
  private links: Link[];
  private nodes: Node[];
  private index: number = 0;
  private standardizedPeople: Person2[] = [];
  private standardizedSelectedPerson;
  public personQualities: string[] = personQualities;

  constructor() {
    this.proportion = this.breakpointService.proportion.getValue();
  }

  get idPersonSelected() {
    return this.graphConfiguration.value.idPersonSelected;
  }

  get personsDistanceProportion() {
    return this.graphConfiguration.value.personsDistanceProportion;
  }

  get attributesDistanceProportion() {
    return this.graphConfiguration.value.attributesDistanceProportion;
  }

  get opacityAura() {
    return this.graphConfiguration.value.opacityAura;
  }

  get percentDefinedAttributes() {
    return this.graphConfiguration.value.percentDefinedAttributes;
  }

  get strengthGraph() {
    return this.graphConfiguration.value.strengthGraph;
  }

  get maxAuraRadio() {
    return this.graphConfiguration.value.maxAuraRadio;
  }

  get valueAttributeNode() {
    return this.graphConfiguration.value.valueAttributeNode;
  }

  get fullColorAttributeNodes() {
    return this.graphConfiguration.value.fullColorAttributeNodes;
  }

  get showNames() {
    return this.graphConfiguration.value.showNames;
  }

  get stiffness() {
    return this.graphConfiguration.value.stiffness;
  }

  // };
  addPerson(nodeGroupAmount: number = 2, percentDefinedAttributes: number = 100, attributesList: string[]) {
    const newNumberPersons = Math.floor(nodeGroupAmount);
    const currentNumberPersons = this.persons2Created.length;

    if (newNumberPersons < 2) return;

    const differenceNumber = newNumberPersons - currentNumberPersons;
    const sameAttributes = this.US.arraysHaveSameElements(attributesList, this.attributesSelected.value);
    if (!sameAttributes) {
      // console.log('new');
      const newPersons = this.loopCreatePersons(newNumberPersons, percentDefinedAttributes, attributesList, true);
      this.attributesSelected.next(attributesList);
      this.persons2Created = newPersons;
      this.persons2Shown = this.persons2Created;
    } else if (percentDefinedAttributes !== this.percentDefinedAttributes) {
      // console.log('new');
      const newPersons = this.loopCreatePersons(newNumberPersons, percentDefinedAttributes, attributesList, true);
      this.persons2Created = newPersons;
      this.redefineAura(attributesList);
      this.persons2Shown = this.persons2Created;
    } else if (differenceNumber === 0) {
      // console.log('slice');
      this.redefineAura(attributesList);
      this.persons2Shown = this.persons2Created.slice(0, newNumberPersons);
    } else if (differenceNumber > 0) {
      // console.log('add');
      const newPersons = this.loopCreatePersons(differenceNumber, this.percentDefinedAttributes, attributesList, false);
      this.persons2Created = [...this.persons2Created, ...newPersons];
      this.redefineAura(attributesList);
      this.persons2Shown = this.persons2Created;
    } else {
      // console.log('else');
      this.persons2Shown = this.persons2Created.slice(0, newNumberPersons);
    }

    this.persons2Subject.next(this.persons2Shown);
  }

  private redefineAura(attributesList: string[]) {
    for (const person of this.persons2Created) {
      // Recalculate the personal aura based on the number of defined attributes
      // make loop to search for attributes that are new or dismissed.
      // if there is new add it if there is none remove it
      for (const attr in person.attributes) {
        if (person.attributes[attr] == null) {
          delete person.attributes[attr];
        }
      }
      person.personalAuraRadio = (this.maxAuraRadio * Object.keys(person.attributes).length) / attributesList.length;
    }
  }

  loopCreatePersons(number: number, percentDefinedAttributes: number, attributesList: string[], isNew: boolean) {
    const persons2Created: Person2[] = [];

    let counterId = isNew ? 0 : this.persons2Created.length;

    for (let i = 0; i < number; i++) {
      const name: string = personNames[this.US.randomNumber(personNames.length, false)] + ` (${this.US.randomNumber(10) + 18})`;
      const id = counterId;

      const attributes = {};
      const preferences = {};

      // Uncomment to make similar numbers for each attributes of a person.
      const mockData = [10, 5, 0];
      const randomNumber = Math.floor(Math.random() * mockData.length);

      for (let j = 0; j < attributesList.length; j++) {
        const attributeName = attributesList[j];
        if (this.US.randomBoolean(percentDefinedAttributes)) {
          attributes[attributeName] = randomNumber;
        }
        preferences[attributeName] = {
          value: 10,
          sign: Sign.CLOSER,
          weight: this.US.randomNumber(this.rangeWeight),
        };
      }

      const personalAuraRadio = (this.maxAuraRadio * Object.keys(attributes).length) / attributesList.length;

      persons2Created.push({
        id,
        name,
        attributes,
        preferences,
        personalAuraRadio,
      });

      counterId += 1;
    }

    return persons2Created;
  }

  /**
   * Generate Chart Data
   * @returns nodes and links using the persons data from the BehaviorSubject
   */
  public getChartData(): Observable<{ nodes: Node[]; links: Link[] }> {
    const nodes: Node[] = [];
    const links: Link[] = [];

    const person = this.persons2Shown.find((p) => p.id === this.idPersonSelected);
    const personsNotSelected = this.persons2Shown.filter((p) => p.id !== this.idPersonSelected);

    // console.log('person', person);
    // console.log('personsNotSelected', personsNotSelected);

    const relationsData = {};
    const selectedData = {
      id: person.id,
      name: person.name,
      attributes: {},
    };
    for (let a = 0; a < personsNotSelected.length; a++) {
      relationsData[personsNotSelected[a].id] = {};
    }

    for (let i = 0; i < personsNotSelected.length; i++) {
      for (const attribute of this.personQualities) {
        if (personsNotSelected[i].attributes[attribute]) {
          const sign: Sign = person.preferences[attribute].sign;

          let attraction: number = 0;

          const preferenceValue: number = person.preferences[attribute].value;
          const attributevalue: number = personsNotSelected[i].attributes[attribute];

          const isGreater: boolean = preferenceValue < attributevalue;
          const isLesser: boolean = preferenceValue > attributevalue;
          const isExact: boolean = preferenceValue === attributevalue;

          if (sign === Sign.GREATER && isGreater) {
            attraction = person.preferences[attribute].weight;
            relationsData[personsNotSelected[i].id][attribute] = attraction;
          } else if (sign === Sign.LESSER && isLesser) {
            attraction = person.preferences[attribute].weight;
            relationsData[personsNotSelected[i].id][attribute] = attraction;
          } else if (sign === Sign.EXACT && isExact) {
            attraction = person.preferences[attribute].weight;
            relationsData[personsNotSelected[i].id][attribute] = attraction;
          } else {
            relationsData[personsNotSelected[i].id][attribute] = 0;
          }

          if (sign === Sign.CLOSER) {
            const separationUnt: number = person.preferences[attribute].weight / (this.rangeAttributes - 1);

            const distanceInt: number = preferenceValue - attributevalue;

            const distanceDouble: number = Math.abs(distanceInt) * separationUnt;

            attraction = Math.floor((person.preferences[attribute].weight - distanceDouble) * 100) / 100;

            relationsData[personsNotSelected[i].id][attribute] = attraction;
          }

          if (selectedData.attributes[attribute]) {
            selectedData.attributes[attribute] += attraction;
          } else {
            selectedData.attributes[attribute] = attraction;
          }
        } else {
          relationsData[personsNotSelected[i].id][attribute] = 0;
          if (!selectedData.attributes[attribute]) {
            selectedData.attributes[attribute] = 0;
          }
        }
      }
    }

    const linksRelationsAttributes: Link[] = [];
    const linksPersons: Link[] = [];
    const nodesPersons: Node[] = [];
    const nodesAttributes: Node[] = [];
    let maxDistanceRelations: number = 0;

    for (const idPerson in relationsData) {
      if (Object.prototype.hasOwnProperty.call(relationsData, idPerson)) {
        // for distance between persons purpose
        let sumAttractions: number = 0;

        let maxDistanceAttributePerson: number = 0;
        let minDistanceAttributePerson: number = 1000;
        // for each person
        for (const attribute in relationsData[idPerson]) {
          if (Object.prototype.hasOwnProperty.call(relationsData[idPerson], attribute)) {
            const distance = relationsData[idPerson][attribute] * 10 + this.maxAuraRadio / this.auraReduced;

            linksRelationsAttributes.push({
              source: idPerson,
              target: `${idPerson}_${attribute}`,
              light: false,
              distance: 0,
            });

            if (distance > maxDistanceRelations) maxDistanceRelations = distance;

            if (relationsData[idPerson][attribute] > maxDistanceAttributePerson) maxDistanceAttributePerson = relationsData[idPerson][attribute];
            if (relationsData[idPerson][attribute] < minDistanceAttributePerson) minDistanceAttributePerson = relationsData[idPerson][attribute];

            sumAttractions += relationsData[idPerson][attribute];
          }
        }

        // get color for Attribute Node
        for (const attribute in relationsData[idPerson]) {
          if (Object.prototype.hasOwnProperty.call(relationsData[idPerson], attribute)) {
            // for each attribute per person there'll be a node
            nodesAttributes.push({
              id: `${idPerson}_${attribute}`,
              name: attribute,
              value: this.valueAttributeNode * this.proportion,
              color: this.US.getColorAttributeNode(relationsData[idPerson][attribute], maxDistanceAttributePerson, minDistanceAttributePerson, 1),
              colorAura: this.US.getColorAttributeNode(relationsData[idPerson][attribute], maxDistanceAttributePerson, minDistanceAttributePerson, 1),
              fullColor: this.fullColorAttributeNodes,
              personId: idPerson,
            });
          }
        }

        // links from other persons to selected person
        linksPersons.push({
          source: idPerson,
          target: selectedData.id,
          light: false,
          distance: sumAttractions / 5,
        });

        nodesPersons.push({
          id: idPerson,
          name: personsNotSelected.find((p) => p.id === +idPerson).name,
          color: '#FFC500',
          value: personsNotSelected.find((p) => p.id === +idPerson).personalAuraRadio * this.proportion,
        });
      }
    }

    let maxDistancePersons: number = 0;
    let minDistancePersons: number = 1000;
    for (let i = 0; i < linksPersons.length; i++) {
      const distance = linksPersons[i].distance;
      if (distance > maxDistancePersons) maxDistancePersons = distance;
      if (distance < minDistancePersons) minDistancePersons = distance;
    }

    for (let i = 0; i < nodesPersons.length; i++) {
      const realDistance = linksPersons[i].distance;
      const realMaxDistance = maxDistancePersons;
      const realMinDistance = minDistancePersons;

      nodes.push({
        ...nodesPersons[i],
        colorAura: this.US.getColorPersonNode(realDistance, realMaxDistance, realMinDistance, this.opacityAura),
        fullColor: false,
        color: this.US.getColorPersonNode(realDistance, realMaxDistance, realMinDistance, this.opacityAura),
        personId: undefined,
        type: NodeType.PERSON,
      });
    }

    for (let i = 0; i < linksRelationsAttributes.length; i++) {
      links.push({
        ...linksRelationsAttributes[i],
        distance: ((linksRelationsAttributes[i].distance * this.maxAuraRadio * this.attributesDistanceProportion) / maxDistanceRelations) * this.proportion,
      });
    }

    // Selected person
    nodes.push({
      id: selectedData.id,
      name: selectedData.name,
      color: `rgb(255, 0, 166, ${this.opacityAura})`,
      fullColor: false,
      colorAura: `rgb(255, 0, 166, ${this.opacityAura})`,
      value: this.maxAuraRadio * this.proportion,
      personId: undefined,
      type: NodeType.PERSON,
    });

    const linksSelectedAttributes: Link[] = [];
    let maxDistanceSelected: number = 1000;
    let minDistanceSelected: number = 0;

    for (const key in selectedData.attributes) {
      if (Object.prototype.hasOwnProperty.call(selectedData.attributes, key)) {
        const distance = selectedData.attributes[key] * 10 + this.maxAuraRadio / this.auraReduced;

        linksSelectedAttributes.push({
          source: key,
          target: selectedData.id,
          light: false,
          distance: distance,
        });

        if (distance > maxDistanceSelected) maxDistanceSelected = distance;
        if (distance < minDistanceSelected) minDistanceSelected = distance;
      }
    }

    for (let i = 0; i < linksSelectedAttributes.length; i++) {
      console.log('presumed distance', ((linksSelectedAttributes[i].distance * this.maxAuraRadio * this.attributesDistanceProportion) / maxDistanceSelected) * this.proportion);
      links.push({
        ...linksSelectedAttributes[i],
        distance: ((linksSelectedAttributes[i].distance * this.maxAuraRadio * this.attributesDistanceProportion) / maxDistanceSelected) * this.proportion,
      });
    }

    for (const key in selectedData.attributes) {
      if (Object.prototype.hasOwnProperty.call(selectedData.attributes, key)) {
        const distance = selectedData.attributes[key] * 10 + this.maxAuraRadio / this.auraReduced;

        nodes.push({
          id: key,
          name: key,
          value: this.valueAttributeNode * this.proportion,
          color: this.US.getColorAttributeNode(distance, maxDistanceSelected, minDistanceSelected, 1, true),
          colorAura: this.US.getColorAttributeNode(distance, maxDistanceSelected, minDistanceSelected, 1, true),
          fullColor: this.fullColorAttributeNodes,
          personId: selectedData.id,
          type: NodeType.ATTRIBUTE,
        });
      }
    }

    // nodes others attributes
    for (let i = 0; i < nodesAttributes.length; i++) {
      nodes.push({
        ...nodesAttributes[i],
        type: NodeType.ATTRIBUTE,
      });
    }

    this.standardizeAttributes(person, personsNotSelected);

    for (const attribute of this.attributesSelected.value) {
      for (let i = 0; i < this.standardizedPeople.length; i++) {
        for (let j = i; j < this.standardizedPeople.length; j++) {
          const attrI = this.standardizedPeople[i].attributes[attribute];
          const attrJ = this.standardizedPeople[j].attributes[attribute];
          if (this.standardizedPeople[i].id === this.standardizedPeople[j].id || attrI == undefined || attrJ == undefined) {
            // continue;
          } else {
            // so that 8 and 8 or 10 and 9 will be closer than 5 and 0
            const rawDistance = this.euclideanCalculatorService.calculateEuclideanDistance(this.standardizedPeople[i].attributes, this.standardizedPeople[j].attributes);
            console.log('isNAN? ', rawDistance);
            links.push({
              source: `${this.standardizedPeople[i].id}_${attribute}`,
              target: `${this.standardizedPeople[j].id}_${attribute}`,
              light: true,
              distance: rawDistance,
            });
            // }
          }
        }
      }
    }

    nodesAttributes.forEach((attributeNode) => {
      Object.keys(person.preferences).forEach((preference) => {
        if (attributeNode.name === preference) {
          const otherPersonAttributes = this.standardizedPeople.find((stPerson) => stPerson.id == attributeNode.personId)?.attributes;
          if (otherPersonAttributes) {
            const distance = this.euclideanCalculatorService.calculateWeightedDistance(this.standardizedSelectedPerson.preferences, otherPersonAttributes);
            links.push({
              source: attributeNode.id,
              target: preference,
              light: false,
              distance: distance,
            });
          }
        }
      });
    });

    // 9. Cluster the nodes
    const peopleNode = [];
    const peopleWithAttributes = nodes.filter((node) => node.type === NodeType.PERSON);
    const nodeAttributes = nodes.filter((node) => node.type === NodeType.ATTRIBUTE);

    const selectedPersonPreferences = {};
    this.attributesSelected.value.forEach((trait) => {
      selectedPersonPreferences[trait] = this.standardizedSelectedPerson.preferences[trait].value;
    });
    peopleWithAttributes.forEach((node) => {
      if (node.id == this.idPersonSelected) {
        peopleNode.push({
          ...node,
          attributes: selectedPersonPreferences,
        });
      } else {
        peopleNode.push({
          ...node,
          attributes: this.standardizedPeople.find((each) => each.id == node.id).attributes,
        });
      }
    });
    // To cluster nodes using K-means
    this.kmeansService.cluster([...nodeAttributes, ...peopleNode], peopleNode.length / 2, this.standardizedSelectedPerson.preferences);
    this.logDistances();
    const clusteredNodes = this.kmeansService.getClusters();
    // Add cluster information to nodes
    clusteredNodes.forEach((node) => {
      const foundNode = nodes.find((n) => n.id === node.id);
      if (foundNode) {
        foundNode.cluster = node.cluster;
      }
    });
    // console.table(relationsData);
    // console.table(selectedData.attributes);
    // console.table(person.preferences);
    return of({ nodes, links });
  }

  public logDistances() {
    this.standardizedPeople.forEach((p) => {
      const distance = this.standardizedPeople.map((person) => {
        if (person.id != p.id) {
          const eucDistance = this.euclideanCalculatorService.calculateEuclideanDistance(p.attributes, person.attributes);
          const tableInfo = {
            sourcePerson: p.name,
            sourceId: p.id,
            targetPerson: person.name,
            targetId: person.id,
            distance: eucDistance,
          };
          return tableInfo;
        }
      });
      console.info('standardizedPeople distance');
      console.table(distance);
    });

    const distances = this.standardizedPeople.map((person) => {
      return {
        person: person.name,
        id: person.id,
        distance: this.euclideanCalculatorService.calculateWeightedDistance(this.standardizedSelectedPerson.preferences, person.attributes),
      };
    });

    console.info('This distance table shows the relation between selected person and other people');
    console.info('This distance table does not show the distance between other people, the clustering behind centroids');
    console.info('Which means nodes within a cluster are as close to each other as possible');
    console.table(distances);
  }

  /**
   * Create Graph & Adjust SVG Height,Width & View Box`
   */
  public createGraph(
    div: HTMLDivElement,
    width: number,
    height: number,
    data: { nodes: Node[]; links: Link[] },
  ): { svg: Selection<SVGSVGElement, unknown, null, undefined>; simulation: Simulation<Node, Link> } {
    select('svg').remove();

    const svg = select(div).append('svg').attr('viewBox', `0 0 ${width} ${height}`).attr('preserveAspectRatio', 'xMidYMid meet');

    const link: Selection<SVGLineElement, Link, BaseType, unknown> = svg
      .append('g')
      .attr('stroke', CHART_OPTIONS.linkColor)
      .attr('stroke-opacity', 1)
      .selectAll('line')
      .data(data.links)
      .join('line')
      .attr('class', 'links');

    // const linkText = svg
    //   .append('g')
    //   .selectAll('text')
    //   .data(data.links)
    //   .enter()
    //   .append('text')
    //   .attr('fill', 'red')
    //   .attr('font-size', '10px')
    //   .text((d: any) => (d.distance === 0 ? '' : d.distance));

    const node: Selection<SVGGElement, Node, BaseType, unknown> = svg
      .append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(data.nodes)
      .enter()
      .append('g')
      .call(
        drag()
          .on('start', (e, d, s) => {
            this.dragStart(e, d, simulation);
            link
              .attr('display', 'none')
              .filter((l) => l.source.id === d.id || l.target.id === d.id)
              .attr('display', 'block')
              .attr('stroke', 'white');

            text
              .filter((n) => {
                return n.type === NodeType.ATTRIBUTE && n.personId === d.id;
              })
              .style('fill', 'white');

            text.filter((n) => n.type === NodeType.ATTRIBUTE && n.id === d.id).style('fill', 'white');
            if (!e.active) simulation.alphaTarget(0.3 * this.stiffness).restart(); // Increase alphaTarget based on stiffness
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (e, d, s) => {
            this.drag(e, d, simulation);
            link
              .attr('display', 'none')
              .filter((l) => l.source.id === d.id || l.target.id === d.id)
              .attr('display', 'block')
              .attr('stroke', 'white');

            text
              .filter((n) => {
                return n.type === NodeType.ATTRIBUTE && n.personId === d.id;
              })
              .style('fill', 'white');

            text.filter((n) => n.type === NodeType.ATTRIBUTE && n.id === d.id).style('fill', 'white');
          })
          .on('end', (e, d, s) => {
            this.dragEnd(event, d, simulation, data.nodes, node, width, height);
            link.attr('display', 'block').attr('stroke', CHART_OPTIONS.linkColor);
            text.filter((n) => n.type === NodeType.ATTRIBUTE && n.personId === d.id).style('fill', 'transparent');
            text.filter((n) => n.type === NodeType.ATTRIBUTE && n.id === d.id).style('fill', 'transparent');
          }),
      );

    const circles: Selection<SVGCircleElement, Node, BaseType, unknown> = node.append('g').style('cursor', 'pointer');

    circles
      .append('circle')
      .attr('r', (d) => (d.type == NodeType.PERSON ? d.value / 1.5 : d.value))
      .style('fill', (d) => (d.fullColor ? d.color : 'transparent'));

    const gradient: Selection<SVGStopElement, unknown, BaseType, unknown> = circles
      .append('radialGradient')
      .attr('id', (d, i) => (d.fullColor ? `glare-gradient-${i}` : ''))
      .attr('cx', '70%')
      .attr('cy', '70%')
      .attr('r', '80%');

    gradient.append('stop').attr('offset', '0%').style('stop-color', CHART_OPTIONS.gradientColor).style('stop-opacity', 1);

    gradient.append('stop').attr('offset', '100%').style('stop-color', CHART_OPTIONS.gradientShade);

    const gradientOut: Selection<SVGStopElement, unknown, BaseType, unknown> = circles
      .append('radialGradient')
      .attr('id', (d, i) => (d.fullColor ? '' : `gradient-out-${i}`))
      .attr('cx', '50%')
      .attr('cy', '50%')
      .attr('r', '50%');

    gradientOut
      .append('stop')
      .attr('offset', '0%')
      .style('stop-color', (n) => n.colorAura)
      .style('stop-opacity', 1);

    gradientOut.append('stop').attr('offset', '100%').style('stop-color', 'transparent');

    circles
      .append('circle')
      .attr('r', (d) => (!d.fullColor ? d.value : 0))
      .attr('x', 0)
      .attr('y', 0)
      .style('fill', (d, i) => `url(#glare-gradient-${i})`);

    circles
      .append('circle')
      .attr('r', (d) => (!d.fullColor ? d.value / 1.5 : 0))
      .attr('x', 0)
      .attr('y', 0)
      .style('fill', (d, i) => `url(#gradient-out-${i})`);

    const text = circles
      .append('text')
      .style('fill', (n) => `${n.type === NodeType.PERSON ? 'white' : 'transparent'}`)
      .text((n) => `${this.showNames ? n.name : ''} ${n.counter ? '(' + n.counter + ')' : ''}`)
      .attr('x', 12)
      .attr('y', 3)
      .style('font-size', '12px');

    svg.select('#light-gradient').attr('refX', 5);

    const simulation = forceSimulation(data.nodes)
      .force(
        'link',
        forceLink(data.links)
          .id((d: any) => d.id)
          .distance((d) => {
            if (!d.distance || isNaN(d.distance)) {
              console.warn(`Invalid distance for link from ${d.source} to ${d.target}. Setting to default 100.`);
              return 100; // Default distance
            }
            return d.distance * 10;
          }),
        // .distance((d) => {
        //   if (d.source.type == 'attribute' && d.target.type == 'attribute') {
        //     return d.distance * 200 * this.attributesDistanceProportion; // Distance based on the provided distance
        //   } else {
        //     return d.distance * 200;
        //   }
        // }), // Minimal distance for attribute nodes
      )
      .force(
        'charge',
        forceManyBody().strength((d) => {
          if (d.type === NodeType.ATTRIBUTE && d.personId != this.idPersonSelected) {
            return -200;
          } else if (d.type === NodeType.ATTRIBUTE) {
            return -100 * this.attributesDistanceProportion;
          } else {
            return -50;
          }
        }),
      )
      .force('center', forceCenter(width / 2, height / 2))
      .force(
        'collision',
        forceCollide().radius((d) => {
          if (d.type === NodeType.PERSON) {
            return 50 * this.personsDistanceProportion;
          } else {
            return 10 * this.attributesDistanceProportion;
          }
        }),
      )
      .force(
        'attract',
        forceManyBody().strength((d) => {
          if (d.id === 0) {
            return d.type === 'person' ? 100 : -100; // Attractive force for the selected person (id: 0)
          }
          return 0;
        }),
      )
      .alphaDecay(0.08) // Increase decay rate to stop faster
      .on('tick', () => {
        this.calculatePosition(data.nodes, node, width, height);

        link
          .attr('x1', (l) => l.source.x)
          .attr('y1', (l) => l.source.y)
          .attr('x2', (l) => l.target.x)
          .attr('y2', (l) => l.target.y);
        // linkText.attr('x', (d) => (d.source.x + d.target.x) / 2).attr('y', (d) => (d.source.y + d.target.y) / 2);
      });

    return { svg, simulation };
  }

  private calculatePosition(nodes, node, width, height) {
    type ClusterCenter = { x: number; y: number; count: number };
    const clusterCenters: { [key: number]: ClusterCenter } = {};

    // Calculate cluster centers
    nodes.forEach((n) => {
      if (n.cluster !== undefined) {
        if (!clusterCenters[n.cluster]) {
          clusterCenters[n.cluster] = { x: 0, y: 0, count: 0 };
        }
        clusterCenters[n.cluster].x += n.x || 0;
        clusterCenters[n.cluster].y += n.y || 0;
        clusterCenters[n.cluster].count++;
      }
    });

    Object.keys(clusterCenters).forEach((cluster) => {
      if (clusterCenters[cluster].count != 0 && clusterCenters[cluster].x != 0 && clusterCenters[cluster].y != 0) {
        // Only calculate the average position if there are nodes in the cluster
        clusterCenters[cluster].x /= clusterCenters[cluster].count;
        clusterCenters[cluster].y /= clusterCenters[cluster].count;
      } else {
        // Assign a default position if the cluster has no nodes (e.g., center of the SVG)
        clusterCenters[cluster].x = width / 2;
        clusterCenters[cluster].y = height / 2;
      }
    });

    nodes.forEach((i) => {
      if (i.cluster !== undefined) {
        // Adjust node positions to be closer to their cluster centers
        i.x += (clusterCenters[i.cluster].x - i.x) * 0.1;
        i.y += (clusterCenters[i.cluster].y - i.y) * 0.1;
      }

      // Ensure nodes stay within the bounds of the SVG
      node.attr('transform', (n) => {
        n.x = Math.max(0, Math.min(width, n.x));
        n.y = Math.max(0, Math.min(height, n.y));
        if (isNaN(Math.max(0, Math.min(width, n.x)))) {
          n.x = 1000;
        }
        if (isNaN(Math.max(0, Math.min(height, n.y)))) {
          n.y = 1000;
        }
        return 'translate(' + n.x + ',' + n.y + ')';
      });
    });
  }

  // Function to standardize the attributes
  private standardizeAttributes(selectedPerson, people) {
    const traits = this.attributesSelected.value;
    const traitMeans: { [key: string]: number } = {};
    const traitStds: { [key: string]: number } = {};

    // Calculate means
    traits.forEach((trait) => {
      traitMeans[trait] =
        people.reduce((sum, person) => {
          if (person.attributes[trait] != undefined) {
            return sum + person.attributes[trait];
          }
          return sum; // Skip the addition if attribute is undefined
        }, 0) / people.length;
    });

    // Calculate standard deviations
    traits.forEach((trait) => {
      traitStds[trait] = Math.sqrt(
        people.reduce((sum, person) => {
          const deviation = person.attributes[trait] - traitMeans[trait];
          if (!isNaN(deviation)) {
            return sum + Math.pow(deviation, 2);
          }
          return sum; // Skip the addition if deviation is NaN (i.e., attribute is undefined)
        }, 0) / people.length,
      );
    });

    // Standardize attributes
    this.standardizedPeople = people.map((person) => {
      const standardizedAttributes = {};
      traits.forEach((trait) => {
        if (person.attributes[trait] != undefined) {
          standardizedAttributes[trait] = (person.attributes[trait] - traitMeans[trait]) / traitStds[trait];
        }
      });
      return {
        ...person,
        attributes: standardizedAttributes,
      };
    });
    // console.log('   ');
    // console.info('standardized data of the people');
    this.standardizedPeople.forEach((ppl) => {
      // console.log(ppl.name);
      // console.table(ppl.attributes);
    });

    // Standardize the selected person's preferences
    this.standardizedSelectedPerson = {
      ...selectedPerson,
      preferences: Object.keys(selectedPerson.preferences).reduce((acc, pref) => {
        acc[pref] = {
          value: (selectedPerson.preferences[pref].value - traitMeans[pref]) / traitStds[pref],
          sign: selectedPerson.preferences[pref].sign,
          weight: selectedPerson.preferences[pref].weight,
        };
        return acc;
      }, {}),
    };
    // console.log('   ');
    // console.info('standardized data of the Selected Person');
    // console.table(this.standardizedSelectedPerson.preferences);
  }

  private dragStart(event: any, d: Node, simulation) {
    if (!event.active) simulation.alphaTarget(0.3 * this.stiffness).restart(); // Increase alphaTarget based on stiffness
    d.fx = d.x;
    d.fy = d.y;
  }

  private drag(event: any, d: Node, simulation) {
    d.fx = event.x;
    d.fy = event.y;
  }

  private dragEnd(event: any, d: Node, simulation, nodes, node, width, height) {
    if (!event.active) simulation.alphaTarget(0); // Reset alphaTarget
    d.fx = null;
    d.fy = null;
    this.calculatePosition(nodes, node, width, height); // Ensure positions are recalculated
  }
}
