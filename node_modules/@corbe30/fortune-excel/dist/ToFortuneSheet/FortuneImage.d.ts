import { IuploadfileList } from "../common/ICommon";
import { FortuneImageBase } from "./FortuneBase";
export declare class ImageList {
    private images;
    constructor(files: IuploadfileList);
    getImageByName(pathName: string): Image;
}
declare class Image extends FortuneImageBase {
    fromCol: number;
    fromColOff: number;
    fromRow: number;
    fromRowOff: number;
    toCol: number;
    toColOff: number;
    toRow: number;
    toRowOff: number;
    constructor(pathName: string, base64: string);
    setDefault(): void;
}
export {};
