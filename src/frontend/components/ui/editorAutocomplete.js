import { autocompletion } from '@codemirror/autocomplete';

// Build dynamic config completions
export function createConfigCompletions(schema) {
  return schema.map((field) => ({
	label: field.key,
	type: 'property',
	info: field.label
  }));
}

// Static API completions
const baseCompletions = [
  {
	label: 'ctx',
	type: 'variable',
	info: 'Component context'
  },
  {
	label: 'track',
	type: 'variable',
	info: 'Current track'
  },
  {
	label: 'album',
	type: 'variable',
	info: 'Current album'
  }
];

const ctxCompletions = [
  { label: 'http', type: 'property' },
  { label: 'setThumbnail', type: 'function' },
  { label: 'log', type: 'function' },
  { label: 'config', type: 'property' }
];

const httpCompletions = [
  { label: 'get', type: 'function' },
  { label: 'post', type: 'function' }
];

const trackCompletions = [
  { label: 'title', type: 'property' },
  { label: 'artist', type: 'property' },
  { label: 'album', type: 'property' },
  { label: 'setGenre', type: 'function' },
  { label: 'setThumbnail', type: 'function' },
//   { label: 'path', type: 'property' },
//   { label: 'duration', type: 'property' }
];

const albumCompletions = [
  { label: 'name', type: 'property' },
  { label: 'artist', type: 'property' },
  { label: 'year', type: 'property' },
  { label: 'setName', type: 'function' },
  { label: 'setGenre', type: 'function' },
  { label: 'setYear', type: 'function' },
  { label: 'setThumbnail', type: 'function' },
  { label: 'setDescription', type: 'function' },
];

const trackAlbumCompletions = [
  { label: 'setName', type: 'function' },
  { label: 'setGenre', type: 'function' },
  { label: 'setYear', type: 'function' },
  { label: 'setThumbnail', type: 'function' },
  { label: 'setDescription', type: 'function' },
];


// Main autocomplete logic
export function createAutocomplete(schema) {
  const configCompletions = createConfigCompletions(schema);

  return autocompletion({
	activateOnTyping: true,
	override: [
	  (context) => {
		// const word = context.matchBefore(/\\w*/);
		// console.debug('Editor match:', word);

		// if (!word) return null;

		// const before = context.state.doc.toString().slice(0, context.pos);

		const word = context.matchBefore(/\w+/);
		const before = context.state.doc.toString().slice(0, context.pos);

		// ctx.
		if (before.endsWith('ctx.')) {
		  return {
			from: context.pos,
			options: ctxCompletions
		  };
		}

		// ctx.http.
		if (before.endsWith('ctx.http.')) {
		  return {
			from: context.pos,
			options: httpCompletions
		  };
		}

		// ctx.config.
		if (before.endsWith('ctx.config.')) {
		  return {
			from: context.pos,
			options: configCompletions
		  };
		}

		// track.
		if (before.endsWith('track.')) {
		  return {
			from: context.pos,
			options: trackCompletions
		  };
		}

		// if (before.endsWith('track.album.')) {
		//   return {
		// 	from: context.pos,
		// 	options: trackAlbumCompletions
		//   };
		// }

		// album.
		if (before.endsWith('album.')) {
		  return {
			from: context.pos,
			options: albumCompletions
		  };
		}

		// global suggestions
		return {
		  from: word?.from ?? 0,
		  options: baseCompletions
		};
	  }
	]
  });
}