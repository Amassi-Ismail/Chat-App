import "./chat-ins-info.css"
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faCancel, faSignOut} from "@fortawesome/free-solid-svg-icons";
import {auth} from "../../config/firebase";
import {chatStore} from "../../config/chatState";


const ChatInsInfo = () => {
    const { user } = chatStore();

    return (<div className="chat-ins-info">
        <div className='chat-ins-info'>
            <div className="user">
                <img src={user.avatar} alt="user-chat"/>
                <h2>{user.username}</h2>
            </div>
            <div className="info">
                <button /*onClick={handleBlock}*/>
                    {/*{isCurrentUserBlocked*/}
                    {/*    ? "You are Blocked!"*/}
                    {/*    : isReceiverBlocked*/}
                    {/*        ? "User blocked"*/}
                    {/*        : "Block User"}*/}
                    <FontAwesomeIcon icon={faCancel} />Block User
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