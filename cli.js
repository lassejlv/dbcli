#! /usr/bin/env bun

import { program } from 'commander';
import { z } from 'zod';
import ora from 'ora';
import { $ } from 'bun';
import fs from 'fs';

const githubUrl = 'https://github.com/lassejlv';
const validDatabasesTypes = ['postgres'];

const promptSchema = z.object({
   username: z.string().max(20),
   password: z.string().max(64),
   database: z
      .string()
      .max(20)
      .refine((value) => !fs.existsSync(value), {
         message: 'Database already exists',
      }),
   port: z.number().int().min(1024).max(65535),
});

program
   .option('--new', 'Create a new project')
   .option('--type <type>', 'Choose a database type')
   .version('0.0.1')
   .description('A CLI tool for scaffolding new database using Docker')
   .parse(process.argv);

if (program.opts().new) {
   const databaseType = program.opts().type;

   if (!validDatabasesTypes.includes(databaseType)) {
      console.error(`Invalid database type. Valid types are: ${validDatabasesTypes.join(', ')}`);
      process.exit(1);
   }

   switch (databaseType) {
      case 'postgres': {
         const username = prompt('Choose a username? ');
         const password = prompt('Choose a password? ');
         const database = prompt('Choose a database name? ');
         const port = Number(prompt('Choose a port? '));

         const result = promptSchema.safeParse({ username, password, database, port });
         if (!result.success) {
            console.error('Invalid input:');
            result.error.errors.forEach((err) => {
               console.error(`- ${err.path.join('.')}: ${err.message}`);
            });
            process.exit(1);
         }

         const spinner = ora(`✨ Scaffolding a new database in ${process.cwd()}`).start();

         try {
            await Bun.sleep(1000);

            spinner.info('Cloning repo and pulling docker image (this may take a while)').isSpinning;
            // Clone repo
            await $`git clone ${githubUrl}/postgres ${database} && cd ${database} && docker pull postgres:16`.quiet();

            spinner.info('Setting up environment variables').isSpinning;

            // Create .env file
            await $`cd ${database} && echo "POSTGRES_USER=${result.data.username}" > .env`.quiet();
            await $`cd ${database} && echo "POSTGRES_PASSWORD=${result.data.password}" >> .env`.quiet();
            await $`cd ${database} && echo "POSTGRES_DB=${result.data.database}" >> .env`.quiet();
            await $`cd ${database} && echo "POSTGRES_VOLUME_NAME=${result.data.database}" >> .env`.quiet();
            await $`cd ${database} && echo "POSTGRES_PORT=${result.data.port}" >> .env`.quiet();

            spinner.info('Starting database container').isSpinning;
            // Start docker container
            await $`cd ${database} && docker compose up -d`.quiet();

            spinner.succeed(`Database ${result.data.database} is now running`);
            process.exit(0);
         } catch (error) {
            spinner.fail(`Error: ${error.message}`);
            process.exit(1);
         }
      }
   }
}
