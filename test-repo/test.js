const assert = require('assert');
const { add, greet } = require('./index');

console.log('Running tests...');

try {
    assert.strictEqual(add(2, 3), 5, 'add(2, 3) should be 5');
    console.log('✅ add passed');
} catch (e) {
    console.error('❌ add failed:', e.message);
    process.exit(1);
}

try {
    assert.strictEqual(greet('World'), 'Hello World', 'greet should say Hello World');
    console.log('✅ greet passed');
} catch (e) {
    console.error('❌ greet failed:', e.message);
    process.exit(1);
}
