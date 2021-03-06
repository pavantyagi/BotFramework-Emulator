//
// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license.
//
// Microsoft Bot Framework: http://botframework.com
//
// Bot Framework Emulator Github:
// https://github.com/Microsoft/BotFramwork-Emulator
//
// Copyright (c) Microsoft Corporation
// All rights reserved.
//
// MIT License:
// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so, subject to
// the following conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED ""AS IS"", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
// LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
//

import { LuisAuthWorkflowService } from '../services/luisAuthWorkflowService';
import { getStore } from '../data-v2/store';
import { CommandRegistryImpl } from '@bfemulator/sdk-shared';
import { SharedConstants } from '@bfemulator/app-shared';

const store = getStore();

/** Registers LUIS commands */
export function registerCommands(commandRegistry: CommandRegistryImpl) {
  const Commands = SharedConstants.Commands.Luis;

  // ---------------------------------------------------------------------------
  // Retrieve the LUIS authoring key
  commandRegistry.registerCommand(Commands.RetrieveAuthoringKey, async () => {
    const workflow = LuisAuthWorkflowService.enterAuthWorkflow();
    const { dispatch: storeDispatch } = store;
    const type = 'LUIS_AUTH_STATUS_CHANGED';
    storeDispatch({ type, luisAuthWorkflowStatus: 'inProgress' });
    let result = undefined;
    while (true) {
      const next = workflow.next(result);
      if (next.done) {
        storeDispatch({ type, luisAuthWorkflowStatus: 'ended' });
        if (!result) {
          storeDispatch({ type, luisAuthWorkflowStatus: 'canceled' });
        }
        break;
      }
      result = await next.value;
    }
    return result;
  });
}
