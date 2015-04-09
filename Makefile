
build: components index.js
	@node_modules/.bin/component build --dev

beautify: index.js
	@node_modules/.bin/standard --format index.js

components: component.json
	@node_modules/.bin/component install --dev

clean:
	rm -fr build components

lint:
	@node_modules/.bin/standard index.js

node_modules:
	npm install

Readme.md: index.js
	dox -r < index.js | doxme --readme > Readme.md

.PHONY: clean Readme.md
