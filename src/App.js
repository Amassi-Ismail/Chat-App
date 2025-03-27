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
import { toast } from "react-toastify";  // Add this import
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCommentDots } from "@fortawesome/free-solid-svg-icons";

function App() {
    const {currUser, isLoading, fetchUser, updateUserStatus} = userStore();
    const { chatId } = chatStore();

    // Handle auth state changes
    useEffect(() => {
        const unSub = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    await fetchUser(user.uid);
                    // Set user as online when logging in
                    await updateUserStatus(user.uid, true);
                } catch (error) {
                    console.error("Error fetching user:", error);
                    toast.error("Error loading user data");
                }
            } else {
                // If there was a previous user, set them as offline
                if (currUser?.id) {
                    await updateUserStatus(currUser.id, false);
                }
                fetchUser(null);
            }
        });

        return () => unSub();
    }, [fetchUser]);

    // Handle browser close/refresh
    useEffect(() => {
        if (!currUser?.id) return;

        const handleBeforeUnload = async () => {
            try {
                await updateUserStatus(currUser.id, false);
            } catch (error) {
                console.error("Error updating status:", error);
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            // Only try to update status if user is still logged in
            if (auth.currentUser) {
                updateUserStatus(currUser.id, false);
            }
        };
    }, [currUser?.id]);

    if (isLoading) return <div className='loading-seg'>Redirecting...</div>;

    return (
        <>
            {currUser ? (
                <div className="flex h-screen  mx-auto p-4">
                    <div className="flex w-full gap-4 bg-white/10 backdrop-blur-sm p-4 rounded-2xl shadow-2xl">
                        <ChatList />
                        {chatId ? (
                            <>
                                <ChatIns />
                                <ChatInsInfo />
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center bg-white rounded-xl">
                                <div className="flex items-center gap-3 text-gray-500">
                                    <FontAwesomeIcon icon={faCommentDots} className="text-2xl" />
                                    <p className="text-lg">Select a chat to start messaging</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <Authentication />
            )}
            <Notifications />
        </>
    );
}

export default App;
