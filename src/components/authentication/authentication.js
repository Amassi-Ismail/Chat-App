import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import { faCloudUpload } from "@fortawesome/free-solid-svg-icons";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import uploadImg, { auth, db } from "../../config/firebase";
import { userStore } from "../../config/userState"; // Add this import

const Authentication = () => {
    const { fetchUser } = userStore(); // Add this line
    const [imgChange, setImgChange] = useState({ file: null, url: "" });
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);

    const handleImgSubmission = (e) => {
        if (e.target.files[0]) {
            setImgChange({
                file: e.target.files[0],
                url: URL.createObjectURL(e.target.files[0])
            });
        }
    };

    const login = async (e) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.target);
        const { email, password } = Object.fromEntries(formData);

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            await fetchUser(userCredential.user.uid); // Add this line
            toast.success("Sign in Successfully");
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    const register = async (e) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.target);
        const { username, email, password } = Object.fromEntries(formData);

        try {
            const data = await createUserWithEmailAndPassword(auth, email, password);
            let imgUrl = ""; // Default empty string for avatar URL

            // Only attempt to upload if an image was selected
            if (imgChange.file) {
                imgUrl = await uploadImg(imgChange.file);
            }

            await setDoc(doc(db, "users", data.user.uid), {
                username,
                email,
                avatar: imgUrl, // Will be empty string if no image was uploaded
                id: data.user.uid,
                blocked: [],
                lastActive: serverTimestamp(),
                isOnline: true
            });

            await setDoc(doc(db, "userchats", data.user.uid), {
                chats: [],
            });

            await fetchUser(data.user.uid);
            toast.success('User registered successfully.');
        } catch (err) {
            console.log(err);
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full max-w-4xl mx-auto p-6 flex items-center justify-center">
            <div className="bg-white w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
                {/* Left Panel - Form */}
                <div className="w-full md:w-1/2 p-8">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-gray-800">
                            {isSignUp ? "Create Account" : "Welcome Back"}
                        </h2>
                        <p className="text-gray-600 mt-2">
                            {isSignUp ? "Sign up to get started" : "Sign in to continue"}
                        </p>
                    </div>

                    <form onSubmit={isSignUp ? register : login} className="space-y-4">
                        {isSignUp && (
                            <>
                                <div>
                                    <input
                                        type="text"
                                        placeholder="Username"
                                        name="username"
                                        className="w-full px-4 py-3 rounded-lg bg-gray-100 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all"
                                    />
                                </div>
                                <div className="relative">
                                    <label 
                                        htmlFor="file" 
                                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border-2 border-dashed border-primary cursor-pointer hover:bg-primary/5 transition-all"
                                    >
                                        {imgChange.url ? (
                                            <img src={imgChange.url} alt="" className="w-10 h-10 rounded-full object-cover"/>
                                        ) : (
                                            <FontAwesomeIcon icon={faCloudUpload} className="text-2xl text-primary"/>
                                        )}
                                        <span className="text-gray-600">
                                            {imgChange.url ? "Change avatar" : "Upload avatar"}
                                        </span>
                                    </label>
                                    <input
                                        type="file"
                                        id="file"
                                        className="hidden"
                                        onChange={handleImgSubmission}
                                    />
                                </div>
                            </>
                        )}
                        <div>
                            <input
                                type="email"
                                placeholder="Email"
                                name="email"
                                className="w-full px-4 py-3 rounded-lg bg-gray-100 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all"
                            />
                        </div>
                        <div>
                            <input
                                type="password"
                                placeholder="Password"
                                name="password"
                                className="w-full px-4 py-3 rounded-lg bg-gray-100 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all"
                            />
                        </div>
                        {!isSignUp && (
                            <div className="text-right">
                                <a href="#" className="text-sm text-primary hover:underline">
                                    Forgot Password?
                                </a>
                            </div>
                        )}
                        <button
                            disabled={loading}
                            className="w-full bg-primary text-white py-3 rounded-lg hover:bg-secondary transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                                    </svg>
                                    {isSignUp ? "Creating account..." : "Signing in..."}
                                </span>
                            ) : (
                                isSignUp ? "Sign Up" : "Sign In"
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-gray-600">
                            {isSignUp ? "Already have an account?" : "Don't have an account?"}
                            <button
                                onClick={() => setIsSignUp(!isSignUp)}
                                className="ml-2 text-primary hover:underline font-medium"
                            >
                                {isSignUp ? "Sign In" : "Sign Up"}
                            </button>
                        </p>
                    </div>
                </div>

                {/* Right Panel - Decoration */}
                <div className="hidden md:block w-1/2 bg-gradient-to-br from-primary to-secondary p-12 text-white">
                    <div className="h-full flex flex-col justify-center">
                        <h2 className="text-4xl font-bold mb-6">
                            {isSignUp ? "Welcome to Our Community!" : "Welcome Back!"}
                        </h2>
                        <p className="text-lg opacity-90 mb-8">
                            {isSignUp 
                                ? "Join our platform and connect with people from around the world."
                                : "Stay connected with your friends and family through instant messaging."
                            }
                        </p>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-white"/>
                                <p>Real-time messaging</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-white"/>
                                <p>File sharing</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-white"/>
                                <p>Group chats</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Authentication;