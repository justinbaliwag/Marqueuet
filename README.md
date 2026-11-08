# Marqueuet — Team Collaboration Guide

The project is hosted and automatically deployed via GitHub Pages:

**Live Demo & Deployment:**  [https://justinbaliwag.github.io/Marqueuet/](https://justinbaliwag.github.io/Marqueuet/)

> * Any approved pull request merged into the main branch automatically updates this live URL.

---

This repository contains the source code for the **Marqueuet** project. If you are new to Git and GitHub, this guide explains the core concepts and provides the exact terminal commands needed to collaborate effectively without overwriting each other's work.

##  Project Directory Structure
```text
Marqueuet/
├── index.html        (Structure & semantic markup only)
├── style.css         (Apple-grade translucent glassmorphism & styles)
├── app.js            (Spring physics & OSINT data logic)
├── .gitignore        (Prevents local OS/editor files from being tracked)
└── README.md         (Team documentation & deployment guides)
```

* **`index.html`**: Handles the layout, sections, navigation bars, and modals.
* **`style.css`**: Handles color palettes, typography, responsive grids, and translucent blur materials.
* **`app.js`**: Handles simulated social feeds, comparison inputs, chart updates, and spring interactions.
---

## 1. What is "Cloning"?

Before you can work on this project, you need a local copy of the project files on your own computer.

**Cloning** downloads the entire project repository—including all files, markup, scripts, and complete version history—from GitHub directly onto your hard drive.

> **Analogy:** Think of the remote repository as a shared master document hosted in cloud storage. "Cloning" downloads an exact, linked duplicate onto your computer so you can open and edit files locally in your code editor.

---

## 2. How to Clone the Repository

Follow these instructions in your terminal or command prompt to download your local working directory.

### Prerequisites
Ensure [Git](https://git-scm.com/) is installed on your computer.

### Step 1: Open Terminal or Command Prompt
* **Windows:** Press `Win + S`, type `cmd`, and press **Enter**.
* **macOS / Linux:** Open the **Terminal** application.

### Step 2: Navigate to Your Working Directory
Use the `cd` (change directory) command to choose where to save the project (for example, your Desktop):
```bash
cd Desktop
```

### Step 3: Clone the Repository
Run the clone command using the repository URL:
```bash
git clone https://github.com/justinbaliwag/Marqueuet.git
```

### Step 4: Enter the Cloned Directory
Move into the newly created folder:
```bash
cd Marqueuet
```

*Verification:* Run `dir` (Windows) or `ls` (macOS/Linux). You should see the project files, including `index.html`.

---

## 3. What is a "Branch"?

When multiple teammates modify the same files simultaneously, editing a single shared copy directly leads to code conflicts and accidental overwrites.

A **Branch** is an isolated, independent workspace within Git.

> **Analogy:** The `main` branch represents the official, working version of your application. When you branch off, you take a snapshot of that code into a separate draft room. You can build features, adjust styling, and test changes safely without disrupting teammates. Once finished and verified, your branch merges back into `main`.

---

## 4. How to Create and Work on Your Own Branch

Never push experimental work directly to `main`. Follow this workflow for each new feature, bug fix, or section update:

### Step 1: Update Your Local Main Branch
Before starting new work, pull the latest changes submitted by your teammates:
```bash
git checkout main
git pull origin main
```

### Step 2: Create and Switch to a New Branch
Use the `checkout -b` flag followed by a clear, lowercase branch name (e.g., `feature/sidebar-update` or `jules/radar-chart`):
```bash
git checkout -b feature/your-feature-name
```
*Verification:* Run `git branch`. An asterisk (`*`) will appear beside your new branch name, confirming it is active.

### Step 3: Edit Your Code
Open the project in VS Code or your preferred text editor, make your adjustments, and save your files.

### Step 4: Stage and Commit Your Changes
Tell Git which modified files to include, then record a clear snapshot message:
```bash
git add .
git commit -m "feat: brief summary of changes made"
```

### Step 5: Push the Branch to GitHub
Send your branch to the remote GitHub repository:
```bash
git push -u origin feature/your-feature-name
```

---

## 5. Merging Changes (Pull Requests)

Once your branch is pushed:

1. Open the repository on GitHub: `https://github.com/justinbaliwag/Marqueuet`
2. Look for the banner highlighting your recently pushed branch and click **Compare & pull request**.
3. Add a concise title and description summarizing what was added or changed.
4. Click **Create pull request**.
5. Alert your teammates to review your updates. Once approved, merge the Pull Request into `main`.
