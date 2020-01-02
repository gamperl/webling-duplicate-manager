<template>
	<Merge v-if="hasAggregatedMembers" />
	<Definition v-else-if="hasMemberDefinition" />
	<Login v-else />
</template>

<script lang="ts">
import { computed, createComponent } from '@vue/composition-api';
import Login from '@/components/Login.vue';
import Definition from '@/components/Definition.vue';
import Merge from '@/components/Merge.vue';
import { provideHttp } from '@/lib/http';
import { provideDefinitions } from '@/lib/definitions';
import { provideStorage } from '@/lib/storage';
import { provideInstances } from '@/lib/instances';
import { provideAggregator } from '@/lib/aggregator';

export default createComponent({
	components: {
		Login,
		Definition,
		Merge
	},
	setup() {
		const { getRequest } = provideHttp();
		const definitions = provideDefinitions(getRequest);
		const instances = provideInstances(getRequest, definitions);
		const { hasAggregated } = provideAggregator(instances, definitions.fetchDefinition);
		provideStorage();

		const hasMemberDefinition = computed(() => definitions.hasDefinition('member'));
		const hasAggregatedMembers = hasAggregated();

		return {
			hasMemberDefinition,
			hasAggregatedMembers
		};
	}
});
</script>
