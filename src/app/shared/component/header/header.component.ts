import { Component, Input } from '@angular/core';
import { IonButtons, IonHeader, IonTitle, IonToolbar, PopoverController } from "@ionic/angular/standalone";

import { RouterModule } from '@angular/router';
import { UserComponent } from '../../user/user.component';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [RouterModule, UserComponent, RouterModule, IonButtons, IonTitle, IonToolbar, IonHeader]
})
export class HeaderComponent {

  @Input()
  title: string = "Welcome";

  constructor(public popoverController: PopoverController) { }




}

