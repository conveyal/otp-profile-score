
build: components index.js
	@node_modules/.bin/component build --dev

components: component.json
	@node_modules/.bin/component install --dev

clean:
	rm -fr build components

node_modules:
	npm install

test: node_modules
	@node_modules/.bin/mocha

test-cov: node_modules
	@node_modules/.bin/istanbul cover node_modules/.bin/_mocha

.PHONY: clean
