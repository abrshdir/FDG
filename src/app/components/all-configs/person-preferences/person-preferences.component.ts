import { AfterViewInit, Component, inject, OnDestroy, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Person2 } from '../../../interfaces';
import { PreferenceTable } from '../../../interfaces/preference-table.interface';
import { FormGroup } from '@angular/forms';
import { FormConfigService } from '../../../services/form-config.service';
import { Subject, takeUntil } from 'rxjs';
import { Sign } from '../../../enums';

@Component({
  selector: 'app-person-attribute',
  templateUrl: './person-preferences.component.html',
  styleUrl: './person-preferences.component.scss',
})
export class PersonPreferencesComponent implements AfterViewInit, OnDestroy {
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  preferenceColumns: string[] = ['name', 'value', 'sign'];
  selectedSource: MatTableDataSource<PreferenceTable>;
  selectedPerson: Person2;
  graphForm: FormGroup;
  signs: string[] = [Sign.CLOSER, Sign.EXACT, Sign.GREATER, Sign.LESSER];
  attributesForm: FormGroup;
  private formConfigService = inject(FormConfigService);
  private unsubscribe = new Subject<void>();

  constructor() {
    this.graphForm = this.formConfigService.graphForm;
    this.attributesForm = this.formConfigService.attributesForm;
    this.getSelectedSource();
    this.getPerson();
  }

  ngAfterViewInit() {
    this.selectedSource.sort = this.sort;
    this.selectedSource.paginator = this.paginator;
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  // Returns the current selected person and its properties.
  getPerson() {
    return this.formConfigService.selectedPerson$.subscribe((person) => {
      this.selectedPerson = person;
    });
  }

  // Populates the table and destroys the observable accordingly
  getSelectedSource() {
    return this.formConfigService.selectedPreferences$.subscribe((res) => {
      this.selectedSource = new MatTableDataSource(res);
      this.selectedSource.sort = this.sort;
    });
  }

  // Update the data source with the modified preference
  updatePreference(preference: PreferenceTable): void {
    const index = this.selectedSource.data.findIndex((p) => p.name === preference.name);
    if (index !== -1) {
      this.selectedSource.data[index] = preference;
      this.formConfigService.dataForPreferences = this.selectedSource.data;
    }
  }
}
