// @ts-ignore
import * as typescriptPlugin from '@graphql-codegen/typescript';
// @ts-ignore
import { codegen } from '@graphql-codegen/core';
import { printSchema, parse } from 'graphql';
import { promises as fsp } from 'fs';
// import callerPath from 'caller-path';


async function writeFile(file: string, data: any) {
    try {
        if ((await fsp.readFile(file, 'utf8')) != data) {
            await fsp.writeFile(file, data);
        }
    } catch(e) {
        await fsp.writeFile(file, data);
    }
}

export async function GraphQLCodegen(schema: any, typeFile: string, schemaFile?: string) {
    // if (!__filename.includes('.ts')) return;
    const printedSchema = '# AUTO-GENERATED, DO NOT MODIFY\r\n# COMPILED FROM API\r\n\r\n'
     + printSchema(schema);
    if (schemaFile) {
        if (await fsp.readFile(schemaFile, 'utf8') == printedSchema) {
            return;
        }
        await writeFile(schemaFile as string, printedSchema);
    }
    const interfaces = '// AUTO-GENERATED, DO NOT MODIFY\n\n' + await codegen({
        documents: [],
        config: {

        },
        filename: typeFile,
        schema: parse(printedSchema),
        plugins: [{ typescript: {} }],
        pluginMap: {
            typescript: typescriptPlugin,
        }
    })
    await writeFile(typeFile, interfaces);
    return {
        writeFile,
        interfaces,
        printedSchema,
        schema,
    }
}

// if (process.argv[1].includes('src/graphql/codegen')) GraphQLCodegen();
// GraphQLCodegen();