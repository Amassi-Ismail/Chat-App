import "./chat-ins-info.css"
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faArrowDown, faArrowUp, faCancel, faDownload, faSignOut} from "@fortawesome/free-solid-svg-icons";
import {auth} from "../../config/firebase";

const ChatInsInfo = () => {
    return (<div className="chat-ins-info">
        <div className='chat-ins-info'>
            <div className="user">
                <img src='' alt="user-chat"/>
                <h2>Test test</h2>
                <p>Lorem ipsum dolor sit amet.</p>
            </div>
            <div className="info">
                <div className="option">
                    <div className="title">
                        <span>Chat Settings</span>
                        {/*<img src="./arrowUp.png" alt=""/>*/}
                        <FontAwesomeIcon className='icon-option' icon={faArrowUp}></FontAwesomeIcon>
                    </div>
                </div>
                <div className="option">
                    <div className="title">
                        <span>Privacy & help</span>
                        {/*<img src="./arrowUp.png" alt=""/>*/}
                        <FontAwesomeIcon className='icon-option' icon={faArrowUp}></FontAwesomeIcon>
                    </div>
                </div>
                <div className="option">
                    <div className="title">
                        <span>Shared photos</span>
                        {/*<img src="./arrowDown.png" alt=""/>*/}
                        <FontAwesomeIcon className='icon-option' icon={faArrowDown}></FontAwesomeIcon>
                    </div>
                    <div className="photos">
                        <div className="photoItem">
                            <div className="photoDetail">
                                <img
                                    src="https://images.pexels.com/photos/7381200/pexels-photo-7381200.jpeg?auto=compress&cs=tinysrgb&w=800&lazy=load"
                                    alt=""
                                />
                                <span>photo_2024_2.png</span>
                            </div>
                            {/*<img src="./download.png" alt="" className="icon"/>*/}
                            <FontAwesomeIcon className='icon-option' icon={faDownload}></FontAwesomeIcon>
                        </div>
                        <div className="photoItem">
                            <div className="photoDetail">
                                <img
                                    src="https://images.pexels.com/photos/7381200/pexels-photo-7381200.jpeg?auto=compress&cs=tinysrgb&w=800&lazy=load"
                                    alt=""
                                />
                                <span>photo_2024_2.png</span>
                            </div>
                            {/*<img src="./download.png" alt="" className="icon"/>*/}
                            <FontAwesomeIcon className='icon-option' icon={faDownload}></FontAwesomeIcon>
                        </div>
                        <div className="photoItem">
                            <div className="photoDetail">
                                <img
                                    src="https://images.pexels.com/photos/7381200/pexels-photo-7381200.jpeg?auto=compress&cs=tinysrgb&w=800&lazy=load"
                                    alt=""
                                />
                                <span>photo_2024_2.png</span>
                            </div>
                            {/*<img src="./download.png" alt="" className="icon"/>*/}
                            <FontAwesomeIcon className='icon-option' icon={faDownload}></FontAwesomeIcon>
                        </div>
                        <div className="photoItem">
                            <div className="photoDetail">
                                <img
                                    src="https://images.pexels.com/photos/7381200/pexels-photo-7381200.jpeg?auto=compress&cs=tinysrgb&w=800&lazy=load"
                                    alt=""
                                />
                                <span>photo_2024_2.png</span>
                            </div>
                            {/*<img src="./download.png" alt="" className="icon"/>*/}
                            <FontAwesomeIcon className='icon-option' icon={faDownload}></FontAwesomeIcon>
                        </div>
                    </div>
                </div>
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