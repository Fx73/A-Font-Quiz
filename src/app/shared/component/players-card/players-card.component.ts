import { Component, EventEmitter, Input, OnInit, Output, input } from '@angular/core';
import { IonBadge, IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonIcon, IonItem, IonList } from "@ionic/angular/standalone";
import { checkmarkCircle, closeCircle, removeOutline, star } from 'ionicons/icons';

import { Player } from 'src/app/shared/DTO/player';
import { addIcons } from 'ionicons';

@Component({
  selector: 'app-players-card',
  templateUrl: './players-card.component.html',
  styleUrls: ['./players-card.component.scss'],
  standalone: true,
  imports: [IonCardTitle, IonCardHeader, IonButton, IonBadge, IonIcon, IonItem, IonCardContent, IonList, IonCard,],
})

export class PlayersCardComponent {
  @Input()
  ownerId!: string | null

  @Input()
  players!: Player[]

  @Input()
  isCurrentlyOwner = false

  @Output() eventKickPlayer = new EventEmitter<string>();



  constructor() {
    addIcons({ star, removeOutline, closeCircle, checkmarkCircle });

  }

  getPlayerStatusClass(player: Player): string {
    const lastSeen = player.lastTimeSeen?.toDate?.();
    if (!lastSeen) return 'active';

    const now = Date.now();
    const diff = now - lastSeen.getTime();

    if (diff <= 20000) return 'active';
    if (diff <= 40000) return 'warning';
    return 'inactive';
  }

  getBadgeIcon(order: number): string {
    switch (order) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return order.toString();
    }
  }

  kickPlayer(playerId: string) {
    this.eventKickPlayer.emit(playerId);
  }


}
