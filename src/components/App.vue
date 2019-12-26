<template>
	<Login v-if="state === 'initialized'" />
	<div v-else>Loged in ...</div>
</template>

<script lang="ts">
import { createComponent, watch } from '@vue/composition-api';
import Login from '@/components/Login.vue';
import { provideStore } from '@/lib/store';

export default createComponent({
	components: {
		Login
	},
	setup() {
		const { state, apikey, domain, persistent } = provideStore();
		watch(state, () => {
			console.log(state.value, apikey.value, domain.value, persistent.value);
		});
		return {
			state
		};
	}
});
</script>
