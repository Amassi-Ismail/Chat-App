# Chat-App

## Project Overview

This is a real-time chatting web application built using React and Firebase. It offers users a seamless communication experience through message exchanges, image uploads, and efficient user management. The project leverages powerful technologies such as Firebase Authentication for secure user access, Firestore for data storage, and Firebase Storage for handling user-generated content like images. Zustand state management is utilized for maintaining real-time updates across the chat application.

## Available Scripts

Within the project directory, you can execute the following scripts:

### `npm start`

Launches the app in development mode.\
Open [http://localhost:3000](http://localhost:3000) in your browser to view the app. The page automatically reloads if you make edits.\
You can also review any lint errors in the console.

### `npm test`

Activates the test runner in an interactive watch mode.\
Refer to the [running tests](https://facebook.github.io/create-react-app/docs/running-tests) section for more information.

### `npm run build`

Compiles the app for production into the `build` directory.\
It optimizes and bundles React for the best performance in production. The app's build is minified, and filenames are appended with hashes for cache busting.\
For deployment instructions, see the [deployment](https://facebook.github.io/create-react-app/docs/deployment) section.

### `npm run eject`

**Caution: This is irreversible! Once ejected, you cannot revert!**\
If dissatisfied with the default build setup and toolchain, executing this command gives you full control over configuration. Proceed with caution.

## Setup and Installation

To set up and run the Chat-App locally, follow these steps:

### Prerequisites

Ensure your environment has:

- [Node.js](https://nodejs.org/) (with npm included)
- A code editor (recommended: [Visual Studio Code](https://code.visualstudio.com/))

### Clone the Repository

1. Clone your forked repository to your local machine:
2. Navigate into the project directory: cd chat-app
3. Install the necessary dependencies: npm install


### Firebase Project Setup

1. Set up a Firebase project:
   - Access the [Firebase Console](https://console.firebase.google.com/).
   - Establish a new project or select an existing one.
   - Register a web app within your Firebase project.
   - Acquire your Firebase configuration (apiKey, authDomain, projectId, etc.)

2. Update the Firebase Configuration:

- Open the `src/config/firebase.js` file in your project.
- Copy and paste your Firebase configuration into the `firebaseConfig` object.


## Usage

### User Registration and Login

- Visit the homepage.

- To register:

  - Click "Create Account".

  - Complete username, email, and password fields.

  - Optionally upload an avatar.

  - Click "SIGN UP".

- To log in:

  - Click "Sign In".

  - Enter email and password.

  - Click "SIGN IN".

### Chat Functionality

- View the dashboard listing ongoing chats.

- Initiate a new chat:

  - Search users by username and select "Add User".

- Send messages:

  - Choose a chat to open.

  - Compose and send text/messages.

### Notifications

- Real-time notifications will indicate login successes, message dispatch confirmations, and errors.

### Logging Out

- Sign out by clicking the "Log Out" button within the chat interface.
