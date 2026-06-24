import { mount } from 'svelte'

import '@frontend/assets/main.css'
import '@fortawesome/fontawesome-free/css/all.min.css'

import '@common/string'
import '@common/date'
import '@common/object'

import '@frontend/stores/remote'

import App from '@frontend/App.svelte'

const app = mount(App, {
  target: document.getElementById('app')
})

export default app
