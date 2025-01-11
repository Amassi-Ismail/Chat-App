import './App.css';
import ChatList from "./components/chat-list/chat-list";
import ChatIns from "./components/chat-ins/chat-ins";
import ChatInsInfo from "./components/chat-ins-info/chat-ins-info";
import Authentication from "./components/authentication/authentication";
import Notifications from "./components/notifications/notifications";
import {useEffect} from "react";
import {auth} from "./config/firebase";
import { onAuthStateChanged } from "firebase/auth"
import {userStore} from "./config/userState";
import {chatStore} from "./config/chatState";

function App() {
    const {currUser, isLoading, fetchUser} = userStore();
    const { chatId } = chatStore();

    useEffect(() => {
        const unSub = onAuthStateChanged(auth, (user) => {
            fetchUser(user?.uid);
        });
        return () => {
            unSub();
        }
    }, [fetchUser])

    if (isLoading) return <div className='loading-seg'>Redirecting...</div>;

  return (
      <>
          {
              currUser ? (
                  <div className="App">
                      <ChatList/>
                      {chatId && <ChatIns/>}
                      {chatId && <ChatInsInfo/>}
                  </div>
                  ) : (<Authentication/>)
                  }
                  <Notifications/>
      </>
              );
          }

    export default App;
