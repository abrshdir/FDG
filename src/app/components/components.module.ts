import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ForceGraphComponent } from './force-graph/force-graph.component';
import { FormConfigurationComponent } from './form-configuration/form-configuration.component';
import { MaterialModule } from '../material/material.module';
import { HomeDashboardComponent } from './home-dashboard/home-dashboard.component';
import { AllConfigsModule } from './all-configs/all-configs.module';

@NgModule({
  declarations: [ForceGraphComponent, FormConfigurationComponent, HomeDashboardComponent],
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MaterialModule, AllConfigsModule],
  exports: [ForceGraphComponent, FormConfigurationComponent, HomeDashboardComponent],
})
export class ComponentsModule {}
