import { Component, inject, OnInit } from '@angular/core';
import { BreakpointService } from '../../services/breakpoint.service';

@Component({
  selector: 'app-home-dashboard',
  templateUrl: './home-dashboard.component.html',
  styleUrl: './home-dashboard.component.scss',
})
export class HomeDashboardComponent implements OnInit {
  total_cols: number = 4;
  col: number = 2;
  row: number = 2;
  panelOpenState = false;
  private breakpointService = inject(BreakpointService);

  ngOnInit() {
    this.breakpointService.proportion.subscribe((proportion) => {
      if (proportion >= 0.7) {
        this.total_cols = 4;
        this.col = 2;
      } else {
        this.total_cols = 1;
        this.col = 1;
      }
    });
  }
}
