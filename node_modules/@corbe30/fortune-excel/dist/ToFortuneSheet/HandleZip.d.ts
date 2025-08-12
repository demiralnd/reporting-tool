import JSZip from "jszip";
import { IuploadfileList } from "../common/ICommon";
export declare class HandleZip {
    uploadFile: File;
    workBook: JSZip;
    constructor(file: File);
    unzipFile(): Promise<IuploadfileList>;
}
