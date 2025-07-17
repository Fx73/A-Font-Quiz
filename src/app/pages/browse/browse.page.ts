import { Component, OnInit } from '@angular/core';
import { InfiniteScrollCustomEvent, IonButton, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonContent, IonInfiniteScroll, IonInfiniteScrollContent, IonInput, IonItem, IonLabel, IonList, IonMenu, IonSearchbar, IonSelect, IonSelectOption, IonSplitPane, IonTextarea, IonToggle } from '@ionic/angular/standalone';
import { loadFontFromFirebase, loadFontFromUrl } from 'src/app/shared/util';

import { AppComponent } from 'src/app/app.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from "src/app/shared/component/header/header.component";
import { ItemFirestoreService } from 'src/app/services/firestore/item.firestore.service';
import { StorageService } from './../../services/firestore/storage.service';
import { TriviaItemDTO } from 'src/app/shared/DTO/trivia-item.dto';
import { UserConfigService } from 'src/app/services/userconfig.service';
import { UserFirestoreService } from './../../services/firestore/user.firestore.service';

@Component({
  selector: 'app-browse',
  templateUrl: './browse.page.html',
  styleUrls: ['./browse.page.scss'],
  standalone: true,
  imports: [IonToggle, IonLabel, IonItem, IonTextarea, IonButton, IonSplitPane, IonCardSubtitle, IonMenu, IonCardContent, IonCardTitle, IonInfiniteScrollContent, IonInfiniteScroll, IonSearchbar, IonSelect, IonSelectOption, IonCard, IonCardHeader, IonInput, IonContent, CommonModule, FormsModule, HeaderComponent]
})
export class BrowsePage implements OnInit {
  searchQuery: string = ''

  items: TriviaItemDTO[] = []
  categoryList: string[] = []
  ownerNameList: Map<string, string> = new Map()

  selectedItem: TriviaItemDTO | null = null
  showNewCategory = false


  userId: string | undefined

  customFontName = 'CUSTOM_FONT_NAME';

  constructor(private itemFirestoreService: ItemFirestoreService, private userFirestoreService: UserFirestoreService, private storageService: StorageService, private userConfigService: UserConfigService) {
    this.userId = userFirestoreService.getUserData()?.id
  }

  ngOnInit() {
    this.itemFirestoreService.getCategories().then(value => this.categoryList = value);
    this.updateItems(null, true);

  }

  async updateItems(lastItemId: string | null, resetList = false) {
    const newItems: TriviaItemDTO[] = await this.itemFirestoreService.GetAllItems(lastItemId, this.searchQuery);

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
  }



  onAddNewItem() {
    this.selectedItem = new TriviaItemDTO();
  }

  onCategorySelect() {
    if (!this.selectedItem) return

    if (this.selectedItem.category === '__custom_new_category__') {
      this.selectedItem.category = ''
      this.showNewCategory = true
    } else {
      this.showNewCategory = false
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

  onAddNewItem() {
    this.selectedItem = new TriviaItemDTO();
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

    this.resetSelectedItem()
  }

  onSaveItem() {
    if (!this.selectedItem || !this.selectedItem.owner || this.selectedItem.owner !== this.userId) return
    this.itemFirestoreService.updateItem(this.selectedItem)

  }
  async onRemoveItem() {
    if (!this.selectedItem || !this.selectedItem.owner || this.selectedItem.owner !== this.userId) return
    await this.itemFirestoreService.deleteItem(this.selectedItem.id)

    this.items = this.items.filter(item => item.id !== this.selectedItem?.id);
    this.resetSelectedItem()
  }

  async select(item: TriviaItemDTO) {
    if (this.selectedItem?.id === item.id) {
      this.resetSelectedItem()
      return;
    }

    this.selectedItem = item;
    this.selectedCategoryChoice = item.category ?? null
    if (this.selectedCategoryChoice) {
      this.itemFirestoreService.getSubcategories(this.selectedCategoryChoice).then(value => this.subcategoryList = value)
      this.selectedSubcategoryChoice = item.subcategory ?? null
    }
    if (item.isLink)
      this.customFontName = await loadFontFromUrl(this.selectedItem!.question)
    else
      this.customFontName = await loadFontFromFirebase(this.selectedItem!.question)

  }


  onSearch(event: any) {
    this.searchQuery = event.target.value.toLowerCase();
    this.updateItems(null, true)
  }

  onIonInfinite(event: InfiniteScrollCustomEvent) {
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

  private resetSelectedItem() {
    this.selectedItem = null
    this.selectedCategoryChoice = null
    this.selectedSubcategoryChoice = null
    this.subcategoryList = []
  }

}
