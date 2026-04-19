importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCbalOrY5HoF-Ekq0gNRGnG3XMrWgi0DgE",
  authDomain: "jbmrsportslive.firebaseapp.com",
  databaseURL: "https://jbmrsportslive-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "jbmrsportslive",
  storageBucket: "jbmrsportslive.firebasestorage.app",
  messagingSenderId: "248496385806",
  appId: "1:248496385806:web:366015b3e8a24159a9b15f",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: 'https://api.iconify.design/lucide:play.svg?color=%2310b981',
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
