# AI Market Intelligence SaaS (For Trial)

## Tech Stack

- **Frontend:** HTML5, CSS3, JavaScript
- **Backend:** Node.js
- **Data Source:** Apify Free TikTok Scraper Actor API

---

## Prerequisites Before Starting

Before running the code, set up these two prerequisites:

1. **Install Node.js on your computer:**
   - Download the LTS version from https://nodejs.org/
   - Run the installer and click **Next** on all prompts until finished.
   - Verify it works by opening Command Prompt and typing:
     - `node -v`
     - `npm -v`

2. **Get a free Apify API Token:**
   - Create a free account at https://apify.com/
   - Click your profile picture / initials in the top-right corner.
   - Go to **Settings** > **Integrations** tab.
   - Under **API tokens**, click the copy icon next to **Default API token**. Keep this copied for Step 4.

---

## Step-by-Step Setup Guide

### Step 1: Open Terminal and Go to Desktop
Decide where on your computer you want to store this project (for example, your Desktop).

1. Open **Command Prompt (CMD)** or **Git Bash**.
2. Run this command to move to your Desktop:

cd Desktop

---

### Step 2: Clone the GitHub Repository
Run this command to download the project folder directly to your Desktop:

git clone https://github.com/justinbaliwag/WST-FinalProject-Prototype.git

Now, enter the newly downloaded folder:

cd WST-FinalProject-Prototype

*(All following commands must be run inside this folder).*

---

### Step 3: Install Required Dependencies
While inside the `WST-FinalProject-Prototype` folder in your terminal, run:

npm install

This automatically reads `package.json` and installs Express, CORS, and Dotenv.

**Note for Windows PowerShell Users:**
If Windows blocks this with `running scripts is disabled on this system`, switch your terminal dropdown in VS Code to **Command Prompt (CMD)**, or run this once in PowerShell as Administrator:

Set-ExecutionPolicy RemoteSigned -Scope CurrentUser

---

### Step 4: Create and Configure the .env File
Because API tokens are secret, they are not saved on GitHub. Each member needs to create their own local configuration file:

1. Open your code editor (like VS Code) and open the `WST-FinalProject-Prototype` folder.
2. In the root directory (the same level as `server.js` and `package.json`), create a new file named:

.env

3. Open the `.env` file and paste the following line, replacing the right side with your actual Apify token:

APIFY_TOKEN=paste_your_apify_token_here

4. Save the file (`Ctrl + S`).

---

### Step 5: Start the Backend Server
In your terminal (pointing inside `WST-FinalProject-Prototype`), run:

node server.js

When successful, your terminal will display:

Server running at http://localhost:3000

**Important:** Keep this terminal window open. The server must remain running in the background to handle requests.

---

### Step 6: Launch and Test the Application
1. Open your File Explorer and go to your folder (`Desktop\WST-FinalProject-Prototype`).
2. Double-click the file named **`index.html`** to open it in your browser (Chrome, Edge, etc.).
3. In the search box, enter a search term.
4. Click **Analyze**.
5. Wait roughly 10–15 seconds for the scraper to pull live data.
6. The dashboard will populate with:
   - **AI Summary:** Aggregated post volume and interaction statistics.
   - **Engagement Metrics:** A horizontal bar chart displaying likes and comments.
   - **Live Sources:** Clickable links leading directly to the live social posts.

---

## How to Stop the Server
When you are done testing, click into the terminal window running `node server.js` and press:

Ctrl + C
