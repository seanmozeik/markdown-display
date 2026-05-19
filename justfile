default:
	@just --list

check:
	bun run check

test:
	bun test

typecheck:
	bun run typecheck

build:
	bun run build:bundle

release:
	bun run build

build-themes:
	bun run build:themes

dev *args:
	bun run src/cli.ts -- {{args}}

lint:
	bun run lint

format:
	bun run format
