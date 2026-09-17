import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class NameGenderApi implements ICredentialType {
	name = 'nameGenderApi';

	displayName = 'NameGender API';

	icon: Icon = { light: 'file:namegender.svg', dark: 'file:namegender.dark.svg' };

	documentationUrl = 'https://github.com/anpekesen/n8n-nodes-namegender?tab=readme-ov-file#credentials';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			description:
				'Found in your NameGender dashboard under API keys. Starts with ng_live_. Signing up is free and needs no card.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	// /me is not charged, so testing the connection never costs a credit.
	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://namegender.com/api/v1',
			url: '/me',
		},
	};
}
