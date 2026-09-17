const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { NameGender } = require('../dist/nodes/NameGender/NameGender.node.js');
const { NameGenderApi } = require('../dist/credentials/NameGenderApi.credentials.js');

const fs = require('node:fs');

// The OpenAPI document generated from the live route table. Inside the main
// NameGender repository the local copy is used, so a contract change is caught
// before it ships; in this standalone repository the published document is.
const localSpec = process.env.OPENAPI || path.join(__dirname, '../../../public/openapi.json');
let spec;

test.before(async () => {
	if (fs.existsSync(localSpec)) {
		spec = JSON.parse(fs.readFileSync(localSpec, 'utf8'));
		return;
	}

	const response = await fetch('https://namegender.com/openapi.json');
	assert.equal(response.status, 200, 'could not download openapi.json');
	spec = await response.json();
});

const description = new NameGender().description;
const base = description.requestDefaults.baseURL;
const operation = description.properties.find((p) => p.name === 'operation');

const bodyFieldsFor = (op) =>
	description.properties
		.flatMap((p) => (p.type === 'collection' ? p.options.map((o) => ({ ...o, displayOptions: p.displayOptions })) : [p]))
		.filter((p) => p.routing?.send?.type === 'body')
		.filter((p) => !p.displayOptions || p.displayOptions.show.operation.includes(op))
		.map((p) => p.routing.send.property);

test('every operation calls a documented POST endpoint', () => {
	for (const option of operation.options) {
		const url = base + option.routing.request.url;
		const specPath = url.replace('https://namegender.com', '');
		const entry = spec.paths[specPath];

		assert.ok(entry, `${option.value}: ${specPath} is not in openapi.json`);
		assert.equal(option.routing.request.method, 'POST');
		assert.ok(entry.post, `${option.value}: ${specPath} does not accept POST`);
	}
});

test('every body field is accepted by its endpoint', () => {
	for (const option of operation.options) {
		const specPath = (base + option.routing.request.url).replace('https://namegender.com', '');
		const schema = spec.paths[specPath].post.requestBody.content['application/json'].schema;
		const accepted = Object.keys(schema.properties);

		for (const field of bodyFieldsFor(option.value)) {
			assert.ok(accepted.includes(field), `${option.value}: body field "${field}" is not in ${specPath}`);
		}

		for (const required of schema.required) {
			assert.ok(bodyFieldsFor(option.value).includes(required), `${option.value}: required "${required}" is never sent`);
		}
	}
});

test('credentials send a Bearer key and test against an uncharged endpoint', () => {
	const credentials = new NameGenderApi();

	assert.equal(credentials.authenticate.properties.headers.Authorization, '=Bearer {{$credentials.apiKey}}');
	assert.equal(credentials.test.request.url, '/me');
	assert.ok(spec.paths['/api/v1/me'], '/me is not documented');
});
