import { NodeConnectionTypes, type INodeType, type INodeTypeDescription } from 'n8n-workflow';

/*
 * Three resources (Gender, Name Check, Salutation), one request per item. n8n already runs a node once for every
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
		subtitle: '={{$parameter["resource"] + ": " + $parameter["operation"]}}',
		description:
			'Get the gender associated with a name, email address or username, a ready salutation, or a check of whether a name looks real',
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
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Age', value: 'age' },
					{ name: 'Gender', value: 'gender' },
					{ name: 'Name Check', value: 'nameCheck' },
					{ name: 'Salutation', value: 'salutation' },
				],
				// Varsayılan Gender: kaynak alanı eklenmeden önce kurulmuş iş akışları
				// bu alanı taşımıyor ve değişmeden çalışmaya devam etmeli.
				default: 'gender',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['gender'] } },
				options: [
					{
						name: 'Countries For Name',
						value: 'countries',
						action: 'Get countries where a name is recorded',
						description:
							'List the countries whose birth records contain the name. This is not a country of origin.',
						routing: { request: { method: 'POST', url: '/gender/countries' } },
					},
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
				],
				default: 'name',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['age'] } },
				options: [
					{
						name: 'Get',
						value: 'age',
						action: 'Get the age of a first name',
						description:
							'How old the living people with a first name are: the median age and the ranges for the middle half and the middle 80%. It describes a group, not the person.',
						routing: { request: { method: 'POST', url: '/age' } },
					},
				],
				default: 'age',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['nameCheck'] } },
				options: [
					{
						name: 'Check',
						value: 'nameCheck',
						action: 'Check whether a name looks real',
						description:
							'Say whether a name typed into a form looks like a real person name, with the reasons. It never calls a name fake.',
						routing: { request: { method: 'POST', url: '/name-check' } },
					},
				],
				default: 'nameCheck',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['salutation'] } },
				options: [
					{
						name: 'Get',
						value: 'salutation',
						action: 'Get a salutation for a name',
						description:
							'Turn a name into a ready letter or email salutation in ten languages, neutral when the gender is not certain',
						routing: { request: { method: 'POST', url: '/salutation' } },
					},
					{
						name: 'Get From Email',
						value: 'salutationEmail',
						action: 'Get a salutation from an email address',
						description:
							'Read the name from an email address and return a ready salutation. Addresses carry no accents; role addresses get the form for organisations.',
						routing: { request: { method: 'POST', url: '/salutation' } },
					},
				],
				default: 'salutation',
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'Ayşe Yılmaz',
				description: 'A first name or a full name. Titles and surnames are handled for you.',
				displayOptions: { show: { operation: ['name', 'countries', 'salutation', 'nameCheck', 'age'] } },
				routing: { send: { type: 'body', property: 'name' } },
			},
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				placeholder: 'name@email.com',
				required: true,
				default: '',
				displayOptions: { show: { operation: ['email', 'salutationEmail'] } },
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
							'Two- or three-letter ISO code (US or USA). Some names change gender across borders, so this changes the answer where it matters.',
						routing: { send: { type: 'body', property: 'country' } },
					},
					{
						displayName: 'IP Address',
						name: 'ip',
						type: 'string',
						default: '',
						placeholder: '203.0.113.7',
						description:
							'IP of the person, for example from a form submission. Used for the country only when neither Country Code nor a Locale with a region is set. Not stored.',
						routing: { send: { type: 'body', property: 'ip' } },
					},
					{
						displayName: 'Locale',
						name: 'locale',
						type: 'string',
						default: '',
						placeholder: 'it-IT',
						description:
							'Language tag of the person, such as the browser\'s Accept-Language. Its region is used as the country when Country Code is empty; a tag without a region (en) sets none.',
						routing: { send: { type: 'body', property: 'locale' } },
					},
				],
			},
			{
				displayName: 'Age Options',
				name: 'ageFields',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: { show: { operation: ['age'] } },
				options: [
					{
						displayName: 'Country Code',
						name: 'country',
						type: 'string',
						default: '',
						placeholder: 'FR',
						description:
							'US, FR or NO, as a code or a country name. Without a country the US data is used; any other country returns no age and costs no credit.',
						routing: { send: { type: 'body', property: 'country' } },
					},
					{
						displayName: 'Gender',
						name: 'gender',
						type: 'options',
						default: 'male',
						options: [
							{ name: 'Female', value: 'female' },
							{ name: 'Male', value: 'male' },
						],
						description:
							'Use only one gender\'s records. Matters for names that moved between genders: men called Leslie are much older than women called Leslie.',
						routing: { send: { type: 'body', property: 'gender' } },
					},
					{
						displayName: 'IP Address',
						name: 'ip',
						type: 'string',
						default: '',
						placeholder: '203.0.113.7',
						description:
							'IP of the person, for example from a form submission. Used for the country only when neither Country Code nor a Locale with a region is set. Not stored.',
						routing: { send: { type: 'body', property: 'ip' } },
					},
					{
						displayName: 'Locale',
						name: 'locale',
						type: 'string',
						default: '',
						placeholder: 'fr-FR',
						description:
							'Language tag of the person, such as the browser\'s Accept-Language. Its region is used as the country when Country Code is empty; a tag without a region (en) sets none.',
						routing: { send: { type: 'body', property: 'locale' } },
					},
				],
			},
			{
				displayName: 'Name Check Options',
				name: 'nameCheckFields',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: { show: { operation: ['nameCheck'] } },
				options: [
					{
						displayName: 'Country Code',
						name: 'country',
						type: 'string',
						default: '',
						placeholder: 'DE',
						description: 'Two- or three-letter ISO code. Helps name parsing and the record lookup.',
						routing: { send: { type: 'body', property: 'country' } },
					},
					{
						displayName: 'IP Address',
						name: 'ip',
						type: 'string',
						default: '',
						placeholder: '203.0.113.7',
						description:
							'IP of the person, for example from a form submission. Used for the country only when neither Country Code nor a Locale with a region is set. Not stored.',
						routing: { send: { type: 'body', property: 'ip' } },
					},
					{
						displayName: 'Locale',
						name: 'locale',
						type: 'string',
						default: '',
						placeholder: 'it-IT',
						description:
							'Language tag of the person, such as the browser\'s Accept-Language. Its region is used as the country when Country Code is empty; a tag without a region (en) sets none.',
						routing: { send: { type: 'body', property: 'locale' } },
					},
				],
			},
			{
				displayName: 'Salutation Options',
				name: 'salutationFields',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: { show: { operation: ['salutation', 'salutationEmail'] } },
				options: [
					{
						displayName: 'Academic Title',
						name: 'title',
						type: 'string',
						default: '',
						placeholder: 'Dr.',
						description: 'Academic title kept in a separate field. Used in German and English salutations.',
						routing: { send: { type: 'body', property: 'title' } },
					},
					{
						displayName: 'Country Code',
						name: 'country',
						type: 'string',
						default: '',
						placeholder: 'IT',
						description:
							'Two- or three-letter ISO code. Improves the gender lookup: Andrea is male in Italy and female in Germany.',
						routing: { send: { type: 'body', property: 'country' } },
					},
					{
						displayName: 'IP Address',
						name: 'ip',
						type: 'string',
						default: '',
						placeholder: '203.0.113.7',
						description:
							'IP of the person, for example from a form submission. Used for the country only when neither Country Code nor a Locale with a region is set. Not stored.',
						routing: { send: { type: 'body', property: 'ip' } },
					},
					{
						displayName: 'Known Gender',
						name: 'gender',
						type: 'options',
						default: 'male',
						description: 'Gender your data already holds. It overrides the lookup.',
						options: [
							{ name: 'Always Neutral', value: 'neutral' },
							{ name: 'Female', value: 'female' },
							{ name: 'Male', value: 'male' },
						],
						routing: { send: { type: 'body', property: 'gender' } },
					},
					{
						displayName: 'Language',
						name: 'language',
						type: 'options',
						default: 'en',
						description:
							'Language of the salutation. Without it, the language of the country code is used, or English.',
						options: [
							{ name: 'Dutch', value: 'nl' },
							{ name: 'English (UK)', value: 'en-GB' },
							{ name: 'English (US)', value: 'en' },
							{ name: 'French', value: 'fr' },
							{ name: 'German', value: 'de' },
							{ name: 'German (Switzerland)', value: 'de-CH' },
							{ name: 'Italian', value: 'it' },
							{ name: 'Japanese', value: 'ja' },
							{ name: 'Polish', value: 'pl' },
							{ name: 'Portuguese (Brazil)', value: 'pt-BR' },
							{ name: 'Portuguese (Portugal)', value: 'pt-PT' },
							{ name: 'Spanish', value: 'es' },
							{ name: 'Turkish', value: 'tr' },
						],
						routing: { send: { type: 'body', property: 'language' } },
					},
					{
						displayName: 'Locale',
						name: 'locale',
						type: 'string',
						default: '',
						placeholder: 'it-IT',
						description:
							'Language tag of the person, such as the browser\'s Accept-Language. Its region is used as the country when Country Code is empty; a tag without a region (en) sets none.',
						routing: { send: { type: 'body', property: 'locale' } },
					},
					{
						displayName: 'Minimum Probability',
						name: 'min_probability',
						type: 'number',
						default: 90,
						typeOptions: { minValue: 50, maxValue: 100 },
						description: 'Below this probability (%) the neutral form is used',
						routing: { send: { type: 'body', property: 'min_probability' } },
					},
				],
			},
		],
	};
}
