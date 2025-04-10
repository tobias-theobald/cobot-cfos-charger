import { FileSystemStorageFormat } from '@/types/zod/other';

import { KeyValueStorageBase } from './KeyValueStorageBase';

export class FileSystemKeyValueStorage extends KeyValueStorageBase {
    fsImportPromise = import('node:fs/promises');

    private getPath(): string {
        if (!this.uri.startsWith('file:')) {
            throw new Error('cannot use non-file protocol with this class');
        }
        const isRelative = this.uri.startsWith('file:./');
        const parsedUrl = new URL(this.uri);
        return `${isRelative ? '.' : ''}${parsedUrl.pathname}`;
    }

    private async readFile(): Promise<FileSystemStorageFormat> {
        const fs = await this.fsImportPromise;
        let fileContent;
        try {
            fileContent = await fs.readFile(this.getPath(), { encoding: 'utf-8' });
        } catch (e) {
            if (typeof e === 'object' && e !== null && 'errno' in e && e.errno === -2) {
                return {};
            } else {
                throw e;
            }
        }
        if (fileContent === '') {
            return {};
        }
        let fileContentJson;
        try {
            fileContentJson = JSON.parse(fileContent);
        } catch (e) {
            throw new Error('DB File JSON corrupt: ' + (e as Error).message);
        }
        const fileContentParseResult = FileSystemStorageFormat.safeParse(fileContentJson);
        if (!fileContentParseResult.success) {
            throw new Error('DB File Type corrupt: ' + fileContentParseResult.error.message);
        }
        return fileContentParseResult.data;
    }

    private async writeFile(newContent: FileSystemStorageFormat): Promise<void> {
        const fileContentParseResult = FileSystemStorageFormat.safeParse(newContent);
        if (!fileContentParseResult.success) {
            throw new Error('Was about to write a corrupt DB File: ' + fileContentParseResult.error.message);
        }

        const fs = await this.fsImportPromise;
        await fs.writeFile(this.getPath(), JSON.stringify(fileContentParseResult.data, null, 2), 'utf-8');
    }

    public async get(key: string): Promise<unknown> {
        const dbFileContent = await this.readFile();
        return dbFileContent[key];
    }
    public async set(key: string, value: unknown): Promise<void> {
        const dbFileContent = await this.readFile();
        return this.writeFile({ ...dbFileContent, [key]: value });
    }
    public async delete(key: string): Promise<void> {
        const dbFileContent = await this.readFile();
        return this.writeFile({ ...dbFileContent, [key]: undefined });
    }
    public async list(prefix?: string | undefined): Promise<[string, unknown][]> {
        const dbFileContent = await this.readFile();
        return Object.entries(dbFileContent).filter(([key]) => prefix === undefined || key.startsWith(prefix));
    }
}
