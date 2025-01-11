import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { initializeApp } from "firebase/app";
import {toast} from "react-toastify";

//TODO: HERE NEEDS TO GO YOUR FIREBASE CONFIGURATION NEEDED FOR STORAGE, DATABASE AND AUTHENTICATION

const app = initializeApp(firebaseConfig);

export const storage = getStorage();

const uploadImg = async (file) => {
    const date = new Date();
    const storageRef = ref(storage, `images/${date + file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);


    return new Promise((resolve, reject) => {
        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                console.log('Upload is ' + progress + '% done');
                switch (snapshot.state) {
                    case 'paused':
                        console.log('Upload is paused');
                        break;
                    case 'running':
                        console.log('Upload is running');
                        break;
                }
            },
            (error) => {
                    reject("Upload failed" + error.message);
                    toast.error("Upload failed" + error.message);
            },
            () => {
                getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                    resolve(downloadURL);
                });
            }
        );
    })
}

    export default uploadImg;
    export const auth = getAuth();
    export const db = getFirestore();
