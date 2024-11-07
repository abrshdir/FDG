import { AfterViewInit, Component, inject, OnDestroy, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Person2 } from '../../../interfaces';
import { FormConfigService } from '../../../services/form-config.service';
import { Subject, takeUntil } from 'rxjs';
import { personQualities } from '../../../data/constants';

@Component({
  selector: 'app-people-preference',
  templateUrl: './people-attributes.component.html',
  styleUrl: './people-attributes.component.scss',
})
export class PeopleAttributesComponent implements AfterViewInit, OnDestroy {
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  displayedColumns: string[] = [];
  dataSource: MatTableDataSource<Person2>;
  protected personQualities: string[] = personQualities;
  private formConfigService = inject(FormConfigService);
  private unsubscribe = new Subject<void>();
  private selectedAttributes: {} = {};
  private people: Person2[] = [];
  private selectedAttribute: string[];
  constructor() {
    this.getAttributes();
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  getAttributes() {
    this.formConfigService.dataSource$
      .pipe(takeUntil(this.unsubscribe)) // Complete the subscription when component gets destroyed
      .subscribe((people) => {
        this.dataSource = new MatTableDataSource(people);
        // To avoid Empty columns after attribute selection ignores certain columns
        this.selectedAttribute = people ? this.formConfigService.attributesForm.get('attributes').value : [];
        this.personQualities = this.selectedAttribute;
        this.displayedColumns = ['name', 'id', ...this.selectedAttribute];
        this.dataSource.sort = this.sort;
        this.dataSource.paginator = this.paginator;
      });
  }
  updatePerson(person: Person2): void {
    // Update the data source with the modified person
    const index = this.dataSource.data.findIndex((p) => p.id === person.id);
    if (index !== -1) {
      for (const attr in person.attributes) {
        if (person.attributes[attr] == null) {
          delete person.attributes[attr];
        }
      }
      this.dataSource.data[index] = person;
      this.formConfigService.dataForAttributes = this.dataSource.data;
    }
  }
  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }
}
