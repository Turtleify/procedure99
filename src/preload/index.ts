import { contextBridge, ipcRenderer } from 'electron'
import type { AppState, BridgeApi, StartupMode, WindowAction } from '../shared/types'

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
  },
  windowControl: (action: WindowAction) => ipcRenderer.send('win:control', action),
  isMaximized: () => ipcRenderer.invoke('win:isMaximized'),
  onMaximizedChange: (cb) => {
    const listener = (_e: Electron.IpcRendererEvent, max: boolean): void => cb(max)
    ipcRenderer.on('win:maximized', listener)
    return () => ipcRenderer.removeListener('win:maximized', listener)
  },
  isWindowVisible: () => ipcRenderer.invoke('win:isVisible'),
  onWindowVisibility: (cb) => {
    const listener = (_e: Electron.IpcRendererEvent, visible: boolean): void => cb(visible)
    ipcRenderer.on('win:visible', listener)
    return () => ipcRenderer.removeListener('win:visible', listener)
  }
}

contextBridge.exposeInMainWorld('api', api)
