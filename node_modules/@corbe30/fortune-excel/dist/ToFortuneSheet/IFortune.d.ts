export interface IFortuneFile {
    info: IFortuneFileInfo;
    sheets: IfortuneSheet[];
}
export interface IFortuneFileInfo {
    name: string;
    creator: string;
    lastmodifiedby: string;
    createdTime: string;
    modifiedTime: string;
    company: string;
    appversion: string;
}
export interface IfortuneSheet {
    name: string;
    color: string;
    config?: IfortuneSheetConfig;
    id: string;
    status: string;
    order: string;
    row: number;
    column: number;
    luckysheet_select_save?: IfortuneSheetSelection[];
    scrollLeft: number;
    scrollTop: number;
    celldata?: IfortuneSheetCelldata[];
    chart?: IfortuneSheetChart[];
    isPivotTable: boolean;
    pivotTable?: IfortuneSheetPivotTable;
    luckysheet_conditionformat_save?: IfortunesheetConditionFormat[];
    freezen?: IfortunesheetFrozen;
    calcChain?: IfortunesheetCalcChain[];
    zoomRatio: number;
    showGridLines: string;
    defaultColWidth: number;
    defaultRowHeight: number;
    images: IfortuneImages;
    dataVerification: IfortunesheetDataVerification;
    hyperlink: IfortunesheetHyperlink;
    hide: number;
}
export interface IfortuneSheetSelection {
    row: number[];
    column: number[];
    sheetIndex: number;
}
export interface IfortuneSheetChart {
}
export interface IfortuneSheetPivotTable {
    pivot_select_save: IfortuneSheetSelection;
    pivotDataSheetIndex: string | undefined;
    column: IfortuneSheetPivotTableField[];
    row: IfortuneSheetPivotTableField[];
    filter: IfortuneSheetPivotTableField[];
    filterparm: IfortuneSheetPivotTablefilterParam;
    values: IfortuneSheetPivotTableField[];
    showType: string;
    pivotDatas: any[][];
    drawPivotTable: boolean;
    pivotTableBoundary: number[];
}
export interface IfortuneSheetPivotTableField {
    index: number;
    name: string;
    fullname: string;
    sumtype: string;
    nameindex: number;
}
export interface IfortuneSheetPivotTablefilterParam {
    [index: string]: IfortuneSheetPivotTablefilterParamItem;
}
export interface IfortuneSheetPivotTablefilterParamItem {
    caljs: IfortuneSheetPivotTablefilterParamItemCaljs;
    rowhidden: IfortuneSheetPivotTablefilterParamItemRowhidden;
    selected: IfortuneSheetPivotTablefilterParamItemSelected;
}
export interface IfortuneSheetPivotTablefilterParamItemCaljs {
    text: string;
    type: string;
    value: string;
    value1: string;
}
export interface IfortuneSheetPivotTablefilterParamItemRowhidden {
    [index: number]: number;
}
export interface IfortuneSheetPivotTablefilterParamItemSelected {
    [index: number]: number;
}
export interface IfortunesheetFrozen {
    horizen: number | undefined;
    vertical: number | undefined;
}
export interface IfortunesheetConditionFormat {
    type: string;
    cellrange: IfortuneSheetSelection[];
    format: string[] | IfortunesheetCFDefaultFormat | IfortunesheetCFIconsFormat;
    conditionName: string | undefined;
    conditionRange: IfortuneSheetSelection[];
    conditionValue: any[];
}
export interface IfortunesheetCFDefaultFormat {
    textColor: string | undefined | null;
    cellColor: string | undefined | null;
}
export interface IfortunesheetCFIconsFormat {
    len: string | number;
    leftMin: string | number;
    top: string | number;
}
export interface IfortunesheetCalcChain {
    r: number;
    c: number;
    id: string | undefined;
}
export interface IfortuneSheetCelldata {
    r: number;
    c: number;
    v: IfortuneSheetCelldataValue | {
        mc: IfortuneSheetCelldataValueMerge;
        ct?: IFortuneSheetCellFormat;
    } | string | null;
}
export interface IfortuneSheetCelldataValue {
    ct: IFortuneSheetCellFormat | undefined;
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
    rt: number | undefined;
    f: string | undefined;
    qp: number | undefined;
}
export interface IFortuneSheetCellFormat {
    fa: string;
    t: string;
}
export interface IfortuneSheetCelldataValueMerge {
    rs?: number;
    cs?: number;
    r: number;
    c: number;
}
export interface IfortuneSheetConfig {
    merge?: IfortuneSheetConfigMerges;
    borderInfo: IfortuneSheetborderInfoCellForImp[];
    rowlen?: IfortuneSheetRowAndColumnLen;
    columnlen?: IfortuneSheetRowAndColumnLen;
    rowhidden?: IfortuneSheetRowAndColumnHidden;
    colhidden?: IfortuneSheetRowAndColumnHidden;
    customHeight: IfortuneSheetRowAndColumnHidden;
    customWidth: IfortuneSheetRowAndColumnHidden;
}
export interface IfortuneSheetConfigMerges {
    [firstRange: string]: IfortuneSheetConfigMerge;
}
export interface IfortuneSheetConfigMerge {
    r: number;
    c: number;
    rs: number;
    cs: number;
}
export interface IfortuneSheetborderInfoCell {
    rangeType: string;
    value: IfortuneSheetborderInfoCellValue;
}
export interface IfortuneSheetborderInfoCellValue {
    row_index: number;
    col_index: number;
    l: IfortuneSheetborderInfoCellValueStyle;
    r: IfortuneSheetborderInfoCellValueStyle;
    t: IfortuneSheetborderInfoCellValueStyle;
    b: IfortuneSheetborderInfoCellValueStyle;
}
export interface IfortuneSheetborderInfoCellValueStyle {
    style: number;
    color: string;
}
export interface IfortuneSheetborderInfoRange {
    rangeType: string;
    borderType: string;
    style: string;
    color: string;
    range: IfortuneSheetSelection[];
}
export interface IfortuneSheetborderInfoCellForImp {
    rangeType: string;
    cells?: string[];
    value: IfortuneSheetborderInfoCellValue;
}
export interface IMapfortuneSheetborderInfoCellForImp {
    [index: number]: IfortuneSheetborderInfoCellForImp;
}
export interface IfortuneSheetRowAndColumnLen {
    [index: string]: number;
}
export interface IfortuneSheetRowAndColumnHidden {
    [index: string]: number;
}
export interface IFormulaSI {
    [index: string]: IFormulaCell;
}
export interface IFormulaCell {
    [index: string]: IFormulaCellValue;
}
export interface IFormulaCellValue {
    t: string;
    ref: string;
    si: string;
    fv: string;
    cellValue: IfortuneSheetCelldata;
}
export interface IFortuneInlineString {
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
export interface IfortuneImage {
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
export interface IfortuneImageBorder {
    color: string;
    radius: number;
    style: string;
    width: number;
}
export interface IfortuneImageCrop {
    height: number;
    offsetLeft: number;
    offsetTop: number;
    width: number;
}
export interface IfortuneImageDefault {
    height: number;
    left: number;
    top: number;
    width: number;
}
export interface IfortuneImages {
    [index: string]: IfortuneImage;
}
export interface IcellOtherInfo {
    [index: string]: IformulaList;
}
export interface IformulaList {
    [index: string]: IformulaListItem;
}
export interface IformulaListItem {
    r: number;
    c: number;
}
export interface IfortunesheetDataVerification {
    [key: string]: IfortunesheetDataVerificationValue;
}
export interface IfortunesheetDataVerificationValue {
    type: IfortunesheetDataVerificationType;
    type2: string | null;
    value1: string | number | null;
    value2: string | number | null;
    checked: boolean;
    remote: boolean;
    prohibitInput: boolean;
    hintShow: boolean;
    hintText: string;
}
export type IfortunesheetDataVerificationType = "dropdown" | "checkbox" | "number" | "number_integer" | "number_decimal" | "text_content" | "text_length" | "date" | "validity";
export interface IfortunesheetHyperlink {
    [key: string]: IfortunesheetHyperlinkValue;
}
export interface IfortunesheetHyperlinkValue {
    linkAddress: string;
    linkTooltip: string;
    linkType: IfortunesheetHyperlinkType;
    display: string;
}
export type IfortunesheetHyperlinkType = "internal" | "external";
