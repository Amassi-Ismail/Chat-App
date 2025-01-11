import "./chat-ins.css"
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faCamera, faImage, faMicrophone} from "@fortawesome/free-solid-svg-icons";
import {useEffect, useRef, useState} from "react";

const ChatIns = () => {
    const [text, setText] = useState("");
    const endRef = useRef(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({behavior: "smooth"});
    })
    return (
        <div className='chat-ins'>
            <div className='header'>
                <div className='user'>
                    <img src='' alt='user.png' className='avatar'/>
                    <div className='texts'>
                        <span className='name'>Test test</span>
                        <p className='description'>Awake!</p>
                    </div>
                </div>
            </div>
            <div className='main'>
                <div className='message'>
                    <img src='' alt='user.png' className='message-avatar'/>
                    <div className='texts'>
                        <p className='message-text'>NopeNE GFRJKLDVANBLASDJHNDSALIJHN</p>
                        <span className='time-sent'>5 mins ago</span>
                    </div>
                </div>
                <div className='message-own'>
                    <div className='texts'>
                        <img src='' alt='img.png'/>
                        <p className='message-text'>NopebhjdhujvbdwsikabhvcahkiubhksdwaCBKHSabgadSHUWKBVK</p>
                        <span className='time-sent'>5 mins ago</span>
                    </div>
                </div>
                <div ref={endRef}></div>
            </div>
            <div className='bottom'>
                <div className='icons'>
                    <FontAwesomeIcon className='icon-ins' icon={faImage}></FontAwesomeIcon>
                    <FontAwesomeIcon className='icon-ins' icon={faCamera}></FontAwesomeIcon>
                    <FontAwesomeIcon className='icon-ins' icon={faMicrophone}></FontAwesomeIcon>
                </div>
                <input type='text' placeholder='Send a message' onChange={(e) => setText(e.target.value)} />
                <div className='emoji'>
                    <img src='/emoji.png' alt='emoji.png'/>
                </div>
                <button className='send-btn'>Send</button>
            </div>
        </div>
    )
}

export default ChatIns