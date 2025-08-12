<p align="center">
  <img align="center" src="fortuneExcelLogo.png" width="150px" height="150px" />
</p>
<h1 align="center">FortuneExcel</h1>
<p align="center">FortuneExcel is an .xlsx import/export plugin for FortuneSheet.</p>

<div align="center">

<p>
<a href="http://npmjs.com/package/@corbe30/fortune-excel" alt="fortuneExcel on npm">
<img src="https://img.shields.io/npm/v/@corbe30/fortune-excel" /></a> <a href="http://npmjs.com/package/@corbe30/fortune-excel" alt="fortuneExcel downloads">
<img src="https://img.shields.io/npm/d18m/%40corbe30%2Ffortune-excel" /></a>
</p>

</div>

## Usage

For best results, import and export a single sheet at a time. Although you can force FortuneExcel to handle multiple sheets, certain configurations may break.

1. Install the package:
```js
npm i @corbe30/fortune-excel
```

2. Add import/export toolbar item in fortune-sheet
> `<ImportHelper />` is a hidden component and only required when using `importToolBarItem()`.
```js
import { ImportHelper, importToolBarItem, exportToolBarItem } from "@corbe30/fortune-excel";

function App() {
  const workbookRef = useRef();
  const [key, setKey] = useState(0);
  const [sheets, setSheets] = useState(data);

  return (
    <>
      <ImportHelper setKey={setKey} setSheets={setSheets} sheetRef={workbookRef} />
      <Workbook
        key={key} data={sheets} ref={workbookRef}
        customToolbarItems={[exportToolBarItem(workbookRef), importToolBarItem()]}
      />
    </>
  );
}
```

## Authors and acknowledgment

- [@Corbe30](https://github.com/Corbe30)

Developers of [FortuneSheetExcel](https://github.com/zenmrp/FortuneSheetExcel):
- [@wbfsa](https://github.com/wbfsa)
- [@wpxp123456](https://github.com/wpxp123456)
- [@Dushusir](https://github.com/Dushusir)
- [@xxxDeveloper](https://github.com/xxxDeveloper)
- [@mengshukeji](https://github.com/mengshukeji)

## License

[MIT](http://opensource.org/licenses/MIT)
