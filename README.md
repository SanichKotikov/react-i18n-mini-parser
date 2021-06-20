# react-i18n-mini-parser

NodeJS module for extracting default i18n messages from a project files where
using [react-i18n-mini](https://www.npmjs.com/package/react-i18n-mini).

### Example of usage

```shell
npm i -D react-i18n-mini-parser
```

```javascript
import fs from 'fs';
import glob from 'glob';
import { extract } from 'react-i18n-mini-parser';

glob("**/*.+(js|ts|tsx)", function(error, files) {
  const messages = extract(files.map(file => fs.readFileSync(file, 'utf8')));
  fs.writeFileSync('./locales/en.json', JSON.stringify(messages, null, '  '), 'utf8');
});
```

Note: `glog` is using as an example. You can use any tool or write your own to find all files that need to be parsed.
