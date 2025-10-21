// Script to check admin role (run this in browser console when logged in as admin)
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Assuming you have db and auth initialized
const auth = getAuth();
const user = auth.currentUser;

if (user) {
  console.log("Current user:", user.uid, user.email);

  // Check user document
  getDoc(doc(db, "users", user.uid)).then((doc) => {
    if (doc.exists()) {
      const data = doc.data();
      console.log("User data:", data);
      console.log("User role:", data.role);

      if (data.role === "admin") {
        console.log("✅ User has admin role");
      } else {
        console.log("❌ User does NOT have admin role");
        console.log("To fix: Update user document to have role: 'admin'");
      }
    } else {
      console.log("❌ User document not found");
    }
  }).catch((error) => {
    console.error("Error checking user:", error);
  });
} else {
  console.log("❌ No user logged in");
}
