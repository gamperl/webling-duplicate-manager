<template>
	<span>
		<b-navbar>
			<template slot="start">
				<b-navbar-item @click="index -= 1" v-if="index > 0">
					<b-icon pack="fa" icon="chevron-left" />
				</b-navbar-item>
				<b-navbar-item v-else :active="false">
					<b-icon />
				</b-navbar-item>
				<b-navbar-item :active="false">
					{{ index + 1 }} von {{ mergables.length }}
				</b-navbar-item>
				<b-navbar-item @click="index += 1" v-if="index + 1 < mergables.length">
					<b-icon pack="fa" icon="chevron-right" />
				</b-navbar-item>
			</template>

			<template slot="end">
				<b-navbar-item tag="div">
					<b-button @click="logout">Abmelden</b-button>
				</b-navbar-item>
			</template>
		</b-navbar>

		<section class="section">
			<div class="container">
				<b-table
					:data="rows"
					:bordered="true"
					:striped="true"
					:narrowed="true"
					:hoverable="true"
					:loading="false"
				>
					<template slot-scope="props">
						<b-table-column label="Feld" :class="{ 'is-size-7': props.row.disabled }">
							{{ props.row.name }}
						</b-table-column>
						<b-table-column v-for="(member, key) in mergables[index].members" :key="member.id" :label="member.label"
							:class="{ 'is-size-7': props.row.disabled }"
						>
							<span v-if="props.row.type === 'parents'">
								<span v-if="member.parents !== null">
									<div v-for="parent in member.parents" :key="parent">
										{{ parent }}
									</div>
								</span>
							</span>
							<span v-else-if="props.row.disabled">
								{{ format(member.properties[props.row.name], props.row.datatype) }}
							</span>
							<b-radio
								v-else
								v-model="mergables[index].models[props.row.name]"
								:name="props.row.name"
								:native-value="key"
							>
								{{ format(member.properties[props.row.name], props.row.datatype) }}
							</b-radio>
						</b-table-column>
					</template>
				</b-table>
			</div>
		</section>
	</span>
</template>

<script lang="ts">
import { createComponent, reactive, ref } from '@vue/composition-api';
import { useAggregator } from '@/lib/aggregator';
import { useDefinitions } from '@/lib/definitions';
import { Formatter } from '@/lib/formatter';
import { useStorage } from '@/lib/storage';

interface IMergable {
	models: { [key: string]: any };
	members: {
		label: string;
		properties: { [propertyName: string]: any };
		links: { [linkCategory: string]: number[] };
		parents: number[] | null;
	}[];
}

interface IRowDefinition {
	type: 'property' | 'parents',
	id: number | string,
	name: string,
	datatype?: string,
	disabled: boolean
}

export default createComponent({
	setup() {
		const { getAggregated } = useAggregator();
		const { getDefinition } = useDefinitions();
		const { clearItems } = useStorage();

		const index = ref(0);
		const memberProperties = getDefinition('member').properties;

		const rows: IRowDefinition[] = memberProperties.map(property => ({
			type: 'property',
			id: property.id,
			name: property.title,
			datatype: property.datatype,
			disabled: false
		}));
		rows.push({
			type: 'parents',
			id: 'parens',
			name: 'Gruppen',
			disabled: false
		});

		// TODO: add links

		const mergables: IMergable[] = [];
		getAggregated().forEach(aggregated => {
			const models: { [key: string]: any } = {};
			memberProperties.forEach(property => {
				const firstValue = Formatter.format(aggregated[0].properties[property.title], property.datatype);
				if (aggregated.every(instance => Formatter.format(instance.properties[property.title], property.datatype) === firstValue)) {
					models[property.title] = null;
					rows.filter(row => row.id === property.id)[0].disabled = true;
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
			rows,
			format: Formatter.format,
			logout: () => {
				clearItems();
				location.reload();
			}
		};
	}
});
</script>
