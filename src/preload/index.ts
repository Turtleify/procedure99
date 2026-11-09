import { contextBridge, ipcRenderer } from 'electron'
import type { AppState, BridgeApi, StartupMode } from '../shared/types'

const api: BridgeApi = {
  load: () => ipcRenderer.invoke('state:load'),
  save: (state: AppState) => ipcRenderer.invoke('state:save', state),
  setStartupMode: (mode: StartupMode) => ipcRenderer.invoke('app:setStartupMode', mode),
  testNotification: () => ipcRenderer.invoke('app:testNotification'),
  getInfo: () => ipcRenderer.invoke('app:info'),
  onNavigate: (cb) => {
    const listener = (_e: Electron.IpcRendererEvent, view: string): void => cb(view)
    ipcRenderer.on('navigate', listener)
    return () => ipcRenderer.removeListener('navigate', listener)
  }
}

contextBridge.exposeInMainWorld('api', api)
