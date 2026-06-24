import { mount } from 'svelte'

import '@frontend/assets/main.css'
import '@fortawesome/fontawesome-free/css/all.min.css'

import '@common/string'
import '@common/date'
import '@common/object'

import './api'
import './platform'

import db from './db'

import App from '@frontend/App.svelte'

async function bootstrap() {

	await db.init()

	mount(App, {
		target: document.getElementById('app')
	})
}

bootstrap()
