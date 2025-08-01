import { Component, OnInit } from '@angular/core';
import { InfiniteScrollCustomEvent, IonButton, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonContent, IonIcon, IonInput, IonItem, IonLabel, IonMenu, IonSearchbar, IonSelect, IonSelectOption, IonSpinner, IonSplitPane, IonTextarea, IonToggle, MenuController } from '@ionic/angular/standalone';
import { loadFontFromFirebase, loadFontFromUrl } from 'src/app/shared/util';

import { AppComponent } from 'src/app/app.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from "src/app/shared/component/header/header.component";
import { ItemFirestoreService } from 'src/app/services/firestore/item.firestore.service';
import { StorageService } from './../../services/firestore/storage.service';
import { TriviaItemDTO } from 'src/app/shared/DTO/trivia-item.dto';
import { UserFirestoreService } from './../../services/firestore/user.firestore.service';
import { addCircleOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';

@Component({
  selector: 'app-browse',
  templateUrl: './browse.page.html',
  styleUrls: ['./browse.page.scss'],
  standalone: true,
  imports: [IonSpinner, IonToggle, IonIcon, IonLabel, IonItem, IonTextarea, IonButton, IonSplitPane, IonCardSubtitle, IonMenu, IonCardContent, IonCardTitle, IonSearchbar, IonSelect, IonSelectOption, IonCard, IonCardHeader, IonInput, IonContent, CommonModule, FormsModule, HeaderComponent]
})
export class BrowsePage implements OnInit {
  searchQuery: string = ''
  categoryQuery: string[] = []
  isLoadingItems: Boolean = false

  items: TriviaItemDTO[] = []
  categoryList: string[] = []
  ownerNameList: Map<string, string> = new Map()

  selectedItem: TriviaItemDTO | null = null
  showNewCategory = false


  userId: string | undefined

  customFontName = 'CUSTOM_FONT_NAME';

  constructor(private itemFirestoreService: ItemFirestoreService, private userFirestoreService: UserFirestoreService, private storageService: StorageService, private menu: MenuController) {
    addIcons({ addCircleOutline });
    this.userId = userFirestoreService.getUserData()?.id
  }

  ngOnInit() {
    this.itemFirestoreService.getCategories().then(value => this.categoryList = value);
    this.updateItems(null, true);

  }

  async updateItems(lastItemId: string | null, resetList = false) {
    if (this.isLoadingItems)
      return;
    this.isLoadingItems = true

    const newItems: TriviaItemDTO[] = await this.itemFirestoreService.GetAllItems(lastItemId, this.categoryQuery, this.searchQuery);

    if (resetList)
      this.items = newItems
    else
      this.items = this.items.concat(newItems)

    const ownerIds = Array.from(new Set(
      this.items.map(item => item.owner).filter(id => id !== undefined)
    )) as string[];

    const missingIds = ownerIds.filter(id => !this.ownerNameList.has(id));
    if (missingIds.length > 0) {
      const freshMap = await this.userFirestoreService.getUserNameMap(missingIds);
      freshMap.forEach((name, id) => {
        this.ownerNameList.set(id, name);
      });
    }

    this.isLoadingItems = false
  }



  onAddNewItem() {
    this.selectedItem = new TriviaItemDTO();
    this.openMenu()
  }

  onSelectItem(item: TriviaItemDTO) {
    if (this.selectedItem?.id === item.id) {
      this.selectedItem = null;
      return;
    }
    this.selectedItem = item;

    if (item.isLink)
      loadFontFromUrl(this.selectedItem!.question).then(cfn => this.customFontName = cfn)
    else
      loadFontFromFirebase(this.selectedItem!.question).then(cfn => this.customFontName = cfn)


    this.openMenu()
  }

  onCategorySelect() {
    if (!this.selectedItem) return

    if (this.selectedItem.category === '__custom_new_category__') {
      this.selectedItem.category = ''
      this.showNewCategory = true
    } else {
      this.showNewCategory = false
    }
  }

  onLinkToggle(checked: boolean) {
    if (!this.selectedItem) return
    if (this.selectedItem.isLink) {
      this.selectedItem.question = ''
      this.selectedItem.isLink = false
    } else {
      if (this.selectedItem.question)
        return
      this.selectedItem.isLink = true
    }
  }


  async onCategoryAdd() {
    if (!this.selectedItem) return
    const valid = await this.itemFirestoreService.addCategory(this.selectedItem?.category)
    if (valid) {
      this.categoryList.push(this.selectedItem?.category)
      this.showNewCategory = false
    }
  }

  async onUploadItem() {
    if (!this.selectedItem) return
    const errors = this.selectedItem.validate()
    if (Object.keys(errors).length > 0) {
      const message = Object.values(errors).join(' | ');
      AppComponent.presentErrorToast(message);
      return
    }

    await this.itemFirestoreService.uploadItem(this.selectedItem)

    this.items.push(this.selectedItem);
    const newCategory = this.selectedItem.category;
    if (newCategory && !this.categoryList.includes(newCategory))
      this.categoryList.push(newCategory);

    this.selectedItem = null
  }

  onSaveItem() {
    if (!this.selectedItem || !this.selectedItem.owner || this.selectedItem.owner !== this.userId) return
    this.itemFirestoreService.updateItem(this.selectedItem)

  }
  async onRemoveItem() {
    if (!this.selectedItem || !this.selectedItem.owner || this.selectedItem.owner !== this.userId) return
    await this.itemFirestoreService.deleteItem(this.selectedItem.id)

    this.items = this.items.filter(item => item.id !== this.selectedItem?.id);
    this.selectedItem = null
  }

  onSearch(event: any) {
    this.searchQuery = event.target.value.toLowerCase();
    this.updateItems(null, true)
  }

  onSearchCategory(categories: string[]) {
    if (categories.length > 10) {
      AppComponent.presentErrorToast("Cannot have more than 10 categories")
    }
    this.updateItems(null, true)
  }

  onScroll(event: any) {
    const threshold = 100; // marge avant la fin
    const position = event.target.scrollTop + event.target.offsetHeight;
    const height = event.target.scrollHeight;

    if (position > height - threshold) {
      this.onIonInfinite(null!)

    }
  }

  onIonInfinite(event: InfiniteScrollCustomEvent) {
    console.log("POUT")
    this.updateItems(this.items.at(-1)?.id ?? null)
  }

  selectFontFile() {
    if (!this.selectedItem) return
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.woff,.woff2,.ttf,.otf';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (file) {
        try {
          const name = await this.storageService.uploadFont(file);
          if (name) {
            this.selectedItem!.question = name
            this.selectedItem!.isLink = false;
            AppComponent.presentOkToast('Font uploaded successfully!');
            this.customFontName = await loadFontFromFirebase(this.selectedItem!.question)
          }
        } catch (err) {
          AppComponent.presentErrorToast('Upload failed');
        }
      }
    };


    input.click();
  }

  async deleteUploadedFont() {
    if (!this.selectedItem) return
    const success = await this.storageService.deleteFont(this.selectedItem.question);
    if (success) {
      this.selectedItem.question = '';
      this.selectedItem.isLink = true;
      AppComponent.presentWarningToast('Font reference removed.');
    }
  }

  openMenu() {
    this.menu.enable(true)
    this.menu.open();
  }
}
