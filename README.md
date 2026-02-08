# Emoji Charades Leaderboard 🏆

A real-time, high-performance leaderboard dashboard for the Emoji Charades event at Acumen'26 NITT. Built with Node.js, Express, and vanilla frontend technologies for maximum speed and compatibility.

## 🌟 Features

*   **Live Leaderboard**: Real-time updates with trend indicators (Up/Down/Neutral).
*   **Analytics Dashboard**: Visual charts for team performance and score distribution.
*   **Presentation Mode**: Optimized view for big-screen projection.
*   **Customizable Themes**: Multiple color palettes (Neon Lime, Cyberpunk, etc.).
*   **Admin Tools**: Sorting, Filtering, and CSV Export.

## 🚀 Installation & Setup

Follow these steps to run the project on your local machine.

### Prerequisites

*   [Node.js](https://nodejs.org/) (v14 or higher) installed.
*   [Git](https://git-scm.com/) installed.

### Steps

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/Mukul-only/emojileaderboard.git
    cd emojileaderboard
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment**
    *   Create a `.env` file in the root directory if you need to configure a specific MongoDB URL or Port (Optional for default local setup).
    *   Default Port: `3000`

4.  **Run the Application**
    ```bash
    npm start
    ```
    *   For development (if nodemon is installed): `npm run dev`

5.  **Access the Dashboard**
    *   Open your browser and go to: `http://localhost:3000`

## 🛠️ Tech Stack

*   **Backend**: Node.js, Express.js
*   **Frontend**: HTML5, CSS3 (Custom Properties), Vanilla JavaScript
*   **Database**: MongoDB (Integrated via `server.js`)
*   **Icons**: Lucide Icons

## 📱 Usage Guide

*   **Navigation**: Use the sidebar to switch between Leaderboard, Analytics, and Settings.
*   **Presentation Mode**: Go to Settings -> Toggle "Presentation Mode" for a distraction-free full-screen view.
*   **Export**: Click "Export CSV" in the header to download current standings.

## 🤝 Contribution

1.  Fork the project
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request
