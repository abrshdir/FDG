import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class EuclideanCalculatorService {
  constructor() {}

  public calculateEuclideanDistance(attributesA: { [key: string]: number }, attributesB: { [key: string]: number }): number {
    const traits = Object.keys(attributesA);
    let squaredDistanceSum = 0;

    traits.forEach((trait) => {
      const valueA = attributesA[trait];
      const valueB = attributesB[trait];

      if (valueB != undefined) {
        const diff = valueA - valueB;
        squaredDistanceSum += diff * diff;
      }
      // If either value is undefined, skip this trait
    });

    return Math.sqrt(squaredDistanceSum);
  }

  public calculateEuclideanDistanceCentroid(personNode, centroidAttributes): number {
    const traits = Object.keys(personNode.attributes);
    let squaredDistanceSum = 0;

    traits.forEach((trait, index) => {
      const diff = personNode.attributes[trait] - centroidAttributes.attributes[trait];
      squaredDistanceSum += diff * diff;
    });

    return Math.sqrt(squaredDistanceSum);
  }

  // Function to calculate weighted Euclidean distance
  public calculateWeightedDistance(preferences, personAttributes: { [key: string]: number }): number {
    const traits = Object.keys(preferences);
    let squaredDistanceSum = 0;

    traits.forEach((trait) => {
      const pref = preferences[trait];
      let distance = 0;

      if (personAttributes[trait] == undefined) {
        return;
      }

      switch (pref.sign) {
        case 'greater':
          distance = personAttributes[trait] > pref.value ? 0 : Math.abs(personAttributes[trait] - pref.value);
          break;
        case 'lesser':
          distance = personAttributes[trait] < pref.value ? 0 : Math.abs(personAttributes[trait] - pref.value);
          break;
        case 'exact':
          distance = personAttributes[trait] === pref.value ? 0 : 1; // Fixed non-weighted penalty for mismatch
          break;
        case 'closer':
        default:
          distance = Math.abs(personAttributes[trait] - pref.value);
          break;
      }

      squaredDistanceSum += distance * distance;
    });

    return Math.sqrt(squaredDistanceSum);
  }
}
