import { Component, inject } from '@angular/core';
import { personQualities } from '../../../data/constants';
import { FormGroup } from '@angular/forms';
import { FormConfigService } from '../../../services/form-config.service';

@Component({
  selector: 'app-attribute-selector',
  templateUrl: './attribute-selector.component.html',
  styleUrl: './attribute-selector.component.scss',
})
export class AttributeSelectorComponent {
  attributesForm: FormGroup;
  graphForm: FormGroup;
  qualities: string[] = personQualities;
  selectedAttributes: Set<string> = new Set<string>();
  private formConfigService = inject(FormConfigService);
  constructor() {
    this.graphForm = this.formConfigService.graphForm;
    this.attributesForm = this.formConfigService.attributesForm;
    this.selectedAttributes = new Set(this.qualities);
    this.formConfigService.initializeForms();
  }

  submitForm() {
    this.formConfigService.submitForm();
  }

  // toggles between chip selection
  toggleSelection(item: string): void {
    if (this.selectedAttributes.has(item)) {
      this.selectedAttributes.delete(item);
    } else {
      this.selectedAttributes.add(item);
    }
    this.updateSelectedArray();
  }

  // returns if the selected chip is in the list or not
  isSelected(item: string): boolean {
    return this.selectedAttributes.has(item);
  }

  // Updates the attributes array of strings in the form on every toggle but doesnt actually update the view
  private updateSelectedArray(): void {
    this.formConfigService.attributesForm.get('attributes').setValue(Array.from(this.selectedAttributes));
  }
}
