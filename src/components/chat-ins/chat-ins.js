import { useState, useEffect, useRef } from "react";
import { userStore } from "../../config/userState";
import { chatStore } from "../../config/chatState";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane, faImage, faEllipsisVertical } from "@fortawesome/free-solid-svg-icons";
import { doc, onSnapshot, updateDoc, arrayUnion, serverTimestamp } from "firebase/firestore";
import { db } from "../../config/firebase";
import uploadImg from "../../config/firebase";
import { format } from "timeago.js";

const ChatIns = () => {
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");
    const { currUser } = userStore();
    const { chatId, user, isCurrUserBlocked, isOthUserBlocked, changeChat } = chatStore();
    const scrollRef = useRef();

    useEffect(() => {
        if (!chatId) return;  // Add this check

        const unSub = onSnapshot(doc(db, "chats", chatId), (doc) => {
            if (doc.exists()) {  // Add existence check
                setMessages(doc.data()?.messages || []);  // Add null check with default empty array
            } else {
                setMessages([]); // Reset messages if chat document doesn't exist
            }
        });

        return () => {
            unSub();
        };
    }, [chatId]);

    // Add listener for blocking status changes
    useEffect(() => {
        if (!user?.id || !currUser?.id) return;

        const unsubscribe = onSnapshot(doc(db, "users", currUser.id), (doc) => {
            if (doc.exists()) {
                const userData = doc.data();
                // If this user is blocked by the other user, update the chat state
                if (userData.blocked.includes(user.id)) {
                    changeChat(chatId, user);
                }
            }
        });

        return () => unsubscribe();
    }, [user?.id, currUser?.id]);

    // Add listener for the other user's blocking actions
    useEffect(() => {
        if (!user?.id || !currUser?.id) return;

        const unsubscribe = onSnapshot(doc(db, "users", user.id), (doc) => {
            if (doc.exists()) {
                const otherUserData = doc.data();
                // If we are blocked by the other user, update the chat state
                if (otherUserData.blocked.includes(currUser.id)) {
                    changeChat(chatId, user);
                }
            }
        });

        return () => unsubscribe();
    }, [user?.id, currUser?.id]);

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!text.trim() && !e.target?.files?.[0]) return;

        try {
            let url = "";
            if (e.target?.files?.[0]) {
                url = await uploadImg(e.target.files[0]);
            }

            const message = {
                senderId: currUser.id,
                text: text || "",
                img: url,
                createdAt: Date.now()
            };

            await updateDoc(doc(db, "chats", chatId), {
                messages: arrayUnion(message)
            });

            setText("");
        } catch (err) {
            console.error(err);
        }
    };

    const isMessagingDisabled = () => {
        return isCurrUserBlocked || isOthUserBlocked;
    };

    return (
        <div className="flex-1 flex flex-col rounded-xl bg-white shadow-custom">
            {/* Chat Header */}
            <div className="p-4 border-b flex items-center rounded-xl justify-between bg-white">
                <div className="flex items-center space-x-3">
                    <img 
                        src={user?.avatar || "./avt.png"} 
                        className="w-10 h-10 rounded-full object-cover"
                        alt="avatar"
                    />
                    <div>
                        <h3 className="font-medium text-gray-900">{user?.username}</h3>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex ${message.senderId === currUser.id ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`max-w-[70%] ${message.senderId === currUser.id ? 'bg-primary text-white' : 'bg-gray-100 text-gray-800'} rounded-2xl px-4 py-2`}>
                            {message.img && (
                                <img 
                                    src={message.img} 
                                    alt="message" 
                                    className="max-w-full rounded-lg mb-2"
                                />
                            )}
                            {message.text && <p className="break-words">{message.text}</p>}
                            <span className={`text-xs ${message.senderId === currUser.id ? 'text-indigo-100' : 'text-gray-500'} block mt-1`}>
                                {format(message.createdAt)}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Message Input */}
            <form onSubmit={sendMessage} className="p-4 border-t rounded-xl bg-white">
                <div className="flex items-center space-x-2">
                    <label className={`p-2 rounded-full transition ${
                        isMessagingDisabled() 
                            ? 'bg-gray-100 cursor-not-allowed' 
                            : 'hover:bg-gray-100 cursor-pointer'
                    }`}>
                        <FontAwesomeIcon 
                            icon={faImage} 
                            className={`${isMessagingDisabled() ? 'text-gray-400' : 'text-gray-600'}`} 
                        />
                        <input 
                            type="file" 
                            className="hidden" 
                            onChange={sendMessage}
                            accept="image/*"
                            disabled={isMessagingDisabled()}
                        />
                    </label>
                    <input
                        type="text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder={isMessagingDisabled() ? "Messaging unavailable" : "Type a message..."}
                        className="flex-1 px-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
                        disabled={isMessagingDisabled()}
                    />
                    <button 
                        type="submit"
                        className={`p-2 rounded-full transition ${
                            isMessagingDisabled()
                                ? 'bg-gray-300 cursor-not-allowed'
                                : 'bg-primary text-white hover:bg-secondary'
                        }`}
                        disabled={isMessagingDisabled()}
                    >
                        <FontAwesomeIcon icon={faPaperPlane} />
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ChatIns;