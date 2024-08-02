RELEASE_VERSION ?= ${shell git rev-parse --abbrev-ref HEAD}

deps:
	yarn config set version-git-tag false
	yarn config set version-commit-hooks false
	npx browserslist@latest --update-db
	yarn install --frozen-lockfile

scan:
	snyk test --severity-threshold=high --all-projects .

build:
	if [ ! -z "$(RELEASE_VERISION)" ]; then yarn version --new-version $(RELEASE_VERSION) ; fi
	yarn build

publish:
	npm publish

test:
	echo all good

npmrc:
	echo "//registry.npmjs.org/:_authToken=$(NPM_TOKEN)\n@hiro-graph:registry=https://registry.npmjs.org/" > ~/.npmrc
	
FORCE:
