import { Component, inject, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatSort } from '@angular/material/sort';
import { ChartDataService } from 'src/app/services/chart-data.service';
import { FormConfigService } from '../../services/form-config.service';

@Component({
  selector: 'app-form-configuration',
  templateUrl: './form-configuration.component.html',
  styleUrl: './form-configuration.component.scss',
})
export class FormConfigurationComponent implements OnChanges {
  @ViewChild(MatSort) sort: MatSort;
  private chartDataService = inject(ChartDataService);
  private formConfigService = inject(FormConfigService);

  graphForm: FormGroup;
  constructor() {
    this.graphForm = this.formConfigService.graphForm;
    this.submitForm();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['inputProperty']) {
      // React to inputProperty changes
      console.log(changes, 'changes------------------');
    }
  }

  get persons() {
    return this.chartDataService.persons2Subject.value;
  }

  submitForm() {
    this.formConfigService.submitForm();
  }
}
