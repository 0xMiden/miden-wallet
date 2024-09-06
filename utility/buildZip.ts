const AdmZip = require('adm-zip');
const path = require('path');
const { TARGET_BROWSER = 'chrome' } = process.env;

const zip = new AdmZip();

const PARENT_DIR = path.resolve(__dirname, '..');
const DIST_PATH = path.join(PARENT_DIR, 'dist');
type BROWSER_TYPE = 'opera' | 'firefox';
const browserPackedExtensions = {
  opera: 'crx',
  firefox: 'xpi',
  default: 'zip'
};

const SOURCE_PATH = path.join(DIST_PATH, `${TARGET_BROWSER}_unpacked`);
const PACKED_EXTENSION = browserPackedExtensions[TARGET_BROWSER as BROWSER_TYPE] || browserPackedExtensions.default;
const OUTPUT_FILE = path.join(DIST_PATH, `${TARGET_BROWSER}.${PACKED_EXTENSION}`);

// Add a directory to the zip file recursively
zip.addLocalFolder(SOURCE_PATH);

// Save the zip file
zip.writeZip(OUTPUT_FILE);
