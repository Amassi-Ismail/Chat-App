import { create } from 'zustand'
import {doc, getDoc, updateDoc, serverTimestamp} from "firebase/firestore";
import {db} from "./firebase";
import { toast } from "react-toastify";

export const userStore = create((set) => ({
    currUser: null,
    isLoading: true,
    fetchUser: async (uid) => {
        set({ isLoading: true });
        
        if (!uid) {
            set({
                currUser: null,
                isLoading: false
            });
            return;
        }

        try {
            const docRef = doc(db, "users", uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                set({
                    currUser: { ...docSnap.data(), id: uid },
                    isLoading: false,
                });
            } else {
                console.error("No user document found!");
                set({
                    currUser: null,
                    isLoading: false,
                });
            }
        } catch (err) {
            console.error("Error fetching user:", err);
            set({
                currUser: null,
                isLoading: false
            });
        }
    },
    updateUserStatus: async (uid, isOnline) => {
        if (!uid) return;
        
        try {
            const userRef = doc(db, "users", uid);
            // Check if user document exists before updating
            const userDoc = await getDoc(userRef);
            if (userDoc.exists()) {
                await updateDoc(userRef, {
                    isOnline,
                    lastActive: serverTimestamp()
                });
            }
        } catch (err) {
            console.error("Error updating user status:", err);
            toast.error("Error updating user status");
        }
    }
}))