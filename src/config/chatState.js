import { create } from 'zustand'
import {doc, getDoc} from "firebase/firestore";
import {db} from "./firebase";
import {userStore} from "./userState";

// Add messageTypes constant
export const messageTypes = {
    TEXT: 'text',
    IMAGE: 'image',
    REPLY: 'reply',
};

export const chatStore = create((set) => ({
    chatId: null,
    user: null,
    isCurrUserBlocked: false,
    isOthUserBlocked: false,
    changeChat: (chatId, user) => {
        // If no user is provided, reset the chat state
        if (!user) {
            return set({
                chatId: null,
                user: null,
                isCurrUserBlocked: false,
                isOthUserBlocked: false
            });
        }

        const currUser = userStore.getState().currUser;

        if (user.blocked?.includes(currUser.id)) {
            return set({
                chatId,
                user: null,
                isCurrUserBlocked: true,
                isOthUserBlocked: false
            });
        }
        else if (currUser.blocked?.includes(user.id)) {
            return set({
                chatId,
                user: user,
                isCurrUserBlocked: false,
                isOthUserBlocked: true
            });
        } else {
            return set({
                chatId,
                user,
                isCurrUserBlocked: false,
                isOthUserBlocked: false
            });
        }
    },
    onBlockChange: () => {
        set(state => ({...state, isOthUserBlocked: !state.isOthUserBlocked}));
    }
}))