import { StorageService } from "../services/firestore/storage.service";

export function generateAlphaNumCode(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';

  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return code;
}

export function isAnswerFontUrl(answer: string): boolean {
  return /^https?:\/\/.+/.test(answer);
}


export async function loadFontFromUrl(cssUrl: string): Promise<string> {
  const linkElement = document.getElementById('dynamic-font-css') as HTMLLinkElement;
  if (linkElement) {
    linkElement.href = cssUrl;
  }

  try {


    const response = await fetch(cssUrl);
    const cssText = await response.text();

    const match = cssText.match(/@font-face\s*{[^}]*}/g);
    const chosenBlock = match?.find(block => block.includes("U+0000-00FF")) ?? match?.[0];
    const fontNameMatch = chosenBlock?.match(/font-family:\s*['"]?([^;'"]+)['"]?/);
    return fontNameMatch?.[1] ?? extractFontFamilyFromUrl(cssUrl);

  } catch (err) {
    return extractFontFamilyFromUrl(cssUrl)
  }


  function extractFontFamilyFromUrl(url: string): string {
    const matches = url.match(/family=([^&]*)/g);
    if (!matches) return '';

    return matches.map(fam => {
      const raw = fam.replace("family=", "");
      return raw.split(":")[0].replace(/\+/g, " ").trim();
    })[0];
  }

}

export async function loadFontFromFirebase(name: string): Promise<string> {
  console.log("trying to load", name)
  const encodedName = encodeURIComponent(name);
  const fontUrl = StorageService.BASE_STORAGE_URL + encodedName + '?alt=media';
  console.log(fontUrl)
  const fontFamily = "CUSTOM_FONT_TESTER"; // Remove extension
  console.log(fontFamily)

  const style = document.createElement('style');
  style.id = 'dynamic-font-style';
  style.innerText = `
    @font-face {
      font-family: '${fontFamily}';
      src: url('${fontUrl}');
    }
  `;
  document.head.appendChild(style);

  return fontFamily;
}


export function sanitizeFileName(fileName: string): string {
  const lastDotIndex = fileName.lastIndexOf('.');
  if (lastDotIndex === -1) return fileName.replace(/\./g, '');

  const name = fileName.substring(0, lastDotIndex).replace(/\./g, '');
  const ext = fileName.substring(lastDotIndex + 1);
  return `${name}.${ext}`;
}
