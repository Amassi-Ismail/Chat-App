import "./chat-ins.css"
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faCamera, faFaceLaugh, faImage, faMicrophone} from "@fortawesome/free-solid-svg-icons";
import {useEffect, useRef, useState} from "react";
import {arrayUnion, doc, getDoc, onSnapshot, updateDoc} from "firebase/firestore";
import uploadImg, {db} from "../../config/firebase";
import {chatStore} from "../../config/chatState";
import {userStore} from "../../config/userState";
import { format } from "timeago.js";

const ChatIns = () => {
    const [text, setText] = useState("");
    const endRef = useRef(null);
    const [chat, setChat] = useState();
    const { chatId, user } = chatStore();
    const { currUser } = userStore();
    const [img, setImg] = useState({
        file: null,
        url: "",
    });


    useEffect(() => {
        endRef.current?.scrollIntoView({behavior: "smooth"});
    })

    useEffect(() => {
        const unSub = onSnapshot(doc(db, "chats", chatId), (res) =>{
            setChat(res.data());
            }
        );
        return () => {
            unSub();
        }
    }, [chatId])

    const sendMessage = async () => {
        if (text === "") return;

        let imgUrl = null;


        try {
            if (img.file) {
                imgUrl = await uploadImg(img.file);
            }

                await updateDoc(doc(db, "chats", chatId), {
                messages: arrayUnion({
                    senderId: currUser.id,
                    text: text,
                    ...(imgUrl && {img: imgUrl}),
                    createdAt: new Date()
                })
            });

            const userIds = [currUser.id, user.id];

            for (const id of userIds) {

            const userChatsRef = doc(db, "userchats", id);
            const userChatsSnap = await getDoc(userChatsRef);

            if (userChatsSnap.exists()) {
                const userChatsData = userChatsSnap.data();
                const chatIndex = userChatsData.chats.findIndex(chat => chat.chatId === chatId);

                userChatsData.chats[chatIndex].lastMessage = text;
                userChatsData.chats[chatIndex].isSeen = id === currUser.id;
                userChatsData.chats[chatIndex].updatedAt = Date.now();

                await updateDoc(userChatsRef, {
                    chats: userChatsData.chats,
                });
            }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setImg({
                file: null,
                url: ""
            });
            setText("");
        }


    }

    const handleImgMessage = (e) => {
        if (e.target.files[0]) {
            setImg({
                file: e.target.files[0],
                url: URL.createObjectURL(e.target.files[0])
            });
        }
    }

    return (
        <div className='chat-ins'>
            <div className='header'>
                <div className='user'>
                    <img src={user.avatar} alt='user.png' className='avatar'/>
                    <div className='texts'>
                        <span className='name'>{user.username}</span>
                    </div>
                </div>
            </div>
            <div className='main'>
                {chat?.messages?.map((message) => (<div className={message.senderId ===currUser?.id ? "message-own" : "message"} key={message?.createdAt}>
                    <div className='texts'>
                        {message.img && <img src={message.img} alt='img.png'/>}
                        <p className='message-text'>{message.text}</p>
                        <span>{format(message.createdAt.toDate())}</span>
                    </div>
                </div>))}
                {img.url && (<div className="message-own">
                    <div className='texts'>
                        <img src={img.url} alt=""/>
                    </div>
                </div>)
                }
                <div ref={endRef}></div>
            </div>
            <div className='bottom'>
                <div className='icons'>
                    <label htmlFor="file">
                        <FontAwesomeIcon className='icon-ins' icon={faImage}></FontAwesomeIcon>
                    </label>
                    <input type="file" id="file" style={{ display: 'none' }} onChange={handleImgMessage}/>
                    <FontAwesomeIcon className='icon-ins' icon={faCamera}></FontAwesomeIcon>
                    <FontAwesomeIcon className='icon-ins' icon={faMicrophone}></FontAwesomeIcon>
                </div>
                <input className="send-input" type='text' placeholder='Send a message' onChange={(e) => setText(e.target.value)} />
                <div className='emoji'>
                    {/*<img src='/emoji.png' alt='emoji.png'/>*/}
                    <FontAwesomeIcon className='icon-ins' icon={faFaceLaugh}/>
                </div>
                <button className='send-btn' onClick={sendMessage}>Send</button>
            </div>
        </div>
    )
}

export default ChatIns