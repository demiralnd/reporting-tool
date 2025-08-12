import { IFortuneFile, IFortuneFileInfo, IfortuneSheet, IfortuneSheetCelldata, IfortuneSheetConfig, IfortuneSheetCelldataValue, IfortuneSheetCelldataValueMerge, IFortuneSheetCellFormat, IfortuneSheetConfigMerges, IfortuneSheetConfigMerge, IfortuneSheetborderInfoCellValue, IfortuneSheetborderInfoCellValueStyle, IfortuneSheetborderInfoCellForImp, IfortuneSheetRowAndColumnLen, IfortuneSheetRowAndColumnHidden, IfortuneSheetSelection, IfortunesheetFrozen, IfortuneSheetChart, IfortuneSheetPivotTable, IfortunesheetConditionFormat, IfortunesheetCalcChain, IFortuneInlineString, IfortuneImage, IfortuneImageBorder, IfortuneImageCrop, IfortuneImageDefault, IfortuneImages, IfortunesheetHyperlink, IfortunesheetDataVerification } from "./IFortune";
export declare class FortuneFileBase implements IFortuneFile {
    info: IFortuneFileInfo;
    sheets: IfortuneSheet[];
}
export declare class FortuneSheetBase implements IfortuneSheet {
    name: string;
    color: string;
    config: IfortuneSheetConfig;
    id: string;
    status: string;
    order: string;
    row: number;
    column: number;
    luckysheet_select_save: IfortuneSheetSelection[];
    scrollLeft: number;
    scrollTop: number;
    zoomRatio: number;
    showGridLines: string;
    defaultColWidth: number;
    defaultRowHeight: number;
    celldata: IfortuneSheetCelldata[];
    chart: IfortuneSheetChart[];
    isPivotTable: boolean;
    pivotTable: IfortuneSheetPivotTable;
    luckysheet_conditionformat_save: IfortunesheetConditionFormat[];
    freezen: IfortunesheetFrozen;
    calcChain: IfortunesheetCalcChain[];
    images: IfortuneImages;
    dataVerification: IfortunesheetDataVerification;
    hyperlink: IfortunesheetHyperlink;
    hide: number;
}
export declare class FortuneFileInfo implements IFortuneFileInfo {
    name: string;
    creator: string;
    lastmodifiedby: string;
    createdTime: string;
    modifiedTime: string;
    company: string;
    appversion: string;
}
export declare class FortuneSheetCelldataBase implements IfortuneSheetCelldata {
    r: number;
    c: number;
    v: IfortuneSheetCelldataValue | string | null;
}
export declare class FortuneSheetCelldataValue implements IfortuneSheetCelldataValue {
    ct: FortuneSheetCellFormat | undefined;
    bg: string | undefined;
    ff: string | undefined;
    fc: string | undefined;
    bl: number | undefined;
    it: number | undefined;
    fs: number | undefined;
    cl: number | undefined;
    un: number | undefined;
    vt: number | undefined;
    ht: number | undefined;
    mc: IfortuneSheetCelldataValueMerge | undefined;
    tr: number | undefined;
    tb: number | undefined;
    v: string | undefined;
    m: string | undefined;
    f: string | undefined;
    rt: number | undefined;
    qp: number | undefined;
}
export declare class FortuneSheetCellFormat implements IFortuneSheetCellFormat {
    fa: string;
    t: string;
    s: FortuneInlineString[] | undefined;
}
export declare class FortuneInlineString implements IFortuneInlineString {
    ff: string | undefined;
    fc: string | undefined;
    fs: number | undefined;
    cl: number | undefined;
    un: number | undefined;
    bl: number | undefined;
    it: number | undefined;
    va: number | undefined;
    v: string | undefined;
}
export declare class FortuneConfig implements IfortuneSheetConfig {
    merge: IfortuneSheetConfigMerges;
    borderInfo: IfortuneSheetborderInfoCellForImp[];
    rowlen: IfortuneSheetRowAndColumnLen;
    columnlen: IfortuneSheetRowAndColumnLen;
    rowhidden: IfortuneSheetRowAndColumnHidden;
    colhidden: IfortuneSheetRowAndColumnHidden;
    customHeight: IfortuneSheetRowAndColumnHidden;
    customWidth: IfortuneSheetRowAndColumnHidden;
}
export declare class FortuneSheetborderInfoCellForImp implements IfortuneSheetborderInfoCellForImp {
    rangeType: string;
    value: IfortuneSheetborderInfoCellValue;
}
export declare class FortuneSheetborderInfoCellValue implements IfortuneSheetborderInfoCellValue {
    row_index: number;
    col_index: number;
    l: IfortuneSheetborderInfoCellValueStyle;
    r: IfortuneSheetborderInfoCellValueStyle;
    t: IfortuneSheetborderInfoCellValueStyle;
    b: IfortuneSheetborderInfoCellValueStyle;
}
export declare class FortuneSheetborderInfoCellValueStyle implements IfortuneSheetborderInfoCellValueStyle {
    "style": number;
    "color": string;
}
export declare class FortuneSheetConfigMerge implements IfortuneSheetConfigMerge {
    r: number;
    c: number;
    rs: number;
    cs: number;
}
export declare class FortunesheetCalcChain implements IfortunesheetCalcChain {
    r: number;
    c: number;
    id: string | undefined;
}
export declare class FortuneImageBase implements IfortuneImage {
    border: IfortuneImageBorder;
    crop: IfortuneImageCrop;
    default: IfortuneImageDefault;
    fixedLeft: number;
    fixedTop: number;
    isFixedPos: Boolean;
    originHeight: number;
    originWidth: number;
    src: string;
    type: string;
}
