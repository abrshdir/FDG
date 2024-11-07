import { inject, Injectable } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ChartDataService } from './chart-data.service';
import { PreferenceTable } from '../interfaces/preference-table.interface';
import { BehaviorSubject, Subject } from 'rxjs';
import { Person2 } from '../interfaces';

@Injectable({
  providedIn: 'root',
})
export class FormConfigService {
  initialPersonsNumber: number = 4;
  graphForm: FormGroup;
  attributesForm: FormGroup;
  public dataForAttributes: Person2[] = [];
  public dataForPreferences = [];
  public dataSourceSubject = new BehaviorSubject<Person2[]>(null);
  dataSource$ = this.dataSourceSubject.asObservable();
  public selectedPersonSubject = new BehaviorSubject<Person2 | null>(null);
  selectedPerson$ = this.selectedPersonSubject.asObservable();
  public selectedPreferencesSubject = new BehaviorSubject<PreferenceTable[]>([]);
  selectedPreferences$ = this.selectedPreferencesSubject.asObservable();
  private selectedPreferences: PreferenceTable[] = [];
  private chartDataService = inject(ChartDataService);
  private fb = inject(FormBuilder);

  constructor() {
    this.initializeForms();
  }

  get persons() {
    return this.chartDataService.persons2Subject.value;
  }

  set persons(people) {
    this.chartDataService.persons2Subject.next(people);
  }

  initializeForms() {
    this.graphForm = this.fb.group({
      nodeGroupAmount: ['', [Validators.required, Validators.min(2), Validators.max(50)]],
      idPersonSelected: ['', [Validators.required]],
      personsDistanceProportion: ['', [Validators.required, Validators.min(0), Validators.max(5)]],
      attributesDistanceProportion: ['', [Validators.required, Validators.min(0), Validators.max(1)]],
      opacityAura: ['', [Validators.required, Validators.min(0), Validators.max(1)]],
      percentDefinedAttributes: ['', [Validators.required, Validators.min(10), Validators.max(100)]],
      strengthGraph: ['', [Validators.required, Validators.min(5), Validators.max(100)]],
      maxAuraRadio: ['', [Validators.required, Validators.min(20), Validators.max(250)]],
      valueAttributeNode: ['', [Validators.required, Validators.min(4), Validators.max(10)]],
      fullColorAttributeNodes: ['', [Validators.required]],
      showNames: ['', [Validators.required]],
      stiffness: ['', [Validators.required, Validators.min(1), Validators.max(20)]],
    });

    this.attributesForm = this.fb.group({
      attributes: [[]],
    });

    const attributesSelected = this.chartDataService.attributesSelected.value;
    this.attributesForm.patchValue({ attributes: attributesSelected });
    const percentDefinedAttributes = this.chartDataService.percentDefinedAttributes;
    this.chartDataService.addPerson(this.initialPersonsNumber, percentDefinedAttributes, attributesSelected);
    this.graphForm.get('nodeGroupAmount').setValue(this.initialPersonsNumber);
    this.graphForm.patchValue({ ...this.chartDataService.graphConfiguration.value });
  }

  submitForm() {
    if (this.graphForm.invalid) return;
    const attributes = this.attributesForm.get('attributes').value as string[];
    this.chartDataService.personQualities = attributes;
    if (attributes.length < 3) {
      return;
    }
    const {
      nodeGroupAmount,
      idPersonSelected,
      personsDistanceProportion,
      attributesDistanceProportion,
      opacityAura,
      percentDefinedAttributes,
      strengthGraph,
      maxAuraRadio,
      valueAttributeNode,
      fullColorAttributeNodes,
      showNames,
      stiffness,
    } = this.graphForm.value;

    this.chartDataService.addPerson(nodeGroupAmount, percentDefinedAttributes, attributes);

    this.chartDataService.graphConfiguration.next({
      idPersonSelected,
      personsDistanceProportion,
      attributesDistanceProportion,
      opacityAura,
      percentDefinedAttributes,
      strengthGraph,
      maxAuraRadio,
      valueAttributeNode,
      fullColorAttributeNodes,
      showNames,
      stiffness,
    });

    if (this.dataForPreferences.length > 0) {
      this.dataForPreferences.forEach((each) => {
        const selectedPerson = this.persons.find((p) => p.id === this.chartDataService.idPersonSelected);
        for (const key in each) {
          if (selectedPerson.preferences[each[key]]) {
            selectedPerson.preferences[each[key]].value = each.value;
            selectedPerson.preferences[each[key]].sign = each.sign;
          }
          // Update the persons array by mapping the new selected person
          this.persons = this.persons.map((p) => (p.id === selectedPerson.id ? JSON.parse(JSON.stringify(selectedPerson)) : p));
        }
      });
    }

    // tamper free attribute data except the editable fields
    if (this.dataForAttributes.length) {
      this.dataForAttributes.forEach((person) => {
        for (const attr in person.attributes) {
          if (person.attributes[attr] == null) {
            delete person.attributes[attr];
          }
        }
        this.persons.map((eachPerson) => {
          if (eachPerson.id === person.id) {
            eachPerson.attributes = person.attributes;
          }
        });
      });
    }

    this.dataSourceSubject.next(this.persons);

    this.selectedPreferences = [];

    const selectedPerson = this.persons.find((p) => p.id === this.chartDataService.idPersonSelected);
    this.selectedPersonSubject.next(selectedPerson);

    for (let i = 0; i < Object.keys(selectedPerson.preferences).length; i++) {
      this.selectedPreferences.push({
        name: Object.keys(selectedPerson.preferences)[i],
        value: selectedPerson.preferences[Object.keys(selectedPerson.preferences)[i]].value,
        sign: selectedPerson.preferences[Object.keys(selectedPerson.preferences)[i]].sign,
      });
    }
    this.selectedPreferencesSubject.next([]);
    this.selectedPreferencesSubject.next(this.selectedPreferences);
  }
}
