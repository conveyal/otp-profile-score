
build: components index.js
	@node_modules/.bin/component build --dev

components: component.json
	@node_modules/.bin/component install --dev

clean:
	rm -fr build components

node_modules:
	npm install

Readme.md:
	dox -r < index.js | doxme --readme > Readme.md

.PHONY: clean Readme.md
