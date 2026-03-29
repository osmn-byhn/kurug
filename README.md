<p align="center">
  <img src="./public/logo.png" width="128" alt="Kurug Logo" />
</p>

<h1 align="center">Kurug</h1>

<p align="center">
  <strong>Modern, Flexible and Powerful Desktop Widget Manager</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Version-1.0.0-blue?style=for-the-badge" alt="Version" />
  <img src="https://img.shields.io/badge/Platform-Linux%20%7C%20Windows%20%7C%20Mac-blueviolet?style=for-the-badge" alt="Platform" />
  <img src="https://img.shields.io/badge/Stack-React%20%7C%20Electron%20%7C%20Vite-61dafb?style=for-the-badge" alt="Stack" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License" />
</p>

## 🌟 What is Kurug?

**Kurug** is an open-source, modern widget management platform designed to make your desktop entirely personal. Whether it's weather, a stock ticker, or just a stylish clock; Kurug allows you to place any content prepared with web technologies (HTML, JS, CSS) directly on your desktop as a persistent and interactive "widget".

## ✨ Key Features

* **🚀 Multi-Source Support:**
  * **Git Repositories:** Paste GitHub, GitLab, or Bitbucket links; Kurug automatically clones and runs them.
  * **Direct URLs:** Instantly turn any website or web application into a widget.
  * **Local Folders:** Directly link local projects you've developed on your computer.
* **🛡️ Isolated Execution:** Each widget runs as an independent process from the main application. If one widget crashes, others or the main app remain unaffected.
* **🎨 Modern Design:** The interface, prepared with glassmorphism aesthetics, fits perfectly into your system with both Dark and Light theme options.
* **🛠️ Easy Management:** Manage all your widgets from a single panel. Toggle them all on/off with one click or customize their settings (size, position, opacity).
* **📦 Native Performance:** Provides low resource consumption and high performance through native file access, bypassing heavy packaging methods.

## 🛠️ How to Use?

1. **Add Widget:** Click the **"Add Widget"** button on the home screen.
2. **Define Source:**
    * You can enter a Git link (Kurug downloads it for you).
    * You can select a folder.
    * Or just enter a URL.
3. **Activation:** Turn on the switch next to the widget added to the list. Your widget will appear on your desktop in seconds!
4. **Personalization:** Click the "Settings" icon to adjust the size and position of the widget on the screen as you wish.

## 🏗️ Technical Architecture

Kurug is built with the most modern web technologies:

* **Frontend:** React 19 + TypeScript + Vite (Ultra-fast development and build process).
* **Styling:** Tailwind CSS (Modern and flexible design system).
* **Runtime:** Electron (Native desktop integration).
* **Engine:** `@osmn-byhn/widget-core` (Custom engine for widget isolation and system integration).
* **Database:** LowDB (Fast and reliable local data storage).

## 🚀 Development and Installation

To run the project locally:

```bash
# Install dependencies
npm install

# Start in development mode
npm run electron:dev
```

### Packaging (Build)

Kurug has optimized packaging scripts for different operating systems:

```bash
# For Windows (.exe)
npm run package:win

# For Debian/Ubuntu (.deb)
npm run package:deb

# For Fedora/RedHat (.rpm)
npm run package:rpm

# For AppImage (.AppImage)
npm run package:appimage

# For macOS (.dmg)
npm run package:mac
```

## 📄 License

This project is licensed under the **MIT** License - see the [LICENSE](LICENSE) file for details.

---
<p align="center">
  Crafted with ❤️ by <a href="https://github.com/osmn-byhn">Osman Beyhan</a>
</p>
