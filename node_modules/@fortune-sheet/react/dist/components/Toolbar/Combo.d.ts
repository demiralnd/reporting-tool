import React from "react";
declare type Props = {
    tooltip: string;
    iconId?: string;
    text?: string;
    onClick?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
    children: (setOpen: React.Dispatch<React.SetStateAction<boolean>>) => React.ReactNode;
};
declare const Combo: React.FC<Props>;
export default Combo;
