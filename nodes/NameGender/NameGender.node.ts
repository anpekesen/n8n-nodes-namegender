import { NodeConnectionTypes, type INodeType, type INodeTypeDescription } from 'n8n-workflow';

/*
 * One resource, one request per item. n8n already runs a node once for every
 * incoming item, so a separate bulk operation would only add a second way of
 * doing the same thing.
 *
 * Unknown is a successful answer: the API returns HTTP 200 with gender null.
 * The node passes that through unchanged so a later IF node can route it.
 */

const lookupOperations = ['name', 'email', 'username'];

export class NameGender implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'NameGender',
		name: 'nameGender',
		icon: { light: 'file:namegender.svg', dark: 'file:namegender.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{"Gender from " + $parameter["operation"]}}',
		description:
			'Get the gender associated with a name, email address or username, with probability, sample size, source and parsed first and last name',
		defaults: {
			name: 'NameGender',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'nameGenderApi', required: true }],
		requestDefaults: {
			baseURL: 'https://namegender.com/api/v1',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Gender From Email',
						value: 'email',
						action: 'Get gender from an email address',
						description: 'Use the part before the @ as the name',
						routing: { request: { method: 'POST', url: '/gender/email' } },
					},
					{
						name: 'Gender From Name',
						value: 'name',
						action: 'Get gender from a name',
						description: 'Look up a first or full name',
						routing: { request: { method: 'POST', url: '/gender' } },
					},
					{
						name: 'Gender From Username',
						value: 'username',
						action: 'Get gender from a username',
						description: 'Strip digits and separators, then look up the name',
						routing: { request: { method: 'POST', url: '/gender/username' } },
					},
					{
						name: 'Countries For Name',
						value: 'countries',
						action: 'Get countries where a name is recorded',
						description:
							'List the countries whose birth records contain the name. This is not a country of origin.',
						routing: { request: { method: 'POST', url: '/gender/countries' } },
					},
				],
				default: 'name',
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'Ayşe Yılmaz',
				description: 'A first name or a full name. Titles and surnames are handled for you.',
				displayOptions: { show: { operation: ['name', 'countries'] } },
				routing: { send: { type: 'body', property: 'name' } },
			},
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				placeholder: 'name@email.com',
				required: true,
				default: '',
				displayOptions: { show: { operation: ['email'] } },
				routing: { send: { type: 'body', property: 'email' } },
			},
			{
				displayName: 'Username',
				name: 'username',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'jane_doe_92',
				displayOptions: { show: { operation: ['username'] } },
				routing: { send: { type: 'body', property: 'username' } },
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: { show: { operation: lookupOperations } },
				options: [
					{
						displayName: 'Best Guess',
						name: 'best_guess',
						type: 'boolean',
						default: false,
						description:
							'Whether to return the most likely gender even below the confidence threshold instead of null. Check probability before trusting it.',
						routing: { send: { type: 'body', property: 'best_guess' } },
					},
					{
						displayName: 'Country Code',
						name: 'country',
						type: 'string',
						default: '',
						placeholder: 'US',
						description:
							'Two-letter ISO code. Some names change gender across borders, so this changes the answer where it matters.',
						routing: { send: { type: 'body', property: 'country' } },
					},
				],
			},
		],
	};
}
