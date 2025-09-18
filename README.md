# GoRealla (com.heptanesia.gorealla)

A comprehensive solution for Real Estate Developers, Contractors, Architects and Interior Designers

## Install the dependencies
```bash
yarn
# or
npm install
```

### Start the app in development mode (hot-code reloading, error reporting, etc.)
```bash
quasar dev
```


### Lint the files
```bash
yarn lint
# or
npm run lint
```


### Build the app for production
```bash
quasar build
```

### Customize the configuration
See [Configuring quasar.config.js](https://v2.quasar.dev/quasar-cli-webpack/quasar-config-js).
// For font-awesome icons
npm install @quasar/extras
npm installl firebase
# For service worker support in Quasar
npm install workbox-webpack-plugin --save-dev

npm install @capacitor/core @capacitor/cli
npm install @capacitor/push-notifications
npm install @capacitor/android @capacitor/ios
npm install @capacitor/camera
npx cap init
npx cap sync

**Incase pf problems**
# Remove node_modules and lock file
rm -rf node_modules package-lock.json

# Clear npm cache
npm cache clean --force

# Reinstall all dependencies
npm install

# Try the command
npx cap copy android

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCyCrHHfM3kiTfnrKMQHj0p3Jy5sjrzPhQ",
  authDomain: "gorealla-41b32.firebaseapp.com",
  projectId: "gorealla-41b32",
  storageBucket: "gorealla-41b32.firebasestorage.app",
  messagingSenderId: "564055391492",
  appId: "1:564055391492:web:4442eee2d16f67438d6451",
  measurementId: "G-MD657JCWSD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
# gorealla_copy
# gorealla_copy
