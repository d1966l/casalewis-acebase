import { AceBaseBase, AceBaseBaseSettings } from 'acebase-core';
import { AceBaseStorage } from './storage/binary/index.js';
import { LocalApi } from './api-local.js';
import { createLocalStorageInstance, LocalStorageSettings } from './storage/custom/local-storage/index.js';
import { IndexedDBStorageSettings } from './storage/custom/indexed-db/settings.js';
export { LocalStorageSettings, IndexedDBStorageSettings };
export class AceBaseLocalSettings extends AceBaseBaseSettings {
    constructor(options = {}) {
        super(options);
        if (options.storage) {
            this.storage = options.storage;
            // If they were set on global settings, copy IPC and transaction settings to storage settings
            if (options.ipc) {
                this.storage.ipc = options.ipc;
            }
            if (options.transactions) {
                this.storage.transactions = options.transactions;
            }
        }
    }
}
export class AceBase extends AceBaseBase {
    /**
     * @param dbname Name of the database to open or create
     */
    constructor(dbname, init = {}) {
        const settings = new AceBaseLocalSettings(init);
        super(dbname, settings);
        const apiSettings = {
            db: this,
            settings,
        };
        this.api = new LocalApi(dbname, apiSettings, () => {
            this.emit('ready');
        });
        this.recovery = {
            repairNode: async (path, options) => {
                if (this.api.storage instanceof AceBaseStorage) {
                    await this.api.storage.repairNode(path, options);
                }
                else if (!this.api.storage.repairNode) {
                    throw new Error(`repairNode is not supported with chosen storage engine`);
                }
            },
        };
    }
    async close() {
        // Close the database by calling exit on the ipc channel, which will emit an 'exit' event when the database can be safely closed.
        await this.api.storage.close();
    }
    get settings() {
        const ipc = this.api.storage.ipc, debug = this.debug;
        return {
            get logLevel() { return debug.level; },
            set logLevel(level) { debug.setLevel(level); },
            get ipcEvents() { return ipc.eventsEnabled; },
            set ipcEvents(enabled) { ipc.eventsEnabled = enabled; },
        };
    }
    /**
     * Creates an AceBase database instance using LocalStorage or SessionStorage as storage engine. When running in non-browser environments, set
     * settings.provider to a custom LocalStorage provider, eg 'node-localstorage'
     * @param dbname Name of the database
     * @param settings optional settings
     */
    static WithLocalStorage(dbname, settings = {}) {
        const db = createLocalStorageInstance(dbname, settings);
        return db;
    }
    /**
     * Creates an AceBase database instance using IndexedDB as storage engine. Only available in browser contexts!
     * @param dbname Name of the database
     * @param settings optional settings
     */
    static WithIndexedDB(dbname, init = {}) {
        throw new Error(`IndexedDB storage can only be used in browser contexts`);
    }
}
//# sourceMappingURL=acebase-local.js.map