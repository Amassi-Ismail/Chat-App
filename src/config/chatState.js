import { create } from 'zustand'
import {doc, getDoc} from "firebase/firestore";
import {db} from "./firebase";

export const userStore = create((set) => ({
    currUser: null,
    isLoading: true,
    fetchUser: async (uid) => {
        if (!uid) return set({
            currUser: null,
            isLoading: false
        });

        try {
            const docRef = doc(db, "users", uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                set({
                    currUser: docSnap.data(),
                    isLoading: false,
                })
            } else {
                set({
                    currUser: null,
                    isLoading: false,
                })
            }
        } catch (err) {
            console.error(err);
            return set({
                currUser: null,
                isLoading: false
            })
        }

    }
}))