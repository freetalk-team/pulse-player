export class ProgressBar {
	#total = 0;
	#processed = 0;
	#width;
	#active = false;
	#isTTY;

	constructor(width = 32) {
		this.#width = width;
		this.#isTTY = process.stdout.isTTY;
	}

	/**
	 * Update scanning progress.
	 */
	scan(count) {
		if (!this.#isTTY) {
			return;
		}

		this.#write(`\r  Scanning... ${count.toLocaleString()} files found`);
	}

	/**
	 * Switch from scanning to importing.
	 */
	start(total) {
		this.#total = total;
		this.#processed = 0;
		this.#active = true;

		if (!this.#isTTY) {
			console.log(`Scanning complete: ${total.toLocaleString()} files`);
			console.log('Importing...');
			return;
		}

		this.#write('\r\x1b[K');
		console.log(`  Scanning complete: ${total.toLocaleString()} files`);
		console.log();
		this.#render();
	}

	/**
	 * Update import progress.
	 */
	update(processed, label = '') {
		this.#processed = processed;

		if (!this.#isTTY) {
			return;
		}

		this.#render(label);
	}

	/**
	 * Finish the import.
	 */
	finish({ imported = 0, skipped = 0, errors = 0, albums = 0 } = {}) {
		this.#processed = this.#total;

		if (this.#isTTY) {
			this.#render();
			process.stdout.write('\n');
		}

		console.log();
		console.log(`  ✓ Imported: ${imported.toLocaleString()}`);
		console.log(`  ◎ Albums:   ${albums.toLocaleString()}`);
		console.log(`  ! Skipped:  ${skipped.toLocaleString()}`);
		console.log(`  ✗ Errors:   ${errors.toLocaleString()}`);
		console.log();

		this.#active = false;
	}

	#render(label = '') {
		const ratio = this.#total > 0
			? Math.min(1, this.#processed / this.#total)
			: 0;

		const percent = Math.round(ratio * 100);

		const filled = Math.round(this.#width * ratio);
		const empty = this.#width - filled;

		const bar =
			'█'.repeat(filled) +
			'░'.repeat(empty);

		const progress =
			`${this.#processed.toLocaleString()}/${this.#total.toLocaleString()}`;

		const line =
			`  ${bar}  ${percent.toString().padStart(3)}%  ${progress}` +
			(label ? `  ${label}` : '');

		this.#write(`\r\x1b[K${line}`);
	}

	#write(text) {
		process.stdout.write(text);
	}
}