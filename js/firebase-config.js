// js/firebase-config.js
// Shared Firebase configuration — imported by all pages
// Usage: import { db, storage } from './firebase-config.js'

import { initializeApp }  from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getDatabase }    from "https://www.gstatic.com/firebasejs/12.10.0/firebase-database.js";
import { getStorage }     from "https://www.gstatic.com/firebasejs/12.10.0/firebase-storage.js";

export const firebaseConfig = {
  apiKey:            "AIzaSyBylcQYwOuQbFU8AmP7h1WnggyvJJSw1XI",
  authDomain:        "armulaud-af87f.firebaseapp.com",
  databaseURL:       "https://armulaud-af87f-default-rtdb.europe-west1.firebasedatabase.app",
  projectId:         "armulaud-af87f",
  storageBucket:     "armulaud-af87f.firebasestorage.app",
  messagingSenderId: "916225040299",
  appId:             "1:916225040299:web:af7b185e5787cea27cbcee"
};

export const app     = initializeApp(firebaseConfig);
export const db      = getDatabase(app);
export const storage = getStorage(app);
