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
					{{ index + 1 }} von {{ aggregated.length }}
				</b-navbar-item>
				<b-navbar-item @click="index += 1" v-if="index + 1 < aggregated.length">
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
						<b-table-column v-for="(member, key) in mergable.members" :key="member.id" :meta="member.id" :label="member.label"
							:class="{ 'is-size-7': props.row.disabled }"
						>
							<template slot="header" slot-scope="{ column }">
								<a :href="'https://' + domain + '.webling.ch#/members/all/:member/view/' + column.meta" target="_blank">
									{{ column.label }}
								</a>
							</template>
							<span v-if="props.row.type === 'parents'">
								<span v-if="props.row.disabled">
									<div v-for="parentId in member.parents" :key="parentId">
										{{ parentId }}
									</div>
								</span>
								<span v-else-if="member.parents !== null">
									<div v-for="parentId in member.parents" :key="parentId">
										<b-checkbox v-model="mergable.models.connections[parentId]">
											{{ parentId }}
										</b-checkbox>
									</div>
								</span>
							</span>
							<span v-else-if="props.row.type === 'debitors'">
								<span v-if="props.row.disabled">
									<div v-for="debitorId in member.links.debitor" :key="debitorId">
										{{ debitorId }}
									</div>
								</span>
								<span v-else-if="member.links.debitor !== null">
									<div v-for="debitorId in member.links.debitor" :key="debitorId">
										<b-checkbox v-model="mergable.models.connections[debitorId]">
											{{ debitorId }}
										</b-checkbox>
									</div>
								</span>
							</span>
							<span v-else-if="props.row.disabled">
								{{ format(member.properties[props.row.name], props.row.datatype) }}
							</span>
							<b-radio
								v-else
								v-model="mergable.models.properties[props.row.name]"
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
import { computed, createComponent, reactive, Ref, ref, watch } from '@vue/composition-api';
import { useAggregator } from '@/lib/aggregator';
import { IDefinitionProperty, useDefinitions } from '@/lib/definitions';
import { Formatter } from '@/lib/formatter';
import { useStorage } from '@/lib/storage';
import { IInstance } from '@/lib/instances';
import { useHttp } from '@/lib/http';

interface IMergableModels {
	properties: { [key: string]: any };
	connections: { [id: number]: boolean };
};

interface IMergable {
	models: IMergableModels;
	members: {
		label: string;
		properties: { [propertyName: string]: any };
		links: { [linkCategory: string]: number[] };
		parents: number[] | null;
	}[];
}

interface IRowDefinition {
	type: 'property' | 'parents' | 'debitors',
	id: number | string,
	name: string,
	datatype?: string,
	disabled: boolean
}

function getMergable(rows: IRowDefinition[], instances: IInstance[], memberProperties: IDefinitionProperty[]): IMergable {

	const models: IMergableModels = {
		properties: {},
		connections: {}
	};

	memberProperties.forEach(property => {
		const firstValue = Formatter.format(instances[0].properties[property.title], property.datatype);
		if (instances.every(instance => Formatter.format(instance.properties[property.title], property.datatype) === firstValue)) {
			models.properties[property.title] = null;
			rows.filter(row => row.id === property.id)[0].disabled = true;
		} else {
			const notNull = instances
				.map((instance, key) => instance.properties[property.title] === null ? null : key)
				.filter(value => value !== null);
			models.properties[property.title] = notNull.length === 0 ? 0 : notNull[0];
		}
	});

	const firstParents = instances[0].parents === null ? 'null' : instances[0].parents.slice().sort().join(',');
	const parentsDisabled = instances.every(instance => (instance.parents === null ? 'null' : instance.parents.slice().sort().join(',')) === firstParents);
	rows.filter(row => row.type === 'parents')[0].disabled = parentsDisabled;
	if (!parentsDisabled) {
		instances.map(instance => {
			if (Array.isArray(instance.parents)) {
				instance.parents.forEach(parentId => {
					models.connections[parentId] = true;
				});
			}
		});
	}

	const debitorsDisabled = instances.every(instance => !Array.isArray(instance.links.debitor) || instance.links.debitor.length === 0);
	rows.filter(row => row.type === 'debitors')[0].disabled = debitorsDisabled;
	if (!debitorsDisabled) {
		instances.map(instance => {
			if (Array.isArray(instance.links.debitor)) {
				instance.links.debitor.forEach(parentId => {
					models.connections[parentId] = true;
				});
			}
		});
	}

	// add debitors

	return {
		models,
		members: instances.map(member => ({
			id: member.id,
			label: member.label,
			properties: member.properties,
			parents: member.parents,
			links: member.links
		}))
	};
}

export default createComponent({
	setup() {
		const { getAggregated } = useAggregator();
		const { getDefinition } = useDefinitions();
		const { clearItems } = useStorage();
		const { domain } = useHttp();

		const index = ref(0);
		const memberProperties = getDefinition('member').properties;
		const aggregated = Array.from(getAggregated());

		const rows: IRowDefinition[] = memberProperties.map(property => ({
			type: 'property',
			id: property.id,
			name: property.title,
			datatype: property.datatype,
			disabled: false
		}));
		rows.push({
			type: 'parents',
			id: 'parents',
			name: 'Gruppen',
			disabled: false
		}, {
			type: 'debitors',
			id: 'debitors',
			name: 'Rechungen',
			disabled: false
		});

		const mergable = computed(() => getMergable(rows, aggregated[index.value], memberProperties));

		return {
			domain,
			aggregated,
			index,
			mergable,
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
