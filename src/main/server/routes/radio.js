import radio from '../../services/radio';

export default async function routes(app) {

	app.get('/', async (req, reply) => {

		const query = req.query;

		query.limit = query.limit ? parseInt(query.limit) : 30;
		query.offset = query.offset ? parseInt(query.offset) : 0;

		return radio.queryStations(query, true);
	});

}