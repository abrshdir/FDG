import { NgModule } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { MeasureInfoComponent } from './measure-info/measure-info.component';
import { AttributeSelectorComponent } from './attribute-selector/attribute-selector.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PeopleAttributesComponent } from './people_attributes/people-attributes.component';
import { MaterialModule } from '../../material/material.module';
import { PersonPreferencesComponent } from './person-preferences/person-preferences.component';

@NgModule({
  declarations: [MeasureInfoComponent, AttributeSelectorComponent, PeopleAttributesComponent, PersonPreferencesComponent],
  imports: [CommonModule, ReactiveFormsModule, MaterialModule, TitleCasePipe, FormsModule],
  exports: [MeasureInfoComponent, AttributeSelectorComponent, PeopleAttributesComponent, PersonPreferencesComponent],
})
export class AllConfigsModule {}
