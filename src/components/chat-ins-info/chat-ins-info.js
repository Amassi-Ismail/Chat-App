import "./chat-ins-info.css"
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faCancel, faSignOut} from "@fortawesome/free-solid-svg-icons";
import {auth, db} from "../../config/firebase";
import {chatStore} from "../../config/chatState";
import {arrayUnion, doc, updateDoc, arrayRemove} from "firebase/firestore";
import {userStore} from "../../config/userState";


const ChatInsInfo = () => {
    const { user } = chatStore();

    const { chatId, isCurrUserBlocked, isOthUserBlocked, onBlockChange, resetChat } = chatStore();
    const { currUser } = userStore();

    const blockUser = async () => {
        if (!user) return;

        const userDocRef = doc(db, "users", currUser.id);

         try {
            await updateDoc(userDocRef, {
                blocked: isOthUserBlocked ? arrayRemove(user.id) : arrayUnion(user.id)
            });
            onBlockChange();
         } catch (err) {
             console.log(err);
         }
    }

    return (<div className="chat-ins-info">
        <div className='chat-ins-info'>
            <div className="user">
                <img src={isCurrUserBlocked || isOthUserBlocked ? "./avt.png" : user.avatar} alt="user-chat"/>
                <h2>{isCurrUserBlocked || isOthUserBlocked ? "User" : user.username}</h2>
            </div>
            <div className="info">
                <button onClick={blockUser}>

                    <FontAwesomeIcon icon={faCancel} />{isCurrUserBlocked ? "You are Blocked" : isOthUserBlocked ? "User Blocked" : "Block User"}
                </button>
                <button className="logout" onClick={()=>{
                    auth.signOut()
                }}><FontAwesomeIcon icon={faSignOut} />Log Out
                </button>
            </div>
        </div>
        </div>
    )
}

export default ChatInsInfo