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
				<b-message v-if="mergeError !== null" type="is-danger">
					{{ mergeError }}
				</b-message>
				<b-message v-if="merged[index]" type="is-info">
					Das Mitglied {{ mergable.members[0].label }} wurde schon zusammengeführt.
				</b-message>
				<b-table
					v-else
					:data="rows"
					:bordered="true"
					:striped="true"
					:narrowed="true"
					:hoverable="true"
					:loading="false"
					class="is-responsive"
					style="overflow-x: auto"
				>
					<template slot-scope="props">
						<b-table-column label="Feld" :class="{ 'is-size-7': props.row.disabled }">
							{{ props.row.name }}
						</b-table-column>
						<b-table-column v-for="(member, key) in mergable.members" :key="member.id" :meta="{id: member.id, label: member.label, created: member.meta.created }" :label="member.label + '(' + key + ')'"
							:class="{ 'is-size-7': props.row.disabled }"
						>
							<template slot="header" slot-scope="{ column }">
								{{ column.meta.label }}
								<a :href="'https://' + domain + '.webling.ch#/members/all/:member/view/' + column.meta.id" target="_blank" class="is-size-7">
									<b-icon pack="fa" icon="external-link-alt" />
								</a>
								<br>
								<span class="is-size-7">Erstellt am {{ format(column.meta.created, 'timestamp') }}</span>
							</template>
							<span v-if="props.row.type === 'parents'">
								<span v-if="props.row.disabled">
									<div v-for="parentId in member.parents" :key="parentId">
										<Label :id="parentId" />
									</div>
								</span>
								<span v-else-if="member.parents !== null">
									<div v-for="parentId in member.parents" :key="parentId">
										<b-checkbox v-model="mergable.models.connections[parentId]">
											<Label :id="parentId" />
										</b-checkbox>
									</div>
								</span>
							</span>
							<span v-else-if="props.row.type === 'debitors'">
								<span v-if="props.row.disabled">
									<div v-for="debitorId in member.links.debitor" :key="debitorId">
										<Label :id="debitorId" />
									</div>
								</span>
								<span v-else-if="member.links.debitor !== null">
									<div v-for="debitorId in member.links.debitor" :key="debitorId">
										<b-checkbox v-model="mergable.models.connections[debitorId]">
											<Label :id="debitorId" />
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
				<div class="columns is-centered">
					<div class="column is-narrow">
						<div class="box is-shadowless">
							<div class="columns is-mobile">
								<div class="column">
									<b-button @click="index -= 1" v-if="index > 0 && !isMerging" class="is-8">
										<b-icon pack="fa" icon="chevron-left" />
									</b-button>
								</div>
								<div class="column">
									<b-button type="is-primary" @click="merge" :disabled="isMerging">Zusammenführen</b-button>
								</div>
								<div class="column">
									<b-button @click="index += 1" v-if="index + 1 < aggregated.length && !isMerging">
										<b-icon pack="fa" icon="chevron-right" />
									</b-button>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	</span>
</template>

<script lang="ts">
import { computed, createComponent, reactive, Ref, ref } from '@vue/composition-api';
import { useAggregator } from '@/lib/aggregator';
import { IDefinitionProperty, useDefinitions } from '@/lib/definitions';
import { Formatter } from '@/lib/formatter';
import { useStorage } from '@/lib/storage';
import { IInstance } from '@/lib/instances';
import { useHttp } from '@/lib/http';
import Label from '@/components/Label.vue';

interface IMergableModels {
	properties: { [key: string]: any };
	connections: { [id: number]: boolean };
}

interface IMergable {
	models: IMergableModels;
	members: {
		id: number;
		meta: { [key: string]: any };
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
		const propertyDisabled = instances.every(instance => Formatter.format(instance.properties[property.title], property.datatype) === firstValue);
		rows.filter(row => row.id === property.id)[0].disabled = propertyDisabled;
		if (!propertyDisabled) {
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

	return {
		models,
		members: instances.map(member => ({
			id: member.id,
			meta: member.meta,
			label: member.label,
			properties: member.properties,
			parents: member.parents,
			links: member.links
		}))
	};
}

export default createComponent({
	components: {
		Label
	},
	setup() {
		const { getAggregated } = useAggregator();
		const { getDefinition } = useDefinitions();
		const { clearItems } = useStorage();
		const { domain, putRequest, deleteRequest } = useHttp();

		const index = ref(0);
		const memberProperties = getDefinition('member').properties;
		const aggregated = Array.from(getAggregated());
		const isMerging = ref(false);
		const mergeError: Ref<string | null> = ref(null);
		const merged = reactive(Array.from({ length: aggregated.length }).map(() => false));

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

		const merge = async () => {
			isMerging.value = true;
			mergeError.value = null;

			const members = mergable.value.members;
			const models = mergable.value.models;

			const properties: { [id: number]: any } = {};
			const parents: number[] = [];
			const debitors: number[] = [];

			memberProperties.forEach(property => {
				if (!rows.filter(row => row.id === property.id)[0].disabled && models.properties[property.title] !== 0) {
					const value = members[models.properties[property.title]].properties[property.title];
					const d2 = Formatter.twoDigits;
					switch (property.datatype) {
						// if the property is a date property, and the value a date object, convert it to string
						case 'date':
							properties[property.id] = `${value.getFullYear()}-${d2(value.getMonth() + 1)}-${d2(value.getDate())}`;
							break;

						// if the property is a timestamp property, and the value a date object, convert it to string
						case 'timestamp':
							properties[property.id] = `${value.getFullYear()}-${d2(value.getMonth() + 1)}-${d2(value.getDate())}` +
								` ${d2(value.getHours())}:${d2(value.getMinutes())}:${d2(value.getSeconds())}`;
							break;

						default:
							properties[property.id] = value;
					}
				}
			});

			if (!rows.filter(row => row.type === 'parents')[0].disabled) {
				members.map((instance) => {
					if (Array.isArray(instance.parents)) {
						parents.push(...instance.parents.filter(parentId => models.connections[parentId]));
					}
				});
			} else {
				parents.push(...members[0].parents!);
			}

			if (!rows.filter(row => row.type === 'debitors')[0].disabled) {
				members.map((instance, pos) => {
					if (pos > 0 && Array.isArray(instance.links.debitor)) {
						debitors.push(...instance.links.debitor.filter(debitorId => models.connections[debitorId]));
					}
				});
			}

			const mergedIds = members.filter((_, pos) => pos > 0).map(member => member.id);
			await putRequest('object', [
				{
					id: members[0].id,
					properties: properties,
					parents: parents
				}, ...debitors.map(debitorId => ({
					id: debitorId,
					links: {
						member: [members[0].id]
					}
				}))
			])
				.then(() => deleteRequest(`object/${mergedIds.join(',')}`))
				.catch(error => { mergeError.value = error.message; });
			merged[index.value] = true;
			isMerging.value = false;
			if (index.value + 1 < aggregated.length) {
				index.value += 1;
			}
		};

		return {
			mergeError,
			domain,
			aggregated,
			index,
			mergable,
			rows,
			isMerging,
			merged,
			format: Formatter.format,
			merge,
			logout: () => {
				clearItems();
				location.reload();
			}
		};
	}
});
</script>
