const fs = require('fs');
const translate = require('translate');
const path = require('path');

const root = path.resolve(__dirname, '..');
const englishFilePath = path.join(root, 'public/_locales/en/messages.json');
const englishFile = require(englishFilePath);

async function translateFile(code: string) {
  let newFile: any = {};
  for (const key in englishFile) {
    const item = englishFile[key];
    let newItem = Object.assign({}, item);
    const newMessage = await translateSegment(item.message, code);
    newItem.message = newMessage;
    newFile[key] = newItem;
  }
  const filePath = path.join(root, 'utility/tmp-messages.json');
  fs.writeFileSync(filePath, JSON.stringify(newFile, null, 2));
}

async function translateWithDiff(fileName: string, code: string, replaceFile: boolean) {
  const existingFile = require(fileName);
  let newFile: any = Object.assign({}, existingFile);

  for (const key in englishFile) {
    if (!existingFile[key]) {
      console.log(`Found missing translation for: ${key}`);
      const item = englishFile[key];
      let newItem = Object.assign({}, item);
      const newMessage = await translateSegment(item.message, code);
      newItem.message = newMessage;
      newFile[key] = newItem;
    } else {
      newFile[key] = existingFile[key];
    }
  }
  const filePath = replaceFile ? fileName : path.join(root, 'utility/tmp-messages.json');
  fs.writeFileSync(filePath, JSON.stringify(newFile, null, 2));
}

async function translateSegment(segment: string, code: string) {
  try {
    if (segment.indexOf('$') > 0) {
      const formattedSegments = [...segment.matchAll(/\'?\$(.*?)\$\'?/g)];
      const formattedReplacements = formattedSegments.map(seg => seg[0]);
      const replacements = formattedSegments.map(seg => seg[1]);
      const splits = segment.split(/\'?\$(.*?)\$\'?/g);
      let replacementIdx = 0;
      let translated = '';
      for (let i = 0; i < splits.length; i++) {
        const split = splits[i];
        if (split == replacements[replacementIdx]) {
          translated = translated.concat(` ${formattedReplacements[replacementIdx]} `);
          replacementIdx += 1;
        } else {
          if (!/[\w]+/g.test(split)) {
            translated = translated.concat(split);
          } else {
            const text = await translate(split, code);
            translated = translated.concat(text);
          }
        }
      }
      return translated;
    } else {
      const translated = (await translate(segment, code)) as string;
      return translated;
    }
  } catch {
    return segment;
  }
}

async function updateAllLanguages() {
  const languageDirs = fs.readdirSync(path.join(root, 'public/_locales'));
  for (let i = 0; i < languageDirs.length; i++) {
    let languageDir = languageDirs[i];
    console.log('Updating translations for file: ', languageDir, '................................');
    if (languageDir === 'en') {
      console.log('Skipping English File');
    }
    const filePath = path.join(root, `public/_locales/${languageDir}/messages.json`);
    const languageCode = languageDir.split('_')[0];
    await translateWithDiff(filePath, languageCode, true);
  }
}

async function fixErrorsForLanguage(fileName: string, code: string, replaceFile: boolean) {
  const existingFile = require(fileName);
  let newFile: any = Object.assign({}, existingFile);

  for (const key in englishFile) {
    if (existingFile[key]) {
      const item = englishFile[key];
      const englishMessage = item.message;
      const otherMessage = existingFile[key].message;
      var regExp = /\$([^$)]+)\$/gm;
      var regExp2 = /\$([^$)]+)\$/gm;
      const englishMatches = englishMessage.match(regExp);
      const otherMatches = otherMessage.match(regExp2);
      if (englishMatches) {
        if (!otherMatches || englishMatches.length != otherMatches.length) {
          console.log('Removing: ', key, englishMatches, otherMatches);
          delete newFile[key];
          continue;
        }
        englishMatches.sort();
        otherMatches.sort();
        const thing = (englishMatches as any[]).map((item, i) => item != otherMatches[i]).filter(item => item);
        if (thing.length > 0) {
          console.log('Removing: ', key, englishMatches, otherMatches);
          delete newFile[key];
        }
      }
    }
  }

  const filePath = replaceFile ? fileName : path.join(root, 'utility/tmp-messages.json');
  fs.writeFileSync(filePath, JSON.stringify(newFile, null, 2));
}

async function fixAllPotentialErrors() {
  const languageDirs = fs.readdirSync(path.join(root, 'public/_locales'));
  for (let i = 0; i < languageDirs.length; i++) {
    let languageDir = languageDirs[i];
    console.log('Analyzing file for potential errors: ', languageDir, '................................');
    if (languageDir === 'en') {
      console.log('Skipping English File');
    }
    const filePath = path.join(root, `public/_locales/${languageDir}/messages.json`);
    const languageCode = languageDir.split('_')[0];
    await fixErrorsForLanguage(filePath, languageCode, true);
  }
}

// eslint-disable-next-line import/order
const argv = require('minimist')(process.argv.slice(2));
const code = argv['_'][0];
if (argv['c'] && argv['f']) {
  // yarn createTranslationFile -f public/_locales/ru/messages.json -c ru
  translateWithDiff(argv['f'], argv['c'], false);
} else if (argv['c']) {
  // yarn createTranslationFile -c ru
  translateFile(argv['c']);
} else if (argv['e']) {
  fixAllPotentialErrors();
} else {
  // yarn createTranslationFile
  updateAllLanguages();
}
