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