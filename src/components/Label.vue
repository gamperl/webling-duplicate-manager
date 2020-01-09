<template>
	<span>
		{{ label }}
		<a v-if="href !== null" :href="href" target="_blank" class="is-size-7">
			<b-icon pack="fa" icon="external-link-alt" />
		</a>
	</span>
</template>

<script lang="ts">
import { createComponent, Ref, ref } from '@vue/composition-api';
import { useInstances } from '@/lib/instances';
import { useHttp } from '@/lib/http';

export default createComponent({
	props: {
		id: {
			type: Number,
			required: true
		}
	},
	setup({ id }) {
		const { domain } = useHttp();
		const { fetchInstance } = useInstances();

		const label = ref('');
		const href: Ref<string|null> = ref(null);

		fetchInstance(id).then(instance => {
			switch (instance.type) {
				case 'membergroup':
					label.value = instance.label;
					href.value = `https://${domain.value}.webling.ch#/members/membergroup/${instance.id}`;
					break;
				case 'debitor':
					label.value = `${instance.label} ${instance.properties.state}`;

					href.value = `https://${domain.value}.webling.ch#/accounting/${instance.parents![0]}/debitor/:debitor/view/${instance.id}`;
					break;
				default:
					label.value = instance.label;
					href.value = null;
			}
		});

		return {
			label,
			href
		};
	}
});
</script>
