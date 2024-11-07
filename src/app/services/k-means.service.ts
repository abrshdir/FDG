import { inject, Injectable } from '@angular/core';
import { Nodes } from 'd3';
import { NodeType } from '../enums';
import { EuclideanCalculatorService } from './euclidean-calculator.service';
import { Subject } from 'rxjs';
import { personQualities } from '../data/constants';

@Injectable({
  providedIn: 'root',
})
export class KMeansClusteringService {
  private nodes: Nodes[];
  private k: number;
  private maxIterations: number = 100;
  private centroids: { id: string; attributes: { [key: string]: number } }[] = [];
  private clusters: { id: number; name: string; cluster: number }[] = [];
  private euclideanCalculatorService = inject(EuclideanCalculatorService);
  private unsubscribe = new Subject<void>();
  private selectedPreferences = [];

  // Implement the K-means clustering algorithm
  public cluster(nodes: Nodes[], k: number, preferences: []) {
    this.nodes = nodes;
    this.k = k;
    this.selectedPreferences = preferences;
    // 1. Initialize centroids
    this.centroids = this.initializeCentroids(this.k);
    // console.log('Initial centroids:', this.centroids);
    // 2. Iterate until convergence or maximum iterations reached
    for (let i = 0; i < this.maxIterations; i++) {
      // console.log('Iteration:', i);
      // 2.1 Assign nodes to clusters/
      this.clusters = this.assignNodesToClusters();
      // console.log('Clusters after assignment:', this.clusters);
      // 2.2 Update centroids
      this.updateCentroids();
      // console.log('Centroids after update:', this.centroids);
      // 2.3 Check for convergence
      if (this.checkConvergence()) {
        console.log('Convergence reached!');
        break;
      }
    }
  }

  public getClusters(): { id: number; cluster: number }[] {
    // console.info('clusters');
    console.table(this.clusters);
    return this.clusters;
  }

  private initializeCentroids(k: number): { id: string; attributes: { [key: string]: number } }[] {
    // Choose k random nodes as initial centroids
    const randomIndices = this.getRandomIndices(k);
    // console.log('Random indices:', randomIndices);
    const nodePeople = this.nodes.filter((node) => node.type === NodeType.PERSON);
    return randomIndices.map((index) => {
      const node = nodePeople[index];
      return { id: node.id.toString(), attributes: node.attributes };
    });
  }

  private getRandomIndices(k: number): number[] {
    const indices: number[] = [];
    const nodePeople = this.nodes.filter((node) => node.type === NodeType.PERSON);
    while (indices.length < k) {
      let randomIndex = Math.floor(Math.random() * nodePeople.length);
      // Ensure that index 0 is not included
      if (randomIndex === 0) {
        randomIndex = (randomIndex + 1) % nodePeople.length;
      }
      if (!indices.includes(randomIndex)) {
        indices.push(randomIndex);
      }
    }
    return indices;
  }

  private assignNodesToClusters(): { id: number; name: string; cluster: number }[] {
    const clusters: { id: number; name: string; cluster: number }[] = [];
    this.nodes
      // added the below line for clustering only the people
      .filter((people) => people.type === NodeType.PERSON)
      .forEach((node) => {
        const closestCentroidIndex = this.findClosestToCentroid(node);
        clusters.push({ id: node.id, name: node.name, cluster: closestCentroidIndex });
      });
    return clusters;
  }

  private findClosestToCentroid(node): number {
    let closestCentroidIndex = 0;
    let minDistance = Infinity;
    this.centroids.forEach((centroid, index) => {
      const distance = this.euclideanCalculatorService.calculateEuclideanDistanceCentroid(node, {
        id: parseInt(centroid.id),
        attributes: centroid.attributes,
      });
      if (distance < minDistance) {
        minDistance = distance;
        closestCentroidIndex = index;
      }
    });
    return closestCentroidIndex;
  }

  private updateCentroids() {
    this.centroids = new Array(Math.round(this.k)).fill(null).map((_, clusterIndex) => {
      // Get all nodes assigned to this cluster
      const nodesInCluster = this.clusters
        .filter((c) => c.cluster === clusterIndex)
        .map((c) => this.nodes.find((n) => n.id === c.id))
        .filter((node): node is (typeof this.nodes)[0] => node !== undefined);

      if (nodesInCluster.length === 0) {
        console.warn(`No nodes in cluster ${clusterIndex}`);
        return { id: clusterIndex.toString(), attributes: {} };
      }

      // Calculate the sum of each attribute for nodes in this cluster
      const attributesSum = personQualities.reduce(
        (acc, key) => {
          acc[key] = nodesInCluster.reduce((sum, node) => sum + (node.attributes[key] || 0), 0);
          return acc;
        },
        {} as { [key: string]: number },
      );

      // Calculate the mean for each attribute (sum divided by the number of nodes)
      const attributesMean = Object.keys(attributesSum).reduce(
        (acc, key) => {
          acc[key] = attributesSum[key] / nodesInCluster.length;
          return acc;
        },
        {} as { [key: string]: number },
      );

      return { id: clusterIndex.toString(), attributes: attributesMean };
    });
  }

  private checkConvergence(): boolean {
    // Check if any node changed cluster assignments
    const previousClusters = this.clusters;
    this.clusters = this.assignNodesToClusters();
    return previousClusters.every((previousCluster, index) => previousCluster.cluster === this.clusters[index].cluster);
  }
}
