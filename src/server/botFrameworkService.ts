import * as Restify from 'restify';
import { BotFrameworkAuthentication } from './botFrameworkAuthentication';
import { ConversationsController } from './framework/conversationsController';
import { AttachmentsController } from './framework/attachmentsController';
import { BotStateController } from './framework/botStateController';
import { ConversationsControllerV3 as DirectLineConversationsController } from './directLine/conversationsControllerV3';
import { RestServer } from './restServer';
import { getStore, getSettings, addSettingsListener } from './settings';
import { Settings } from '../types/serverSettingsTypes';
import * as log from './log';
import * as Fs from 'fs';
import * as path from 'path';
import * as ngrok from './ngrok';
import { makeLinkMessage } from './log';


/**
 * Communicates with the bot.
 */
export class BotFrameworkService extends RestServer {

    private _serviceUrl: string;
    inspectUrl: string;
    ngrokPath: string;
    ngrokServiceUrl: string;

    public get serviceUrl() {
        return ngrok.running()
            ? this.ngrokServiceUrl
            : this._serviceUrl
    }

    authentication = new BotFrameworkAuthentication();

    constructor() {
        super("emulator");
        ConversationsController.registerRoutes(this, this.authentication);
        AttachmentsController.registerRoutes(this);
        BotStateController.registerRoutes(this, this.authentication);
        DirectLineConversationsController.registerRoutes(this);
        addSettingsListener((settings: Settings) => {
            this.configure(settings);
        });
        this.configure(getSettings());
    }

    /**
     * Applies configuration changes.
     */
    private configure(settings: Settings) {
        let relaunchNgrok = false;

        // Did port change?
        if (this.port !== settings.framework.port) {
            console.log(`restarting ${this.router.name} because ${this.port} !== ${settings.framework.port}`);
            this.restart(settings.framework.port);
            // Respawn ngrok when the port changes
            relaunchNgrok = true;
        }

        // Did ngrok path change?
        if (relaunchNgrok || this.ngrokPath !== settings.framework.ngrokPath) {
            const prevNgrokPath = this.ngrokPath;
            this.ngrokPath = settings.framework.ngrokPath;
            const prevServiceUrl = this.serviceUrl;
            this._serviceUrl = `http://localhost:${this.port}`;
            this.inspectUrl = null;
            this.ngrokServiceUrl = null;
            const startNgrok = () => {
                // if we have an ngrok path
                if (this.ngrokPath) {
                    // then make it so
                    ngrok.connect({
                        port: this.port,
                        path: this.ngrokPath
                    }, (err, url: string, inspectPort: string) => {
                        if (err) {
                            log.warn(`failed to configure ngrok at ${this.ngrokPath}: ${err.message || err.msg}`);
                        } else {
                            this.inspectUrl = `http://127.0.0.1:${inspectPort}`;
                            this.ngrokServiceUrl = url;
                            log.debug(`ngrok listening on: ${url}`);
                            log.debug('inspectorUrl:', log.makeLinkMessage(this.inspectUrl, this.inspectUrl));
                        }
                        // Sync settings to client
                        getStore().dispatch({
                            type: 'Framework_Set2',
                            state: {
                                port: this.port,
                                ngrokPath: this.ngrokPath,
                                serviceUrl: this._serviceUrl,
                                ngrokServiceUrl: this.ngrokServiceUrl,
                                ngrokRunning: ngrok.running()
                            }
                        });
                    });
                }
            }
            if (this.ngrokPath !== prevNgrokPath) {
                ngrok.kill((wasRunning) => {
                    if (wasRunning)
                        log.debug('ngrok stopped');
                    startNgrok();
                    return true;
                }) || startNgrok();
            } else {
                ngrok.disconnect(prevServiceUrl, () => {
                    startNgrok();
                });
            }
        }
    }
}