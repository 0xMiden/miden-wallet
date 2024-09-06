const fs = require('fs');
const path = require('path');
const _ = require('lodash');

// Get all language directories
const localesDir = path.join(__dirname, 'public', '_locales');
const langDirs = fs.readdirSync(localesDir);

langDirs.forEach(langDir => {
  const messagesPath = path.join(localesDir, langDir, 'messages.json');
  // Check if message.json exists
  if (fs.existsSync(messagesPath)) {
    console.log(langDir);
    const messages = JSON.parse(fs.readFileSync(messagesPath, 'utf-8'));

    // Format messages
    const formattedMessages = {};
    for (const key in messages) {
      formattedMessages[key] = messages[key].message;
    }

    // Remove duplicates
    // const uniqueMessages = _.uniqWith(formattedMessages, _.isEqual);
    // console.log(uniqueMessages);
    // // Write to {{lang}}.json
    const outputPath = path.join(localesDir, langDir, `${langDir}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(formattedMessages, null, 2));
  }
});
