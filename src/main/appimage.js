import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

const appName = 'Pulse Player';
const appId = 'io.sipme.pulseplayer';

const installDir = path.join(
  os.homedir(),
  '.local',
  'share',
  'pulse-player'
);

const installedIcon = path.join(
	installDir,
	'pulse-player.png'
);

const appImagePath = path.join(
  installDir,
  'pulse-player.AppImage'
);

const desktopDir = path.join(
  os.homedir(),
  '.local',
  'share',
  'applications'
);

const desktopFile = path.join(
  desktopDir,
  `${appId}.desktop`
);

export function isAppImage() {
  return process.platform === 'linux' && !!process.env.APPIMAGE;
}

export async function installAppImage() {
	if (!isAppImage()) {
		throw new Error('Application is not running as an AppImage');
	}

	const source = process.env.APPIMAGE;

	await fs.mkdir(installDir, { recursive: true });
	await fs.mkdir(desktopDir, { recursive: true });

	await fs.copyFile(source, appImagePath);

	// AppImages need to remain executable.
	await fs.chmod(appImagePath, 0o755);

	// const sourceIcon = path.join(
	// 		process.env.APPDIR,
	// 		'usr/share/icons/hicolor/512x512/apps/pulse-player.png'
	// 	);

	const sourceIcon = await findAppIcon();

	await fs.copyFile(sourceIcon, installedIcon);

	const desktopEntry = `[Desktop Entry]
Name=Pulse Player
Comment=Modern, lightweight media player
Exec=${escapeDesktopValue(appImagePath)} %U
Icon=${installedIcon}
Terminal=false
Type=Application
Categories=AudioVideo;Audio;Player;
MimeType=audio/mpeg;audio/ogg;audio/flac;audio/wav;audio/x-m4a;audio/mp4;
StartupWMClass=pulse-player;
`;

	await fs.writeFile(desktopFile, desktopEntry, 'utf8');
}

export async function uninstallAppImage() {
	await fs.rm(desktopFile, { force: true });
	await fs.rm(installDir, { recursive: true, force: true });
}

export function isAppImageInstalled() {
	return fs.access(desktopFile)
		.then(() => true)
		.catch(() => false);
}

function escapeDesktopValue(value) {
	return value.replace(/([\\"])/g, '\\$1');
}

async function findAppIcon() {
	const iconDir = path.join(
		process.env.APPDIR,
		'usr/share/icons/hicolor'
	);

	const sizes = [
		'512x512',
		'256x256',
		'128x128',
		'64x64',
		'48x48'
	];

	for (const size of sizes) {
		const iconPath = path.join(
			iconDir,
			size,
			'apps',
			'pulse-player.png'
		);

		try {
			await fs.access(iconPath);
			return iconPath;
		} catch {
			// Try next size
		}
	}

	throw new Error('Pulse Player icon not found in AppImage');
}