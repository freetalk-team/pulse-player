import createMetadataModule from '@wasm/metadata.js';
import metadataWasmUrl from '@wasm/metadata.wasm?url';

let wasmPromise = null;

function getWasm() {
    if (!wasmPromise) {
        wasmPromise = createMetadataModule({
            locateFile(path) {
                if (path.endsWith('.wasm')) {
                    return metadataWasmUrl;
                }

                return path;
            }
        });
    }

    return wasmPromise;
}

self.onmessage = async (event) => {
    const { id, buffer } = event.data;

    try {
        const wasm = await getWasm();

        // Parse...
    } catch (error) {
        self.postMessage({
            id,
            error: error instanceof Error
                ? error.message
                : String(error)
        });
    }
};