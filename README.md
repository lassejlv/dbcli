# dbcli

🐳 A CLI tool for scaffolding new database using Docker. (in alpha)

## Installation

This tool only works with [Bun](https://bun.sh) and [Docker](https://www.docker.com/) installed on your machine.

```bash
bun install -g @themrdev/dbcli
```

## Usage

Only postgres is supported for now.

```bash
dbcli --new --type postgres # It will prompt and ask for username,password and database name
```

And you are good to go. It will create a new postgres database with the provided credentials.
