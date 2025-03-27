import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCancel, faSignOut, faTrash, faUserMinus } from "@fortawesome/free-solid-svg-icons"; // Add faUserMinus
import { auth, db } from "../../config/firebase";
import { chatStore } from "../../config/chatState";
import { 
    arrayUnion, 
    doc, 
    updateDoc, 
    arrayRemove, 
    deleteDoc, 
    onSnapshot,
    collection,
    query,
    where,
    getDocs,
    getDoc 
} from "firebase/firestore";
import { userStore } from "../../config/userState";
import { toast } from "react-toastify";
import { useState, useEffect } from "react";
import { format } from "timeago.js";

const ChatInsInfo = () => {
    const [userStatus, setUserStatus] = useState({ isOnline: false, lastActive: null });
    // Add changeChat to the destructuring
    const { user, chatId, isCurrUserBlocked, isOthUserBlocked, onBlockChange, changeChat } = chatStore();
    const { currUser } = userStore();

    // Add real-time user status listener
    useEffect(() => {
        if (!user?.id) return;

        const unsubscribe = onSnapshot(doc(db, "users", user.id), (doc) => {
            if (doc.exists()) {
                setUserStatus({
                    isOnline: doc.data().isOnline,
                    lastActive: doc.data().lastActive?.toDate()
                });
            }
        });

        return () => unsubscribe();
    }, [user?.id]);

    // Update status display in the component
    const getStatusText = () => {
        if (isCurrUserBlocked || isOthUserBlocked) return "";
        if (userStatus.isOnline) return "Active now";
        if (userStatus.lastActive) return `Last active ${format(userStatus.lastActive)}`;
        return "";
    };

    const blockUser = async () => {
        if (!user) return;

        const userDocRef = doc(db, "users", currUser.id);

        try {
            await updateDoc(userDocRef, {
                blocked: isOthUserBlocked ? arrayRemove(user.id) : arrayUnion(user.id)
            });
            
            // Update the chat store immediately
            onBlockChange();
            
            // Show success message
            toast.success(isOthUserBlocked ? "User unblocked" : "User blocked");
            
            // Update the other user's chat ref to reflect the block
            const chatRef = doc(db, "chats", chatId);
            await updateDoc(chatRef, {
                blockedBy: isOthUserBlocked ? arrayRemove(currUser.id) : arrayUnion(currUser.id)
            });
        } catch (err) {
            console.error(err);
            toast.error("Error updating block status");
        }
    };

    // Add an effect to listen for block status changes
    useEffect(() => {
        if (!chatId) return;

        const unsubscribe = onSnapshot(doc(db, "chats", chatId), (doc) => {
            if (doc.exists()) {
                const blockedBy = doc.data().blockedBy || [];
                if (blockedBy.includes(user?.id)) {
                    onBlockChange();
                }
            }
        });

        return () => unsubscribe();
    }, [chatId, user?.id]);

    const deleteChat = async () => {
        if (!chatId) return;

        try {
            const chatRef = doc(db, "chats", chatId);
            
            // Update the chat document with empty messages instead of deleting
            await updateDoc(chatRef, {
                messages: []
            });

            toast.success("Chat history cleared successfully");
        } catch (err) {
            console.error(err);
            toast.error("Error clearing chat history");
        }
    };

    const removeFriend = async () => {
        if (!user || !chatId) return;

        try {
            // 1. Delete chat messages first
            const chatRef = doc(db, "chats", chatId);
            await deleteDoc(chatRef);

            // 2. Remove chat from both users' userchats
            const currentUserChatsRef = doc(db, "userchats", currUser.id);
            const otherUserChatsRef = doc(db, "userchats", user.id);

            const [currentUserChats, otherUserChats] = await Promise.all([
                getDoc(currentUserChatsRef),
                getDoc(otherUserChatsRef)
            ]);

            if (currentUserChats.exists()) {
                await updateDoc(currentUserChatsRef, {
                    chats: currentUserChats.data().chats.filter(
                        chat => chat.chatId !== chatId
                    )
                });
            }

            if (otherUserChats.exists()) {
                await updateDoc(otherUserChatsRef, {
                    chats: otherUserChats.data().chats.filter(
                        chat => chat.chatId !== chatId
                    )
                });
            }

            // 3. Remove any existing friend requests
            const requestsRef = collection(db, "friendRequests");
            const q = query(requestsRef, 
                where("senderId", "in", [currUser.id, user.id]),
                where("receiverId", "in", [currUser.id, user.id])
            );
            
            const requests = await getDocs(q);
            await Promise.all(requests.docs.map(doc => deleteDoc(doc.ref)));

            // 4. Reset chat state last
            changeChat(null, null);
            
            toast.success("Friend removed successfully");
        } catch (err) {
            console.error(err);
            toast.error("Error removing friend");
        }
    };

    return (
        <div className="w-[300px] bg-white shadow-lg rounded-xl flex flex-col">
            {/* User Profile Section */}
            <div className="p-6 flex flex-col items-center border-b border-gray-200">
                <img 
                    src={isCurrUserBlocked || isOthUserBlocked ? "./avt.png" : user?.avatar || "./avt.png"} 
                    alt="user-chat"
                    className="w-24 h-24 rounded-full object-cover border-4 border-primary"
                />
                <h2 className="mt-4 text-xl font-semibold text-gray-800">
                    {isCurrUserBlocked || isOthUserBlocked ? "User" : user?.username}
                </h2>
                <span className={`text-sm mt-1 ${userStatus.isOnline ? 'text-green-500' : 'text-gray-500'}`}>
                    {getStatusText()}
                </span>
            </div>

            {/* Actions Section */}
            <div className="p-6 space-y-4">
                {/* Remove Friend Button */}
                <button
                    onClick={removeFriend}
                    className="w-full py-3 px-4 rounded-lg bg-yellow-100 hover:bg-yellow-200 text-yellow-600
                             flex items-center justify-center gap-2 transition"
                >
                    <FontAwesomeIcon icon={faUserMinus} className="w-4 h-4" />
                    <span>Remove Friend</span>
                </button>

                {/* Block User Button */}
                <button
                    onClick={blockUser}
                    className={`w-full py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition
                        ${isOthUserBlocked || isCurrUserBlocked 
                            ? 'bg-red-500 hover:bg-red-600 text-white' 
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                >
                    <FontAwesomeIcon icon={faCancel} className="w-4 h-4" />
                    <span>
                        {isCurrUserBlocked 
                            ? "You are Blocked" 
                            : isOthUserBlocked 
                                ? "User Blocked" 
                                : "Block User"}
                    </span>
                </button>

                {/* Delete Chat Button */}
                <button
                    onClick={deleteChat}
                    className="w-full py-3 px-4 rounded-lg bg-red-100 hover:bg-red-200 text-red-600
                             flex items-center justify-center gap-2 transition"
                >
                    <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
                    <span>Clear Chat History</span>
                </button>
            </div>
        </div>
    );
};

export default ChatInsInfo;