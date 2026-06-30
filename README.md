# SecVoice: Transformer-Driven Deepfake Voice Analyzer (Frontend UI)

This repository contains the frontend User Interface (UI) for the **SecVoice** project, an advanced deepfake voice detection system. The UI is built using React and Vite, providing a seamless experience for real-time streaming evaluation and static file forensic verification.

**Note:** This guide is exclusively for setting up the UI. The backend (Machine Learning inference API) and the database (Firebase Firestore) are already implemented, configured, and publicly accessible. No additional setup is required for them.

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your system:
- **Node.js**: Version 18.0.0 or higher is recommended. You can download it from [nodejs.org](https://nodejs.org/).
- **npm**: (Node Package Manager) which comes bundled with Node.js.
- **Git**: (Optional) If you plan to clone the repository using Git.

---

## 🛠️ Step-by-Step Setup Process

### Step 1: Obtain the Source Code
If you have the source code as a compressed folder, extract it to your desired workspace directory. If you are using Git, clone the repository using your terminal:

```bash
# Clone the repository (replace with the actual repository URL)
git clone <repository-url>

# Navigate into the project directory
cd asvspoof-project-frotend
```

### Step 2: Install Node Dependencies
Open your terminal or command prompt, ensure you are in the root directory of the project (where the `package.json` file is located), and execute the following command:

```bash
# Install all required packages and dependencies
npm install
```
*This command reads the `package.json` and `package-lock.json` files and downloads all necessary libraries (such as React, Vite, Tailwind CSS, Firebase SDK, Recharts, and Lucide React) into a local `node_modules` folder.*

### Step 3: Start the Development Server
Once the installation process is successfully completed, you can boot up the local development server to run the application:

```bash
# Start the Vite development server
npm run dev
```

After running this command, Vite will output a local server address in your terminal. It typically looks like this:
```text
  VITE v5.3.1  ready in 350 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h to show help
```
Open your preferred web browser and navigate to `http://localhost:5173/` to access the SecVoice application.

---

## 📁 Project Structure Overview
To help you navigate the codebase, here is a brief overview of the key components:
- **`src/components/Auth.jsx`**: Handles user registration, authentication, and secure login with robust password validation.
- **`src/components/RealtimeInference.jsx`**: Establishes a secure WebSocket (`wss://`) connection to stream local microphone hardware captures to the ML API for real-time spoof detection.
- **`src/components/Inference.jsx` & `FileUploadInference.jsx`**: Manages static audio file uploads (`.wav`, `.flac`, `.mp3`) for forensic verification against the deep learning model.
- **`src/components/HistoryLog.jsx`**: Fetches, analyzes, and displays visual audit trail logs and telemetry from Firebase Firestore using interactive charts.
- **`src/firebase.js`**: Contains the pre-configured Firebase initialization keys and project bindings.
- **`vite.config.js`**: Configuration file for the Vite bundler.

---

## 🛑 Troubleshooting Common Issues

- **Microphone Initialization Blocked**: If you are testing the Real-Time Streaming Evaluation, ensure that your browser has granted microphone permissions to `localhost`.
- **Port Conflicts**: If port `5173` is already in use by another application, Vite will automatically bind to the next available port (e.g., `5174`). Always check the terminal output for the correct URL.
- **WebSocket Streaming Failures**: Ensure your network firewall allows outbound connections over secure WebSocket protocols (`wss://`), as this is required to communicate with the hosted streaming cluster.
