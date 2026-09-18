const events = new EventTarget();

export default {
	on(channel, func) {
		const subscription = (event) => func(...event.detail);

		events.addEventListener(channel, subscription);

		return () => {
			events.removeEventListener(channel, subscription);
		};
	},

	emit(channel, ...args) {
		events.dispatchEvent(
			new CustomEvent(channel, {
				detail: args
			})
		);
	}
}
