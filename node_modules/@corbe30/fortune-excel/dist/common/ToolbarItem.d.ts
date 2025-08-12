/// <reference types="react" />
export declare const exportToolBarItem: (sheetRef: any) => {
    key: string;
    tooltip: string;
    icon: import("react").JSX.Element;
    onClick: (e: any) => Promise<void>;
};
export declare const importToolBarItem: () => {
    key: string;
    tooltip: string;
    icon: import("react").JSX.Element;
    onClick: (e: any) => void;
};
