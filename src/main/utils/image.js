import { join, isAbsolute, basename } from 'node:path';
import fs from 'fs';
import crypto from 'crypto';

export class Image {

    static async downloadThumb(url, dir, timeout=5000) {
        const hash = hashUrl(url);

        console.debug('Hashed url:', url, '=>', hash);

        let ext = getExtFromUrl(url);
        let filename = `${hash}.${ext}`;

        // If we have extension → try fast path
        if (ext) {
            const filePath = join(dir, filename);

            if (fs.existsSync(filePath)) {
                return filename; // ✅ already cached
            }
        }

        console.debug('[IMAGE] download:', url);

        // Otherwise fetch (or fallback case)
        const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(timeout) });

        if (!res.ok) 
            throw new Error(`Failed: ${res.status}`);

        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.startsWith('image/'))
            throw new Error(`Not an image: ${contentType}`);

        // If extension was missing or unreliable → detect from headers
        if (!ext) {
            const contentType = res.headers.get('content-type') || '';

            const map = {
                'image/jpeg': 'jpg',
                'image/png': 'png',
                'image/webp': 'webp',
                'image/gif': 'gif',
                'image/x-icon': 'ico',
                'image/vnd.microsoft.icon': 'ico'
            };

            ext = map[contentType];
            if (!ext)
                throw new Error(`Invalid content type: ${contentType}`);

            filename = `${hash}.${ext}`;
        }

        const filePath = join(dir, filename);

        // Double-check (race condition safe)
        if (fs.existsSync(filePath)) {
            return filename;
        }

        const buffer = Buffer.from(await res.arrayBuffer());
        if (buffer.length < 600)
            throw new Error(`Image too small: ${url}`);

        await fs.promises.writeFile(filePath, buffer);

        return filename;

        function hashUrl(url) {
            return crypto.createHash('md5').update(url).digest('hex');
        }

        function getExtFromUrl(url) {
            try {
                const pathname = new URL(url).pathname;
                const ext = pathname.split('.').pop().toLowerCase();

                // basic sanity check
                if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) {
                    return ext === 'jpeg' ? 'jpg' : ext;
                }
            } catch {}

            return null;
        }
    }

    static async downloadThumbFile(url, dir, timeout=5000) {
        const path = URL.parse(url).pathname;
        const filename = basename(path);
        const filePath = join(dir, filename);

        console.debug('[IMAGE] downloading:', url, '=>', filePath);

        if (fs.existsSync(filePath)) {
            return filename; // ✅ already cached
        }

        const res = await fetch(url, { signal: AbortSignal.timeout(timeout) });
        if (!res.ok) 
            throw new Error(`HTTP error! status: ${response.status}`);

        const fileStream = fs.createWriteStream(filePath);
        const reader = res.body.getReader();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            fileStream.write(Buffer.from(value));
        }

        fileStream.end();

        // const buffer = Buffer.from(await res.arrayBuffer());
        // await fs.promises.writeFile(filePath, buffer);

        return filename;
    }
}