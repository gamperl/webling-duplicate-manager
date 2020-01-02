<template>
	<section class="section">
		<div class="container">
			<b-table
				:data="memberProperties"
				:bordered="true"
				:striped="true"
				:narrowed="true"
				:hoverable="true"
				:loading="false"
			>
				<template slot-scope="props">
					<b-table-column label="Feld" :class="{ 'is-size-7': mergables[index].models[props.row.title] === null }">
						{{ props.row.title }}
					</b-table-column>
					<b-table-column v-for="(member, key) in mergables[index].members" :key="member.id" :label="member.label"
						:class="{ 'is-size-7': mergables[index].models[props.row.title] === null }"
					>
						<b-radio
							v-if="mergables[index].models[props.row.title] !== null"
							v-model="mergables[index].models[props.row.title]"
							:name="props.row.title"
							:native-value="key"
						>
							{{ format(member.properties[props.row.title], props.row.datatype) }}
						</b-radio>
						<span v-else>
							{{ format(member.properties[props.row.title], props.row.datatype) }}
						</span>
					</b-table-column>
				</template>
			</b-table>
		</div>
	</section>
</template>

<script lang="ts">
import { createComponent, reactive, ref } from '@vue/composition-api';
import { useAggregator } from '@/lib/aggregator';
import { useDefinitions } from '@/lib/definitions';
import { Formatter } from '@/lib/formatter';

interface IMergable {
	models: { [key: string]: any };
	members: {
		label: string;
		properties: { [propertyName: string]: any };
		links: { [linkCategory: string]: number[] };
		parents: number[] | null;
	}[];
}

export default createComponent({
	setup() {
		const { getAggregated } = useAggregator();
		const { getDefinition } = useDefinitions();

		const index = ref(0);
		const memberProperties = getDefinition('member').properties;

		const mergables: IMergable[] = [];
		getAggregated().forEach(aggregated => {
			const models: { [key: string]: any } = {};
			memberProperties.forEach(property => {
				const firstValue = Formatter.format(aggregated[0].properties[property.title], property.datatype);
				if (aggregated.every(instance => Formatter.format(instance.properties[property.title], property.datatype) === firstValue)) {
					models[property.title] = null;
				} else {
					const notNull = aggregated
						.map((instance, key) => instance.properties[property.title] === null ? null : key)
						.filter(value => value !== null);
					models[property.title] = notNull.length === 0 ? 0 : notNull[0];
				}
			});
			mergables.push(reactive({
				models: models,
				members: aggregated.map(member => ({
					label: member.label,
					properties: member.properties,
					parents: member.parents,
					links: member.links
				}))
			}));
		});

		return {
			index,
			mergables,
			memberProperties,
			format: Formatter.format
		};
	}
});
</script>
