import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faMinus, faPlus, faSearch, faEllipsisVertical, faSignOut, faTimes, faUserFriends} from "@fortawesome/free-solid-svg-icons";
import {useEffect, useState} from "react";
import {userStore} from "../../config/userState";
import {
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    collection,
    query,
    where,
    setDoc,
    serverTimestamp,
    updateDoc,
    arrayUnion,
    arrayRemove,
    deleteDoc,
    addDoc
} from "firebase/firestore";
import {db} from "../../config/firebase";
import {toast} from "react-toastify";
import {chatStore} from "../../config/chatState";
import { auth } from "../../config/firebase";
import { format } from "timeago.js";

const ChatList = () => {
    const [addClicked, setAddClicked] = useState(false);
    const [chats, setChats] = useState([]);
    const { currUser } = userStore();
    const { updateUserStatus } = userStore();
    const [user, setUser] = useState(null);
    const { changeChat } = chatStore();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showFriendRequests, setShowFriendRequests] = useState(false);
    const [friendRequests, setFriendRequests] = useState({ sent: [], received: [] });
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const unSub = onSnapshot(doc(db, "userchats", currUser.id), async (res) => {
        const items = res.data().chats;

        const promises = items.map(async (item) => {
            const userDocRef = doc(db, "users", item.receiverId);
            const userDocSnap = await getDoc(userDocRef);

            const user = userDocSnap.data();

            return{ ...item, user };
        });

            const chatData = await Promise.all(promises);
            setChats(chatData.sort((a, b) => b.updatedAt - a.updatedAt));
        });
        return () =>{
            unSub();
        }
    }, [currUser.id]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isMenuOpen && !event.target.closest('.relative')) {
                setIsMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isMenuOpen]);

    useEffect(() => {
        if (!currUser?.id) return;

        const unsubscribe = onSnapshot(
            query(collection(db, "friendRequests"),
                where("receiverId", "==", currUser.id)
            ),
            (snapshot) => {
                const received = [];
                snapshot.forEach((doc) => {
                    received.push({ id: doc.id, ...doc.data() });
                });
                setFriendRequests(prev => ({ ...prev, received }));
            }
        );

        const unsubscribeSent = onSnapshot(
            query(collection(db, "friendRequests"),
                where("senderId", "==", currUser.id)
            ),
            (snapshot) => {
                const sent = [];
                snapshot.forEach((doc) => {
                    sent.push({ id: doc.id, ...doc.data() });
                });
                setFriendRequests(prev => ({ ...prev, sent }));
            }
        );

        return () => {
            unsubscribe();
            unsubscribeSent();
        };
    }, [currUser?.id]);

    const searchUser = async e => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const email = formData.get("email");

        try {
            const userRef = collection(db, "users");
            const q = query(userRef, where("email", "==", email));
            const queryResult = await getDocs(q);

            if (!queryResult.empty) {
                const foundUser = queryResult.docs[0].data();
                if (foundUser.id === currUser.id) {
                    toast.error("You cannot add yourself");
                    return;
                }
                setUser(foundUser);
            } else {
                toast.error("User not found");
            }
        } catch (err) {
            toast.error(err.message);
        }
    };

    const addUser = async () => {
        const chatRef = collection(db, "chats");
        const userChatsRef = collection(db, "userchats");

        try {
            const newChatRef = doc(chatRef);

            await setDoc(newChatRef, {
                createdAt: serverTimestamp(),
                messages: []
            });

            await updateDoc(doc(userChatsRef, user.id), {
                chats: arrayUnion({
                    chatId: newChatRef.id,
                    lastMessage: "",
                    receiverId: currUser.id,
                    updatedAt: Date.now(),
                })
            });

            await updateDoc(doc(userChatsRef, currUser.id), {
                chats: arrayUnion({
                    chatId: newChatRef.id,
                    lastMessage: "",
                    receiverId: user.id,
                    updatedAt: Date.now(),
                })
            });

        } catch (err) {
            console.log(err.message);
        }
    }


    const selectChat = async (chat) => {
        const userChats = chats.map((item) => {
            const {user, ...rest} = item;
            return rest;
        });

        const chatIndex = userChats.findIndex((item) => item.chatId === chat.chatId);
        userChats[chatIndex].isSeen = true;

        const userChatsRef = doc(db, "userchats", currUser.id);

        try {
            await updateDoc(userChatsRef, {
                chats: userChats
            });

            changeChat(chat.chatId, chat.user);
        } catch (err) {
            console.log(err.message);
        }
    }

    const handleSignOut = async () => {
        try {
            setIsMenuOpen(false);
            // First update the status
            await updateUserStatus(currUser.id, false);
            // Then sign out
            await auth.signOut();
        } catch (err) {
            console.error("Error signing out:", err);
            toast.error("Error signing out");
        }
    };

    const sendFriendRequest = async () => {
        if (!user) return;

        try {
            // First check if users are already friends by checking existing chats
            const currentUserChatsRef = doc(db, "userchats", currUser.id);
            const currentUserChatsSnap = await getDoc(currentUserChatsRef);
            
            if (currentUserChatsSnap.exists()) {
                const userChats = currentUserChatsSnap.data().chats;
                const alreadyFriends = userChats.some(chat => chat.receiverId === user.id);
                
                if (alreadyFriends) {
                    toast.error("You are already friends with this user");
                    return;
                }
            }

            // Then check existing friend requests
            const requestsRef = collection(db, "friendRequests");
            
            // Check for existing requests in both directions
            const sentRequestQuery = query(requestsRef, 
                where("senderId", "==", currUser.id),
                where("receiverId", "==", user.id)
            );
            const receivedRequestQuery = query(requestsRef, 
                where("senderId", "==", user.id),
                where("receiverId", "==", currUser.id)
            );

            const [sentRequests, receivedRequests] = await Promise.all([
                getDocs(sentRequestQuery),
                getDocs(receivedRequestQuery)
            ]);

            if (!sentRequests.empty) {
                toast.error("Friend request already sent");
                return;
            }

            if (!receivedRequests.empty) {
                toast.error("This user has already sent you a friend request");
                return;
            }

            // If all checks pass, create the friend request
            await addDoc(requestsRef, {
                senderId: currUser.id,
                receiverId: user.id,
                status: "pending",
                timestamp: serverTimestamp(),
                senderInfo: {
                    username: currUser.username,
                    avatar: currUser.avatar
                },
                receiverInfo: {
                    username: user.username,
                    avatar: user.avatar
                }
            });

            toast.success("Friend request sent!");
            setAddClicked(false);
        } catch (err) {
            console.error(err);
            toast.error("Error sending friend request");
        }
    };

    const handleFriendRequest = async (requestId, status) => {
        try {
            const requestRef = doc(db, "friendRequests", requestId);
            await updateDoc(requestRef, { status });

            if (status === 'accepted') {
                const request = friendRequests.received.find(r => r.id === requestId);
                
                // Create new chat when request is accepted
                const chatRef = collection(db, "chats");
                const userChatsRef = collection(db, "userchats");
                const newChatRef = doc(chatRef);

                // Create the chat document
                await setDoc(newChatRef, {
                    createdAt: serverTimestamp(),
                    messages: []
                });

                // Update sender's userchats
                await updateDoc(doc(userChatsRef, request.senderId), {
                    chats: arrayUnion({
                        chatId: newChatRef.id,
                        lastMessage: "",
                        receiverId: currUser.id,
                        updatedAt: Date.now(),
                    })
                });

                // Update receiver's userchats
                await updateDoc(doc(userChatsRef, currUser.id), {
                    chats: arrayUnion({
                        chatId: newChatRef.id,
                        lastMessage: "",
                        receiverId: request.senderId,
                        updatedAt: Date.now(),
                    })
                });

                toast.success("Friend request accepted and chat created!");
            } else {
                toast.info(`Friend request ${status}`);
            }
            
            setShowFriendRequests(false);
        } catch (err) {
            console.error(err);
            toast.error("Error updating friend request");
        }
    };

    const filteredChats = chats.filter(chat => 
        chat.user.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="w-[350px] flex flex-col bg-white rounded-xl shadow-custom">
            {/* Current User Header */}
            <div className="p-4 border-b relative">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <img 
                            src={currUser.avatar || "/emoji.png"} 
                            className="w-12 h-12 rounded-full object-cover border-2 border-primary"
                            alt="avatar"
                        />
                        <h2 className="font-semibold text-gray-800">{currUser.username}</h2>
                    </div>
                    <div className="relative">
                        <button 
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="p-2 hover:bg-gray-100 rounded-full transition"
                        >
                            <FontAwesomeIcon 
                                icon={faEllipsisVertical} 
                                className="w-5 h-5 text-gray-600"
                            />
                        </button>

                        {/* Dropdown Menu */}
                        {isMenuOpen && (
                            <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg py-1 z-10">
                                <button
                                    onClick={() => setShowFriendRequests(true)}
                                    className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                    <FontAwesomeIcon icon={faUserFriends} className="w-4 h-4" />
                                    <span>Friend Requests</span>
                                    {friendRequests.received.filter(r => r.status === 'pending').length > 0 && (
                                        <span className="ml-auto bg-primary text-white text-xs px-2 py-1 rounded-full">
                                            {friendRequests.received.filter(r => r.status === 'pending').length}
                                        </span>
                                    )}
                                </button>
                                <button
                                    onClick={handleSignOut}
                                    className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                    <FontAwesomeIcon icon={faSignOut} className="w-4 h-4" />
                                    <span>Log Out</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="p-4">
                <div className="flex items-center space-x-2">
                    <div className="flex-1 relative">
                        <input 
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search friends..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <FontAwesomeIcon 
                            icon={faSearch} 
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        />
                    </div>
                    <button 
                        onClick={() => setAddClicked(prev => !prev)}
                        className="p-2 bg-primary text-white rounded-lg hover:bg-secondary transition"
                    >
                        <FontAwesomeIcon icon={!addClicked ? faPlus : faMinus} />
                    </button>
                </div>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto">
                {filteredChats.map((chat) => (
                    <div
                        key={chat.chatId}
                        onClick={() => selectChat(chat)}
                        className={`flex items-center p-4 hover:bg-gray-50 cursor-pointer transition ${
                            !chat?.isSeen ? 'bg-indigo-50' : ''
                        }`}
                    >
                        <img
                            src={chat.user.avatar || "./avt.png"}
                            className="w-12 h-12 rounded-full object-cover"
                            alt="avatar"
                        />
                        <div className="ml-3 flex-1">
                            <h3 className="font-medium text-gray-900">{chat.user.username}</h3>
                            <p className="text-sm text-gray-500 truncate">{chat.lastMessage}</p>
                        </div>
                    </div>
                ))}
                {filteredChats.length === 0 && searchTerm && (
                    <div className="text-center text-gray-500 py-8">
                        No friends found
                    </div>
                )}
            </div>

            {/* Add User Modal */}
            {addClicked && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-xl shadow-lg w-96">
                        {/* Add close button */}
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Add New Friend</h3>
                            <button 
                                onClick={() => setAddClicked(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition"
                            >
                                <FontAwesomeIcon icon={faTimes} className="w-4 h-4 text-gray-600" />
                            </button>
                        </div>
                        <form onSubmit={searchUser} className="space-y-4">
                            <input
                                type="email"
                                placeholder="Search friend by email..."
                                name="email"
                                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                            <button className="w-full bg-primary text-white py-3 rounded-lg hover:bg-secondary transition">
                                Search
                            </button>
                        </form>

                        {user && (
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <img
                                            src={user.avatar || "./avt.png"}
                                            className="w-10 h-10 rounded-full"
                                            alt=""
                                        />
                                        <span className="font-medium">{user.username}</span>
                                    </div>
                                    {/* <button
                                        onClick={addUser}
                                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary transition"
                                    >
                                        Add
                                    </button> */}
                                    <button
                                        onClick={sendFriendRequest}
                                        className="px-1 py-1 bg-primary text-white rounded-lg hover:bg-secondary transition"
                                    >
                                        Send Friend Request
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Friend Requests Popover */}
            {showFriendRequests && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-96 max-h-[80vh] overflow-hidden">
                        <div className="p-4 border-b flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Friend Requests</h3>
                            <button 
                                onClick={() => setShowFriendRequests(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition"
                            >
                                <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
                            </button>
                        </div>
                        
                        <div className="p-4 overflow-y-auto max-h-[60vh]">
                            {/* Received Requests */}
                            {friendRequests.received.length > 0 && (
                                <div className="mb-6">
                                    <h4 className="text-sm font-semibold text-gray-500 mb-2">Received</h4>
                                    {friendRequests.received.map((request) => (
                                        <div key={request.id} className="bg-gray-50 rounded-lg p-2 mb-2">
                                            <div className="flex items-center gap-3 mb-2 p-2">
                                                <img 
                                                    src={request.senderInfo.avatar || "./avt.png"} 
                                                    className="w-10 h-10 rounded-full"
                                                    alt=""
                                                />
                                                <div>
                                                    <p className="font-medium">{request.senderInfo.username}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {format(request.timestamp?.toDate())}
                                                    </p>
                                                </div>
                                            </div>
                                            {request.status === 'pending' ? (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleFriendRequest(request.id, 'accepted')}
                                                        className="flex-1 bg-primary text-white py-2 rounded-lg hover:bg-secondary transition"
                                                    >
                                                        Accept
                                                    </button>
                                                    <button
                                                        onClick={() => handleFriendRequest(request.id, 'declined')}
                                                        className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition"
                                                    >
                                                        Decline
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className={`text-sm ${
                                                    request.status === 'accepted' ? 'text-green-500' : 'text-red-500'
                                                }`}>
                                                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Sent Requests */}
                            {friendRequests.sent.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-500 mb-2">Sent</h4>
                                    {friendRequests.sent.map((request) => (
                                        <div key={request.id} className="bg-gray-50 rounded-lg p-3 mb-2">
                                            <div className="flex items-center gap-3">
                                                <img 
                                                    src={request.receiverInfo.avatar || "./avt.png"} 
                                                    className="w-10 h-10 rounded-full"
                                                    alt=""
                                                />
                                                <div>
                                                    <p className="font-medium">{request.receiverInfo.username}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {format(request.timestamp?.toDate())}
                                                    </p>
                                                </div>
                                                <span className={`ml-auto text-sm ${
                                                    request.status === 'pending' ? 'text-yellow-500' :
                                                    request.status === 'accepted' ? 'text-green-500' : 'text-red-500'
                                                }`}>
                                                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {friendRequests.received.length === 0 && friendRequests.sent.length === 0 && (
                                <div className="text-center text-gray-500 py-8">
                                    No friend requests
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ChatList