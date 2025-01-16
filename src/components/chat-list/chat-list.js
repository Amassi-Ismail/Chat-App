import "./chat-list.css"
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faMinus, faPlus, faSearch} from "@fortawesome/free-solid-svg-icons";
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
    deleteDoc
} from "firebase/firestore";
import {db} from "../../config/firebase";
import {toast} from "react-toastify";
import {chatStore} from "../../config/chatState";

const ChatList = () => {
    const [addClicked, setAddClicked] = useState(true);
    const [chats, setChats] = useState([]);
    const { currUser } = userStore();
    const [user, setUser] = useState(null);
    const { changeChat } = chatStore();

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


    const searchUser = async e => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const username = formData.get("username");

        try {
            const userRef = collection(db, "users");
            const q = query(userRef, where("username", "==", username));
            const queryResult = await getDocs(q);

            if (!queryResult.empty) {
                setUser(queryResult.docs[0].data());
            }

        } catch (err) {
            toast.error(err.message);
            console.log(err.message);
        }
    }

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

    const removeChat = async (chat, user) => {
        const userChatsRef = collection(db, "userchats");
        const chatRef = doc(db, "chats", chat.chatId);

        try {
            await updateDoc(doc(userChatsRef, user.id), {
                chats: arrayRemove({ chatId: chat.chatId }) // Assuming chatId is the identifier
            });

            await updateDoc(doc(userChatsRef, currUser.id), {
                chats: arrayRemove({ chatId: chat.chatId }) // Assuming chatId is the identifier
            });

            await deleteDoc(chatRef);

            setChats((prevChats) => prevChats.filter(chat1 => chat1.chatId !== chat.chatId));
            toast.success("Chat removed successfully!");

        } catch (err) {
            console.log(err.message);
            toast.error("Error removing chat: " + err);
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


    return (
        <div className='chat-list'>
            <div className='current-user'>
            <div className='user-info'>
                <img className='user-avatar' src={currUser.avatar || "/emoji.png"} alt='avatar.png'/>
                <h2 className='user-name'>{currUser.username}</h2>
            </div>
                <div className='side-control'>
                    <img className='more-png' src='/more.png' alt='more1.png'/>
                </div>
            </div>
            <div className='search-container'>
                <div className='search-bar'>
                    <FontAwesomeIcon className='search-icon' icon={faSearch} />
                    <input className='search-input' type='text' name='search' placeholder='Search...'/>
                </div>
                <>{
                  addClicked ? (
                      <FontAwesomeIcon className='plus-icon' icon={faPlus} onClick={() => setAddClicked((prev) => !prev)}/>
                  ) : <FontAwesomeIcon className='plus-icon' icon={faMinus} onClick={() => setAddClicked((prev) => !prev)}/>
                    }</>

            </div>
            <div className='chat-list-inn'>
                {chats.map((chat) => (
                    <div className='chat-list-item' key={chat.chatId} onClick={() => selectChat(chat)} style={{
                        backgroundColor: chat?.isSeen ? "transparent" : "orange"
                    }}>
                        <img className='chat-avatar' src={chat.user.avatar || "./avt.png"} alt='avatar.png'/>
                        <div className='chat-info'>
                            <span className='chat-user-name'>{chat.user.username}</span>
                            <p className='last-text'>{chat.lastMessage}</p>
                        </div>
                        <button onClick={() => removeChat(chat, chat.user)}>Delete chat</button>
                    </div>
                ))}

                {!addClicked && <div className="addUser">
                    <form onSubmit={searchUser}>
                        <input type="text" placeholder="Username" name="username"/>
                        <button>Search</button>
                    </form>
                    {user && <div className="user">
                        <div className="detail">
                            <img src={user.avatar || "./avt.png"} alt=""/>
                            <span>{user.username}</span>
                        </div>
                        <button onClick={addUser}>Add User</button>
                    </div>}
                </div>}
            </div>
        </div>
    )
}

export default ChatList