<template>
	<Login v-if="state === 'initialized'" />
	<div v-else>Loged in ...</div>
</template>

<script lang="ts">
import { createComponent, watch } from '@vue/composition-api';
import Login from '@/components/Login.vue';
import { provideStore } from '@/lib/store';
import { provideHttp } from '@/lib/http';

export default createComponent({
	components: {
		Login
	},
	setup() {
		const { apikey, domain } = provideHttp();
		const { state, persistent } = provideStore();
		watch(state, () => {
			console.log(state.value, apikey.value, domain.value, persistent.value);
		});
		return {
			state
		};
	}
});
</script>
