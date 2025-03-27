import { useState, useEffect, useRef } from "react";
import { userStore } from "../../config/userState";
import { chatStore, messageTypes } from "../../config/chatState";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
    faPaperPlane, 
    faImage, 
    faReply, 
    faTrash, 
    faSmile,
    faEllipsisVertical,
    faTimes 
} from "@fortawesome/free-solid-svg-icons";
import { doc, onSnapshot, updateDoc, arrayUnion, serverTimestamp, getDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import uploadImg from "../../config/firebase";
import { format } from "timeago.js";
import toast from "react-hot-toast";

const ChatIns = () => {
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");
    const { currUser } = userStore();
    const { chatId, user, isCurrUserBlocked, isOthUserBlocked, changeChat } = chatStore();
    const scrollRef = useRef();
    const inputRef = useRef(); // Added inputRef
    const [replyTo, setReplyTo] = useState(null);
    const [showReactions, setShowReactions] = useState(null);
    const reactions = ['👍', '❤️', '😄', '😮', '😢', '😡'];

    useEffect(() => {
        if (!chatId) return;

        const unSub = onSnapshot(doc(db, "chats", chatId), (doc) => {
            if (doc.exists()) {
                setMessages(doc.data()?.messages || []);
            } else {
                setMessages([]);
            }
        });

        return () => {
            unSub();
        };
    }, [chatId]);

    useEffect(() => {
        if (!user?.id || !currUser?.id) return;

        const unsubscribe = onSnapshot(doc(db, "users", currUser.id), (doc) => {
            if (doc.exists()) {
                const userData = doc.data();
                if (userData.blocked.includes(user.id)) {
                    changeChat(chatId, user);
                }
            }
        });

        return () => unsubscribe();
    }, [user?.id, currUser?.id]);

    useEffect(() => {
        if (!user?.id || !currUser?.id) return;

        const unsubscribe = onSnapshot(doc(db, "users", user.id), (doc) => {
            if (doc.exists()) {
                const otherUserData = doc.data();
                if (otherUserData.blocked.includes(currUser.id)) {
                    changeChat(chatId, user);
                }
            }
        });

        return () => unsubscribe();
    }, [user?.id, currUser?.id]);

    const handleReply = (message) => {
        if (isMessagingDisabled()) return;
        setReplyTo(message);
        // Use ref instead of querySelector for better React practices
        inputRef.current.focus();
    };

    const handleReaction = async (messageId, reaction) => {
        try {
            const chatRef = doc(db, "chats", chatId);
            const chatDoc = await getDoc(chatRef);
            
            if (chatDoc.exists()) {
                const messages = chatDoc.data().messages;
                const messageIndex = messages.findIndex(m => m.id === messageId);
                
                if (messageIndex !== -1) {
                    const message = messages[messageIndex];
                    const reactions = message.reactions || {};
                    
                    if (reactions[reaction]?.includes(currUser.id)) {
                        reactions[reaction] = reactions[reaction].filter(id => id !== currUser.id);
                    } else {
                        reactions[reaction] = [...(reactions[reaction] || []), currUser.id];
                    }
                    
                    messages[messageIndex] = { ...message, reactions };
                    await updateDoc(chatRef, { messages });
                }
            }
            setShowReactions(null);
        } catch (err) {
            console.error(err);
            toast.error("Error adding reaction");
        }
    };

    const handleDeleteMessage = async (messageId) => {
        try {
            const chatRef = doc(db, "chats", chatId);
            const chatDoc = await getDoc(chatRef);
            
            if (chatDoc.exists()) {
                const messages = chatDoc.data().messages.filter(m => m.id !== messageId);
                await updateDoc(chatRef, { messages });
                toast.success("Message deleted");
            }
        } catch (err) {
            console.error(err);
            toast.error("Error deleting message");
        }
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!text.trim() && !e.target?.files?.[0]) return;

        try {
            let url = "";
            if (e.target?.files?.[0]) {
                url = await uploadImg(e.target.files[0]);
            }

            const message = {
                id: Date.now().toString(),
                senderId: currUser.id,
                text: text || "",
                img: url,
                createdAt: Date.now(),
                type: url ? messageTypes.IMAGE : messageTypes.TEXT,
                reactions: {},
                ...(replyTo && {
                    type: messageTypes.REPLY,
                    replyTo: {
                        id: replyTo.id,
                        text: replyTo.text,
                        senderId: replyTo.senderId
                    }
                })
            };

            await updateDoc(doc(db, "chats", chatId), {
                messages: arrayUnion(message)
            });

            setText("");
            setReplyTo(null);
        } catch (err) {
            console.error(err);
            toast.error("Error sending message");
        }
    };

    const isMessagingDisabled = () => {
        return isCurrUserBlocked || isOthUserBlocked;
    };

    const MessageItem = ({ message }) => (
        <div className={`flex ${message.senderId === currUser.id ? 'justify-end' : 'justify-start'} mb-4 group`}>
            <div className="relative max-w-[70%]">
                {/* Reply Preview */}
                {message.type === messageTypes.REPLY && (
                    <div className="text-sm text-gray-500 mb-1 bg-gray-100 rounded p-1">
                        Replying to: {message.replyTo.text}
                    </div>
                )}
                
                <div className={`relative ${
                    message.senderId === currUser.id ? 'bg-primary text-white' : 'bg-gray-100 text-gray-800'
                } rounded-2xl px-4 py-2`}>
                    {/* Message Image */}
                    {message.img && (
                        <img 
                            src={message.img} 
                            alt="message" 
                            className="max-w-full rounded-lg mb-2"
                        />
                    )}
                    
                    {/* Message Text */}
                    {message.text && <p className="break-words">{message.text}</p>}
                    
                    {/* Action Buttons */}
                    <div className={`absolute top-1/2 transform -translate-y-1/2 hidden group-hover:flex items-center gap-2 bg-white rounded-lg shadow-lg p-1 z-20 ${
                        message.senderId === currUser.id ? 'right-full mr-2' : 'left-full ml-2'
                    }`}>
                        {!isMessagingDisabled() && (
                            <>
                                <button 
                                    onClick={() => handleReply(message)}
                                    className="p-1.5 hover:bg-gray-100 rounded-full"
                                >
                                    <FontAwesomeIcon icon={faReply} className="text-gray-600 w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => setShowReactions(message.id)}
                                    className="p-1.5 hover:bg-gray-100 rounded-full"
                                >
                                    <FontAwesomeIcon icon={faSmile} className="text-gray-600 w-4 h-4" />
                                </button>
                            </>
                        )}
                        {message.senderId === currUser.id && (
                            <button 
                                onClick={() => handleDeleteMessage(message.id)}
                                className="p-1.5 hover:bg-gray-100 rounded-full"
                            >
                                <FontAwesomeIcon icon={faTrash} className="text-gray-600 w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Reactions Display */}
                    <div className="flex flex-wrap gap-1 mt-1">
                        {Object.entries(message.reactions || {}).map(([reaction, users]) => 
                            users.length > 0 && (
                                <span 
                                    key={reaction} 
                                    className={`text-xs px-1.5 py-0.5 rounded-full ${
                                        message.senderId === currUser.id 
                                            ? 'bg-white/20 text-white' 
                                            : 'bg-gray-200 text-gray-700'
                                    }`}
                                >
                                    {reaction} {users.length}
                                </span>
                            )
                        )}
                    </div>

                    {/* Reactions Popup */}
                    {showReactions === message.id && (
                        <div className={`absolute ${
                            message.senderId === currUser.id ? 'right-0' : 'left-0'
                        } bottom-full mb-2 bg-white rounded-lg shadow-lg p-2 flex gap-1 z-10`}>
                            {reactions.map(reaction => (
                                <button
                                    key={reaction}
                                    onClick={() => handleReaction(message.id, reaction)}
                                    className="hover:bg-gray-100 p-2 rounded-lg transition-colors"
                                >
                                    {reaction}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Timestamp */}
                    <span className={`text-xs ${
                        message.senderId === currUser.id ? 'text-white/70' : 'text-gray-500'
                    } block mt-1`}>
                        {format(message.createdAt)}
                    </span>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex-1 flex flex-col rounded-xl bg-white shadow-custom">
            {/* Header */}
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

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                {messages.map((message) => (
                    <MessageItem key={message.id} message={message} />
                ))}
            </div>

            {/* Reply Preview */}
            {replyTo && (
                <div className="px-4 py-2 bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faReply} className="text-gray-600" />
                        <span className="text-sm text-gray-600">
                            Replying to: {replyTo.text}
                        </span>
                    </div>
                    <button 
                        onClick={() => setReplyTo(null)}
                        className="text-gray-600 hover:text-gray-800"
                    >
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>
            )}

            {/* Message Input Form */}
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
                        ref={inputRef}
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