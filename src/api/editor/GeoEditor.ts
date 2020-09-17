import {EditorMode} from "./EditorMode";

export interface GeoEditor {
    setMode(mode: EditorMode);
    getData()
}