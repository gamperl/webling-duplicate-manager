<template>
	<Definition v-if="hasMemberDefinition" />
	<Login v-else />
</template>

<script lang="ts">
import { computed, createComponent } from '@vue/composition-api';
import Login from '@/components/Login.vue';
import Definition from '@/components/Definition.vue';
import { provideHttp } from '@/lib/http';
import { provideDefinitionss } from '@/lib/definitions';
import { provideStorage } from '@/lib/storage';

export default createComponent({
	components: {
		Login,
		Definition
	},
	setup() {
		const http = provideHttp();
		const { get } = provideDefinitionss(http);
		provideStorage();

		const hasMemberDefinition = computed(() => get('member').ready);

		return {
			hasMemberDefinition
		};
	}
});
</script>
