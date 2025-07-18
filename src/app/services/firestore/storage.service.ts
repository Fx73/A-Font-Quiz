import { deleteObject, getMetadata, getStorage, ref, uploadBytesResumable } from 'firebase/storage';

import { AppComponent } from 'src/app/app.component';
import { Injectable } from '@angular/core';
import { ItemFirestoreService } from './item.firestore.service';
import { getDownloadURL } from 'firebase/storage';
import { sanitizeFileName } from 'src/app/shared/util';

@Injectable({
    providedIn: 'root'
})
export class StorageService {
    public static readonly BASE_STORAGE_URL = 'https://firebasestorage.googleapis.com/v0/b/afontquiz.firebasestorage.app/o/';

    private storage = getStorage();

    constructor(private itemService: ItemFirestoreService) { }

    async uploadFont(file: File): Promise<string | null> {
        const fileName = sanitizeFileName(file.name)
        const fileRef = ref(this.storage, fileName);
        try {
            const existingURL = await getDownloadURL(fileRef);
            AppComponent.presentOkToast('File already exists. Using existing version.');
            return fileName;
        } catch (error: any) {
            if (error.code !== 'storage/object-not-found') {
                AppComponent.presentErrorToast('Database error: ' + error.message);
                return null;
            }
        }

        const metadata = {
            contentType: file.type,
            cacheControl: 'public,max-age=31536000,immutable'
        };

        return new Promise((resolve, reject) => {
            const uploadTask = uploadBytesResumable(fileRef, file, metadata);

            uploadTask.on('state_changed',
                () => { },
                err => {
                    AppComponent.presentErrorToast('Upload error: ' + err.message);
                    resolve(null);
                },
                async () => {
                    AppComponent.presentOkToast('Font uploaded successfully!');
                    resolve(fileName);
                }
            );
        });
    }



    async deleteFont(fontName: string): Promise<boolean> {
        try {
            const isUsed = await this.itemService.isFontUsed(fontName);
            if (isUsed) {
                AppComponent.presentWarningToast('Font is still in use. Will not delete.');
                return false;
            }

            const fileRef = ref(this.storage, fontName);

            await deleteObject(fileRef);
            AppComponent.presentOkToast('Font deleted successfully.');
            return true;

        } catch (err: any) {
            AppComponent.presentErrorToast('Error deleting font: ' + err.message);
            return false;
        }

    }

}
