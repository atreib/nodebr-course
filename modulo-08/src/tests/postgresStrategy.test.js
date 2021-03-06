const assert = require('assert');
const PSQL = require('./../db/strategies/postgres/postgres');
const Context = require('./../db/strategies/base/contextStrategy');
const heroSchema = require('./../db/strategies/postgres/schemas/heroes.schema')

// const context = new Context(new PSQL());
let context = {};

// creating our mock to insert, select and remove
const MOCK_HERO_CREATE = {
    name: 'superman',
    power: 'wear underwear'
};

// creating our mock to update, select and remove
const MOCK_HERO_UPDATE = {
    name: 'ex-superman',
    power: 'ex-wear underwear'
};

// cant use () => { } (arrow function) here because of the "this.{func}"
// arrow functions use lexical binding to the "this" parameter
// and it cant access the mocha context
describe('Postgres strategy', async function () {
    this.timeout(Infinity);

    before(async () => {
        const connection = await PSQL.connect();
        const model = await PSQL._defineModel(connection, heroSchema);
        context = new Context(new PSQL(connection, model));
    });

    it('should connect to postgres', async () => {
        const result = await context.isConnected();
        assert.equal(result, true);     
    });

    it('should insert a hero to postgres', async () => {
        const expected = await context.create(MOCK_HERO_CREATE);
        // remove the id to use the deepEqual (because our mock doesnt have the id)
        delete expected.id;
        assert.deepEqual(expected, MOCK_HERO_CREATE);
    });

    it('should list first hero filtered by name from postgres', async () => {
        const [expected] = await context.read({ name: MOCK_HERO_CREATE.name });
        delete expected.id;
        assert.deepEqual(expected, MOCK_HERO_CREATE);
    });

    it('should list all heroes from postgres', async () => {
        const result = await context.read(null, 1, 0);
        assert.ok((result.length >= 0));
    });

    it('should read heroes with pagination from postgres', async () => {
        const result = await context.read();
        assert.ok((result.length > 0));
    });

    it('should update one hero from postgres', async () => {
        const [initialStateHero] = await context.read({ name: MOCK_HERO_CREATE.name });
        const [expected] = await context.update(initialStateHero.id, MOCK_HERO_UPDATE);
        assert.deepEqual(expected, 1);
    });

    it('should get one hero by id from postgres', async () => {
        const [expected] = await context.read({ name: MOCK_HERO_UPDATE.name });
        const result = await context.get(expected.id);
        assert.deepEqual(expected, result);
    });

    it('should delete one hero by id from postgres', async () => {
        const [item] = await context.read({ name: MOCK_HERO_UPDATE.name });
        const expected = await context.delete(item.id);
        assert.deepEqual(expected, 1);
    });

});