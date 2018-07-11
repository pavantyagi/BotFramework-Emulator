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

import { NotificationAction, NotificationActions } from '../action/notificationActions';

export interface NotificationState {
  byId: {
    [notificationId: string]: { read: boolean };
  };
  allIds: string[];
}

const DEFAULT_STATE: NotificationState = {
  byId: {},
  allIds: []
};

export function notification(state: NotificationState = DEFAULT_STATE, action: NotificationAction): NotificationState {
  switch (action.type) {
    case NotificationActions.finishAdd: {
      const { id: idToAdd } = action.payload.notification;
      let allIds;
      if (!state.byId[idToAdd]) {
        allIds = [...state.allIds, idToAdd];
      } else {
        allIds = state.allIds;
      }
      state = {
        ...state,
        byId: {
          ...state.byId,
          [action.payload.notification.id]: { read: action.payload.read }
        },
        allIds
      };
      break;
    }

    case NotificationActions.finishRemove: {
      const { id: idToRemove } = action.payload;
      const byId = {};
      Object.keys(state.byId).forEach(notifId => {
        if (notifId !== idToRemove) {
          byId[notifId] = state.byId[notifId];
        }
      });
      state = {
        ...state,
        byId,
        allIds: state.allIds.filter(id => id !== idToRemove)
      };
      break;
    }

    case NotificationActions.markAllAsRead: {
      const readNotifications = {};
      Object.keys(state.byId).forEach(notifId => {
        readNotifications[notifId] = { read: true };
      });
      state = {
        ...state,
        byId: readNotifications
      };
      break;
    }

    case NotificationActions.finishClear: {
      state = {
        byId: {},
        allIds: []
      };
      break;
    }

    default:
      break;
  }

  return state;
}

export default notification;