import Vue from 'vue';

import VueCompositionApi from '@vue/composition-api';

import Buefy from 'buefy';
import 'buefy/dist/buefy.css';
import '@fortawesome/fontawesome-free/css/all.css';

import App from '@/components/App.vue';

Vue.use(VueCompositionApi);
Vue.use(Buefy);

Vue.config.productionTip = false;

new Vue({
	render: h => h(App)
}).$mount('#app');
