import "./authentication.css"
import {useEffect, useState} from "react";
import {toast} from "react-toastify";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faGoogle} from "@fortawesome/free-brands-svg-icons";
import {createUserWithEmailAndPassword, signInWithEmailAndPassword} from "firebase/auth";
import {doc, setDoc} from "firebase/firestore";
import uploadImg, {auth, db} from "../../config/firebase";


const Authentication = () => {
    const [imgChange, setImgChange] = useState({
        file: null,
        url: "",
    });

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const container = document.getElementById('container');
        const registerBtn = document.getElementById('register');
        const loginBtn = document.getElementById('login');

        registerBtn.addEventListener('click', () => {
            container.classList.add("active");
        });

        loginBtn.addEventListener('click', () => {
            container.classList.remove("active");
        });
    })

    const handleImgSubmission = (e) => {
        if (e.target.files[0]) {
            setImgChange({
                file: e.target.files[0],
                url: URL.createObjectURL(e.target.files[0])
            })
        }
    }

    const login = async (e) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.target);
        const { email, password } = Object.fromEntries(formData);

        try {
            await signInWithEmailAndPassword(auth, email, password);
            toast.success("Sign in Successfully");
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    }

    const register = async (e) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.target);
        const { username, email, password } = Object.fromEntries(formData);

        try {
            const data = await createUserWithEmailAndPassword(auth, email, password);
            const imgUrl = await uploadImg(imgChange.file);

            await setDoc(doc(db, "users", data.user.uid), {
                username,
                email,
                avatar: imgUrl,
                id: data.user.uid,
                blocked: []
            });

            await setDoc(doc(db, "userchats", data.user.uid), {
                chats: [],
            });

            toast.success('User registered successfully.');
        } catch (err) {
            console.log(err);
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (<div className="container" id="container">
        <div className="form-container sign-up">
            <form onSubmit={register}>
                <h1>Create Account</h1>
                <div className="social-icons">
                    <a className="icon"><FontAwesomeIcon icon={faGoogle} className='fa-brands fa-google-plus-g'></FontAwesomeIcon></a>
                </div>
                <span>or use your email for registration</span>
                <input type="text" placeholder="Name" name="username"/>
                <input type="email" placeholder="Email" name="email"/>
                <input type="password" placeholder="Password" name="password"/>
                <label htmlFor="file">
                    <img src={imgChange.url} alt=''/>
                    Upload an image
                </label>
                <input
                    type="file"
                    id="file"
                    style={{display: "none"}}
                    onChange={handleImgSubmission}
                />
                <button disabled={loading}>{loading ? 'Signing up!' : "SIGN UP"}</button>
            </form>
        </div>
        <div className="form-container sign-in">
            <form onSubmit={login}>
                <h1>Sign In</h1>
                <div className="social-icons">
                    <a className="icon"><FontAwesomeIcon icon={faGoogle} className='fa-brands fa-google-plus-g'></FontAwesomeIcon></a>
                </div>
                <span>or use your email password</span>
                <input type="email" placeholder="Email" name="email"/>
                <input type="password" placeholder="Password" name="password"/>
                <a className='forgot-password'>Forget Your Password?</a>
                <button disabled={loading}>{loading ? 'Signing in!' : "SIGN IN"}</button>
            </form>
        </div>
        <div className="toggle-container">
            <div className="toggle">
                <div className="toggle-panel toggle-left">
                    <h1>Welcome Back!</h1>
                    <p>Enter your personal details to use all of site features</p>
                    <button className="hidden" id="login">Sign In</button>
                </div>
                <div className="toggle-panel toggle-right">
                    <h1>Hello, Friend!</h1>
                    <p>Register with your personal details to use all of site features</p>
                    <button className="hidden" id="register">Sign Up</button>
                </div>
            </div>
        </div>
    </div>)
}

export default Authentication