# Pulse Player

<p align="center">
  <img src="resources/icon.png" width="96" alt="Pulse Player">
</p>

<h3 align="center">Modern, lightweight media player</h3>

<p align="center">
  A free and open-source desktop music player for managing and enjoying your local music collection.
</p>

<p align="center">
  <a href="https://www.sipme.io/player">Website</a> ·
  <a href="https://github.com/freetalk-team/pulse-player/releases">Downloads</a> ·
  <a href="https://github.com/freetalk-team/pulse-player/issues">Issues</a>
</p>

---

## About

**Pulse Player** is a free and open-source desktop music player built with Electron and Svelte.

It is designed around your local music collection, while also providing features for playlists, metadata management, Internet radio, and remote control.

The goal is to provide a modern, lightweight player without requiring your music collection to be tied to a particular streaming service or cloud platform.

## Features

* 🎵 Local music library management
* 📁 Import music from folders
* 🔎 Fast library and track search
* 🏷️ Track and album metadata management
* 🖼️ Album artwork and thumbnails
* ▶️ Playlist management
* 🔀 Shuffle and repeat playback
* 📻 Internet radio
* 📱 Remote control over your local network
* ⬇️ Optional remote downloads
* 🎧 Support for a wide range of media formats through FFmpeg
* 💾 Local SQLite database
* 🌐 Built-in web interface for remote control and related features
* 🖥️ Native desktop application for Linux and Windows

Some features may be optional modules or may still be under development.

## Screenshots

Screenshots and additional information are available on the project website:

**https://www.sipme.io/player**

## Downloads

Pre-built releases are available from GitHub Releases:

**https://github.com/freetalk-team/pulse-player/releases**

Current desktop builds focus on:

* Linux x64
* Linux ARM64
* Windows x64
* Windows ARM64

Linux releases may be provided as:

* AppImage
* `.deb`
* `.tar.gz`

Download the appropriate package for your system from the latest GitHub release.

## Installation

### Linux

#### AppImage

Download the AppImage from the latest release and make it executable:

```bash
chmod +x Pulse-Player-*.AppImage
```

Then run it:

```bash
./Pulse-Player-*.AppImage
```

#### Debian / Ubuntu

Download the `.deb` package and install it with:

```bash
sudo apt install ./pulse-player-*.deb
```

### Windows

Download the Windows installer from the latest GitHub release and follow the installation wizard.

## Development

### Requirements

* Node.js 22+
* npm
* Git

Clone the repository:

```bash
git clone https://github.com/freetalk-team/pulse-player.git
cd pulse-player
```

Install dependencies:

```bash
npm install
```

### Development mode

Start the application in development mode:

```bash
npm run dev
```

The development environment uses the local development API configuration.

### Build

Build the application for a specific platform using the available npm scripts.

For example:

```bash
npm run build:linux
```

Other platform-specific build scripts are available in `package.json`.

## Technology

Pulse Player is built using:

* [Electron](https://www.electronjs.org/)
* [Svelte](https://svelte.dev/)
* [Vite](https://vite.dev/)
* [Tailwind CSS](https://tailwindcss.com/)
* [Fastify](https://fastify.dev/)
* SQLite
* FFmpeg

The application uses separate Electron main, renderer, and worker components to keep the user interface responsive while handling library and media operations in the background.

## Project Structure

The project is organized roughly around the following components:

```text
src/
├── main/          # Electron main process
├── renderer/      # Svelte user interface
├── workers/       # Background processing
├── common/        # Shared application functionality
└── ...
```

The exact structure may evolve as the project develops.

## Open Source

Pulse Player is free and open-source software.

The source code is available on GitHub:

https://github.com/freetalk-team/pulse-player

Contributions, bug reports, feature requests, and feedback are welcome.

If you find a problem, please open an issue:

https://github.com/freetalk-team/pulse-player/issues

## Support the Project

Pulse Player is developed as a free and open-source project.

If you find it useful and would like to support its continued development, you can make a donation through one of the following options.

Your support helps with development, hosting, infrastructure, and future improvements.

### ☕ Buy Me a Coffee

https://buymeacoffee.com/freetalkteam

### 💳 Stripe

Make a one-time contribution using a payment card:

https://buy.stripe.com/3cIdR26y45REeZm4jcgEg01

### 💙 GitHub Sponsors

Support the project through GitHub Sponsors:

https://github.com/sponsors/freetalk-team

### ₿ Bitcoin

Bitcoin donations can be sent directly to:

<table>
  <tr>
    <td valign="middle">
      <strong>Bitcoin</strong>
      <p>Send Bitcoin to:</p>
      <code>BC1QDP8JCFTZAAGH8D0X59DXGZK8KGL4ER0UUAXPTG</code>
    </td>
    <td align="right" width="150">
      <img src="src/frontend/assets/bt-qr.png" alt="Bitcoin donation QR code" width="160">
    </td>
  </tr>
</table>

## Optional Features

Pulse Player itself is free and open source. Some additional features and services may be offered as optional paid features.

Purchasing an optional feature does not make the core application proprietary. It helps support continued development and maintenance of the project.

## Roadmap

Planned development includes improvements to:

* Music library management
* Metadata and artwork handling
* Playlists and playback
* Internet radio
* Remote control
* Remote downloads
* Cross-platform packaging
* User interface and accessibility
* Performance and stability

The roadmap may change as development progresses.

## Contributing

Contributions are welcome.

Before making a large change, consider opening an issue to discuss the proposed functionality.

For bug reports, please include:

* Operating system and architecture
* Pulse Player version
* Installation format used
* Steps to reproduce the problem
* Relevant error messages or logs

## License

Pulse Player is released under the **MIT License**.

See the [`LICENSE`](LICENSE) file for the complete license text.

## Links

* **Website:** https://www.sipme.io/player
* **Source code:** https://github.com/freetalk-team/pulse-player
* **Releases:** https://github.com/freetalk-team/pulse-player/releases
* **Issues:** https://github.com/freetalk-team/pulse-player/issues
* **GitHub Sponsors:** https://github.com/sponsors/freetalk-team
* **Buy Me a Coffee:** https://buymeacoffee.com/freetalkteam

---

<p align="center">
  Made with ❤️ by <strong>Freetalk Team</strong>
</p>
