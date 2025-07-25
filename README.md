## Overview
**kgeet-front** is the React frontend application for the `kgeet` audio service. It provides a user-friendly interface to submit video URLs (e.g., YouTube), request audio downloads, and stream the audio directly in the browser with smooth playback.

The app interacts with the `kgeet-back` Spring Boot backend to: - Submit download requests - List available audio files - Stream audio with caching for seamless playback

## Features
- Simple and intuitive UI for submitting video URLs
- List downloaded audio files with playback controls
- Seamless audio streaming from backend
- Automatically handles download status and audio availability
- Clean design with responsive layout

## Prerequisites
- Node.js (v18+ recommended)
- npm or yarn - `kgeet-back` backend running on `localhost:8083` 
## Getting Started 
### 1. Clone the repository ```bash
git clone https://github.com/your-username/kgeet-front.git
cd kgeet-front`` 

### 2\. Install dependencies

`npm install # or yarn install` 

### 3\. Start the development server

`npm start # or yarn start` 

The app will be available at: `http://localhost:3000`

* * *

Usage Demo
----------

### Submitting a URL

*   Paste a supported video URL (e.g., YouTube)
    
*   Click **Download Audio**
    
*   Wait for the server to process and store the file
    

### Streaming Audio

*   Once available, the audio will appear in the list
    
*   Click **Play** to stream the audio from the backend
    

* * *

Screenshots
-----------

<img width="1467" height="841" alt="image" src="https://github.com/user-attachments/assets/ada20b24-2d6f-4a96-9792-e3b1430f8557" />
<img width="1468" height="552" alt="image" src="https://github.com/user-attachments/assets/283a6642-a8d1-454f-a111-7bf36df6ce14" />

* * *

Demo Video
----------

[React App.webm](https://github.com/user-attachments/assets/17e0b5f3-40d9-4be1-955f-40d50eb5aeae)

* * *

Configuration
-------------

If needed, you can update the backend API base URL in `.env`:

`REACT_APP_API_BASE_URL=http://localhost:8083` 
